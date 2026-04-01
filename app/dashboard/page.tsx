import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceSupabase = createServiceClient()
  const { data: owner } = await serviceSupabase
    .from('owners')
    .select('*, properties(*)')
    .eq('supabase_user_id', user.id)
    .single()

  const properties = (owner?.properties ?? []).filter((p: { active: boolean }) => p.active)

  if (properties.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">No hay propiedades asignadas a tu cuenta.</p>
      </div>
    )
  }

  // Redirect to first property overview
  redirect(`/dashboard/${properties[0].id}/overview`)
}
