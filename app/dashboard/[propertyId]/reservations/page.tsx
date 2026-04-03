import { notFound } from 'next/navigation'
import { loadOwnerProperty } from '@/lib/admin'
import Link from 'next/link'

interface Props {
  params: Promise<{ propertyId: string }>
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  confirmed:    { label: 'Confirmada', color: 'bg-green-100 text-green-700' },
  checked_in:   { label: 'En casa', color: 'bg-blue-100 text-blue-700' },
  checked_out:  { label: 'Completada', color: 'bg-gray-100 text-gray-600' },
  cancelled:    { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
  inquiry:      { label: 'Consulta', color: 'bg-yellow-100 text-yellow-700' },
}

export default async function ReservationsPage({ params }: Props) {
  const { propertyId } = await params

  const { property, sb: serviceSupabase } = await loadOwnerProperty(propertyId)
  if (!property) notFound()

  // Get reservations: upcoming first, then past
  const today = new Date().toISOString().split('T')[0]

  const { data: upcoming } = await serviceSupabase
    .from('reservations')
    .select('*')
    .eq('property_id', propertyId)
    .gte('check_in', today)
    .neq('status', 'cancelled')
    .order('check_in', { ascending: true })
    .limit(20)

  const { data: past } = await serviceSupabase
    .from('reservations')
    .select('*')
    .eq('property_id', propertyId)
    .lt('check_in', today)
    .order('check_in', { ascending: false })
    .limit(10)

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
        <Link
          href={`/dashboard/${propertyId}/chat`}
          className="text-sm text-gray-500 hover:text-gray-800 border border-dashed border-gray-300 px-3 py-1.5 rounded-lg transition"
        >
          Pregúntale a la IA ✦
        </Link>
      </div>

      {/* Upcoming */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Próximas reservas
        </h2>
        {!upcoming?.length ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-400 text-sm">
            No hay reservas próximas confirmadas.
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((r: any) => (
              <ReservationRow key={r.id} reservation={r} />
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      {(past?.length ?? 0) > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Reservas recientes
          </h2>
          <div className="space-y-2">
            {past!.map((r: any) => (
              <ReservationRow key={r.id} reservation={r} past />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

interface ReservationData {
  id: string
  status: string
  check_in: string
  check_out: string
  nights: number | null
  guest_name: string | null
  channel: string | null
  num_guests: number | null
  owner_revenue: number | null
  currency: string | null
}

function ReservationRow({ reservation: r, past = false }: { reservation: ReservationData; past?: boolean }) {
  const status = STATUS_LABELS[r.status] ?? { label: r.status, color: 'bg-gray-100 text-gray-600' }
  const checkIn = new Date(r.check_in)
  const checkOut = new Date(r.check_out)
  const fmt = (d: Date) => d.toLocaleDateString('es-DO', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className={`bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-4 ${past ? 'opacity-70' : ''}`}>
      <div className="shrink-0 text-center w-16">
        <p className="text-xs text-gray-400">{checkIn.toLocaleDateString('es-DO', { month: 'short' })}</p>
        <p className="text-2xl font-bold text-gray-900 leading-none">{checkIn.getDate()}</p>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-gray-900 text-sm">{r.guest_name ?? 'Huésped'}</p>
          {r.channel && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{r.channel}</span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          {fmt(checkIn)} → {fmt(checkOut)}
          {r.nights ? ` · ${r.nights} noches` : ''}
          {r.num_guests ? ` · ${r.num_guests} huéspedes` : ''}
        </p>
      </div>

      {r.owner_revenue && (
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-gray-900">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: r.currency ?? 'USD' }).format(r.owner_revenue)}
          </p>
          <p className="text-xs text-gray-400">ingreso neto</p>
        </div>
      )}
    </div>
  )
}
