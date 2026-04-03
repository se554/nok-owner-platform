import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import TopNav from '@/components/dashboard/TopNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const serviceSupabase = createServiceClient()
  const { data: owner } = await (serviceSupabase as any)
    .from('owners')
    .select('*, properties(*)')
    .eq('supabase_user_id', user.id)
    .single()

  if (!owner) redirect('/login')

  // Admin can see ALL properties across all owners
  const { isAdminEmail } = await import('@/lib/admin')
  const isAdmin = isAdminEmail(owner.email)

  let properties: any[]
  if (isAdmin) {
    const { data: allProps } = await (serviceSupabase as any)
      .from('properties')
      .select('*')
      .eq('active', true)
      .order('name')
    properties = allProps ?? []
  } else {
    properties = (owner.properties ?? []).filter((p: { active: boolean }) => p.active)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1D1D1B' }}>
      <TopNav owner={owner} properties={properties} />
      <main className="pt-16 min-w-0">
        {children}
      </main>
    </div>
  )
}
