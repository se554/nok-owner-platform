/**
 * GET /api/sync-reviews
 *
 * Bulk review sync endpoint — fetches reviews from Guesty for ALL properties
 * that have a guesty_listing_id and upserts them into the reviews table.
 *
 * Auth: x-sync-secret header or ?secret= query param
 * Designed for cron jobs or manual admin triggers.
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getReviews } from '@/lib/guesty'

export const maxDuration = 300

const VALID_SECRET = process.env.SYNC_SECRET || 'nok-sync-2025'
const BATCH_SIZE = 5
const BATCH_DELAY_MS = 2000

function authorize(req: Request): boolean {
  const { searchParams } = new URL(req.url)
  const headerSecret = req.headers.get('x-sync-secret')
  const querySecret = searchParams.get('secret')
  return headerSecret === VALID_SECRET || querySecret === VALID_SECRET
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = createServiceClient()

  // Fetch all properties with a guesty_listing_id
  const { data: properties, error: propError } = await sb
    .from('properties')
    .select('id, name, guesty_listing_id')
    .not('guesty_listing_id', 'is', null)

  if (propError) {
    return NextResponse.json(
      { error: 'Failed to fetch properties', detail: propError.message },
      { status: 500 }
    )
  }

  if (!properties || properties.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No properties with guesty_listing_id found',
      summary: { properties_processed: 0, total_reviews: 0, errors: [] },
    })
  }

  const summary = {
    properties_processed: 0,
    total_reviews: 0,
    errors: [] as string[],
    details: [] as { property_id: string; name: string; reviews_synced: number }[],
  }

  // Process in batches
  for (let i = 0; i < properties.length; i += BATCH_SIZE) {
    const batch = properties.slice(i, i + BATCH_SIZE)

    const batchPromises = batch.map(async (property) => {
      const propertyId = property.id
      const guestyListingId = property.guesty_listing_id
      const propertyName = property.name ?? propertyId

      try {
        const reviews = await getReviews(guestyListingId, 50)
        const reviewList = Array.isArray(reviews)
          ? reviews
          : ((reviews as any)?.results ?? (reviews as any)?.data ?? [])

        let synced = 0

        for (const r of reviewList) {
          // Guesty Open API v1 nests review data inside rawReview
          const raw = (r as any).rawReview ?? {}

          const row = {
            property_id: propertyId,
            guesty_review_id: r._id,
            channel: (r as any).channelId ?? r.source ?? null,
            overall_score: raw.overall_rating ?? r.rating ?? null,
            cleanliness_score:
              raw.category_ratings_cleanliness ?? r.categoryRatings?.cleanliness ?? null,
            communication_score:
              raw.category_ratings_communication ?? r.categoryRatings?.communication ?? null,
            checkin_score:
              raw.category_ratings_checkin ?? r.categoryRatings?.checkIn ?? null,
            accuracy_score:
              raw.category_ratings_accuracy ?? r.categoryRatings?.accuracy ?? null,
            location_score:
              raw.category_ratings_location ?? r.categoryRatings?.location ?? null,
            value_score:
              raw.category_ratings_value ?? r.categoryRatings?.value ?? null,
            guest_name: r.reviewee?.fullName ?? null,
            reviewer_text: raw.public_review ?? r.publicReview ?? null,
            host_response:
              ((r as any).reviewReplies?.[0] as any)?.text ?? r.hostResponse ?? null,
            submitted_at:
              raw.submitted_at ?? (r as any).createdAt ?? r.submittedAt ?? null,
            raw_data: r,
            synced_at: new Date().toISOString(),
          }

          const { error: upsertError } = await sb
            .from('reviews')
            .upsert(row, { onConflict: 'guesty_review_id' })

          if (upsertError) {
            summary.errors.push(
              `Property ${propertyName}: upsert error for review ${r._id}: ${upsertError.message}`
            )
          } else {
            synced++
          }
        }

        summary.properties_processed++
        summary.total_reviews += synced
        summary.details.push({
          property_id: propertyId,
          name: propertyName,
          reviews_synced: synced,
        })
      } catch (e) {
        summary.properties_processed++
        summary.errors.push(
          `Property ${propertyName} (${guestyListingId}): ${e instanceof Error ? e.message : String(e)}`
        )
      }
    })

    await Promise.all(batchPromises)

    // Delay between batches to avoid Guesty rate limits
    if (i + BATCH_SIZE < properties.length) {
      await sleep(BATCH_DELAY_MS)
    }
  }

  return NextResponse.json({
    success: true,
    message: `Synced ${summary.total_reviews} reviews across ${summary.properties_processed} properties`,
    summary,
  })
}
