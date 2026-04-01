import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceSupabase = createServiceClient()
  const { data: owner } = await serviceSupabase
    .from('owners')
    .select('*, properties(*)')
    .eq('supabase_user_id', user.id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockOwner = owner ?? { id: '', name: user.email ?? 'Admin', email: user.email ?? '', supabase_user_id: user.id } as any
  const properties = (owner?.properties ?? []).filter((p: { active: boolean }) => p.active)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar owner={mockOwner} properties={properties} />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
