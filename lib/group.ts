import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { redirect, notFound } from 'next/navigation'

export async function loadOwnerGroup(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sb = createServiceClient() as any
  const { data: owner } = await sb.from('owners').select('id, name, email').eq('supabase_user_id', user.id).single()
  if (!owner) redirect('/login')
  const isAdmin = isAdminEmail(owner.email)

  let gq = sb.from('owner_property_groups').select('*').eq('id', groupId)
  if (!isAdmin) gq = gq.eq('owner_id', owner.id)
  const { data: group } = await gq.single()
  if (!group) notFound()

  const { data: memberRows } = await sb
    .from('owner_property_group_members').select('property_id').eq('group_id', groupId)
  const propertyIds: string[] = (memberRows ?? []).map((m: any) => m.property_id)

  const { data: properties } = propertyIds.length
    ? await sb.from('properties').select('*').in('id', propertyIds)
    : { data: [] as any[] }

  return { owner, group, propertyIds, properties: properties ?? [], sb, isAdmin }
}
