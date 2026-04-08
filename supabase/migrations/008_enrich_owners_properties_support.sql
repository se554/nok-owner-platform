-- ============================================================
-- NOK Owner Platform — Migration 008
-- Enrich owners & properties with Notion data fields
-- Add FAQ knowledge base with pgvector for semantic search
-- Enhance support_tickets for email flow (n8n) + internal management
-- ============================================================

-- Enable pgvector for semantic search
create extension if not exists vector;

-- ============================================================
-- ENRICH OWNERS with banking & identity info from Notion
-- ============================================================
alter table public.owners add column if not exists pais text;
alter table public.owners add column if not exists banco text;
alter table public.owners add column if not exists numero_cuenta text;
alter table public.owners add column if not exists swift_routing text;
alter table public.owners add column if not exists direccion text;
alter table public.owners add column if not exists rut_url text;
alter table public.owners add column if not exists notion_id text;

comment on column public.owners.pais is 'País del propietario: Colombia, Estados Unidos, Republica Dominicana';
comment on column public.owners.banco is 'Banco para transferencias';
comment on column public.owners.numero_cuenta is 'Número de cuenta bancaria';
comment on column public.owners.swift_routing is 'Código SWIFT o Routing number';
comment on column public.owners.rut_url is 'URL del documento RUT';
comment on column public.owners.notion_id is 'ID legacy de Notion (para migración)';

-- ============================================================
-- ENRICH PROPERTIES with operational & financial fields from Notion
-- ============================================================
alter table public.properties add column if not exists guesty_listing_id text unique;
alter table public.properties add column if not exists tipo text;
alter table public.properties add column if not exists nok_commission_rate numeric(5,4);
alter table public.properties add column if not exists tarifa_mensual numeric(12,2);
alter table public.properties add column if not exists tarifa_short_term numeric(12,2);
alter table public.properties add column if not exists cleaning_fee numeric(10,2);
alter table public.properties add column if not exists cuenta_principal text;
alter table public.properties add column if not exists mantenimiento_responsable text;
alter table public.properties add column if not exists cobro_automatizacion boolean default false;
alter table public.properties add column if not exists pago_ingresos_adicionales boolean default false;
alter table public.properties add column if not exists airbnb_url text;
alter table public.properties add column if not exists booking_url text;
alter table public.properties add column if not exists marriot_url text;
alter table public.properties add column if not exists nok_booking_engine_url text;
alter table public.properties add column if not exists notion_id text;

comment on column public.properties.guesty_listing_id is 'Guesty listing ID — clave para sincronizar con PMS';
comment on column public.properties.tipo is 'Tipo de propiedad (Apartamento, Villa, Studio, etc.)';
comment on column public.properties.nok_commission_rate is 'Comisión NOK como decimal (ej: 0.20 = 20%)';
comment on column public.properties.tarifa_mensual is 'Tarifa mensual indicativa en USD';
comment on column public.properties.tarifa_short_term is 'Tarifa short-term indicativa en USD';
comment on column public.properties.cleaning_fee is 'Tarifa de limpieza cobrada al propietario en USD';
comment on column public.properties.cuenta_principal is 'Quién maneja la cuenta principal: Nok, Propietario, Vistacana';
comment on column public.properties.mantenimiento_responsable is 'Responsable de mantenimiento: Propietario o Nok';
comment on column public.properties.notion_id is 'ID legacy de Notion (para migración)';

-- ============================================================
-- ENHANCE SUPPORT_TICKETS for email flow + n8n integration
-- ============================================================
alter table public.support_tickets alter column property_id drop not null;
alter table public.support_tickets alter column owner_id drop not null;
alter table public.support_tickets add column if not exists area_responsable text;
alter table public.support_tickets add column if not exists correo_propietario text;
alter table public.support_tickets add column if not exists correo_responsable text;
alter table public.support_tickets add column if not exists propietario_nombre text;
alter table public.support_tickets add column if not exists apartamento text;
alter table public.support_tickets add column if not exists gmail_hilo_id text unique;
alter table public.support_tickets add column if not exists resumen_ia text;
alter table public.support_tickets add column if not exists respuesta_enviada text;
alter table public.support_tickets add column if not exists urgencia text default 'baja';
alter table public.support_tickets add column if not exists categoria_faq text;
alter table public.support_tickets add column if not exists fecha_respuesta date;
alter table public.support_tickets add column if not exists auto_respondible boolean default false;
alter table public.support_tickets add column if not exists source text default 'chat';

comment on column public.support_tickets.area_responsable is 'Área NOK: Revenue Management, Operaciones COL, Operaciones RD, CX, Growth, Finance, C-level';
comment on column public.support_tickets.gmail_hilo_id is 'Gmail thread ID para tracking de emails vía n8n';
comment on column public.support_tickets.resumen_ia is 'Resumen generado por Claude AI';
comment on column public.support_tickets.source is 'Origen del ticket: chat, email, dashboard';
comment on column public.support_tickets.urgencia is 'Nivel de urgencia: alta, media, baja';

-- ============================================================
-- FAQ / KNOWLEDGE BASE with semantic search
-- ============================================================
create table if not exists public.faq_por_area (
  id                    uuid primary key default uuid_generate_v4(),
  pregunta_tipo         text not null,
  respuesta_base        text,
  area                  text check (area in (
    'Revenue Management', 'Operaciones Colombia', 'Operaciones Republica Dominicana',
    'CX', 'Growth', 'Finance', 'C-level'
  )),
  palabras_clave        text,
  responsable_principal text,
  correo_responsable    text,
  auto_respondible      boolean default false,
  veces_consultada      integer default 0,
  embedding             vector(1536),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.faq_por_area is 'Base de conocimiento FAQ por área — con embeddings para búsqueda semántica';

create trigger faq_updated_at
  before update on public.faq_por_area
  for each row execute function public.handle_updated_at();

-- Índice para búsqueda semántica
create index if not exists faq_embedding_idx on public.faq_por_area
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- RLS for faq_por_area
alter table public.faq_por_area enable row level security;
create policy "faq_read_all" on public.faq_por_area for select using (true);
create policy "faq_service_write" on public.faq_por_area for all using (true);

-- ============================================================
-- Función de búsqueda semántica de FAQs
-- ============================================================
create or replace function public.match_faqs(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 3
)
returns table (
  id uuid,
  pregunta_tipo text,
  respuesta_base text,
  area text,
  palabras_clave text,
  similarity float
)
language sql stable
as $$
  select
    f.id, f.pregunta_tipo, f.respuesta_base, f.area, f.palabras_clave,
    1 - (f.embedding <=> query_embedding) as similarity
  from public.faq_por_area f
  where 1 - (f.embedding <=> query_embedding) > match_threshold
  order by f.embedding <=> query_embedding
  limit match_count;
$$;
