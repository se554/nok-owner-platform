-- ============================================================
-- NOK Owner Platform — Guesty Integration
-- Migration 004: Reservations + Reviews tables
-- ============================================================

-- ============================================================
-- RESERVATIONS
-- Synced from Guesty. The core of what an owner cares about.
-- ============================================================
create table public.reservations (
  id                      uuid primary key default uuid_generate_v4(),
  property_id             uuid not null references public.properties(id) on delete cascade,
  -- Guesty IDs
  guesty_reservation_id   text unique not null,
  guesty_listing_id       text,
  -- Status
  status                  text not null default 'confirmed',
  -- 'inquiry', 'declined', 'expired', 'cancelled', 'confirmed', 'checked_in', 'checked_out', 'closed'
  -- Dates
  check_in                date not null,
  check_out               date not null,
  nights                  integer generated always as (check_out - check_in) stored,
  -- Guest info
  guest_name              text,
  guest_email             text,
  guest_phone             text,
  guest_country           text,
  num_guests              integer,
  -- Financials (always in USD unless specified)
  total_price             numeric(12,2),
  owner_revenue           numeric(12,2),      -- after NOK commission
  currency                text default 'USD',
  -- Platform (channel)
  channel                 text,               -- 'airbnb', 'booking.com', 'direct', 'vrbo', etc.
  -- Special flags
  is_blocked              boolean default false,  -- owner blocks / maintenance holds
  notes                   text,
  -- Raw payload
  raw_data                jsonb,
  synced_at               timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table public.reservations is 'Reservations per property, synced from Guesty';
create index idx_reservations_property_id on public.reservations(property_id);
create index idx_reservations_check_in on public.reservations(check_in);
create index idx_reservations_status on public.reservations(status);
-- For calendar queries (date range overlaps)
create index idx_reservations_dates on public.reservations(property_id, check_in, check_out);

create trigger reservations_updated_at
  before update on public.reservations
  for each row execute function public.handle_updated_at();

-- ============================================================
-- REVIEWS
-- Synced from Guesty (Airbnb, Booking.com, etc.)
-- ============================================================
create table public.reviews (
  id                    uuid primary key default uuid_generate_v4(),
  property_id           uuid not null references public.properties(id) on delete cascade,
  reservation_id        uuid references public.reservations(id) on delete set null,
  guesty_review_id      text unique,
  -- Platform
  channel               text,               -- 'airbnb', 'booking.com', etc.
  -- Scores (1-5 scale, normalized)
  overall_score         numeric(3,2),
  cleanliness_score     numeric(3,2),
  communication_score   numeric(3,2),
  checkin_score         numeric(3,2),
  accuracy_score        numeric(3,2),
  location_score        numeric(3,2),
  value_score           numeric(3,2),
  -- Content
  guest_name            text,
  reviewer_text         text,               -- what the guest wrote
  host_response         text,               -- NOK's response
  -- Date
  submitted_at          timestamptz,
  -- Raw data
  raw_data              jsonb,
  synced_at             timestamptz,
  created_at            timestamptz not null default now()
);

comment on table public.reviews is 'Guest reviews per property, synced from Guesty';
create index idx_reviews_property_id on public.reviews(property_id);
create index idx_reviews_submitted_at on public.reviews(submitted_at desc);
create index idx_reviews_overall_score on public.reviews(property_id, overall_score);

-- ============================================================
-- PRICING CALENDAR
-- Daily rate cache per property — key for AI to answer pricing questions.
-- Populated from Wheelhouse / Guesty pricing engine.
-- ============================================================
create table public.pricing_calendar (
  id                    uuid primary key default uuid_generate_v4(),
  property_id           uuid not null references public.properties(id) on delete cascade,
  calendar_date         date not null,
  -- Rates
  base_rate             numeric(10,2),      -- NOK's set rate
  recommended_rate      numeric(10,2),      -- Wheelhouse suggestion
  min_rate              numeric(10,2),
  max_rate              numeric(10,2),
  currency              text default 'USD',
  -- Availability
  is_available          boolean default true,
  is_blocked            boolean default false,
  block_reason          text,               -- 'owner_block', 'maintenance', 'reserved'
  min_stay_nights       integer default 2,
  -- Source
  source                text default 'wheelhouse',  -- 'wheelhouse', 'guesty', 'manual'
  synced_at             timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique(property_id, calendar_date)
);

comment on table public.pricing_calendar is 'Daily pricing and availability per property — primary source for AI answers on rates';
create index idx_pricing_calendar_property_date on public.pricing_calendar(property_id, calendar_date);

create trigger pricing_calendar_updated_at
  before update on public.pricing_calendar
  for each row execute function public.handle_updated_at();

-- ============================================================
-- RLS POLICIES for new tables
-- ============================================================

alter table public.reservations       enable row level security;
alter table public.reviews            enable row level security;
alter table public.pricing_calendar   enable row level security;

-- Reservations: owner sees only their properties
create policy "reservations: select own"
  on public.reservations for select
  using (
    property_id in (
      select id from public.properties where owner_id = public.get_my_owner_id()
    )
  );

-- Reviews: owner sees only their properties
create policy "reviews: select own"
  on public.reviews for select
  using (
    property_id in (
      select id from public.properties where owner_id = public.get_my_owner_id()
    )
  );

-- Pricing calendar: owner sees only their properties
create policy "pricing_calendar: select own"
  on public.pricing_calendar for select
  using (
    property_id in (
      select id from public.properties where owner_id = public.get_my_owner_id()
    )
  );

-- ============================================================
-- Update properties table: add guesty_listing_id
-- ============================================================
alter table public.properties
  add column if not exists guesty_listing_id text unique;
