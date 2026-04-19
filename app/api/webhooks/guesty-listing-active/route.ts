import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * Guesty webhook — listing.updated filtered by status = active.
 *
 * Flow per spec (section 2):
 *  1. Validate Guesty signature / shared secret.
 *  2. Verify listing is ACTIVE and owner_email is present.
 *  3. Dedupe on listing_id + email_type = welcome.
 *  4. Enqueue for delayed send (5 min) — we trigger send-welcome which itself dedupes.
 *     For simplicity we call send-welcome directly; the 5-min delay is configured in Make,
 *     but we also accept an immediate call and let the receiver dedupe.
 */
export async function POST(req: NextRequest) {
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const expected = process.env.GUESTY_WEBHOOK_SECRET
  if (!expected || bearer !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const payload = await req.json().catch(() => null)
  if (!payload) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  const listing = payload.listing || payload
  const status = listing?.status || listing?.listingStatus
  if (status !== 'active') {
    return NextResponse.json({ ignored: true, reason: `status=${status}` })
  }

  const listingId: string | undefined = listing?._id || listing?.id || listing?.listingId
  const ownerEmail: string | undefined = listing?.owner?.email || listing?.ownerEmail
  const ownerName: string =
    listing?.owner?.displayName ||
    listing?.owner?.fullName ||
    listing?.ownerName ||
    'Owner'
  const propertyName: string = listing?.nickname || listing?.title || 'Your property'
  const city: string = listing?.address?.city || '—'
  const unitCount: number = listing?.unitTypeCount || listing?.subListings?.length || 1

  if (!listingId || !ownerEmail) {
    const sb = createServiceClient()
    await sb.from('owner_email_log').insert({
      listing_id: listingId || 'unknown',
      owner_email: ownerEmail || 'unknown',
      email_type: 'welcome',
      status: 'failed',
      error_message: `missing fields: ${!listingId ? 'listingId ' : ''}${!ownerEmail ? 'ownerEmail' : ''}`,
    })
    return NextResponse.json({ error: 'missing listingId or ownerEmail' }, { status: 422 })
  }

  // Lookup assigned account manager from internal table if available.
  // Schema-agnostic: gracefully falls back to default if column missing.
  let onboardingManager = process.env.NOK_DEFAULT_MANAGER || 'Your NOK team'
  try {
    const sb = createServiceClient()
    const { data: mgr } = await sb
      .from('owners')
      .select('onboarding_manager')
      .eq('email', ownerEmail)
      .maybeSingle()
    if (mgr?.onboarding_manager) onboardingManager = mgr.onboarding_manager
  } catch {
    // ignore — optional field
  }

  // Generate temp password link via Supabase magic link
  const sb = createServiceClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nok-owner-platform.vercel.app'
  let temporaryPasswordLink = `${appUrl}/login`
  try {
    const { data: linkData } = await sb.auth.admin.generateLink({
      type: 'magiclink',
      email: ownerEmail,
      options: { redirectTo: `${appUrl}/dashboard` },
    })
    if (linkData?.properties?.action_link) {
      temporaryPasswordLink = linkData.properties.action_link
    }
  } catch {
    // fall back to plain login url; the email still sends
  }

  // Invoke send-welcome directly (share same secret surface)
  const secret = process.env.ONBOARDING_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'ONBOARDING_WEBHOOK_SECRET missing' }, { status: 500 })
  }

  const res = await fetch(`${appUrl}/api/owners/send-welcome`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      listingId,
      ownerEmail,
      ownerName,
      propertyName,
      city,
      unitCount,
      onboardingManager,
      temporaryPasswordLink,
    }),
  })

  const result = await res.json().catch(() => ({}))
  return NextResponse.json({ forwarded: true, status: res.status, result })
}
