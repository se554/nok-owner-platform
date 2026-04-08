import { NextRequest, NextResponse } from 'next/server'
import { getCatalogItems } from '@/lib/nok-standards'

export async function GET(req: NextRequest) {
  const country = (req.nextUrl.searchParams.get('country') ?? 'CO') as 'CO' | 'DO'

  try {
    const items = await getCatalogItems(country)
    return NextResponse.json(
      items.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        currency: i.currency,
        purchase_url: i.purchase_url,
        space_type: i.space_type,
      }))
    )
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
