import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'

// List groups visible to current user
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ groups: [] }, { status: 401 })
  const sb = createServiceClient() as any
  const { data: owner } = await sb.from('owners').select('id, email').eq('supabase_user_id', user.id).single()
  if (!owner) return NextResponse.json({ groups: [] })
  const isAdmin = isAdminEmail(owner.email)

  let q = sb.from('owner_property_groups').select('id, name, owner_id, active').eq('active', true).order('name')
  if (!isAdmin) q = q.eq('owner_id', owner.id)
  const { data: groups } = await q
  const ids = (groups ?? []).map((g: any) => g.id)
  const { data: members } = ids.length
    ? await sb.from('owner_property_group_members').select('group_id, property_id').in('group_id', ids)
    : { data: [] as any[] }
  const byGroup: Record<string, string[]> = {}
  for (const m of members ?? []) {
    byGroup[m.group_id] = byGroup[m.group_id] ?? []
    byGroup[m.group_id].push(m.property_id)
  }
  return NextResponse.json({
    groups: (groups ?? []).map((g: any) => ({ ...g, property_ids: byGroup[g.id] ?? [] })),
  })
}

// Create a new group for current owner
export async function POST(req: Request) {
  const body = await req.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const sb = createServiceClient() as any
  const { data: owner } = await sb.from('owners').select('id, email').eq('supabase_user_id', user.id).single()
  if (!owner) return NextResponse.json({ error: 'no owner' }, { status: 403 })

  const name = String(body.name || '').trim()
  const propertyIds: string[] = Array.isArray(body.property_ids) ? body.property_ids : []
  if (!name || propertyIds.length === 0) {
    return NextResponse.json({ error: 'Nombre y propiedades requeridas' }, { status: 400 })
  }

  // Non-admin: restrict propertyIds to own properties
  const isAdmin = isAdminEmail(owner.email)
  let allowedIds = propertyIds
  if (!isAdmin) {
    const { data: myProps } = await sb.from('properties').select('id').eq('owner_id', owner.id).in('id', propertyIds)
    allowedIds = (myProps ?? []).map((p: any) => p.id)
  }
  if (allowedIds.length === 0) return NextResponse.json({ error: 'Sin propiedades válidas' }, { status: 400 })

  const { data: group, error } = await sb
    .from('owner_property_groups')
    .insert({ name, owner_id: owner.id, active: true })
    .select()
    .single()
  if (error) return NextResponse.json({ error: (error as any)?.message ?? 'Error' }, { status: 500 })

  const rows = allowedIds.map((pid) => ({ group_id: group.id, property_id: pid }))
  await sb.from('owner_property_group_members').insert(rows)
  return NextResponse.json({ group: { ...group, property_ids: allowedIds } })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const sb = createServiceClient() as any
  const { data: owner } = await sb.from('owners').select('id, email').eq('supabase_user_id', user.id).single()
  if (!owner) return NextResponse.json({ error: 'no owner' }, { status: 403 })
  const isAdmin = isAdminEmail(owner.email)
  let q = sb.from('owner_property_groups').delete().eq('id', id)
  if (!isAdmin) q = q.eq('owner_id', owner.id)
  const { error } = await q
  if (error) return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
