import { notFound, redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Props {
  params: Promise<{ propertyId: string }>
}

function Stars({ score }: { score: number }) {
  const full = Math.floor(score)
  const half = score - full >= 0.5
  return (
    <span className="text-amber-400 text-sm">
      {'★'.repeat(full)}
      {half ? '½' : ''}
      {'☆'.repeat(5 - full - (half ? 1 : 0))}
    </span>
  )
}

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-500 w-28 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div
          className="bg-amber-400 h-1.5 rounded-full"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="text-gray-700 font-medium w-8 text-right">{value.toFixed(1)}</span>
    </div>
  )
}

export default async function ReviewsPage({ params }: Props) {
  const { propertyId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceSupabase = createServiceClient()

  const { data: owner } = await serviceSupabase
    .from('owners')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single()

  if (!owner) redirect('/login')

  const { data: property } = await serviceSupabase
    .from('properties')
    .select('id, name')
    .eq('id', propertyId)
    .eq('owner_id', owner.id)
    .single()

  if (!property) notFound()

  const { data: reviews } = await serviceSupabase
    .from('reviews')
    .select('*')
    .eq('property_id', propertyId)
    .order('submitted_at', { ascending: false })
    .limit(30)

  // Compute aggregate stats
  const allReviews = reviews ?? []
  const avgOverall = allReviews.length
    ? allReviews.reduce((s, r) => s + (r.overall_score ?? 0), 0) / allReviews.length
    : null

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reseñas</h1>
        <Link
          href={`/dashboard/${propertyId}/chat`}
          className="text-sm text-gray-500 hover:text-gray-800 border border-dashed border-gray-300 px-3 py-1.5 rounded-lg transition"
        >
          Pregúntale a la IA ✦
        </Link>
      </div>

      {/* Summary card */}
      {avgOverall && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 flex items-center gap-6">
          <div className="text-center">
            <p className="text-5xl font-bold text-gray-900">{avgOverall.toFixed(2)}</p>
            <Stars score={avgOverall} />
            <p className="text-xs text-gray-400 mt-1">{allReviews.length} reseñas</p>
          </div>
          <div className="flex-1 space-y-2">
            <ScoreBar label="Limpieza" value={avgScore(allReviews, 'cleanliness_score')} />
            <ScoreBar label="Comunicación" value={avgScore(allReviews, 'communication_score')} />
            <ScoreBar label="Check-in" value={avgScore(allReviews, 'checkin_score')} />
            <ScoreBar label="Exactitud" value={avgScore(allReviews, 'accuracy_score')} />
            <ScoreBar label="Ubicación" value={avgScore(allReviews, 'location_score')} />
            <ScoreBar label="Valor" value={avgScore(allReviews, 'value_score')} />
          </div>
        </div>
      )}

      {/* Reviews list */}
      {allReviews.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
          No hay reseñas sincronizadas todavía.
        </div>
      ) : (
        <div className="space-y-3">
          {allReviews.map(review => (
            <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{review.guest_name ?? 'Huésped'}</p>
                  <p className="text-xs text-gray-400">
                    {review.submitted_at
                      ? new Date(review.submitted_at).toLocaleDateString('es-DO', { month: 'long', day: 'numeric', year: 'numeric' })
                      : ''}
                    {review.channel && ` · ${review.channel}`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {review.overall_score && (
                    <span className="text-sm font-semibold text-gray-900">
                      {(review.overall_score as number).toFixed(1)}
                    </span>
                  )}
                  {review.overall_score && <Stars score={review.overall_score as number} />}
                </div>
              </div>

              {review.reviewer_text && (
                <p className="text-sm text-gray-700 leading-relaxed">{review.reviewer_text as string}</p>
              )}

              {review.host_response && (
                <div className="mt-3 pl-3 border-l-2 border-gray-200">
                  <p className="text-xs text-gray-400 mb-1">Respuesta de NOK</p>
                  <p className="text-xs text-gray-600">{review.host_response as string}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function avgScore(reviews: Record<string, unknown>[], field: string): number | null {
  const vals = reviews
    .map(r => r[field] as number | null)
    .filter((v): v is number => v !== null && v > 0)
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}
