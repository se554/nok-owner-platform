import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({
    apiKey: process.env.NOK_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
  })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const category = formData.get('category') as string

    if (!file || !category) {
      return NextResponse.json({ error: 'file and category required' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp'

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: `You are a NOK hospitality standards inspector. NOK is a premium short-term rental brand in Latin America.

Analyze this photo of the "${category}" area. Check if furniture and design meet NOK's standards:

NOK Standards:
- Furniture must be in good condition (no visible damage, stains, or excessive wear)
- Design must be modern and minimalist (no outdated styles from before 2015)
- Color palette: neutral tones (white, gray, beige, black) — no strong colors
- Beds must have headboards
- Sofas must be modern style, clean, no visible wear
- Kitchen must look clean and organized
- Linens must appear clean, white or neutral colored
- Walls should be clean, well-painted, no visible damage

Respond in JSON only (no markdown, no backticks):
{
  "category": "${category}",
  "overall_status": "approved|needs_review|rejected",
  "score": 0-100,
  "items_detected": ["item1", "item2"],
  "issues": ["issue description if any"],
  "recommendation": "brief action if rejected or needs_review, empty string if approved"
}`,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Parse JSON from response (handle potential markdown wrapping)
    let json
    try {
      const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
      json = JSON.parse(cleaned)
    } catch {
      json = {
        category,
        overall_status: 'needs_review',
        score: 50,
        items_detected: [],
        issues: ['Could not analyze photo properly'],
        recommendation: 'Please try uploading a clearer photo',
      }
    }

    return NextResponse.json(json)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
