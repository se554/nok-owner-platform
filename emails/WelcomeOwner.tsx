import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export interface WelcomeOwnerProps {
  ownerName: string
  propertyName: string
  city: string
  listingId: string
  unitCount: number
  ownerEmail: string
  portalLinkToken: string
  temporaryPasswordLink: string
  onboardingManager: string
  supportEmail: string
  appUrl: string
}

const EARTH = '#833B0E'
const SUNSET = '#D6A700'
const BLACK = '#1A1A1A'
const TIMELESS = '#F0EFED'

export default function WelcomeOwner({
  ownerName = 'Owner',
  propertyName = 'Your property',
  city = '—',
  listingId = '—',
  unitCount = 1,
  ownerEmail = 'owner@example.com',
  portalLinkToken = 'https://nok.rent/portal?t=xxx',
  temporaryPasswordLink = 'https://nok.rent/set-password?t=xxx',
  onboardingManager = 'Your NOK team',
  supportEmail = 'hello@nok.rent',
}: WelcomeOwnerProps) {
  return (
    <Html>
      <Head />
      <Preview>Everything you need to get started is inside.</Preview>
      <Body style={{ backgroundColor: TIMELESS, fontFamily: 'Arial, Helvetica, sans-serif', margin: 0 }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', backgroundColor: '#FFFFFF' }}>
          {/* HEADER */}
          <Section style={{ backgroundColor: BLACK, padding: '32px 24px', textAlign: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: 700, letterSpacing: '0.3em', margin: 0 }}>
              NOK
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, letterSpacing: '0.15em', marginTop: 8, textTransform: 'uppercase' }}>
              Feels right. Anywhere.
            </Text>
          </Section>
          <Hr style={{ borderColor: SUNSET, borderWidth: 2, borderStyle: 'solid', margin: 0 }} />

          {/* BLOCK 1 — CONFIRMATION */}
          <Section style={{ padding: '32px 32px 16px' }}>
            <Heading style={{ color: BLACK, fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>
              Your property is now live on NOK.
            </Heading>
            <Text style={{ color: '#555', fontSize: 15, margin: '0 0 24px' }}>
              Here&apos;s a summary of your listing.
            </Text>
            <SummaryRow label="Property" value={propertyName} />
            <SummaryRow label="City" value={city} />
            <SummaryRow label="Property ID" value={listingId} />
            <SummaryRow label="Units" value={`${unitCount} unit${unitCount !== 1 ? 's' : ''}`} />
          </Section>

          {/* BLOCK 2 — PORTAL ACCESS */}
          <Section style={{ padding: '16px 32px', backgroundColor: TIMELESS, borderRadius: 8, margin: '16px 32px' }}>
            <Heading style={{ color: BLACK, fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>
              Your Owners Portal is ready.
            </Heading>
            <Text style={{ color: '#555', fontSize: 14, margin: '0 0 20px' }}>
              Track performance, reservations and financials — all in one place.
            </Text>
            <Button
              href={portalLinkToken}
              style={{
                backgroundColor: EARTH,
                color: '#FFFFFF',
                padding: '14px 28px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Access Owners Portal →
            </Button>
            <Text style={{ fontSize: 13, color: '#555', marginTop: 20, marginBottom: 4 }}>
              <strong>Username:</strong> {ownerEmail}
            </Text>
            <Text style={{ fontSize: 13, color: '#555', margin: 0 }}>
              <strong>Set password:</strong>{' '}
              <Link href={temporaryPasswordLink} style={{ color: EARTH }}>
                {temporaryPasswordLink}
              </Link>
            </Text>
            <Text style={{ fontSize: 12, color: '#888', marginTop: 12 }}>
              This link expires in 48 hours. Set your password now.
            </Text>
          </Section>

          {/* BLOCK 3 — FEATURES */}
          <Section style={{ padding: '24px 32px' }}>
            <FeatureRow title="Performance" body="Occupancy rate, revenue trends, booking pace — updated daily." />
            <FeatureRow title="Reservations" body="View all upcoming and past reservations for your property." />
            <FeatureRow title="Financials" body="Monthly statements, NOK commission breakdown, net payout." />
            <FeatureRow title="Operations" body="Maintenance requests, cleaning logs, incident reports." />
          </Section>

          <Hr style={{ borderColor: '#DDDDDD', margin: '0 32px' }} />

          {/* BLOCK 4 — NEXT STEPS */}
          <Section style={{ padding: '24px 32px' }}>
            <Heading style={{ color: BLACK, fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>Next steps</Heading>
            <StepRow n={1} body="Activate your account — set your password via the link above." />
            <StepRow n={2} body="Review your listing information in the portal and confirm it's complete." />
            <StepRow n={3} body="Upload your banking details for monthly payouts." />
            <StepRow n={4} body="Schedule your intro call with your NOK account manager." />
          </Section>

          <Hr style={{ borderColor: '#DDDDDD', margin: '0 32px' }} />

          {/* BLOCK 5 — CONTACT */}
          <Section style={{ padding: '24px 32px' }}>
            <Heading style={{ color: BLACK, fontSize: 18, fontWeight: 700, margin: '0 0 12px' }}>
              Contact &amp; support
            </Heading>
            <Text style={{ fontSize: 14, color: '#333', margin: '4px 0' }}>
              <strong>Account manager:</strong> {onboardingManager}
            </Text>
            <Text style={{ fontSize: 14, color: '#333', margin: '4px 0' }}>
              <strong>Email:</strong>{' '}
              <Link href={`mailto:${supportEmail}`} style={{ color: EARTH }}>
                {supportEmail}
              </Link>
            </Text>
            <Text style={{ fontSize: 13, color: '#666', marginTop: 12 }}>
              We respond within 4 business hours on weekdays.
            </Text>
          </Section>

          {/* FOOTER */}
          <Section style={{ backgroundColor: BLACK, padding: '24px 32px', textAlign: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 13, margin: '0 0 8px' }}>
              The NOK team &nbsp;·&nbsp; Feels right. Anywhere.
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: 0 }}>
              © 2026 NOK · nok.rent · You&apos;re receiving this because your property was recently activated on NOK.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <Text style={{ fontSize: 14, color: '#333', margin: '6px 0' }}>
      <span style={{ color: '#888', display: 'inline-block', minWidth: 100 }}>{label}:</span>{' '}
      <strong>{value}</strong>
    </Text>
  )
}

function FeatureRow({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 14, fontWeight: 700, color: BLACK, margin: '0 0 2px' }}>{title}</Text>
      <Text style={{ fontSize: 13, color: '#555', margin: 0 }}>{body}</Text>
    </div>
  )
}

function StepRow({ n, body }: { n: number; body: string }) {
  return (
    <Text style={{ fontSize: 14, color: '#333', margin: '8px 0' }}>
      <span
        style={{
          display: 'inline-block',
          width: 22,
          height: 22,
          lineHeight: '22px',
          textAlign: 'center',
          borderRadius: 11,
          backgroundColor: EARTH,
          color: '#FFFFFF',
          fontSize: 12,
          fontWeight: 700,
          marginRight: 10,
        }}
      >
        {n}
      </span>
      {body}
    </Text>
  )
}
