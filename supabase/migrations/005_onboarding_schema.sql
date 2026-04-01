-- ============================================================
-- NOK Owner Platform — Onboarding Module Schema
-- Migration 005: Tables for intelligent owner onboarding
-- ============================================================

-- ============================================================
-- NOK_STANDARDS
-- What NOK requires per space type. Used by AI to validate
-- and generate inventory lists during onboarding.
-- ============================================================
create table public.nok_standards (
  id             uuid primary key default uuid_generate_v4(),
  space_type     text not null check (space_type in ('cocina','sala','habitacion','baño','terraza','general','lavanderia')),
  category       text not null,                           -- 'utensilios', 'electrodomesticos', 'lenceria', 'toallas', 'muebles', 'tecnologia'
  item_name      text not null,
  quantity_min   integer not null default 1,
  quantity_max   integer,                                 -- null = same as min
  unit           text default 'unidad',                  -- 'unidad', 'juego', 'por cama', 'por baño'
  size_notes     text,                                    -- e.g. "colchón King 90x50, resto 70x50"
  is_required    boolean not null default true,
  market         text default 'all' check (market in ('all','DO','CO')), -- 'all' = aplica en ambos mercados
  notes          text,                                    -- observaciones adicionales del estándar
  created_at     timestamptz not null default now()
);

comment on table public.nok_standards is 'NOK required inventory standards per space type — used by AI during onboarding';
create index idx_nok_standards_space on public.nok_standards(space_type);
create index idx_nok_standards_required on public.nok_standards(is_required);

-- ============================================================
-- CATALOG_ITEMS
-- Products NOK recommends / installs. Two markets: DO (DOP) and CO (COP).
-- Santiago loads and updates these via the admin panel.
-- ============================================================
create table public.catalog_items (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  provider            text not null,                     -- 'IKEA', 'JUMBO', 'ITALICA', etc.
  reference_code      text,
  category            text not null check (category in ('cocina','sala','comedor','habitacion','baño','electrodomesticos','lenceria','toallas','terraza','general','tecnologia')),
  space_type          text check (space_type in ('cocina','sala','habitacion','baño','terraza','general','lavanderia')),
  country             text not null check (country in ('DO','CO')),
  currency            text not null check (currency in ('DOP','COP','USD')),
  price               numeric(12,2) not null,            -- price in local currency (DOP or COP)
  colors_available    jsonb default '[]',                -- [{color: 'blanco', photo_url: '...'}]
  is_nok_standard     boolean not null default false,    -- is this the NOK-preferred option?
  purchase_url        text,
  photo_url           text,
  active              boolean not null default true,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.catalog_items is 'Product catalog per market — items NOK recommends during onboarding';
create index idx_catalog_items_category on public.catalog_items(category);
create index idx_catalog_items_country on public.catalog_items(country);
create index idx_catalog_items_active on public.catalog_items(active);

create trigger catalog_items_updated_at
  before update on public.catalog_items
  for each row execute function public.handle_updated_at();

-- ============================================================
-- ONBOARDING_SESSIONS
-- One session per owner per property being onboarded.
-- Tracks the full flow from start to approved/rejected.
-- ============================================================
create table public.onboarding_sessions (
  id                  uuid primary key default uuid_generate_v4(),
  owner_id            uuid references public.owners(id) on delete set null,
  -- Contact info (for owners not yet in system)
  owner_name          text not null,
  owner_email         text not null,
  owner_phone         text,
  property_address    text not null,
  property_city       text not null default 'Santo Domingo',
  property_country    text not null default 'DO',
  bedrooms            integer,
  bathrooms           integer,
  -- Flow state
  status              text not null default 'started'
                      check (status in ('started','plan_uploaded','chat_in_progress','report_ready','approved','rejected')),
  apartment_type      text check (apartment_type in ('empty','furnished')),
  -- Floor plan
  floor_plan_url      text,                              -- Supabase Storage URL
  floor_plan_spaces   jsonb,                             -- extracted by Claude Vision: [{name, width_m, length_m, area_m2}]
  -- Chat
  chat_history        jsonb default '[]',                -- [{role, content, timestamp, attachments?}]
  -- Results
  inventory_result    jsonb,                             -- summary: {has_it: [], missing: [], not_nok: []}
  quote_total         numeric(12,2),
  quote_currency      text,
  quote_pdf_url       text,                              -- Supabase Storage URL
  -- Metadata
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.onboarding_sessions is 'Onboarding sessions — one per owner/property being evaluated for NOK';
create index idx_onboarding_sessions_owner on public.onboarding_sessions(owner_id);
create index idx_onboarding_sessions_status on public.onboarding_sessions(status);
create index idx_onboarding_sessions_email on public.onboarding_sessions(owner_email);

create trigger onboarding_sessions_updated_at
  before update on public.onboarding_sessions
  for each row execute function public.handle_updated_at();

-- ============================================================
-- ONBOARDING_INVENTORY_ITEMS
-- Line items per session. Built progressively during the chat.
-- ============================================================
create table public.onboarding_inventory_items (
  id                  uuid primary key default uuid_generate_v4(),
  session_id          uuid not null references public.onboarding_sessions(id) on delete cascade,
  catalog_item_id     uuid references public.catalog_items(id) on delete set null,
  space               text not null check (space in ('cocina','sala','habitacion','baño','terraza','general','lavanderia')),
  item_name           text not null,
  status              text not null default 'missing'
                      check (status in ('has_it','missing','not_nok_standard','optional')),
  quantity_needed     integer not null default 1,
  selected_color      text,
  unit_price          numeric(12,2),
  currency            text,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.onboarding_inventory_items is 'Inventory line items per onboarding session — built during AI chat';
create index idx_onb_inv_session on public.onboarding_inventory_items(session_id);
create index idx_onb_inv_space on public.onboarding_inventory_items(session_id, space);
create index idx_onb_inv_status on public.onboarding_inventory_items(session_id, status);

create trigger onboarding_inventory_items_updated_at
  before update on public.onboarding_inventory_items
  for each row execute function public.handle_updated_at();

-- ============================================================
-- RLS — Row Level Security
-- ============================================================

-- nok_standards: public read (used in chat context), admin write
alter table public.nok_standards enable row level security;

create policy "anyone can read standards"
  on public.nok_standards for select
  using (true);

create policy "service role manages standards"
  on public.nok_standards for all
  using (auth.role() = 'service_role');

-- catalog_items: public read (active only), admin write
alter table public.catalog_items enable row level security;

create policy "anyone can read active catalog items"
  on public.catalog_items for select
  using (active = true);

create policy "service role manages catalog"
  on public.catalog_items for all
  using (auth.role() = 'service_role');

-- onboarding_sessions: owners see their own, service role sees all
alter table public.onboarding_sessions enable row level security;

create policy "owners can view own sessions"
  on public.onboarding_sessions for select
  using (
    owner_id in (
      select id from public.owners where supabase_user_id = auth.uid()
    )
    or owner_email = (select email from auth.users where id = auth.uid())
  );

create policy "anyone can insert sessions (new prospects)"
  on public.onboarding_sessions for insert
  with check (true);

create policy "owners can update own sessions"
  on public.onboarding_sessions for update
  using (
    owner_id in (
      select id from public.owners where supabase_user_id = auth.uid()
    )
    or owner_email = (select email from auth.users where id = auth.uid())
  );

create policy "service role full access to sessions"
  on public.onboarding_sessions for all
  using (auth.role() = 'service_role');

-- onboarding_inventory_items: follow session access
alter table public.onboarding_inventory_items enable row level security;

create policy "access items via session ownership"
  on public.onboarding_inventory_items for select
  using (
    session_id in (
      select id from public.onboarding_sessions
      where owner_id in (
        select id from public.owners where supabase_user_id = auth.uid()
      )
      or owner_email = (select email from auth.users where id = auth.uid())
    )
  );

create policy "insert items for owned sessions"
  on public.onboarding_inventory_items for insert
  with check (true);

create policy "update items for owned sessions"
  on public.onboarding_inventory_items for update
  using (
    session_id in (
      select id from public.onboarding_sessions
      where owner_id in (
        select id from public.owners where supabase_user_id = auth.uid()
      )
      or owner_email = (select email from auth.users where id = auth.uid())
    )
  );

create policy "service role full access to inventory items"
  on public.onboarding_inventory_items for all
  using (auth.role() = 'service_role');
