import jwt from 'jsonwebtoken'

export interface OnboardingTokenPayload {
  listingId: string
  ownerEmail: string
  purpose: 'portal_access'
}

const SECRET = process.env.ONBOARDING_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SECRET) {
  // Defer throwing until actually used; allows Next build to succeed without envs.
  console.warn('[onboarding-token] ONBOARDING_JWT_SECRET not set')
}

export function signOnboardingToken(payload: OnboardingTokenPayload, ttlHours = 48): string {
  if (!SECRET) throw new Error('ONBOARDING_JWT_SECRET is not configured')
  return jwt.sign(payload, SECRET, { expiresIn: `${ttlHours}h`, issuer: 'nok-owners' })
}

export function verifyOnboardingToken(token: string): OnboardingTokenPayload | null {
  if (!SECRET) return null
  try {
    const decoded = jwt.verify(token, SECRET, { issuer: 'nok-owners' }) as OnboardingTokenPayload & {
      iat: number
      exp: number
    }
    return {
      listingId: decoded.listingId,
      ownerEmail: decoded.ownerEmail,
      purpose: decoded.purpose,
    }
  } catch {
    return null
  }
}
