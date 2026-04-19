/**
 * Owner-entered direct costs — helpers for dashboard calculations.
 *
 * Each cost is either `monthly` (recurring between start_date and end_date)
 * or `one_time` (hits only the month matching start_date).
 */

export interface OwnerCostRow {
  id: string
  property_id: string
  label: string
  category: string | null
  amount: number
  currency: 'USD' | 'DOP' | 'COP'
  frequency: 'monthly' | 'one_time'
  start_date: string
  end_date: string | null
  notes: string | null
  created_at: string
}

function ymd(d: Date) {
  return d.toISOString().slice(0, 10)
}

/**
 * Amount (in the cost's own currency) that applies to a given month window.
 */
export function costAmountForMonth(
  cost: OwnerCostRow,
  monthStart: Date,
  monthEnd: Date,
): number {
  const start = new Date(cost.start_date + 'T00:00:00')
  const end = cost.end_date ? new Date(cost.end_date + 'T00:00:00') : null

  if (cost.frequency === 'one_time') {
    if (start >= monthStart && start <= monthEnd) return cost.amount
    return 0
  }

  // monthly: applies every full month where (start <= monthEnd) AND (end is null or end >= monthStart)
  const startsBeforeMonthEnd = start <= monthEnd
  const endsAfterMonthStart = !end || end >= monthStart
  return startsBeforeMonthEnd && endsAfterMonthStart ? cost.amount : 0
}

/**
 * Sum of costs that apply to the given month, in USD (using provided rate helpers).
 */
export function sumMonthCostsUSD(
  costs: OwnerCostRow[],
  monthStart: Date,
  monthEnd: Date,
  toUSD: (amount: number, currency: string) => number,
): number {
  return costs.reduce((s, c) => {
    const amt = costAmountForMonth(c, monthStart, monthEnd)
    if (!amt) return s
    return s + toUSD(amt, c.currency)
  }, 0)
}

/**
 * Sum of costs that apply to any month in a YTD range.
 * Iterates month by month — simpler than closed-form and handles end_date correctly.
 */
export function sumRangeCostsUSD(
  costs: OwnerCostRow[],
  rangeStart: Date,
  rangeEnd: Date,
  toUSD: (amount: number, currency: string) => number,
): number {
  let total = 0
  const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1)
  while (cursor <= rangeEnd) {
    const monthStart = new Date(cursor)
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
    total += sumMonthCostsUSD(costs, monthStart, monthEnd, toUSD)
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return total
}

export const CATEGORY_LABELS: Record<string, string> = {
  mortgage: 'Hipoteca',
  maintenance: 'Mantenimiento',
  utilities: 'Servicios',
  insurance: 'Seguro',
  hoa: 'Condominio / HOA',
  property_tax: 'IPI / Impuestos',
  other: 'Otro',
}

export { ymd }
