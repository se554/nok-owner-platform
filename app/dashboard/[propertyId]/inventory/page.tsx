import { notFound } from 'next/navigation'
import { loadOwnerProperty } from '@/lib/admin'

interface Props {
  params: Promise<{ propertyId: string }>
}

const CONDITION_CONFIG: Record<string, { label: string; color: string; badge: string }> = {
  good:              { label: 'Bueno', color: 'text-green-700', badge: 'bg-green-100' },
  fair:              { label: 'Regular', color: 'text-amber-700', badge: 'bg-amber-100' },
  poor:              { label: 'Malo', color: 'text-red-700', badge: 'bg-red-100' },
  needs_replacement: { label: 'Reemplazar', color: 'text-red-700', badge: 'bg-red-100' },
}

export default async function InventoryPage({ params }: Props) {
  const { propertyId } = await params

  const { property, sb: serviceSupabase } = await loadOwnerProperty(propertyId)
  if (!property) notFound()

  const { data: items } = await serviceSupabase
    .from('inventory_items')
    .select('*')
    .eq('property_id', propertyId)
    .order('condition')

  const allItems = items ?? []
  const alerts = allItems.filter(i => i.condition === 'poor' || i.condition === 'needs_replacement')

  // Group by category
  const byCategory: Record<string, typeof allItems> = {}
  for (const item of allItems) {
    const cat = item.category ?? 'Otros'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(item)
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Inventario</h1>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-red-800 mb-2">
            {alerts.length} ítem{alerts.length > 1 ? 's' : ''} requiere atención
          </p>
          <div className="space-y-1">
            {alerts.map(item => (
              <p key={item.id} className="text-sm text-red-700">
                • {item.name} — {CONDITION_CONFIG[item.condition ?? '']?.label ?? item.condition}
              </p>
            ))}
          </div>
        </div>
      )}

      {allItems.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
          No hay inventario sincronizado todavía.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byCategory).map(([category, categoryItems]) => (
            <div key={category}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 capitalize">
                {category}
              </h2>
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {categoryItems.map(item => {
                  const cond = CONDITION_CONFIG[item.condition ?? '']
                  const monthsOld = item.last_replaced_at
                    ? Math.floor((Date.now() - new Date(item.last_replaced_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
                    : null

                  return (
                    <div key={item.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-400">
                          Cantidad: {item.quantity}
                          {monthsOld !== null && ` · Último reemplazo: hace ${monthsOld} mes${monthsOld !== 1 ? 'es' : ''}`}
                          {item.replacement_threshold_months && ` · Vida útil: ${item.replacement_threshold_months} meses`}
                        </p>
                      </div>
                      {cond && (
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cond.badge} ${cond.color}`}>
                          {cond.label}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
