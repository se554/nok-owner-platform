-- ============================================================
-- NOK Owner Platform — Initial Schema
-- Migration 001: Core tables
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- OWNERS
-- One row per property owner. Linked to Supabase auth.users.
-- ============================================================
create table public.owners (
  id                uuid primary key default uuid_generate_v4(),
  supabase_user_id  uuid unique references auth.users(id) on delete cascade,
  name              text not null,
  email             text not null unique,
  phone             text,
  avatar_url        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.owners is 'Property owners registered on the NOK Owner Platform';

-- ============================================================
-- PROPERTIES
-- Each property belongs to exactly one owner.
-- External IDs allow syncing with Hostify, Breezeway, Wheelhouse.
-- ============================================================
create table public.properties (
  id                        uuid primary key default uuid_generate_v4(),
  owner_id                  uuid not null references public.owners(id) on delete cascade,
  -- External system IDs
  hostify_property_id       text unique,
  breezeway_property_id     text unique,
  wheelhouse_property_id    text unique,
  -- Property details
  name                      text not null,
  address                   text,
  city                      text,
  country                   text default 'DO',
  bedrooms                  integer,
  bathrooms                 integer,
  max_guests                integer,
  cover_image_url           text,
  active                    boolean not null default true,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

comment on table public.properties is 'Short-term rental units managed by NOK';

-- ============================================================
-- INVENTORY ITEMS
-- Synced from Breezeway. Tracks consumables and equipment.
-- ============================================================
create table public.inventory_items (
  id                            uuid primary key default uuid_generate_v4(),
  property_id                   uuid not null references public.properties(id) on delete cascade,
  breezeway_item_id             text,
  name                          text not null,
  category                      text,                        -- e.g. 'linens', 'appliances', 'cleaning'
  quantity                      integer not null default 0,
  condition                     text,                        -- 'good', 'fair', 'poor', 'needs_replacement'
  -- Replacement tracking
  replacement_threshold_months  integer,                     -- alert after N months
  last_replaced_at              timestamptz,
  next_replacement_alert_at     timestamptz,                 -- computed from threshold
  -- Metadata
  notes                         text,
  raw_data                      jsonb,                       -- raw Breezeway payload
  synced_at                     timestamptz,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

comment on table public.inventory_items is 'Inventory items per property, synced from Breezeway';
create index idx_inventory_items_property_id on public.inventory_items(property_id);
create index idx_inventory_items_next_alert on public.inventory_items(next_replacement_alert_at);

-- ============================================================
-- CLEANING RECORDS
-- Cleaning tasks synced from Breezeway.
-- ============================================================
create table public.cleaning_records (
  id                    uuid primary key default uuid_generate_v4(),
  property_id           uuid not null references public.properties(id) on delete cascade,
  breezeway_task_id     text unique,
  scheduled_at          timestamptz,
  completed_at          timestamptz,
  staff_name            text,
  status                text not null default 'scheduled',  -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  duration_minutes      integer,
  notes                 text,
  photos                jsonb default '[]',                 -- array of {url, caption, taken_at}
  raw_data              jsonb,
  synced_at             timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.cleaning_records is 'Cleaning tasks per property, synced from Breezeway';
create index idx_cleaning_records_property_id on public.cleaning_records(property_id);
create index idx_cleaning_records_scheduled_at on public.cleaning_records(scheduled_at desc);

-- ============================================================
-- MAINTENANCE RECORDS
-- Maintenance tasks and inspections synced from Breezeway.
-- ============================================================
create table public.maintenance_records (
  id                    uuid primary key default uuid_generate_v4(),
  property_id           uuid not null references public.properties(id) on delete cascade,
  breezeway_task_id     text unique,
  type                  text not null default 'maintenance',  -- 'maintenance', 'inspection'
  title                 text,
  scheduled_at          timestamptz,
  completed_at          timestamptz,
  staff_name            text,
  status                text not null default 'scheduled',   -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  priority              text default 'medium',               -- 'low', 'medium', 'high', 'urgent'
  notes                 text,
  photos                jsonb default '[]',
  raw_data              jsonb,
  synced_at             timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.maintenance_records is 'Maintenance and inspection records per property, synced from Breezeway';
create index idx_maintenance_records_property_id on public.maintenance_records(property_id);
create index idx_maintenance_records_scheduled_at on public.maintenance_records(scheduled_at desc);

-- ============================================================
-- PROPERTY METRICS (CACHE)
-- Daily snapshot of metrics from Hostify + Wheelhouse.
-- Avoids hammering external APIs on every page load.
-- ============================================================
create table public.property_metrics (
  id                        uuid primary key default uuid_generate_v4(),
  property_id               uuid not null references public.properties(id) on delete cascade,
  metric_date               date not null,
  -- Hostify data
  occupancy_rate            numeric(5,2),                    -- percentage 0-100
  revenue_month             numeric(12,2),                   -- month-to-date revenue
  revenue_month_currency    text default 'USD',
  active_reservations_count integer,
  avg_daily_rate            numeric(10,2),
  -- Platform reviews (Hostify)
  review_score_airbnb       numeric(3,2),
  review_score_booking      numeric(3,2),
  review_count_airbnb       integer,
  review_count_booking      integer,
  -- Wheelhouse data
  recommended_rate          numeric(10,2),
  applied_rate              numeric(10,2),
  -- Raw payloads for debugging
  hostify_raw               jsonb,
  wheelhouse_raw            jsonb,
  synced_at                 timestamptz not null default now(),
  created_at                timestamptz not null default now(),
  unique(property_id, metric_date)
);

comment on table public.property_metrics is 'Daily cached metrics snapshot from Hostify and Wheelhouse';
create index idx_property_metrics_property_date on public.property_metrics(property_id, metric_date desc);

-- ============================================================
-- CHAT MESSAGES
-- AI conversation history per owner+property.
-- ============================================================
create table public.chat_messages (
  id            uuid primary key default uuid_generate_v4(),
  property_id   uuid not null references public.properties(id) on delete cascade,
  owner_id      uuid not null references public.owners(id) on delete cascade,
  role          text not null check (role in ('user', 'assistant')),
  content       text not null,
  metadata      jsonb,                                      -- tool calls, context used, etc.
  created_at    timestamptz not null default now()
);

comment on table public.chat_messages is 'AI chat conversation history per property';
create index idx_chat_messages_property_owner on public.chat_messages(property_id, owner_id, created_at desc);

-- ============================================================
-- SUPPORT TICKETS
-- Generated when AI cannot resolve an owner query.
-- ============================================================
create table public.support_tickets (
  id                  uuid primary key default uuid_generate_v4(),
  property_id         uuid not null references public.properties(id) on delete cascade,
  owner_id            uuid not null references public.owners(id) on delete cascade,
  chat_message_id     uuid references public.chat_messages(id) on delete set null,
  title               text not null,
  description         text not null,
  status              text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority            text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  resolved_at         timestamptz,
  resolution_notes    text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.support_tickets is 'Support tickets created when AI cannot resolve owner queries';
create index idx_support_tickets_owner on public.support_tickets(owner_id, created_at desc);
create index idx_support_tickets_status on public.support_tickets(status);

-- ============================================================
-- UPDATED_AT trigger function (reusable)
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at trigger to all relevant tables
create trigger owners_updated_at
  before update on public.owners
  for each row execute function public.handle_updated_at();

create trigger properties_updated_at
  before update on public.properties
  for each row execute function public.handle_updated_at();

create trigger inventory_items_updated_at
  before update on public.inventory_items
  for each row execute function public.handle_updated_at();

create trigger cleaning_records_updated_at
  before update on public.cleaning_records
  for each row execute function public.handle_updated_at();

create trigger maintenance_records_updated_at
  before update on public.maintenance_records
  for each row execute function public.handle_updated_at();

create trigger support_tickets_updated_at
  before update on public.support_tickets
  for each row execute function public.handle_updated_at();
