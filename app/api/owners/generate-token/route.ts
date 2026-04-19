import { NextRequest, NextResponse } from 'next/server'
import { signOnboardingToken } from '@/lib/onboarding-token'

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
}

export async function POST(req: NextRequest) {
  // Require a shared secret so Make/Zapier can call this, but nobody else
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const expected = process.env.ONBOARDING_WEBHOOK_SECRET
  if (!expected || bearer !== expected) return unauthorized()

  const body = await req.json().catch(() => null)
  if (!body?.listingId || !body?.ownerEmail) {
    return NextResponse.json({ error: 'listingId and ownerEmail required' }, { status: 400 })
  }

  const token = signOnboardingToken({
    listingId: String(body.listingId),
    ownerEmail: String(body.ownerEmail),
    purpose: 'portal_access',
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nok-owner-platform.vercel.app'
  const portalLink = `${appUrl}/onboarding/access?token=${token}`

  return NextResponse.json({ token, portalLink, expiresInHours: 48 })
}
