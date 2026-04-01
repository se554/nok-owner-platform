import { notFound, redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Props {
  params: Promise<{ propertyId: string }>
}

function formatCurrency(amount: number | null, currency = 'USD') {
  if (amount === null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

function formatPercent(val: number | null) {
  if (val === null) return '—'
  return `${val.toFixed(1)}%`
}

export default async function OverviewPage({ params }: Props) {
  const { propertyId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceSupabase = createServiceClient()

  // Get owner
  const { data: owner } = await serviceSupabase
    .from('owners')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single()

  if (!owner) redirect('/login')

  // Get property (verify ownership)
  const { data: property } = await serviceSupabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .eq('owner_id', owner.id)
    .single()

  if (!property) notFound()

  const now = new Date()
  const yearStart = `${now.getFullYear()}-01-01`

  // Load latest metrics + recent cleanings in parallel
  const [metricsRes, cleaningsRes, upcomingRes, channelRes] = await Promise.all([
    serviceSupabase
      .from('property_metrics')
      .select('*')
      .eq('property_id', propertyId)
      .order('metric_date', { ascending: false })
      .limit(1)
      .single(),
    serviceSupabase
      .from('cleaning_records')
      .select('completed_at, staff_name, status')
      .eq('property_id', propertyId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single(),
    serviceSupabase
      .from('reservations')
      .select('check_in, check_out, guest_name, channel, nights')
      .eq('property_id', propertyId)
      .eq('status', 'confirmed')
      .gte('check_in', new Date().toISOString().split('T')[0])
      .order('check_in', { ascending: true })
      .limit(3),
    serviceSupabase
      .from('reservations')
      .select('channel, owner_revenue, currency')
      .eq('property_id', propertyId)
      .neq('status', 'cancelled')
      .gte('check_in', yearStart),
  ])

  const metrics = metricsRes.data
  const lastCleaning = cleaningsRes.data
  const upcomingReservations = upcomingRes.data ?? []

  // Aggregate channel data
  const channelMap: Record<string, { count: number; revenue: number }> = {}
  for (const r of channelRes.data ?? []) {
    const ch = r.channel ?? 'Otro'
    if (!channelMap[ch]) channelMap[ch] = { count: 0, revenue: 0 }
    channelMap[ch].count++
    channelMap[ch].revenue += r.owner_revenue ?? 0
  }
  const channels = Object.entries(channelMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
  const totalRevenue = channels.reduce((s, [, v]) => s + v.revenue, 0)

  const CHANNEL_COLORS: Record<string, string> = {
    Airbnb: 'bg-rose-500',
    'Booking.com': 'bg-blue-500',
    Direct: 'bg-green-500',
    Vrbo: 'bg-purple-500',
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
        {property.address && (
          <p className="text-gray-500 text-sm mt-0.5">{property.address}</p>
        )}
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Ocupación del mes"
          value={formatPercent(metrics?.occupancy_rate ?? null)}
          sub="mes en curso"
        />
        <MetricCard
          label="Ingresos del mes"
          value={formatCurrency(metrics?.revenue_month ?? null, metrics?.revenue_month_currency)}
          sub="netos propietario"
        />
        <MetricCard
          label="Tarifa promedio"
          value={metrics?.avg_daily_rate ? formatCurrency(metrics.avg_daily_rate) : '—'}
          sub="por noche"
        />
        <MetricCard
          label="Noches reservadas"
          value={metrics?.active_reservations_count ? String(metrics.active_reservations_count) : '—'}
          sub="reservas activas"
        />
      </div>

      {/* Reviews row */}
      {(metrics?.review_score_airbnb || metrics?.review_score_booking) && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {metrics.review_score_airbnb && (
            <ReviewCard
              platform="Airbnb"
              score={metrics.review_score_airbnb}
              count={metrics.review_count_airbnb}
            />
          )}
          {metrics.review_score_booking && (
            <ReviewCard
              platform="Booking.com"
              score={metrics.review_score_booking}
              count={metrics.review_count_booking}
            />
          )}
        </div>
      )}

      {/* Channel breakdown */}
      {channels.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Origen de reservas — {now.getFullYear()}</h2>
          <div className="space-y-3">
            {channels.map(([channel, data]) => {
              const pct = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
              const color = CHANNEL_COLORS[channel] ?? 'bg-gray-400'
              return (
                <div key={channel}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{channel}</span>
                    <span className="text-gray-500">
                      {data.count} reservas · {formatCurrency(data.revenue)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{ width: `${pct.toFixed(1)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Upcoming reservations */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Próximas reservas</h2>
            <Link
              href={`/dashboard/${propertyId}/reservations`}
              className="text-xs text-gray-500 hover:text-gray-800"
            >
              Ver todas →
            </Link>
          </div>
          {upcomingReservations.length === 0 ? (
            <p className="text-sm text-gray-400">No hay reservas próximas.</p>
          ) : (
            <div className="space-y-3">
              {upcomingReservations.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{r.guest_name ?? 'Huésped'}</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(r.check_in).toLocaleDateString('es-DO', { month: 'short', day: 'numeric' })}
                      {' → '}
                      {new Date(r.check_out).toLocaleDateString('es-DO', { month: 'short', day: 'numeric' })}
                      {r.nights ? ` · ${r.nights} noches` : ''}
                    </p>
                  </div>
                  {r.channel && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {r.channel}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Operations quick status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Estado operativo</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Última limpieza</span>
              <span className="text-gray-900 font-medium">
                {lastCleaning?.completed_at
                  ? new Date(lastCleaning.completed_at).toLocaleDateString('es-DO', {
                      month: 'short', day: 'numeric'
                    })
                  : 'Sin datos'}
              </span>
            </div>
            {lastCleaning?.staff_name && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Limpiadora</span>
                <span className="text-gray-900">{lastCleaning.staff_name}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Reservas activas</span>
              <span className="text-gray-900 font-medium">
                {metrics?.active_reservations_count ?? '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat CTA */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">¿Tienes alguna pregunta?</h3>
          <p className="text-gray-400 text-sm mt-0.5">
            Pregúntale a la IA sobre precios, reservas, reseñas o el estado de tu propiedad.
          </p>
        </div>
        <Link
          href={`/dashboard/${propertyId}/chat`}
          className="shrink-0 ml-4 bg-white text-gray-900 font-medium text-sm px-4 py-2 rounded-lg hover:bg-gray-100 transition"
        >
          Abrir chat →
        </Link>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div className={`bg-white rounded-xl border p-4 ${highlight ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}>
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function ReviewCard({
  platform,
  score,
  count,
}: {
  platform: string
  score: number
  count: number | null
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <div className="text-3xl">⭐</div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{platform}</p>
        <p className="text-2xl font-bold text-gray-900">{score.toFixed(2)}</p>
        {count && <p className="text-xs text-gray-400">{count} reseñas</p>}
      </div>
    </div>
  )
}
