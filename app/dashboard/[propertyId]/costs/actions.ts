'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type Frequency = 'monthly' | 'one_time'
type Currency = 'USD' | 'DOP' | 'COP'
type Category =
  | 'mortgage'
  | 'maintenance'
  | 'utilities'
  | 'insurance'
  | 'hoa'
  | 'property_tax'
  | 'other'

async function requireOwner(propertyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthenticated')

  const sb = createServiceClient() as any
  const { data: owner } = await sb
    .from('owners')
    .select('id, email')
    .eq('supabase_user_id', user.id)
    .single()
  if (!owner) throw new Error('owner not found')

  return { owner, sb, propertyId }
}

export async function createOwnerCost(propertyId: string, formData: FormData) {
  const { owner, sb } = await requireOwner(propertyId)

  const label = String(formData.get('label') || '').trim()
  const category = (formData.get('category') || 'other') as Category
  const amount = Number(formData.get('amount') || 0)
  const currency = (formData.get('currency') || 'USD') as Currency
  const frequency = (formData.get('frequency') || 'monthly') as Frequency
  const startDate = String(formData.get('start_date') || new Date().toISOString().slice(0, 10))
  const endDate = formData.get('end_date') ? String(formData.get('end_date')) : null
  const notes = formData.get('notes') ? String(formData.get('notes')).trim() : null

  if (!label || amount <= 0) throw new Error('label and amount required')

  const { error } = await sb.from('owner_costs').insert({
    property_id: propertyId,
    owner_id: owner.id,
    label,
    category,
    amount,
    currency,
    frequency,
    start_date: startDate,
    end_date: endDate,
    notes,
  })
  if (error) throw error

  revalidatePath(`/dashboard/${propertyId}/costs`)
  revalidatePath(`/dashboard/${propertyId}/overview`)
}

export async function deleteOwnerCost(propertyId: string, costId: string) {
  const { sb } = await requireOwner(propertyId)
  const { error } = await sb.from('owner_costs').delete().eq('id', costId)
  if (error) throw error
  revalidatePath(`/dashboard/${propertyId}/costs`)
  revalidatePath(`/dashboard/${propertyId}/overview`)
}
