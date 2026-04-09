import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ properties: [] }, { status: 401 })

  const sb = createServiceClient() as any
  const { data: owner } = await sb.from('owners').select('id, email').eq('supabase_user_id', user.id).single()
  if (!owner) return NextResponse.json({ properties: [] })
  const isAdmin = isAdminEmail(owner.email)

  let q = sb.from('properties').select('id, name').eq('active', true).order('name')
  if (!isAdmin) q = q.eq('owner_id', owner.id)
  const { data } = await q
  return NextResponse.json({ properties: data ?? [] })
}
