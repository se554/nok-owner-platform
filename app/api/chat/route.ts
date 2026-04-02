import { streamText, stepCountIs } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
const anthropic = createAnthropic({ apiKey: process.env.NOK_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || '' })
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import {
  getUpcomingReservationsTool,
  getPricingForPeriodTool,
  getCalendarTool,
  getMonthlyRevenueTool,
  getPropertyMetricsTool,
  getReviewsTool,
  getReviewStatsTool,
  getLastCleaningTool,
  getMaintenanceTool,
  getInventoryAlertsTool,
  getFullInventoryTool,
  createSupportTicketTool,
} from '@/lib/ai/tools'

export const maxDuration = 60

export async function POST(req: Request) {
  const { messages, propertyId } = await req.json()

  if (!propertyId) {
    return new Response('propertyId is required', { status: 400 })
  }

  // ── Authenticate ──────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // ── Load owner + property ─────────────────────────────────────
  const serviceSupabase = createServiceClient()

  type OwnerRow = import('@/lib/types/database').Owner
  type PropertyRow = import('@/lib/types/database').Property

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = serviceSupabase as any

  const ownerRes = await sb.from('owners').select('*').eq('supabase_user_id', user.id).single()
  const propertyRes = await sb.from('properties').select('*').eq('id', propertyId).single()

  if (ownerRes.error || !ownerRes.data) {
    return new Response('Owner not found', { status: 404 })
  }
  if (propertyRes.error || !propertyRes.data) {
    return new Response('Property not found', { status: 404 })
  }

  const owner = ownerRes.data as OwnerRow
  const property = propertyRes.data as PropertyRow

  // ── Verify property belongs to this owner ─────────────────────
  if (property.owner_id !== owner.id) {
    return new Response('Forbidden', { status: 403 })
  }

  // ── Build tools with property context ─────────────────────────
  const tools = {
    getUpcomingReservations: getUpcomingReservationsTool(propertyId),
    getPricingForPeriod: getPricingForPeriodTool(propertyId),
    getCalendar: getCalendarTool(propertyId),
    getMonthlyRevenue: getMonthlyRevenueTool(propertyId),
    getPropertyMetrics: getPropertyMetricsTool(propertyId),
    getReviews: getReviewsTool(propertyId),
    getReviewStats: getReviewStatsTool(propertyId),
    getLastCleaning: getLastCleaningTool(propertyId),
    getMaintenance: getMaintenanceTool(propertyId),
    getInventoryAlerts: getInventoryAlertsTool(propertyId),
    getFullInventory: getFullInventoryTool(propertyId),
    createSupportTicket: createSupportTicketTool(propertyId, owner.id),
  }

  // ── Save user message to DB ───────────────────────────────────
  const lastUserMessage = messages.at(-1)
  if (lastUserMessage?.role === 'user') {
    await sb.from('chat_messages').insert({
      property_id: propertyId,
      owner_id: owner.id,
      role: 'user',
      content: typeof lastUserMessage.content === 'string'
        ? lastUserMessage.content
        : JSON.stringify(lastUserMessage.content),
    })
  }

  // ── Stream AI response ────────────────────────────────────────
  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: buildSystemPrompt(property, owner),
    messages,
    tools,
    stopWhen: stepCountIs(5),
    temperature: 0.3,
    onFinish: async ({ text }) => {
      // Save assistant response
      if (text) {
        await sb.from('chat_messages').insert({
          property_id: propertyId,
          owner_id: owner.id,
          role: 'assistant',
          content: text,
        })
      }
    },
  })

  return result.toUIMessageStreamResponse()
}
