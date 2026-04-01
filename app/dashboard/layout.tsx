import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const serviceSupabase = createServiceClient()
  const { data: owner } = await serviceSupabase
    .from('owners')
    .select('*, properties(*)')
    .eq('supabase_user_id', user.id)
    .single()

  if (!owner) redirect('/login')

  const properties = (owner.properties ?? []).filter((p: { active: boolean }) => p.active)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar owner={owner} properties={properties} />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
