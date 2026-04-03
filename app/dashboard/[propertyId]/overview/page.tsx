import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { copToUSD } from '@/lib/trm'
import SupportForm from '@/components/dashboard/SupportForm'
import { loadOwnerProperty } from '@/lib/admin'

interface Props {
  params: Promise<{ propertyId: string }>
}

function fmt(amount: number | null, currency = 'USD') {
  if (amount === null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

function fmtPct(val: number | null) {
  if (val === null) return '—'
  return `${val.toFixed(1)}%`
}

export default async function OverviewPage({ params }: Props) {
  const { propertyId } = await params

  const { owner, property, sb } = await loadOwnerProperty(propertyId)
  if (!property) notFound()

  const now       = new Date()
  const yearStart = `${now.getFullYear()}-01-01`
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const monthEnd   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`

  const [cleaningsRes, upcomingRes, channelRes, checkoutsRes, monthResRes] = await Promise.all([
    sb.from('cleaning_records').select('completed_at, staff_name, status')
      .eq('property_id', propertyId).eq('status', 'completed')
      .order('completed_at', { ascending: false }).limit(1).single(),
    sb.from('reservations').select('check_in, check_out, guest_name, channel, nights')
      .eq('property_id', propertyId).eq('status', 'confirmed')
      .gte('check_in', new Date().toISOString().split('T')[0])
      .order('check_in', { ascending: true }).limit(3),
    sb.from('reservations').select('channel, owner_revenue, currency')
      .eq('property_id', propertyId).eq('status', 'confirmed').gte('check_in', yearStart),
    sb.from('reservations').select('check_in, check_out')
      .eq('property_id', propertyId).eq('status', 'confirmed')
      .lte('check_in', monthEnd).gte('check_out', monthStart),
    sb.from('reservations').select('owner_revenue, nights, currency')
      .eq('property_id', propertyId).eq('status', 'confirmed')
      .gte('check_in', monthStart).lte('check_in', monthEnd),
  ])

  const lastCleaning        = cleaningsRes.data
  const upcomingReservations = upcomingRes.data ?? []

  // Calculate metrics from reservations
  const monthReservations = monthResRes.data ?? []
  const totalBookedNights = monthReservations.reduce((s: number, r: any) => s + (r.nights ?? 0), 0)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const occupancyRate = daysInMonth > 0 ? Math.round((totalBookedNights / daysInMonth) * 100) : 0

  // Calculate checkouts this month (reservations that check out within this month)
  const checkoutReservations = checkoutsRes.data ?? []
  const checkoutsThisMonth = checkoutReservations.filter((r: any) => {
    const co = r.check_out
    return co >= monthStart && co <= monthEnd
  }).length

  // Channel breakdown (year to date)
  const channelMap: Record<string, { count: number; revenue: number }> = {}
  for (const r of channelRes.data ?? []) {
    const ch = r.channel ?? 'Otro'
    if (!channelMap[ch]) channelMap[ch] = { count: 0, revenue: 0 }
    channelMap[ch].count++
    channelMap[ch].revenue += r.owner_revenue ?? 0
  }
  const channels = Object.entries(channelMap).sort((a, b) => b[1].revenue - a[1].revenue)
  const totalRevenue = channels.reduce((s, [, v]) => s + v.revenue, 0)

  const CHANNEL_COLORS: Record<string, string> = {
    Airbnb: '#ef4444',
    'Booking.com': '#3b82f6',
    Direct: '#0E6845',
    Vrbo: '#8b5cf6',
  }

  // Financial summary
  const grossRevenue   = monthReservations.reduce((s: number, r: any) => s + (r.owner_revenue ?? 0), 0)
  const avgDailyRate   = totalBookedNights > 0 ? Math.round(grossRevenue / totalBookedNights) : 0
  const commRate       = (property.nok_commission_rate ?? 0) / 100
  const commAmount     = grossRevenue * commRate
  const checkouts      = checkoutsThisMonth
  let cleaningCostUSD  = 0
  if (property.cleaning_fee && checkouts > 0) {
    const raw = property.cleaning_fee as number
    cleaningCostUSD = property.cleaning_fee_currency === 'COP'
      ? await copToUSD(raw * checkouts)
      : raw * checkouts
  }
  const netRevenue         = grossRevenue - commAmount - cleaningCostUSD
  const hasFinancialData   = property.nok_commission_rate != null || property.cleaning_fee != null
  const ownerFirstName     = (owner as any).name?.split(' ')[0] ?? 'Propietario'

  return (
    <div style={{ backgroundColor: '#1D1D1B' }}>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section
        className="hero-shimmer relative overflow-hidden px-8 lg:px-16 flex flex-col justify-center"
        style={{ minHeight: '280px', paddingTop: '48px', paddingBottom: '48px' }}
      >
        {/* Subtle bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #1D1D1B)' }}
        />

        <div className="relative z-10">
          <p
            className="text-xs uppercase tracking-[0.2em] mb-4 fade-up"
            style={{ color: 'rgba(185,181,220,0.7)' }}
          >
            Portal de Propietarios
          </p>
          <h1
            className="font-serif text-5xl lg:text-6xl font-light text-[#F2F2F2] mb-3 fade-up-delay-1"
          >
            Bienvenido, {ownerFirstName}
          </h1>
          <p
            className="text-base mb-10 fade-up-delay-1"
            style={{ color: 'rgba(242,242,242,0.45)' }}
          >
            Aquí está el rendimiento de {property.name} este mes
          </p>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-3 fade-up-delay-2">
            <StatPill
              label="Ingresos del mes"
              value={fmt(grossRevenue)}
            />
            <StatPill
              label="Ocupación"
              value={fmtPct(occupancyRate)}
            />
            <StatPill
              label="Noches reservadas"
              value={String(totalBookedNights)}
            />
          </div>
        </div>
      </section>

      {/* ── Content ───────────────────────────────────────────────── */}
      <div className="px-8 lg:px-16 py-10 max-w-6xl space-y-6">

        {/* Metrics row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Ocupación del mes" value={fmtPct(occupancyRate)} sub="mes en curso" />
          <MetricCard label="Ingresos del mes" value={fmt(grossRevenue)} sub="owner revenue" />
          <MetricCard label="Tarifa promedio" value={avgDailyRate > 0 ? fmt(avgDailyRate) : '—'} sub="por noche" />
          <MetricCard label="Noches reservadas" value={String(totalBookedNights)} sub={`${monthReservations.length} reservas`} />
        </div>

        {/* Financial summary */}
        {hasFinancialData && (
          <div
            className="rounded-2xl p-6 nok-card"
          >
            <h2
              className="font-serif text-2xl font-light text-[#F2F2F2] mb-6"
            >
              Resumen financiero —{' '}
              {new Date(now.getFullYear(), now.getMonth()).toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="space-y-4">
              <FinRow label="Ingresos brutos" value={fmt(grossRevenue)} accent={false} />
              {property.nok_commission_rate != null && (
                <FinRow
                  label={`Comisión NOK (${property.nok_commission_rate}%)`}
                  value={`− ${fmt(commAmount)}`}
                  deduct
                />
              )}
              {property.cleaning_fee != null && (
                <FinRow
                  label={`Limpieza (${checkouts} checkout${checkouts !== 1 ? 's' : ''})`}
                  value={`− ${fmt(cleaningCostUSD)}`}
                  deduct
                />
              )}
              <div
                className="pt-4 mt-1"
                style={{ borderTop: '1px solid rgba(242,242,242,0.07)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[#F2F2F2] font-medium">Ingreso neto propietario</span>
                  <span className="text-xl font-semibold" style={{ color: '#4ade80' }}>{fmt(netRevenue)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews section removed — metrics table not populated */}

        {/* Channel breakdown */}
        {channels.length > 0 && (
          <div className="rounded-2xl p-6 nok-card">
            <h2 className="font-serif text-2xl font-light text-[#F2F2F2] mb-6">
              Origen de reservas — {now.getFullYear()}
            </h2>
            <div className="space-y-4">
              {channels.map(([channel, data]) => {
                const pct   = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
                const color = CHANNEL_COLORS[channel] ?? '#6b7280'
                return (
                  <div key={channel}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        <span className="font-medium text-[#F2F2F2]">{channel}</span>
                      </div>
                      <span style={{ color: 'rgba(242,242,242,0.45)' }}>
                        {data.count} reservas · {fmt(data.revenue)}
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'rgba(242,242,242,0.06)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct.toFixed(1)}%`, backgroundColor: color, opacity: 0.8 }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Upcoming + Operations row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Upcoming reservations */}
          <div className="rounded-2xl p-6 nok-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl font-light text-[#F2F2F2]">Próximas reservas</h2>
              <Link
                href={`/dashboard/${propertyId}/reservations`}
                className="text-xs transition-colors duration-200"
                style={{ color: '#B9B5DC' }}
                onMouseEnter={undefined}
              >
                Ver todas →
              </Link>
            </div>
            {upcomingReservations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: 'rgba(77,67,158,0.1)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(185,181,220,0.5)" strokeWidth="1.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <p className="text-sm" style={{ color: 'rgba(242,242,242,0.3)' }}>No hay reservas próximas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingReservations.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-3 first:pt-0"
                    style={{ borderBottom: i < upcomingReservations.length - 1 ? '1px solid rgba(242,242,242,0.05)' : 'none' }}
                  >
                    <div>
                      <p className="text-sm font-medium text-[#F2F2F2]">{r.guest_name ?? 'Huésped'}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(242,242,242,0.4)' }}>
                        {new Date(r.check_in).toLocaleDateString('es-DO', { month: 'short', day: 'numeric' })}
                        {' — '}
                        {new Date(r.check_out).toLocaleDateString('es-DO', { month: 'short', day: 'numeric' })}
                        {r.nights ? ` · ${r.nights} noches` : ''}
                      </p>
                    </div>
                    {r.channel && (
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{
                          backgroundColor: `${CHANNEL_COLORS[r.channel] ?? '#6b7280'}18`,
                          color: CHANNEL_COLORS[r.channel] ?? 'rgba(242,242,242,0.5)',
                          border: `1px solid ${CHANNEL_COLORS[r.channel] ?? '#6b7280'}35`,
                        }}
                      >
                        {r.channel}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Operations */}
          <div className="rounded-2xl p-6 nok-card">
            <h2 className="font-serif text-2xl font-light text-[#F2F2F2] mb-6">Estado operativo</h2>
            <div className="space-y-4">
              <OpRow
                label="Última limpieza"
                value={lastCleaning?.completed_at
                  ? new Date(lastCleaning.completed_at).toLocaleDateString('es-DO', { month: 'short', day: 'numeric' })
                  : 'Sin datos'}
              />
              {lastCleaning?.staff_name && (
                <OpRow label="Limpiadora" value={lastCleaning.staff_name} />
              )}
              <OpRow
                label="Reservas del mes"
                value={String(monthReservations.length)}
              />
              {property.nok_commission_rate != null && (
                <OpRow label="Comisión NOK" value={`${property.nok_commission_rate}%`} />
              )}
              {property.country && (
                <OpRow label="Mercado" value={property.country} />
              )}
            </div>
          </div>
        </div>

        {/* Support form */}
        <SupportForm propertyId={propertyId} />

        {/* NOK AI banner */}
        <div className="ai-banner-shimmer rounded-2xl p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <h3 className="font-semibold text-white text-sm">NOK AI está optimizando tus propiedades</h3>
            </div>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Precios dinámicos, respuestas automáticas y reportes inteligentes activos en tiempo real
            </p>
            <div className="flex flex-wrap gap-2">
              {['Precio dinámico ✓', 'Auto-respuestas ✓', 'Reportes AI ✓'].map(badge => (
                <span
                  key={badge}
                  className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
          <Link
            href={`/dashboard/${propertyId}/chat`}
            className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap"
            style={{
              backgroundColor: 'rgba(255,255,255,0.95)',
              color: '#4D439E',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}
          >
            Abrir NOK AI →
          </Link>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between py-6 text-xs"
          style={{
            borderTop: '1px solid rgba(242,242,242,0.06)',
            color: 'rgba(242,242,242,0.2)',
          }}
        >
          <span className="font-serif text-sm tracking-[0.2em]">NOK</span>
          <span>Curated stays designed to flow with you · <a href="https://nok.rent" target="_blank" rel="noopener" className="hover:text-[#B9B5DC] transition-colors">nok.rent</a></span>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center gap-4 px-5 py-3 rounded-xl"
      style={{
        backgroundColor: 'rgba(20,20,19,0.7)',
        border: '1px solid rgba(77,67,158,0.3)',
        borderLeft: '3px solid #4D439E',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div>
        <p className="text-xl font-semibold text-[#F2F2F2] leading-none">{value}</p>
        <p className="text-xs mt-1" style={{ color: 'rgba(242,242,242,0.45)' }}>{label}</p>
      </div>
    </div>
  )
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      className="rounded-2xl p-5 nok-card"
    >
      <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'rgba(242,242,242,0.35)' }}>{label}</p>
      <p className="font-serif text-4xl font-light text-[#F2F2F2] leading-none">{value}</p>
      {sub && <p className="text-xs mt-2" style={{ color: 'rgba(242,242,242,0.3)' }}>{sub}</p>}
    </div>
  )
}

function FinRow({ label, value, deduct = false, accent = false }: {
  label: string
  value: string
  deduct?: boolean
  accent?: boolean
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: 'rgba(242,242,242,0.55)' }}>{label}</span>
      <span style={{ color: deduct ? 'rgba(242,100,100,0.85)' : accent ? '#4ade80' : '#F2F2F2' }}>
        {value}
      </span>
    </div>
  )
}

function ReviewCard({ platform, score, count, color }: {
  platform: string; score: number; count: number | null; color: string
}) {
  return (
    <div className="rounded-2xl p-5 nok-card flex items-center gap-5">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xl"
        style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
      >
        ⭐
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(242,242,242,0.35)' }}>{platform}</p>
        <p className="font-serif text-3xl font-light text-[#F2F2F2]">{score.toFixed(2)}</p>
        {count && <p className="text-xs mt-0.5" style={{ color: 'rgba(242,242,242,0.3)' }}>{count} reseñas</p>}
      </div>
    </div>
  )
}

function OpRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between py-3 text-sm"
      style={{ borderBottom: '1px solid rgba(242,242,242,0.04)' }}
    >
      <span style={{ color: 'rgba(242,242,242,0.45)' }}>{label}</span>
      <span className="font-medium text-[#F2F2F2]">{value}</span>
    </div>
  )
}
