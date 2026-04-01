import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'
import { getNokStandardsForPrompt } from '@/lib/nok-standards'

const SPACE_ORDER = ['cocina', 'sala', 'habitacion', 'baño', 'lavanderia', 'terraza', 'general']

// Tool definition — AI calls this to persist inventory items as it discovers them
const SAVE_ITEMS_TOOL: Anthropic.Tool = {
  name: 'save_inventory_items',
  description: 'Guarda los ítems de inventario de un espacio una vez que hayas determinado su estado con el propietario. Llama esta herramienta al terminar de revisar cada espacio.',
  input_schema: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        description: 'Lista de ítems del espacio con su estado',
        items: {
          type: 'object',
          properties: {
            space:           { type: 'string', enum: SPACE_ORDER, description: 'Espacio al que pertenece el ítem' },
            item_name:       { type: 'string', description: 'Nombre del ítem según estándares NOK' },
            status:          { type: 'string', enum: ['has_it', 'missing', 'not_nok_standard'], description: 'has_it = el propietario ya lo tiene y cumple NOK; missing = no lo tiene; not_nok_standard = lo tiene pero no cumple estándar NOK' },
            quantity_needed: { type: 'number', description: 'Cantidad necesaria según estándar NOK (no la que tiene, la que necesita para cumplir)' },
            notes:           { type: 'string', description: 'Observaciones opcionales (e.g. "tiene pero es de madera, NOK requiere vidrio templado")' },
          },
          required: ['space', 'item_name', 'status', 'quantity_needed'],
        },
      },
    },
    required: ['items'],
  },
}

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.NOK_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY })
  try {
    const body = await req.json()
    const { session_id, messages } = body as {
      session_id: string
      messages: Array<{ role: 'user' | 'assistant'; content: string | Array<{ type: string; [k: string]: unknown }> }>
    }

    if (!session_id || !messages?.length) {
      return new Response(JSON.stringify({ error: 'session_id y messages requeridos' }), { status: 400 })
    }

    const supabase = createServiceClient()

    // Fetch session context
    const { data: session, error: sessionError } = await supabase
      .from('onboarding_sessions')
      .select('*')
      .eq('id', session_id)
      .single()

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: 'Sesión no encontrada' }), { status: 404 })
    }

    const country = session.property_country === 'CO' ? 'CO' : 'DO'
    const standardsText = await getNokStandardsForPrompt(country)

    // Build floor plan context
    let floorPlanContext = ''
    if (session.floor_plan_spaces) {
      const spaces = session.floor_plan_spaces as Array<{ name: string; area_m2: number | null }>
      floorPlanContext = `\nDIMENSIONES DEL APARTAMENTO (extraídas del plano):\n`
      floorPlanContext += spaces.map(s => `- ${s.name}: ${s.area_m2 ? `${s.area_m2} m²` : 'dimensiones no legibles'}`).join('\n')
    }

    // Load existing inventory items
    let inventoryContext = ''
    const { data: existingItems } = await supabase
      .from('onboarding_inventory_items')
      .select('space, item_name, status, quantity_needed')
      .eq('session_id', session_id)

    if (existingItems && existingItems.length > 0) {
      const grouped: Record<string, typeof existingItems> = {}
      for (const item of existingItems) {
        if (!grouped[item.space]) grouped[item.space] = []
        grouped[item.space].push(item)
      }
      inventoryContext = `\nINVENTARIO GUARDADO HASTA AHORA:\n`
      for (const [space, items] of Object.entries(grouped)) {
        inventoryContext += `${space.toUpperCase()}:\n`
        for (const item of items) {
          const icon = item.status === 'has_it' ? '✅' : item.status === 'missing' ? '❌' : '⚠️'  // not_nok_standard = ⚠️
          inventoryContext += `  ${icon} ${item.item_name} (x${item.quantity_needed})\n`
        }
      }
    }

    const systemPrompt = `Eres el asistente de onboarding de NOK, empresa líder de gestión de apartamentos de corto plazo en el Caribe y Colombia.
Tu trabajo es construir el inventario completo del apartamento conversando con el propietario, espacio por espacio.

PROPIETARIO: ${session.owner_name}
DIRECCIÓN: ${session.property_address}, ${session.property_city}
HABITACIONES: ${session.bedrooms ?? 'por determinar'}
BAÑOS: ${session.bathrooms ?? 'por determinar'}
${floorPlanContext}

ESTÁNDARES NOK (lo que debe tener el apartamento):
${standardsText}
${inventoryContext}

ORDEN DE ESPACIOS (sigue este orden, sin saltarte ninguno):
cocina → sala/comedor → habitación(es) → baño(s) → lavandería → terraza → general

REGLA #1 — NUNCA TERMINES UN MENSAJE SIN PREGUNTAR EL SIGUIENTE ESPACIO:
Cada vez que termines de revisar un espacio, tu mensaje SIEMPRE debe terminar con la pregunta del siguiente espacio.
Ejemplo correcto: "Tienes ✅ nevera y microondas. Te falta ❌ cafetera, utensilios de cocina y limpieza. Perfecto, pasemos a la **sala/comedor** — ¿qué muebles y decoración tienes ahí?"
NUNCA dejes un mensaje sin la pregunta del siguiente espacio hasta que hayas cubierto todos.

REGLA #2 — SI EL USUARIO CONFIRMA, PREGUNTA EL SIGUIENTE ESPACIO:
Si el usuario dice "correcto", "ok", "sí", "exacto" o similar después de un resumen, significa que el espacio está listo.
Responde: "Perfecto, pasemos a [siguiente espacio] — ¿qué tienes ahí?"

REGLA #3 — UN INTERCAMBIO POR ESPACIO:
Con UNA respuesta del propietario tienes suficiente. Haz el resumen y pasa al siguiente.
NO preguntes "¿algo más en la cocina?" ni "¿terminamos con X?". TÚ decides cuándo avanzar.

REGLA #4 — ESPACIO VACÍO:
Si el propietario dice que no tiene nada, di: "Ok, todo por conseguir en [espacio]. Pasemos a [siguiente] — ¿qué tienes ahí?"

CIERRE (solo cuando hayas cubierto TODOS los espacios):
Di exactamente: "¡Listo! Ya tengo todo lo que necesito para preparar tu cotización."

TONO: amigable, directo, eficiente. Máximo 4 oraciones por respuesta.`

    // Strip leading assistant messages (Anthropic requires first message to be user)
    const trimmedMessages = [...messages]
    while (trimmedMessages.length > 0 && trimmedMessages[0].role === 'assistant') {
      trimmedMessages.shift()
    }
    if (!trimmedMessages.length) {
      return new Response(JSON.stringify({ error: 'No hay mensajes de usuario' }), { status: 400 })
    }

    // Stream — no tools here, extraction happens in background after stream closes
    const stream = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: systemPrompt,
      messages: trimmedMessages.map(m => ({
        role: m.role,
        content: m.content as string,
      })),
      stream: true,
    })

    let fullText = ''
    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const chunk = event.delta.text
              fullText += chunk
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
            }
          }

          // Save chat history and send done — close the stream immediately
          const updatedHistory = [
            ...(session.chat_history as Array<unknown> ?? []),
            ...messages.slice(-(messages.length - (session.chat_history as Array<unknown> ?? []).length)),
            { role: 'assistant', content: fullText, timestamp: new Date().toISOString() },
          ]
          const isComplete = fullText.includes('Ya tengo todo lo que necesito para preparar tu cotización')
          await supabase
            .from('onboarding_sessions')
            .update({ chat_history: updatedHistory, status: isComplete ? 'report_ready' : 'chat_in_progress' })
            .eq('id', session_id)

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, complete: isComplete })}\n\n`))
          controller.close()

          // --- Extraction pass (background) — runs AFTER stream is closed ---
          // Separate Anthropic call with tool_choice:'any' to always persist inventory items.
          const capturedText = fullText
          const capturedMessages = trimmedMessages
          Promise.resolve().then(async () => {
            try {
              const transcript = [
                ...capturedMessages.map(m => `${m.role === 'user' ? 'PROPIETARIO' : 'ASISTENTE'}: ${m.content as string}`),
                `ASISTENTE: ${capturedText}`,
              ].join('\n\n')

              const extraction = await anthropic.messages.create({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 2000,
                system: `Eres un extractor de inventario de apartamentos para NOK. Dada la transcripción de una conversación de onboarding, extrae los ítems de inventario mencionados y llama save_inventory_items.
Reglas:
- has_it: el propietario lo tiene Y cumple estándares NOK
- missing: no lo tiene (o no fue mencionado como que lo tiene)
- not_nok_standard: lo tiene pero no cumple el estándar NOK (ej: tabla de madera → NOK requiere vidrio templado)
- Solo incluye ítems EXPLÍCITAMENTE mencionados o inferibles directamente de la conversación
- quantity_needed = cantidad mínima según estándar NOK (no la que tiene el propietario)

ESTÁNDARES NOK (referencia):
${standardsText}`,
                tools: [SAVE_ITEMS_TOOL],
                tool_choice: { type: 'any' },
                messages: [{ role: 'user', content: `Extrae el inventario de esta conversación:\n\n${transcript}` }],
              })

              for (const block of extraction.content) {
                if (block.type === 'tool_use' && block.name === 'save_inventory_items') {
                  const input = block.input as {
                    items: Array<{ space: string; item_name: string; status: 'has_it' | 'missing' | 'not_nok_standard'; quantity_needed: number; notes?: string }>
                  }
                  const spaces = [...new Set(input.items.map(i => i.space))]
                  for (const space of spaces) {
                    await supabase.from('onboarding_inventory_items').delete()
                      .eq('session_id', session_id).eq('space', space)
                  }
                  // Fetch catalog items for price matching
                  const { data: catalogItems } = await supabase
                    .from('catalog_items')
                    .select('id, name, space_type, price, currency')
                    .eq('country', country)
                    .eq('active', true)

                  const matchCatalog = (itemName: string, space: string) => {
                    if (!catalogItems) return null
                    const nameLower = itemName.toLowerCase()
                    // Exact match first
                    let match = catalogItems.find(c =>
                      c.name.toLowerCase() === nameLower && (c.space_type === space || !c.space_type)
                    )
                    if (!match) {
                      // Partial match (catalog name contains item name or vice versa)
                      match = catalogItems.find(c =>
                        (c.name.toLowerCase().includes(nameLower) || nameLower.includes(c.name.toLowerCase())) &&
                        (c.space_type === space || !c.space_type)
                      )
                    }
                    if (!match) {
                      // Looser: ignore space
                      match = catalogItems.find(c =>
                        c.name.toLowerCase().includes(nameLower) || nameLower.includes(c.name.toLowerCase())
                      )
                    }
                    return match
                  }

                  const rows = input.items.map(item => {
                    const catalogMatch = matchCatalog(item.item_name, item.space)
                    return {
                      session_id, space: item.space, item_name: item.item_name,
                      status: item.status, quantity_needed: item.quantity_needed,
                      notes: item.notes ?? null,
                      catalog_item_id: catalogMatch?.id ?? null,
                      unit_price: catalogMatch?.price ?? null,
                      currency: catalogMatch?.currency ?? (country === 'DO' ? 'DOP' : 'COP'),
                    }
                  })
                  if (rows.length > 0) {
                    await supabase.from('onboarding_inventory_items').insert(rows)
                  }
                }
              }
            } catch (extractErr) {
              console.error('extraction error:', extractErr)
            }
          })
        } catch (streamErr) {
          console.error('stream error:', streamErr)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(streamErr) })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error('onboarding chat error:', errMsg)
    return new Response(JSON.stringify({ error: 'Error en el chat', detail: errMsg }), { status: 500 })
  }
}
