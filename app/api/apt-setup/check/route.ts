import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getNokStandardsForPrompt } from '@/lib/nok-standards'

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({
    apiKey: process.env.NOK_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
  })

  try {
    const body = await req.json()
    const { messages, country, bedrooms, bathrooms, property_address } = body as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      country: 'CO' | 'DO'
      bedrooms: number
      bathrooms: number
      property_address: string
    }

    const standardsText = await getNokStandardsForPrompt(country)

    const systemPrompt = `Eres el inspector de est\u00e1ndares de NOK, empresa l\u00edder de gesti\u00f3n de apartamentos premium de corto plazo en Latinoam\u00e9rica.

Tu trabajo: verificar r\u00e1pidamente qu\u00e9 tiene el apartamento vs. los est\u00e1ndares NOK.

APARTAMENTO: ${property_address}
HABITACIONES: ${bedrooms} | BA\u00d1OS: ${bathrooms}

EST\u00c1NDARES NOK (referencia):
${standardsText}

FLUJO R\u00c1PIDO — 4 categor\u00edas en orden:
1. Sala/Comedor
2. Habitaciones (cuartos)
3. Cocina
4. Lencer\u00eda (s\u00e1banas, toallas, almohadas)

REGLAS:
1. Pregunta UNA categor\u00eda a la vez: "\u00bfQu\u00e9 muebles y accesorios tienes en la sala?"
2. Con la respuesta, haz resumen inmediato y PASA a la siguiente categor\u00eda en el MISMO mensaje
3. Formato de resumen: "\u2705 Sof\u00e1, mesa de centro. \u274c Te faltan: cojines decorativos, l\u00e1mpara de piso."
4. NUNCA preguntes "\u00bfalgo m\u00e1s?" \u2014 T\u00da decides cu\u00e1ndo avanzar
5. M\u00e1ximo 3-4 oraciones por respuesta
6. Cuando termines las 4 categor\u00edas, responde con el JSON final

CIERRE (despu\u00e9s de cubrir las 4 categor\u00edas):
Responde EXACTAMENTE con un bloque JSON como este (sin texto antes ni despu\u00e9s):
\`\`\`json
{
  "complete": true,
  "results": {
    "sala": {
      "items": [
        {"name": "Sof\u00e1", "status": "has_it", "quantity_needed": 1},
        {"name": "Cojines decorativos", "status": "missing", "quantity_needed": 4}
      ]
    },
    "habitacion": { "items": [...] },
    "cocina": { "items": [...] },
    "lenceria": { "items": [...] }
  }
}
\`\`\`

status values: "has_it" | "missing" | "not_nok_standard"

TONO: profesional pero amigable. Directo y eficiente.`

    const trimmedMessages = [...messages]
    while (trimmedMessages.length > 0 && trimmedMessages[0].role === 'assistant') {
      trimmedMessages.shift()
    }
    if (!trimmedMessages.length) {
      return new Response(JSON.stringify({ error: 'No messages' }), { status: 400 })
    }

    const stream = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: systemPrompt,
      messages: trimmedMessages.map(m => ({ role: m.role, content: m.content })),
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
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
          controller.close()
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`))
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
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
