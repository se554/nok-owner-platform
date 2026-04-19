import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import { signOnboardingToken } from '@/lib/onboarding-token'
import WelcomeOwner from '@/emails/WelcomeOwner'

const FROM = process.env.RESEND_FROM_ADDRESS || 'NOK <noreply@nok.rent>'
const SUPPORT_EMAIL = process.env.NOK_SUPPORT_EMAIL || 'hello@nok.rent'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nok-owner-platform.vercel.app'

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
}

interface SendWelcomeBody {
  listingId: string
  ownerEmail: string
  ownerName: string
  propertyName: string
  city: string
  unitCount: number
  onboardingManager?: string
  temporaryPasswordLink: string
}

export async function POST(req: NextRequest) {
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const expected = process.env.ONBOARDING_WEBHOOK_SECRET
  if (!expected || bearer !== expected) return unauthorized()

  const body = (await req.json().catch(() => null)) as SendWelcomeBody | null
  if (!body?.listingId || !body?.ownerEmail || !body?.ownerName || !body?.propertyName) {
    return NextResponse.json(
      { error: 'required: listingId, ownerEmail, ownerName, propertyName' },
      { status: 400 },
    )
  }

  const sb = createServiceClient()

  // Deduplication check per spec
  const { data: alreadySent } = await sb
    .from('owner_email_log')
    .select('id')
    .eq('listing_id', body.listingId)
    .eq('email_type', 'welcome')
    .eq('status', 'sent')
    .limit(1)
    .maybeSingle()

  if (alreadySent) {
    await sb.from('owner_email_log').insert({
      listing_id: body.listingId,
      owner_email: body.ownerEmail,
      email_type: 'welcome',
      status: 'skipped',
      error_message: 'already sent',
    })
    return NextResponse.json({ skipped: true, reason: 'already sent' })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY missing' }, { status: 500 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const token = signOnboardingToken({
    listingId: body.listingId,
    ownerEmail: body.ownerEmail,
    purpose: 'portal_access',
  })
  const portalLink = `${APP_URL}/onboarding/access?token=${token}`

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [body.ownerEmail],
      subject: 'Welcome to NOK — Your property is now live',
      react: WelcomeOwner({
        ownerName: body.ownerName,
        propertyName: body.propertyName,
        city: body.city || '—',
        listingId: body.listingId,
        unitCount: body.unitCount || 1,
        ownerEmail: body.ownerEmail,
        portalLinkToken: portalLink,
        temporaryPasswordLink: body.temporaryPasswordLink,
        onboardingManager: body.onboardingManager || 'Your NOK team',
        supportEmail: SUPPORT_EMAIL,
        appUrl: APP_URL,
      }),
    })

    if (error) {
      await sb.from('owner_email_log').insert({
        listing_id: body.listingId,
        owner_email: body.ownerEmail,
        email_type: 'welcome',
        status: 'failed',
        error_message: error.message,
      })
      return NextResponse.json({ error: error.message }, { status: 502 })
    }

    await sb.from('owner_email_log').insert({
      listing_id: body.listingId,
      owner_email: body.ownerEmail,
      email_type: 'welcome',
      status: 'sent',
      resend_id: data?.id,
      metadata: { portalLink, onboardingManager: body.onboardingManager ?? null },
    })

    return NextResponse.json({ sent: true, resendId: data?.id, portalLink })
  } catch (err: any) {
    await sb.from('owner_email_log').insert({
      listing_id: body.listingId,
      owner_email: body.ownerEmail,
      email_type: 'welcome',
      status: 'failed',
      error_message: err?.message || 'unknown',
    })
    return NextResponse.json({ error: err?.message || 'failed' }, { status: 500 })
  }
}
