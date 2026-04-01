import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import { QuotePDF, type QuoteData, type QuoteItem } from '@/lib/pdf-generator'

export async function POST(req: NextRequest) {
  try {
    const { session_id } = await req.json()
    if (!session_id) {
      return NextResponse.json({ error: 'session_id requerido' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Fetch session + inventory items
    const [{ data: session }, { data: inventoryItems }] = await Promise.all([
      supabase.from('onboarding_sessions').select('*').eq('id', session_id).single(),
      supabase
        .from('onboarding_inventory_items')
        .select('*, catalog_items(name, price, currency)')
        .eq('session_id', session_id)
        .eq('status', 'missing'),
    ])

    if (!session) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    const currency = session.property_country === 'CO' ? 'COP' : 'DOP'

    // Build quote items
    const quoteItems: QuoteItem[] = (inventoryItems ?? []).map(item => ({
      space: item.space,
      item_name: item.item_name,
      quantity: item.quantity_needed,
      color: item.selected_color ?? undefined,
      unit_price: item.unit_price ?? 0,
      currency: item.currency ?? currency,
      status: 'missing' as const,
    }))

    const grandTotal = quoteItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)

    const quoteData: QuoteData = {
      session_id,
      owner_name: session.owner_name,
      owner_email: session.owner_email,
      property_address: session.property_address,
      property_city: session.property_city,
      generated_at: new Date().toLocaleDateString('es-DO', {
        year: 'numeric', month: 'long', day: 'numeric'
      }),
      items: quoteItems,
      currency,
    }

    // Generate PDF
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(createElement(QuotePDF, { data: quoteData }) as any)

    // Upload PDF to Supabase Storage
    const storagePath = `${session_id}/cotizacion-nok-${Date.now()}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('floor-plans')
      .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true })

    if (uploadError) {
      console.error('PDF upload error:', uploadError)
      return NextResponse.json({ error: 'Error guardando el PDF' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('floor-plans')
      .getPublicUrl(storagePath)

    // Update session with quote info
    await supabase
      .from('onboarding_sessions')
      .update({
        quote_pdf_url: publicUrl,
        quote_total: grandTotal,
        quote_currency: currency,
        status: 'report_ready',
      })
      .eq('id', session_id)

    // Send emails if Resend key is configured
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const pdfBase64 = pdfBuffer.toString('base64')

      // Email to owner
      await resend.emails.send({
        from: 'NOK <onboarding@nok.do>',
        to: session.owner_email,
        subject: `Tu cotización NOK está lista — ${session.property_address}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="font-size: 24px; letter-spacing: 2px;">NOK</h1>
            <h2>¡Hola ${session.owner_name}! 👋</h2>
            <p>Tu cotización de onboarding está lista. Hemos analizado tu apartamento en <strong>${session.property_address}</strong> y preparamos un inventario completo con todo lo que necesitas para cumplir los estándares NOK.</p>
            <p><strong>Total estimado: ${currency === 'DOP' ? 'RD$' : '$'}${grandTotal.toLocaleString()}</strong></p>
            <p>Adjuntamos el PDF con el detalle completo. Un ejecutivo de NOK te contactará en las próximas 24 horas para revisar juntos los detalles.</p>
            <p style="margin-top: 32px; color: #666;">— El equipo NOK</p>
          </div>
        `,
        attachments: [{
          filename: `cotizacion-nok-${session_id.slice(0, 8)}.pdf`,
          content: pdfBase64,
        }],
      })

      // Email to NOK team
      const nokTeamEmail = process.env.NOK_TEAM_EMAIL ?? 'operaciones@nok.do'
      await resend.emails.send({
        from: 'NOK Onboarding <onboarding@nok.do>',
        to: nokTeamEmail,
        subject: `[Nuevo onboarding] ${session.owner_name} — ${session.property_address}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px;">
            <h2>Nuevo onboarding completado</h2>
            <table style="border-collapse: collapse; width: 100%;">
              <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Propietario</strong></td><td style="padding: 8px; border: 1px solid #eee;">${session.owner_name}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #eee;">${session.owner_email}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Teléfono</strong></td><td style="padding: 8px; border: 1px solid #eee;">${session.owner_phone ?? '—'}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Propiedad</strong></td><td style="padding: 8px; border: 1px solid #eee;">${session.property_address}, ${session.property_city}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Total cotización</strong></td><td style="padding: 8px; border: 1px solid #eee;">${currency === 'DOP' ? 'RD$' : '$'}${grandTotal.toLocaleString()} ${currency}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Ítems a comprar</strong></td><td style="padding: 8px; border: 1px solid #eee;">${quoteItems.length}</td></tr>
            </table>
            <p style="margin-top: 16px;"><a href="${publicUrl}">📄 Ver cotización PDF</a></p>
          </div>
        `,
        attachments: [{
          filename: `cotizacion-nok-${session.owner_name.replace(/\s+/g, '-')}.pdf`,
          content: pdfBase64,
        }],
      })
    }

    return NextResponse.json({
      success: true,
      quote_pdf_url: publicUrl,
      quote_total: grandTotal,
      currency,
      items_count: quoteItems.length,
    })
  } catch (err) {
    console.error('generate-quote error:', err)
    return NextResponse.json({ error: 'Error generando la cotización' }, { status: 500 })
  }
}
