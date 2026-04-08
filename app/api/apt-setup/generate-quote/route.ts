import { NextRequest } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { AptSetupQuotePDF, type AptSetupQuoteData } from '@/lib/apt-setup-pdf'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { quoteData } = body as { quoteData: AptSetupQuoteData }

    if (!quoteData) {
      return new Response(JSON.stringify({ error: 'quoteData required' }), { status: 400 })
    }

    // Generate quote number
    const now = new Date()
    const quoteNumber = `NOK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`
    quoteData.quote_number = quoteNumber
    quoteData.generated_at = now.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(createElement(AptSetupQuotePDF, { data: quoteData }) as any)

    const ownerSlug = quoteData.owner_name.replace(/\s+/g, '-').substring(0, 30)
    const filename = `NOK-Cotizacion-${ownerSlug}-${quoteNumber}.pdf`

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('apt-setup generate-quote error:', err)
    return new Response(JSON.stringify({ error: 'Error generating PDF', detail: String(err) }), { status: 500 })
  }
}
