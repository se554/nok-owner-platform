import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type NokStandard = {
  id: string
  space_type: string
  category: string
  item_name: string
  quantity_min: number
  quantity_max: number | null
  unit: string
  size_notes: string | null
  is_required: boolean
  market: string
  notes: string | null
}

export type CatalogItem = {
  id: string
  name: string
  provider: string
  reference_code: string | null
  category: string
  space_type: string | null
  country: string
  currency: string
  price: number
  colors_available: { color: string; photo_url: string }[]
  is_nok_standard: boolean
  purchase_url: string | null
  photo_url: string | null
  active: boolean
  notes: string | null
}

/**
 * Fetch all NOK standards, optionally filtered by market.
 * Returns them grouped by space_type for easy use in AI system prompts.
 */
export async function getNokStandards(market: 'DO' | 'CO' = 'DO') {
  const { data, error } = await supabase
    .from('nok_standards')
    .select('*')
    .or(`market.eq.all,market.eq.${market}`)
    .order('space_type')
    .order('category')
    .order('item_name')

  if (error) throw error
  return data as NokStandard[]
}

/**
 * Returns standards formatted as a readable text block for AI system prompts.
 * Grouped by space → category → item with quantities.
 */
export async function getNokStandardsForPrompt(market: 'DO' | 'CO' = 'DO'): Promise<string> {
  const standards = await getNokStandards(market)

  const grouped: Record<string, Record<string, NokStandard[]>> = {}
  for (const s of standards) {
    if (!grouped[s.space_type]) grouped[s.space_type] = {}
    if (!grouped[s.space_type][s.category]) grouped[s.space_type][s.category] = []
    grouped[s.space_type][s.category].push(s)
  }

  const spaceLabels: Record<string, string> = {
    cocina: 'COCINA',
    sala: 'SALA / COMEDOR',
    habitacion: 'HABITACIONES',
    baño: 'BAÑOS',
    general: 'GENERAL / TODO EL APARTAMENTO',
    lavanderia: 'LAVANDERÍA',
    terraza: 'TERRAZA',
  }

  const lines: string[] = []
  for (const [space, categories] of Object.entries(grouped)) {
    lines.push(`\n## ${spaceLabels[space] ?? space.toUpperCase()}`)
    for (const [cat, items] of Object.entries(categories)) {
      lines.push(`### ${cat.charAt(0).toUpperCase() + cat.slice(1)}`)
      for (const item of items) {
        const qty =
          item.quantity_max && item.quantity_max !== item.quantity_min
            ? `${item.quantity_min}–${item.quantity_max}`
            : `${item.quantity_min}`
        const required = item.is_required ? '✅' : '⚪'
        const unit = item.unit !== 'unidad' ? ` (${item.unit})` : ''
        const notes = [item.size_notes, item.notes].filter(Boolean).join(' | ')
        lines.push(
          `${required} ${qty}x ${item.item_name}${unit}${notes ? ` — ${notes}` : ''}`
        )
      }
    }
  }
  return lines.join('\n')
}

/**
 * Fetch catalog items for a given market and optional space/category filters.
 */
export async function getCatalogItems(
  country: 'DO' | 'CO',
  filters?: { category?: string; space_type?: string }
) {
  let query = supabase
    .from('catalog_items')
    .select('*')
    .eq('country', country)
    .eq('active', true)
    .order('category')
    .order('name')

  if (filters?.category) query = query.eq('category', filters.category)
  if (filters?.space_type) query = query.eq('space_type', filters.space_type)

  const { data, error } = await query
  if (error) throw error
  return data as CatalogItem[]
}

/**
 * Find catalog items that match a given standard item name (fuzzy, case-insensitive).
 */
export async function findCatalogItemsForStandard(
  itemName: string,
  country: 'DO' | 'CO'
): Promise<CatalogItem[]> {
  const { data, error } = await supabase
    .from('catalog_items')
    .select('*')
    .eq('country', country)
    .eq('active', true)
    .ilike('name', `%${itemName}%`)
    .order('is_nok_standard', { ascending: false })

  if (error) throw error
  return data as CatalogItem[]
}
