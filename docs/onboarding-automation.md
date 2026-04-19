# NOK Owners — Onboarding automation

Spec: `NOK_Owners_Portal_Onboarding.docx` (April 2026).

## Flow

```
Guesty listing.updated  ─▶  Make (5 min delay + validation)  ─▶  /api/webhooks/guesty-listing-active
                                                                          │
                                                                          ▼
                                                              /api/owners/send-welcome
                                                                          │
                                                                          ▼
                                                              Resend  +  owner_email_log
                                                                          │
                                                               (D+7)      ▼
                                                              /api/cron/onboarding-followup
```

## Environment variables

Add to `.env.local` and Vercel project settings:

```bash
# Required
RESEND_API_KEY=              # Resend transactional key
RESEND_FROM_ADDRESS="NOK <noreply@nok.rent>"
NEXT_PUBLIC_APP_URL=https://nok-owner-platform.vercel.app
NOK_SUPPORT_EMAIL=hello@nok.rent

# Secrets (shared with Make scenario + Guesty webhook)
GUESTY_WEBHOOK_SECRET=       # shared secret Guesty/Make sends as Bearer
ONBOARDING_WEBHOOK_SECRET=   # shared secret between /webhooks → /owners/send-welcome
ONBOARDING_JWT_SECRET=       # signs the 48h portal_link_token
CRON_SECRET=                 # gates the D+7 followup cron

# Optional
NOK_DEFAULT_MANAGER="Santiago"
NOK_SCHEDULE_LINK=https://cal.com/nok/owner-intro
```

## Database

Run `supabase/migrations/021_owner_email_log.sql` in the Supabase SQL editor.
Creates `owner_email_log` + `owner_email_already_sent()` helper.

## Make scenario (recommended)

1. **Trigger** — Guesty webhook: `listing.updated`
2. **Filter** — `status === "active"` AND `owner.email` is not empty
3. **Sleep** — 5 minutes (lets Guesty sync secondary fields)
4. **HTTP request** — `POST {NEXT_PUBLIC_APP_URL}/api/webhooks/guesty-listing-active`
   - Headers: `Authorization: Bearer {GUESTY_WEBHOOK_SECRET}`
   - Body: forward the Guesty payload
5. **Store** — the response (already logged to `owner_email_log`)

## Vercel cron — D+7 follow-up

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/onboarding-followup?secret=$CRON_SECRET",
      "schedule": "0 14 * * *"
    }
  ]
}
```

(Runs daily at 14:00 UTC / 10:00 DO.)

## Dedupe & error handling

- `owner_email_log` enforces one `sent` row per `(listing_id, email_type)` via the
  check in `send-welcome`/`cron`.
- Failed sends are logged as `status = 'failed'` with the error message — retry-safe.
- Expired JWT lands on `/onboarding/access` which shows the "contact your NOK account
  manager" message, never a 404.

## Local test

```bash
curl -X POST http://localhost:3000/api/owners/send-welcome \
  -H "authorization: Bearer $ONBOARDING_WEBHOOK_SECRET" \
  -H "content-type: application/json" \
  -d '{
    "listingId": "test-123",
    "ownerEmail": "test@nok.do",
    "ownerName": "Santiago",
    "propertyName": "The Park IV 301",
    "city": "Santo Domingo",
    "unitCount": 1,
    "onboardingManager": "Santiago",
    "temporaryPasswordLink": "https://nok-owner-platform.vercel.app/login"
  }'
```
