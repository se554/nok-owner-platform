-- Owner-entered direct costs (mortgage, HOA, maintenance, etc.)
-- Recurring monthly OR one-time. Subtracted from net revenue on the owner dashboard.

create table if not exists owner_costs (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references properties(id) on delete cascade,
  owner_id      uuid references owners(id) on delete set null,
  label         text not null,
  category      text check (category in ('mortgage','maintenance','utilities','insurance','hoa','property_tax','other')),
  amount        numeric(12,2) not null check (amount >= 0),
  currency      text not null default 'USD' check (currency in ('USD','DOP','COP')),
  frequency     text not null check (frequency in ('monthly','one_time')),
  start_date    date not null,
  end_date      date,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists owner_costs_property_idx
  on owner_costs (property_id);

create index if not exists owner_costs_owner_idx
  on owner_costs (owner_id);

-- Keep updated_at in sync
create or replace function owner_costs_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists owner_costs_touch_trigger on owner_costs;
create trigger owner_costs_touch_trigger
  before update on owner_costs
  for each row execute function owner_costs_touch();

alter table owner_costs enable row level security;

-- Owners see/edit only their own property costs
drop policy if exists "owners read own costs" on owner_costs;
create policy "owners read own costs"
  on owner_costs for select
  to authenticated
  using (owner_id = get_my_owner_id());

drop policy if exists "owners insert own costs" on owner_costs;
create policy "owners insert own costs"
  on owner_costs for insert
  to authenticated
  with check (owner_id = get_my_owner_id());

drop policy if exists "owners update own costs" on owner_costs;
create policy "owners update own costs"
  on owner_costs for update
  to authenticated
  using (owner_id = get_my_owner_id())
  with check (owner_id = get_my_owner_id());

drop policy if exists "owners delete own costs" on owner_costs;
create policy "owners delete own costs"
  on owner_costs for delete
  to authenticated
  using (owner_id = get_my_owner_id());

drop policy if exists "service role full access" on owner_costs;
create policy "service role full access"
  on owner_costs for all
  to service_role using (true) with check (true);
