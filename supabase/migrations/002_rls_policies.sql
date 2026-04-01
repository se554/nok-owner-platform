-- ============================================================
-- NOK Owner Platform — Row Level Security
-- Migration 002: RLS policies
-- ============================================================
-- Core principle: every owner only sees their own data.
-- The service role (used in API routes) bypasses RLS.
-- ============================================================

-- Enable RLS on all tables
alter table public.owners           enable row level security;
alter table public.properties       enable row level security;
alter table public.inventory_items  enable row level security;
alter table public.cleaning_records enable row level security;
alter table public.maintenance_records enable row level security;
alter table public.property_metrics enable row level security;
alter table public.chat_messages    enable row level security;
alter table public.support_tickets  enable row level security;

-- ============================================================
-- Helper: get the owner.id for the currently authenticated user
-- ============================================================
create or replace function public.get_my_owner_id()
returns uuid as $$
  select id from public.owners where supabase_user_id = auth.uid()
$$ language sql security definer stable;

-- ============================================================
-- OWNERS table
-- ============================================================
-- Owners can only read their own row
create policy "owners: select own row"
  on public.owners for select
  using (supabase_user_id = auth.uid());

-- Owners can update their own profile
create policy "owners: update own row"
  on public.owners for update
  using (supabase_user_id = auth.uid());

-- Insert is done via service role (admin onboarding), not by the owner
-- No insert policy for anon/authenticated role

-- ============================================================
-- PROPERTIES table
-- ============================================================
create policy "properties: select own"
  on public.properties for select
  using (owner_id = public.get_my_owner_id());

-- Owners cannot create/update/delete properties (NOK team does this via service role)

-- ============================================================
-- INVENTORY ITEMS
-- ============================================================
create policy "inventory_items: select own properties"
  on public.inventory_items for select
  using (
    property_id in (
      select id from public.properties where owner_id = public.get_my_owner_id()
    )
  );

-- ============================================================
-- CLEANING RECORDS
-- ============================================================
create policy "cleaning_records: select own properties"
  on public.cleaning_records for select
  using (
    property_id in (
      select id from public.properties where owner_id = public.get_my_owner_id()
    )
  );

-- ============================================================
-- MAINTENANCE RECORDS
-- ============================================================
create policy "maintenance_records: select own properties"
  on public.maintenance_records for select
  using (
    property_id in (
      select id from public.properties where owner_id = public.get_my_owner_id()
    )
  );

-- ============================================================
-- PROPERTY METRICS
-- ============================================================
create policy "property_metrics: select own properties"
  on public.property_metrics for select
  using (
    property_id in (
      select id from public.properties where owner_id = public.get_my_owner_id()
    )
  );

-- ============================================================
-- CHAT MESSAGES
-- ============================================================
-- Owners can read their own messages
create policy "chat_messages: select own"
  on public.chat_messages for select
  using (owner_id = public.get_my_owner_id());

-- Owners can insert messages (user role only)
create policy "chat_messages: insert own"
  on public.chat_messages for insert
  with check (owner_id = public.get_my_owner_id());

-- ============================================================
-- SUPPORT TICKETS
-- ============================================================
create policy "support_tickets: select own"
  on public.support_tickets for select
  using (owner_id = public.get_my_owner_id());

create policy "support_tickets: insert own"
  on public.support_tickets for insert
  with check (owner_id = public.get_my_owner_id());
