/**
 * Admin helpers — centralized admin email list and property access
 */

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const ADMIN_EMAILS = ['se@nok.rent']

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email)
}

/**
 * Load owner + property with admin bypass.
 * Admins (by email) can access any property regardless of owner_id.
 * Returns { owner, property, sb } or redirects/notfounds.
 */
export async function loadOwnerProperty(propertyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sb = createServiceClient() as any

  const { data: owner } = await sb
    .from('owners')
    .select('id, name, email')
    .eq('supabase_user_id', user.id)
    .single()

  if (!owner) redirect('/login')

  const isAdmin = isAdminEmail(owner.email)

  let query = sb.from('properties').select('*').eq('id', propertyId)
  if (!isAdmin) {
    query = query.eq('owner_id', owner.id)
  }
  const { data: property } = await query.single()

  return { owner, property, sb, isAdmin }
}
