-- Ticket conversation history / event log
create table if not exists public.ticket_events (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  event_type text not null check (event_type in ('owner_message', 'ai_response', 'agent_response', 'status_change', 'note', 'email_sent')),
  content text,
  metadata jsonb,
  author_name text,
  author_email text,
  created_at timestamptz not null default now()
);

create index idx_ticket_events_ticket on public.ticket_events(ticket_id, created_at asc);
alter table public.ticket_events enable row level security;
create policy "ticket_events_all" on public.ticket_events for all using (true);
