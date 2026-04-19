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

export interface FollowupD7Props {
  ownerName: string
  onboardingManager: string
  portalLinkToken: string
  scheduleCallLink: string
  supportEmail: string
}

const EARTH = '#833B0E'
const SUNSET = '#D6A700'
const BLACK = '#1A1A1A'
const TIMELESS = '#F0EFED'

export default function FollowupD7({
  ownerName = 'Owner',
  onboardingManager = 'your NOK account manager',
  portalLinkToken = 'https://nok.rent/portal?t=xxx',
  scheduleCallLink = 'https://nok.rent/schedule',
  supportEmail = 'hello@nok.rent',
}: FollowupD7Props) {
  return (
    <Html>
      <Head />
      <Preview>A quick check-in — how&apos;s your NOK setup going?</Preview>
      <Body style={{ backgroundColor: TIMELESS, fontFamily: 'Arial, Helvetica, sans-serif', margin: 0 }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', backgroundColor: '#FFFFFF' }}>
          <Section style={{ backgroundColor: BLACK, padding: '32px 24px', textAlign: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: 700, letterSpacing: '0.3em', margin: 0 }}>
              NOK
            </Text>
          </Section>
          <Hr style={{ borderColor: SUNSET, borderWidth: 2, borderStyle: 'solid', margin: 0 }} />

          <Section style={{ padding: '40px 32px 16px' }}>
            <Heading style={{ color: BLACK, fontSize: 24, fontWeight: 700, margin: '0 0 16px' }}>
              Hi {ownerName} — just checking in.
            </Heading>
            <Text style={{ color: '#444', fontSize: 15, lineHeight: 1.55, margin: '0 0 20px' }}>
              We noticed you haven&apos;t completed your setup yet. Your account manager{' '}
              <strong>{onboardingManager}</strong> is here to help.
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
                marginBottom: 12,
              }}
            >
              Continue setup →
            </Button>

            <br />
            <Link href={scheduleCallLink} style={{ color: EARTH, fontSize: 14, fontWeight: 600 }}>
              Schedule a call with {onboardingManager} →
            </Link>
          </Section>

          <Hr style={{ borderColor: '#DDDDDD', margin: '24px 32px' }} />

          <Section style={{ padding: '0 32px 24px' }}>
            <Text style={{ fontSize: 13, color: '#666', margin: 0 }}>
              Questions? Reach us at{' '}
              <Link href={`mailto:${supportEmail}`} style={{ color: EARTH }}>
                {supportEmail}
              </Link>
              .
            </Text>
          </Section>

          <Section style={{ backgroundColor: BLACK, padding: '24px 32px', textAlign: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 13, margin: '0 0 8px' }}>
              The NOK team &nbsp;·&nbsp; Feels right. Anywhere.
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: 0 }}>
              © 2026 NOK · nok.rent
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
