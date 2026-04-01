import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({
    anthropic_key_exists: !!process.env.ANTHROPIC_API_KEY,
    nok_anthropic_key_exists: !!process.env.NOK_ANTHROPIC_API_KEY,
    nok_anthropic_key_length: process.env.NOK_ANTHROPIC_API_KEY?.length ?? 0,
    supabase_url_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    service_key_exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  })
}
