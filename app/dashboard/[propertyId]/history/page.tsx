import { notFound } from 'next/navigation'
import { loadOwnerProperty } from '@/lib/admin'

interface Props {
  params: Promise<{ propertyId: string }>
}

export default async function HistoryPage({ params }: Props) {
  const { propertyId } = await params

  const { property, sb: serviceSupabase } = await loadOwnerProperty(propertyId)
  if (!property) notFound()

  const [cleaningsRes, maintenanceRes] = await Promise.all([
    serviceSupabase
      .from('cleaning_records')
      .select('*')
      .eq('property_id', propertyId)
      .order('scheduled_at', { ascending: false })
      .limit(20),
    serviceSupabase
      .from('maintenance_records')
      .select('*')
      .eq('property_id', propertyId)
      .order('scheduled_at', { ascending: false })
      .limit(20),
  ])

  const cleanings = cleaningsRes.data ?? []
  const maintenance = maintenanceRes.data ?? []

  // Merge and sort by date
  const timeline = [
    ...cleanings.map((c: Record<string, unknown>) => ({ ...c, _type: 'cleaning' as const })),
    ...maintenance.map((m: Record<string, unknown>) => ({ ...m, _type: 'maintenance' as const })),
  ].sort((a, b) => {
    const dateA = new Date(a.scheduled_at ?? a.created_at).getTime()
    const dateB = new Date(b.scheduled_at ?? b.created_at).getTime()
    return dateB - dateA
  })

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Historial operativo</h1>

      {timeline.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
          No hay historial operativo todavía.
        </div>
      ) : (
        <div className="space-y-3">
          {timeline.map(record => {
            const isCleaning = record._type === 'cleaning'
            const date = record.completed_at ?? record.scheduled_at
            const formattedDate = date
              ? new Date(date).toLocaleDateString('es-DO', {
                  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                })
              : 'Sin fecha'

            return (
              <div key={record.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm
                    ${isCleaning ? 'bg-blue-100' : 'bg-amber-100'}`}>
                    {isCleaning ? '🧹' : (record as Record<string,unknown>).type === 'inspection' ? '🔍' : '🔧'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900">
                        {isCleaning
                          ? 'Limpieza'
                          : ((record as Record<string,unknown>).title as string) ?? ((record as Record<string,unknown>).type === 'inspection' ? 'Inspección' : 'Mantenimiento')}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${record.status === 'completed' ? 'bg-green-100 text-green-700' :
                          record.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'}`}>
                        {record.status === 'completed' ? 'Completado' :
                         record.status === 'cancelled' ? 'Cancelado' :
                         record.status === 'in_progress' ? 'En curso' : 'Programado'}
                      </span>
                      {(record as Record<string,unknown>).priority === 'high' || (record as Record<string,unknown>).priority === 'urgent' ? (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          {(record as Record<string,unknown>).priority === 'urgent' ? 'Urgente' : 'Alta prioridad'}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formattedDate}
                      {record.staff_name && ` · ${record.staff_name}`}
                      {isCleaning && (record as Record<string,unknown>).duration_minutes
                        ? ` · ${(record as Record<string,unknown>).duration_minutes} min`
                        : ''}
                    </p>
                    {record.notes && (
                      <p className="text-xs text-gray-600 mt-1.5 bg-gray-50 rounded-lg px-3 py-2">
                        {record.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
