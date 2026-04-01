import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      owner_name, owner_email, owner_phone,
      property_address, property_city, property_country,
      bedrooms, bathrooms, apartment_type,
    } = body

    if (!owner_name || !owner_email || !property_address || !apartment_type) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('onboarding_sessions')
      .insert({
        owner_name,
        owner_email,
        owner_phone: owner_phone || null,
        property_address,
        property_city,
        property_country,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        apartment_type,
        status: 'started',
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('create-session error:', error)
      return NextResponse.json({ error: 'Error creando la sesión' }, { status: 500 })
    }

    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error('create-session error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
