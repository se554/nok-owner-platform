import { notFound, redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import CalendarView from '@/components/calendar/CalendarView'
import SyncButton from '@/components/calendar/SyncButton'

interface Props {
  params: Promise<{ propertyId: string }>
  searchParams: Promise<{ month?: string; year?: string }>
}

export default async function CalendarPage({ params, searchParams }: Props) {
  const { propertyId } = await params
  const { month, year } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sb = createServiceClient()

  const { data: owner } = await sb.from('owners').select('id').eq('supabase_user_id', user.id).single()
  if (!owner) redirect('/login')

  const { data: property } = await sb.from('properties').select('*').eq('id', propertyId).eq('owner_id', owner.id).single()
  if (!property) notFound()

  // Determine the month/year to show
  const now = new Date()
  const displayYear = year ? parseInt(year) : now.getFullYear()
  const displayMonth = month ? parseInt(month) : now.getMonth() + 1 // 1-12

  // Build date range for the month
  const firstDay = new Date(displayYear, displayMonth - 1, 1)
  const lastDay = new Date(displayYear, displayMonth, 0)
  const from = firstDay.toISOString().split('T')[0]
  const to = lastDay.toISOString().split('T')[0]

  // Load reservations and pricing in parallel
  const [reservationsRes, pricingRes] = await Promise.all([
    sb.from('reservations')
      .select('id, check_in, check_out, nights, guest_name, channel, status, num_guests, owner_revenue, currency, total_price')
      .eq('property_id', propertyId)
      .neq('status', 'cancelled')
      .lte('check_in', to)
      .gte('check_out', from)
      .order('check_in'),
    sb.from('pricing_calendar')
      .select('calendar_date, base_rate, recommended_rate, is_available, is_blocked, block_reason, min_stay_nights, currency')
      .eq('property_id', propertyId)
      .gte('calendar_date', from)
      .lte('calendar_date', to)
      .order('calendar_date'),
  ])

  return (
    <div className="px-8 lg:px-16 py-10 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-4xl font-light text-[#F2F2F2]">Calendario</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(242,242,242,0.4)' }}>{property.name}</p>
        </div>
        <SyncButton propertyId={propertyId} />
      </div>

      <CalendarView
        propertyId={propertyId}
        year={displayYear}
        month={displayMonth}
        reservations={reservationsRes.data ?? []}
        pricing={pricingRes.data ?? []}
      />
    </div>
  )
}
