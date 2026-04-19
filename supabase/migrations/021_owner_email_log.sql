-- Onboarding email log + deduplication for NOK Owners welcome flow
-- Spec: NOK_Owners_Portal_Onboarding.docx · Section 2 (Automation) + Section 5 (Stack)

create table if not exists owner_email_log (
  id              uuid primary key default gen_random_uuid(),
  listing_id      text not null,
  owner_email     text not null,
  email_type      text not null check (email_type in ('welcome', 'followup_d7')),
  status          text not null check (status in ('sent', 'failed', 'skipped')),
  error_message   text,
  resend_id       text,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists owner_email_log_listing_type_idx
  on owner_email_log (listing_id, email_type);

create index if not exists owner_email_log_created_idx
  on owner_email_log (created_at desc);

-- Dedupe helper: has a given listing already received a given email_type successfully?
create or replace function owner_email_already_sent(
  p_listing_id text,
  p_email_type text
) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from owner_email_log
    where listing_id = p_listing_id
      and email_type = p_email_type
      and status = 'sent'
  );
$$;

alter table owner_email_log enable row level security;

-- Only service role writes/reads; no owner-facing access needed
drop policy if exists "service role full access" on owner_email_log;
create policy "service role full access"
  on owner_email_log
  for all
  to service_role
  using (true)
  with check (true);
