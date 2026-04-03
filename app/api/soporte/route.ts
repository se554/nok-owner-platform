import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const AREAS_ROUTING: Record<string, string> = {
  'Revenue Management': 'jad@nok.rent',
  'Finanzas': 'jp@nok.rent',
  'Operaciones CO': 'jcc@nok.rent',
  'Operaciones RD': 'rg@nok.rent',
  'Growth': 'mc@nok.rent',
  'CX': 'mam@nok.rent',
  'C-level': 'se@nok.rent',
}

export async function POST(req: NextRequest) {
  try {
    // Verify authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const sb = createServiceClient()
    const body = await req.json()
    const { propertyId, message } = body

    if (!propertyId || !message?.trim()) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    // Get owner and property info
    const { data: owner } = await sb
      .from('owners')
      .select('id, name, email, pais')
      .eq('supabase_user_id', user.id)
      .single()

    if (!owner) {
      return NextResponse.json({ error: 'Propietario no encontrado' }, { status: 404 })
    }

    const { data: property } = await sb
      .from('properties')
      .select('id, name, country')
      .eq('id', propertyId)
      .eq('owner_id', owner.id)
      .single()

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
    }

    // Classify with Claude
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const classifyResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Eres un asistente de clasificación de consultas de propietarios para NOK, empresa de gestión de apartamentos.

Clasifica la consulta en UNA de estas áreas:

**Revenue Management**: Reportes mensuales, liquidaciones, ingresos, ocupación, ADR, tarifas, rendimiento del apto, listing.
**Finanzas**: Impuestos, declaración de renta, DIAN, contribuciones parafiscales, FONTUR.
**Operaciones**: Limpieza, mantenimiento, daños, reparaciones, servicios públicos, incidencias.
**Growth**: Comisión NOK, contrato, acceso a Guesty, inventario, onboarding, fotos.
**CX**: Bloqueo de fechas, reservas directas, quejas de huéspedes, RNT, check-in.
**C-level**: Pagos al propietario, fecha de pago, comprobantes, reclamos de pago.

Responde ÚNICAMENTE en JSON (sin texto adicional):
{
  "area": "Revenue Management|Finanzas|Operaciones|Growth|CX|C-level",
  "urgencia": "alta|media|baja",
  "confianza": "alta|media|baja",
  "titulo": "Titulo corto y descriptivo",
  "resumen": "Resumen breve en español (máximo 80 palabras)",
  "respuestaSugerida": "Borrador de respuesta profesional en español"
}

---
Propietario: ${owner.name}
Apartamento: ${property.name}
Consulta: ${message}`
      }]
    })

    const aiText = classifyResponse.content[0].type === 'text' ? classifyResponse.content[0].text : ''
    let classification = { area: 'CX', urgencia: 'baja', confianza: 'baja', titulo: 'Consulta de propietario', resumen: '', respuestaSugerida: '' }
    try {
      const cleaned = aiText.replace(/```json\n?|```\n?/g, '').trim()
      classification = JSON.parse(cleaned)
    } catch { /* use defaults */ }

    // Determine responsible person
    const pais = (property.country || owner.pais || '').toLowerCase()
    let correoResponsable: string
    if (classification.confianza === 'baja') {
      correoResponsable = 'cg@nok.rent'
    } else if (classification.area === 'Operaciones') {
      correoResponsable = pais.includes('dominicana') || pais.includes('rd') ? 'rg@nok.rent' : 'jcc@nok.rent'
    } else {
      correoResponsable = AREAS_ROUTING[classification.area] || 'cg@nok.rent'
    }

    // Create ticket in Supabase
    const { data: ticket, error: ticketError } = await sb
      .from('support_tickets')
      .insert({
        title: classification.titulo || 'Consulta de propietario',
        description: message,
        status: 'open',
        urgencia: classification.urgencia,
        confianza_ia: classification.confianza,
        area_responsable: classification.area,
        correo_responsable: correoResponsable,
        owner_id: owner.id,
        property_id: property.id,
        apartamento: property.name,
        correo_propietario: owner.email,
        propietario_nombre: owner.name,
        resumen_ia: classification.resumen,
        source: 'platform',
      })
      .select()
      .single()

    if (ticketError) throw ticketError

    // Create ticket events
    await Promise.all([
      sb.from('ticket_events').insert({
        ticket_id: ticket.id,
        event_type: 'owner_message',
        content: message,
        author_name: owner.name,
        author_email: owner.email,
      }),
      sb.from('ticket_events').insert({
        ticket_id: ticket.id,
        event_type: 'ai_response',
        content: `Area: ${classification.area} | Urgencia: ${classification.urgencia} | Confianza: ${classification.confianza} | Resumen: ${classification.resumen}`,
        author_name: 'system',
      }),
    ])

    // Trigger n8n webhook to send Gmail notification
    const webhookUrl = process.env.N8N_SOPORTE_WEBHOOK_URL
    if (webhookUrl) {
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId: ticket.id,
            title: ticket.title,
            description: message,
            area: classification.area,
            urgencia: classification.urgencia,
            confianza: classification.confianza,
            resumen: classification.resumen,
            respuestaSugerida: classification.respuestaSugerida,
            correoResponsable,
            senderEmail: owner.email,
            ownerName: owner.name,
            apartamento: property.name,
          }),
        })
        // Get thread ID from n8n response to enable Flow 2
        const webhookData = await webhookResponse.json().catch(() => null)
        if (webhookData?.threadId) {
          await sb
            .from('support_tickets')
            .update({ gmail_hilo_id: webhookData.threadId })
            .eq('id', ticket.id)
        }
      } catch (e) {
        console.error('n8n webhook error (non-blocking):', e)
      }
    }

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      area: classification.area,
      confianza: classification.confianza,
    })
  } catch (error) {
    console.error('Soporte POST error:', error)
    return NextResponse.json({ error: 'Error creando ticket' }, { status: 500 })
  }
}
