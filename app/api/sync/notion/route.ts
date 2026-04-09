/**
 * POST /api/sync/notion
 *
 * Reads ALL apartments from the Notion Apartamentos database and
 * upserts financial data into Supabase properties:
 *   - nok_commission_rate  (%)
 *   - cleaning_fee         (raw, in original currency)
 *   - cleaning_fee_currency (COP | USD)
 *   - country
 *   - notion_id
 *
 * Matches on guesty_listing_id. Properties without a guesty_listing_id
 * in Notion are skipped (logged).
 *
 * Admin-only: requires the requesting user to own at least one property
 * OR be an internal service call (x-sync-secret header).
 */

import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAllApartamentos } from '@/lib/notion'

const SYNC_SECRET = process.env.SYNC_SECRET ?? ''

export async function POST(req: Request) {
  // ⚠️ DISABLED 2026-04-08 — Supabase is now the source of truth.
  // Master data is managed via nok-hub /master module. Notion is no longer synced
  // to avoid overwriting edits made in the master dashboard.
  return NextResponse.json({
    error: 'Notion sync is disabled. Use nok-hub /master to edit properties.',
  }, { status: 410 })

  // Allow internal cron calls via secret header
  const internalCall = SYNC_SECRET && req.headers.get('x-sync-secret') === SYNC_SECRET

  if (!internalCall) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = createServiceClient()

  let synced = 0
  let skipped = 0
  const errors: string[] = []

  try {
    const apartamentos = await getAllApartamentos()

    for (const apt of apartamentos) {
      if (!apt.guesty_listing_id) {
        skipped++
        continue
      }

      const { error } = await sb
        .from('properties')
        .update({
          nok_commission_rate: apt.nok_commission_rate,
          cleaning_fee: apt.cleaning_fee,
          cleaning_fee_currency: apt.cleaning_fee_currency,
          country: apt.country,
          notion_id: apt.notion_id,
        })
        .eq('guesty_listing_id', apt.guesty_listing_id)

      if (error) {
        errors.push(`${apt.name}: ${(error as any)?.message ?? 'unknown'}`)
      } else {
        synced++
      }
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    synced,
    skipped,
    errors,
    message: `Sincronizados ${synced} apartamentos desde Notion`,
  })
}
