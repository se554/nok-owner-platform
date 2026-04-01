'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

interface Reservation {
  id: string
  check_in: string
  check_out: string
  nights: number | null
  guest_name: string | null
  channel: string | null
  status: string
  num_guests: number | null
  owner_revenue: number | null
  currency: string | null
  total_price: number | null
}

interface PricingDay {
  calendar_date: string
  base_rate: number | null
  recommended_rate: number | null
  is_available: boolean
  is_blocked: boolean
  block_reason: string | null
  min_stay_nights: number | null
  currency: string | null
}

interface CalendarViewProps {
  propertyId: string
  year: number
  month: number
  reservations: Reservation[]
  pricing: PricingDay[]
}

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAYS_ES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

const CHANNEL_COLORS: Record<string, string> = {
  airbnb:       'bg-rose-500',
  'booking.com':'bg-blue-500',
  direct:       'bg-green-500',
  vrbo:         'bg-purple-500',
}

function getChannelColor(channel: string | null) {
  if (!channel) return 'bg-gray-400'
  const key = channel.toLowerCase()
  return CHANNEL_COLORS[key] ?? 'bg-gray-500'
}

function fmt(amount: number | null, currency = 'USD') {
  if (!amount) return null
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export default function CalendarView({ propertyId, year, month, reservations, pricing }: CalendarViewProps) {
  const router = useRouter()
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)

  // Build pricing map by date
  const pricingMap = new Map<string, PricingDay>()
  for (const p of pricing) pricingMap.set(p.calendar_date, p)

  // Build reservation coverage map: date -> reservation
  const reservationMap = new Map<string, Reservation>()
  for (const r of reservations) {
    const checkIn = new Date(r.check_in + 'T00:00:00')
    const checkOut = new Date(r.check_out + 'T00:00:00')
    const current = new Date(checkIn)
    while (current < checkOut) {
      const key = current.toISOString().split('T')[0]
      reservationMap.set(key, r)
      current.setDate(current.getDate() + 1)
    }
  }

  // Calendar grid
  const firstOfMonth = new Date(year, month - 1, 1)
  const lastOfMonth = new Date(year, month, 0)
  const startPad = firstOfMonth.getDay() // 0=Sun
  const totalDays = lastOfMonth.getDate()

  const cells: Array<{ date: string; day: number } | null> = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) {
    const date = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    cells.push({ date, day: d })
  }
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  function navigate(delta: number) {
    let m = month + delta
    let y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    router.push(`/dashboard/${propertyId}/calendar?month=${m}&year=${y}`)
  }

  const today = new Date().toISOString().split('T')[0]

  // Summary stats
  const bookedDays = [...reservationMap.keys()].filter(d => d >= `${year}-${String(month).padStart(2,'0')}-01` && d <= `${year}-${String(month).padStart(2,'0')}-${String(totalDays).padStart(2,'0')}`).length
  const occupancy = Math.round((bookedDays / totalDays) * 100)
  const monthRevenue = reservations
    .filter(r => r.check_in >= `${year}-${String(month).padStart(2,'0')}-01` && r.check_in <= `${year}-${String(month).padStart(2,'0')}-${String(totalDays).padStart(2,'0')}`)
    .reduce((sum, r) => sum + (r.owner_revenue ?? 0), 0)

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 font-medium">Ocupación</p>
          <p className="text-2xl font-bold text-gray-900">{occupancy}%</p>
          <p className="text-xs text-gray-400">{bookedDays}/{totalDays} días</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 font-medium">Reservas</p>
          <p className="text-2xl font-bold text-gray-900">{reservations.length}</p>
          <p className="text-xs text-gray-400">este mes</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 font-medium">Ingresos netos</p>
          <p className="text-2xl font-bold text-gray-900">{fmt(monthRevenue) ?? '—'}</p>
          <p className="text-xs text-gray-400">propietario</p>
        </div>
      </div>

      {/* Calendar card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition">‹</button>
          <h2 className="font-semibold text-gray-900">{MONTHS_ES[month - 1]} {year}</h2>
          <button onClick={() => navigate(1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition">›</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS_ES.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            if (!cell) return <div key={i} className="min-h-[80px] border-b border-r border-gray-50 bg-gray-50/50" />

            const { date, day } = cell
            const reservation = reservationMap.get(date)
            const price = pricingMap.get(date)
            const isToday = date === today
            const isPast = date < today
            const isCheckIn = reservation?.check_in === date
            const isCheckOut = reservation?.check_out === date

            return (
              <div
                key={date}
                onClick={() => reservation && setSelectedReservation(reservation)}
                className={`min-h-[80px] border-b border-r border-gray-100 p-1.5 flex flex-col
                  ${reservation ? 'cursor-pointer' : ''}
                  ${isPast ? 'bg-gray-50/60' : 'bg-white'}
                  ${reservation ? 'hover:brightness-95' : ''}
                `}
              >
                {/* Day number */}
                <div className="flex items-start justify-between mb-1">
                  <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-black text-white' : isPast ? 'text-gray-300' : 'text-gray-700'}
                  `}>
                    {day}
                  </span>
                  {isCheckIn && (
                    <span className="text-[9px] text-green-600 font-semibold">IN</span>
                  )}
                  {isCheckOut && !isCheckIn && (
                    <span className="text-[9px] text-red-400 font-semibold">OUT</span>
                  )}
                </div>

                {/* Reservation bar */}
                {reservation && (
                  <div className={`rounded px-1.5 py-1 mb-1 ${getChannelColor(reservation.channel)} bg-opacity-15 border-l-2 ${getChannelColor(reservation.channel).replace('bg-', 'border-')}`}>
                    <p className="text-[10px] font-semibold text-gray-800 truncate leading-tight">
                      {reservation.guest_name ?? 'Huésped'}
                    </p>
                    {isCheckIn && (
                      <p className="text-[9px] text-gray-500 leading-tight">
                        {reservation.nights}n · {reservation.channel ?? ''}
                      </p>
                    )}
                  </div>
                )}

                {/* Rate from Guesty */}
                {!reservation && price?.base_rate && (
                  <div className="mt-auto">
                    <p className="text-[10px] font-semibold text-gray-700">
                      {fmt(price.base_rate, price.currency ?? 'USD')}
                    </p>
                    {price.min_stay_nights && price.min_stay_nights > 1 && (
                      <p className="text-[9px] text-gray-400">{price.min_stay_nights}n mín</p>
                    )}
                  </div>
                )}

                {/* Blocked */}
                {!reservation && price?.is_blocked && (
                  <div className="rounded bg-gray-200 px-1 py-0.5">
                    <p className="text-[9px] text-gray-500">Bloqueado</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-3 px-1">
        <p className="text-xs text-gray-400 font-medium">Canales:</p>
        {Object.entries(CHANNEL_COLORS).map(([channel, color]) => (
          <div key={channel} className="flex items-center gap-1">
            <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
            <span className="text-xs text-gray-500 capitalize">{channel}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-gray-400" />
          <span className="text-xs text-gray-500">Otro</span>
        </div>
      </div>

      {/* Reservation detail modal */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReservation(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-semibold text-gray-900 text-lg">{selectedReservation.guest_name ?? 'Huésped'}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${getChannelColor(selectedReservation.channel)}`} />
                  <p className="text-sm text-gray-500 capitalize">{selectedReservation.channel ?? 'Canal desconocido'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedReservation(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="space-y-2.5">
              <Row label="Check-in" value={new Date(selectedReservation.check_in + 'T00:00:00').toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' })} />
              <Row label="Check-out" value={new Date(selectedReservation.check_out + 'T00:00:00').toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' })} />
              <Row label="Noches" value={String(selectedReservation.nights ?? '—')} />
              {selectedReservation.num_guests && <Row label="Huéspedes" value={String(selectedReservation.num_guests)} />}
              {selectedReservation.total_price && (
                <Row label="Precio total" value={fmt(selectedReservation.total_price, selectedReservation.currency ?? 'USD') ?? '—'} />
              )}
              {selectedReservation.owner_revenue && (
                <Row label="Ingreso neto" value={fmt(selectedReservation.owner_revenue, selectedReservation.currency ?? 'USD') ?? '—'} highlight />
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <Link
                href={`/dashboard/${propertyId}/reservations`}
                className="flex-1 text-center text-sm border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition text-gray-700"
                onClick={() => setSelectedReservation(null)}
              >
                Ver todas las reservas
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-green-700' : 'text-gray-900'}`}>{value}</span>
    </div>
  )
}
