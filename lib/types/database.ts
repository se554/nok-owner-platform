// Auto-typed database schema for NOK Owner Platform
// Keep in sync with supabase/migrations/001_initial_schema.sql

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      owners: {
        Row: {
          id: string
          supabase_user_id: string | null
          name: string
          email: string
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          supabase_user_id?: string | null
          name: string
          email: string
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['owners']['Insert']>
      }
      properties: {
        Row: {
          id: string
          owner_id: string
          hostify_property_id: string | null
          breezeway_property_id: string | null
          wheelhouse_property_id: string | null
          guesty_listing_id: string | null
          name: string
          address: string | null
          city: string | null
          country: string
          bedrooms: number | null
          bathrooms: number | null
          max_guests: number | null
          cover_image_url: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          hostify_property_id?: string | null
          breezeway_property_id?: string | null
          wheelhouse_property_id?: string | null
          guesty_listing_id?: string | null
          name: string
          address?: string | null
          city?: string | null
          country?: string
          bedrooms?: number | null
          bathrooms?: number | null
          max_guests?: number | null
          cover_image_url?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['properties']['Insert']>
      }
      inventory_items: {
        Row: {
          id: string
          property_id: string
          breezeway_item_id: string | null
          name: string
          category: string | null
          quantity: number
          condition: string | null
          replacement_threshold_months: number | null
          last_replaced_at: string | null
          next_replacement_alert_at: string | null
          notes: string | null
          raw_data: Json | null
          synced_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['inventory_items']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['inventory_items']['Insert']>
      }
      cleaning_records: {
        Row: {
          id: string
          property_id: string
          breezeway_task_id: string | null
          scheduled_at: string | null
          completed_at: string | null
          staff_name: string | null
          status: string
          duration_minutes: number | null
          notes: string | null
          photos: Json
          raw_data: Json | null
          synced_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['cleaning_records']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['cleaning_records']['Insert']>
      }
      maintenance_records: {
        Row: {
          id: string
          property_id: string
          breezeway_task_id: string | null
          type: string
          title: string | null
          scheduled_at: string | null
          completed_at: string | null
          staff_name: string | null
          status: string
          priority: string
          notes: string | null
          photos: Json
          raw_data: Json | null
          synced_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['maintenance_records']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['maintenance_records']['Insert']>
      }
      property_metrics: {
        Row: {
          id: string
          property_id: string
          metric_date: string
          occupancy_rate: number | null
          revenue_month: number | null
          revenue_month_currency: string
          active_reservations_count: number | null
          avg_daily_rate: number | null
          review_score_airbnb: number | null
          review_score_booking: number | null
          review_count_airbnb: number | null
          review_count_booking: number | null
          recommended_rate: number | null
          applied_rate: number | null
          hostify_raw: Json | null
          wheelhouse_raw: Json | null
          synced_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['property_metrics']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['property_metrics']['Insert']>
      }
      chat_messages: {
        Row: {
          id: string
          property_id: string
          owner_id: string
          role: 'user' | 'assistant'
          content: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          owner_id: string
          role: 'user' | 'assistant'
          content: string
          metadata?: Json | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>
      }
      support_tickets: {
        Row: {
          id: string
          property_id: string
          owner_id: string
          chat_message_id: string | null
          title: string
          description: string
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          resolved_at: string | null
          resolution_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          owner_id: string
          chat_message_id?: string | null
          title: string
          description: string
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          resolved_at?: string | null
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['support_tickets']['Insert']>
      }
    }
    Functions: {
      get_my_owner_id: {
        Args: Record<string, never>
        Returns: string
      }
    }
  }
}

// Convenience type aliases
export type Owner = Database['public']['Tables']['owners']['Row']
export type Property = Database['public']['Tables']['properties']['Row']
export type InventoryItem = Database['public']['Tables']['inventory_items']['Row']
export type CleaningRecord = Database['public']['Tables']['cleaning_records']['Row']
export type MaintenanceRecord = Database['public']['Tables']['maintenance_records']['Row']
export type PropertyMetrics = Database['public']['Tables']['property_metrics']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type SupportTicket = Database['public']['Tables']['support_tickets']['Row']
