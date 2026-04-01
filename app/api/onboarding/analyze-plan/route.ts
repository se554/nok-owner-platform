import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { analyzeFloorPlan } from '@/lib/claude-vision'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const sessionId = formData.get('session_id') as string | null

    if (!file || !sessionId) {
      return NextResponse.json({ error: 'file y session_id requeridos' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Solo se aceptan archivos PDF' }, { status: 400 })
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo no puede superar 20 MB' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Upload PDF to Supabase Storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const storagePath = `${sessionId}/floor-plan-${Date.now()}.pdf`

    const { error: uploadError } = await supabase.storage
      .from('floor-plans')
      .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: true })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Error subiendo el archivo' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('floor-plans')
      .getPublicUrl(storagePath)

    // Analyze with Claude Vision
    const base64 = buffer.toString('base64')
    const analysis = await analyzeFloorPlan(base64)

    // Save results to session
    const { error: updateError } = await supabase
      .from('onboarding_sessions')
      .update({
        floor_plan_url: publicUrl,
        floor_plan_spaces: analysis.spaces,
        bedrooms: analysis.bedrooms,
        bathrooms: analysis.bathrooms,
        status: 'plan_uploaded',
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Session update error:', updateError)
      return NextResponse.json({ error: 'Error actualizando la sesión' }, { status: 500 })
    }

    return NextResponse.json({ success: true, analysis, floor_plan_url: publicUrl })
  } catch (err) {
    console.error('analyze-plan error:', err)
    return NextResponse.json({ error: 'Error analizando el plano' }, { status: 500 })
  }
}
