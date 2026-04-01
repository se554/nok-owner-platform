/**
 * AI Tool definitions for the NOK Owner chatbot.
 *
 * Each tool gives Claude access to real data about the owner's property.
 * The AI decides which tools to call based on the owner's question.
 *
 * Tool categories:
 *   📅 Reservations & Calendar
 *   💰 Revenue & Pricing
 *   ⭐ Reviews
 *   🧹 Operations (cleanings, maintenance)
 *   📦 Inventory
 *   🎫 Support tickets
 */

import { tool } from 'ai'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import {
  getUpcomingReservations,
  getPricingForPeriod,
  getReviews,
  getReviewStats,
  getMonthlyRevenue,
  getPricingCalendar,
} from '@/lib/guesty'

// ─── Helper: resolve property ──────────────────────────────────────────────
// All tools receive propertyId as context (injected, not from AI)

// ─── RESERVATIONS ──────────────────────────────────────────────────────────

export const getUpcomingReservationsTool = (guestyListingId: string) =>
  tool({
    description:
      'Get upcoming confirmed reservations for the property. Use when the owner asks about who is coming, occupancy, next guests, or future reservations.',
    inputSchema: z.object({
      limit: z.number().optional().describe('Max number of reservations to return (default 10)'),
    }),
    execute: async ({ limit = 10 }) => {
      const reservations = await getUpcomingReservations(guestyListingId)
      return reservations.slice(0, limit).map(r => ({
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        nights: r.nightsCount,
        guests: r.guestsCount,
        guestName: r.guest.fullName,
        channel: r.source,
        revenue: r.money.hostPayout,
        currency: r.money.currency,
      }))
    },
  })

export const getPricingForPeriodTool = (guestyListingId: string) =>
  tool({
    description:
      'Get pricing and availability for a specific date range. Use when the owner asks about rates for a specific period, holiday, or event (e.g., "Semana Santa", "Navidad", "agosto").',
    inputSchema: z.object({
      checkIn: z.string().describe('Check-in date in YYYY-MM-DD format'),
      checkOut: z.string().describe('Check-out date in YYYY-MM-DD format'),
    }),
    execute: async ({ checkIn, checkOut }) => {
      const pricing = await getPricingForPeriod(guestyListingId, checkIn, checkOut)
      return {
        checkIn,
        checkOut,
        totalNights: pricing.totalNights,
        available: pricing.available,
        avgNightlyRate: pricing.avgNightlyRate,
        estimatedTotal: pricing.estimatedTotal,
        currency: 'USD',
        dayByDay: pricing.days.map(d => ({
          date: d.date,
          rate: d.price,
          available: d.status === 'available',
          minNights: d.minNights,
        })),
      }
    },
  })

export const getCalendarTool = (guestyListingId: string) =>
  tool({
    description:
      'Get the full availability calendar for a date range. Use when the owner asks what dates are available or occupied.',
    inputSchema: z.object({
      from: z.string().describe('Start date YYYY-MM-DD'),
      to: z.string().describe('End date YYYY-MM-DD'),
    }),
    execute: async ({ from, to }) => {
      const days = await getPricingCalendar(guestyListingId, from, to)
      const available = days.filter(d => d.status === 'available').length
      const booked = days.filter(d => d.status === 'booked').length
      return {
        from,
        to,
        totalDays: days.length,
        availableDays: available,
        bookedDays: booked,
        occupancyRate: days.length ? Math.round((booked / days.length) * 100) : 0,
        days: days.map(d => ({
          date: d.date,
          status: d.status,
          rate: d.price,
        })),
      }
    },
  })

// ─── REVENUE ───────────────────────────────────────────────────────────────

export const getMonthlyRevenueTool = (guestyListingId: string) =>
  tool({
    description:
      'Get revenue earned for a specific month. Use when the owner asks how much they earned, what the income was, or revenue for a period.',
    inputSchema: z.object({
      year: z.number().describe('4-digit year, e.g. 2025'),
      month: z.number().min(1).max(12).describe('Month number 1-12'),
    }),
    execute: async ({ year, month }) => {
      return getMonthlyRevenue(guestyListingId, year, month)
    },
  })

export const getPropertyMetricsTool = (propertyId: string) =>
  tool({
    description:
      'Get the latest cached performance metrics for the property: occupancy %, month-to-date revenue, average daily rate, Wheelhouse recommended rate vs applied rate.',
    inputSchema: z.object({}),
    execute: async () => {
      const supabase = createServiceClient()
      const { data } = await supabase
        .from('property_metrics')
        .select('*')
        .eq('property_id', propertyId)
        .order('metric_date', { ascending: false })
        .limit(1)
        .single()
      return data ?? { message: 'No metrics available yet' }
    },
  })

// ─── REVIEWS ───────────────────────────────────────────────────────────────

export const getReviewsTool = (guestyListingId: string) =>
  tool({
    description:
      'Get recent guest reviews for the property. Use when the owner asks about reviews, ratings, guest feedback, or what guests are saying.',
    inputSchema: z.object({
      limit: z.number().optional().describe('Number of recent reviews to fetch (default 5)'),
    }),
    execute: async ({ limit = 5 }) => {
      const reviews = await getReviews(guestyListingId, limit)
      return reviews.map(r => ({
        date: r.submittedAt,
        guestName: r.reviewee.fullName,
        rating: r.rating,
        comment: r.publicReview,
        response: r.hostResponse,
        platform: r.source,
        scores: r.categoryRatings,
      }))
    },
  })

export const getReviewStatsTool = (guestyListingId: string) =>
  tool({
    description:
      'Get aggregate review statistics: average score, total reviews, category averages. Use when owner asks about overall rating or score.',
    inputSchema: z.object({}),
    execute: async () => getReviewStats(guestyListingId),
  })

// ─── OPERATIONS ────────────────────────────────────────────────────────────

export const getLastCleaningTool = (propertyId: string) =>
  tool({
    description:
      'Get the most recent cleaning records for the property. Use when owner asks about last cleaning, who cleaned, or operational status.',
    inputSchema: z.object({
      limit: z.number().optional().describe('Number of cleaning records (default 3)'),
    }),
    execute: async ({ limit = 3 }) => {
      const supabase = createServiceClient()
      const { data } = await supabase
        .from('cleaning_records')
        .select('scheduled_at, completed_at, staff_name, status, duration_minutes, notes')
        .eq('property_id', propertyId)
        .order('scheduled_at', { ascending: false })
        .limit(limit)
      return data ?? []
    },
  })

export const getMaintenanceTool = (propertyId: string) =>
  tool({
    description:
      'Get recent maintenance and inspection records. Use when owner asks about maintenance, repairs, or property condition.',
    inputSchema: z.object({
      limit: z.number().optional().describe('Number of records (default 5)'),
    }),
    execute: async ({ limit = 5 }) => {
      const supabase = createServiceClient()
      const { data } = await supabase
        .from('maintenance_records')
        .select('type, title, scheduled_at, completed_at, staff_name, status, priority, notes')
        .eq('property_id', propertyId)
        .order('scheduled_at', { ascending: false })
        .limit(limit)
      return data ?? []
    },
  })

// ─── INVENTORY ─────────────────────────────────────────────────────────────

export const getInventoryAlertsTool = (propertyId: string) =>
  tool({
    description:
      'Get inventory items that need attention or replacement. Use when owner asks about inventory, what needs replacing, or supplies.',
    inputSchema: z.object({}),
    execute: async () => {
      const supabase = createServiceClient()
      const { data } = await supabase
        .from('inventory_items')
        .select('name, category, quantity, condition, last_replaced_at, replacement_threshold_months, notes')
        .eq('property_id', propertyId)
        .in('condition', ['poor', 'needs_replacement', 'fair'])
        .order('condition')
      return data ?? []
    },
  })

export const getFullInventoryTool = (propertyId: string) =>
  tool({
    description:
      'Get the complete inventory list for the property.',
    inputSchema: z.object({}),
    execute: async () => {
      const supabase = createServiceClient()
      const { data } = await supabase
        .from('inventory_items')
        .select('name, category, quantity, condition, last_replaced_at, replacement_threshold_months')
        .eq('property_id', propertyId)
        .order('category')
      return data ?? []
    },
  })

// ─── SUPPORT TICKETS ───────────────────────────────────────────────────────

export const createSupportTicketTool = (propertyId: string, ownerId: string, chatMessageId?: string) =>
  tool({
    description:
      'Create a support ticket for the NOK team when you cannot fully resolve the owner\'s question or when they need human assistance. Always use this when the issue requires action from the operations team.',
    inputSchema: z.object({
      title: z.string().describe('Brief title of the issue'),
      description: z.string().describe('Detailed description of what the owner needs'),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).describe('Priority level'),
    }),
    execute: async ({ title, description, priority }) => {
      const supabase = createServiceClient()
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          property_id: propertyId,
          owner_id: ownerId,
          chat_message_id: chatMessageId ?? null,
          title,
          description,
          priority,
        })
        .select('id, status')
        .single()

      if (error) throw new Error(error.message)
      return {
        ticketId: data.id,
        status: data.status,
        message: 'Ticket created. The NOK team will contact you shortly.',
      }
    },
  })
