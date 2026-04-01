/**
 * Notion API client — reads the Apartamentos database
 * Database ID: 1057a032c2e48033b341ca0972b9f9f5
 *
 * Fields used:
 *   - Listing (title)              → property name
 *   - guesty_listing_id (rich_text) → match key against Supabase properties
 *   - Comision (number)             → NOK commission % (e.g. 10 = 10%)
 *   - Tarifa de Limpieza (a Propietario) (number) → cleaning fee
 *   - Location (select)             → Colombia | Republica Dominicana | USA
 *   - Moneda Limpieza (select)      → COP | USD (inferred from Location if missing)
 */

const NOTION_API_KEY = process.env.NOTION_API_KEY || ''
const NOTION_APARTAMENTOS_DB = process.env.NOTION_APARTAMENTOS_DB || '1057a032c2e48033b341ca0972b9f9f5'
const NOTION_VERSION = '2022-06-28'

export interface NotionApartamento {
  notion_id: string
  name: string
  guesty_listing_id: string | null
  nok_commission_rate: number | null   // 0–100 percent
  cleaning_fee: number | null          // raw value (COP or USD)
  cleaning_fee_currency: 'COP' | 'USD'
  country: string | null               // Colombia | Republica Dominicana | USA
}

function notionHeaders() {
  return {
    'Authorization': `Bearer ${NOTION_API_KEY}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  }
}

function extractText(prop: any): string | null {
  if (!prop) return null
  if (prop.type === 'title') return prop.title?.map((t: any) => t.plain_text).join('') || null
  if (prop.type === 'rich_text') return prop.rich_text?.map((t: any) => t.plain_text).join('') || null
  return null
}

function extractNumber(prop: any): number | null {
  if (!prop || prop.type !== 'number') return null
  return prop.number ?? null
}

function extractSelect(prop: any): string | null {
  if (!prop || prop.type !== 'select') return null
  return prop.select?.name ?? null
}

function parseApartamento(page: any): NotionApartamento {
  const props = page.properties ?? {}

  const name = extractText(props['Listing'] ?? props['Name'] ?? props['Nombre'] ?? props['nombre'])
  const guestyId = extractText(props['guesty_listing_id'] ?? props['Guesty Listing ID'] ?? props['guesty_id'])
  const commission = extractNumber(props['Comision'] ?? props['Comisión'] ?? props['commission'])
  const cleaningFee = extractNumber(
    props['Tarifa de Limpieza (a Propietario)'] ??
    props['Tarifa de Limpieza'] ??
    props['cleaning_fee']
  )
  const location = extractSelect(props['Location'] ?? props['Ubicación'] ?? props['Pais'])

  // Determine currency: Colombia = COP, everything else = USD
  const currency: 'COP' | 'USD' = location?.toLowerCase().includes('colombia') ? 'COP' : 'USD'

  return {
    notion_id: page.id,
    name: name ?? 'Sin nombre',
    guesty_listing_id: guestyId,
    nok_commission_rate: commission,
    cleaning_fee: cleaningFee,
    cleaning_fee_currency: currency,
    country: location,
  }
}

export async function getAllApartamentos(): Promise<NotionApartamento[]> {
  const results: NotionApartamento[] = []
  let cursor: string | undefined

  do {
    const body: any = { page_size: 100 }
    if (cursor) body.start_cursor = cursor

    const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_APARTAMENTOS_DB}/query`, {
      method: 'POST',
      headers: notionHeaders(),
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Notion API error ${res.status}: ${err}`)
    }

    const data = await res.json()
    for (const page of data.results ?? []) {
      results.push(parseApartamento(page))
    }

    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)

  return results
}
