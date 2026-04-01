-- ============================================================
-- NOK Owner Platform — Demo Seed Data
-- Migration 003: Sample data for development/testing
-- Run ONLY in development. Use service role.
-- ============================================================

-- NOTE: To create a real owner, first create the user via Supabase Auth,
-- then insert into owners referencing the auth.users.id.
-- This seed uses placeholder UUIDs for development only.

-- Sample owner (replace supabase_user_id with real auth.users.id after signup)
insert into public.owners (id, supabase_user_id, name, email, phone)
values (
  '00000000-0000-0000-0000-000000000001',
  null,  -- fill in after creating auth user
  'Santiago Demo',
  'demo@nok.com',
  '+1-809-555-0100'
) on conflict (email) do nothing;

-- Sample properties
insert into public.properties (
  id, owner_id,
  hostify_property_id, breezeway_property_id, wheelhouse_property_id,
  name, address, city, country, bedrooms, bathrooms, max_guests
) values
(
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'hostify-prop-001', 'breezeway-prop-001', 'wheelhouse-prop-001',
  'Casa Marina — Piantini', 'C. Freddy Prestol Castillo 45, Piantini', 'Santo Domingo', 'DO', 2, 2, 5
),
(
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000001',
  'hostify-prop-002', 'breezeway-prop-002', 'wheelhouse-prop-002',
  'Penthouse Naco', 'Av. Sarasota 65, Naco', 'Santo Domingo', 'DO', 3, 3, 8
)
on conflict (id) do nothing;

-- Sample inventory items
insert into public.inventory_items (
  property_id, name, category, quantity, condition,
  replacement_threshold_months, last_replaced_at
) values
('00000000-0000-0000-0000-000000000010', 'Sábanas Queen (set)', 'linens', 4, 'good', 12, now() - interval '8 months'),
('00000000-0000-0000-0000-000000000010', 'Toallas de baño', 'linens', 6, 'fair', 6, now() - interval '5 months'),
('00000000-0000-0000-0000-000000000010', 'Cafetera Nespresso', 'appliances', 1, 'good', 36, now() - interval '6 months'),
('00000000-0000-0000-0000-000000000010', 'Control remoto A/C', 'electronics', 2, 'poor', 24, now() - interval '20 months'),
('00000000-0000-0000-0000-000000000011', 'Sábanas King (set)', 'linens', 6, 'good', 12, now() - interval '3 months'),
('00000000-0000-0000-0000-000000000011', 'Toallas de piscina', 'linens', 8, 'good', 6, now() - interval '2 months')
on conflict do nothing;

-- Sample cleaning records
insert into public.cleaning_records (
  property_id, scheduled_at, completed_at, staff_name, status, duration_minutes, notes
) values
(
  '00000000-0000-0000-0000-000000000010',
  now() - interval '2 days', now() - interval '2 days' + interval '2 hours',
  'María García', 'completed', 120, 'Limpieza post checkout. Todo en orden.'
),
(
  '00000000-0000-0000-0000-000000000010',
  now() - interval '7 days', now() - interval '7 days' + interval '1.5 hours',
  'Carmen Rodríguez', 'completed', 90, 'Limpieza estándar.'
),
(
  '00000000-0000-0000-0000-000000000011',
  now() - interval '1 day', now() - interval '1 day' + interval '3 hours',
  'María García', 'completed', 180, 'Limpieza profunda post temporada.'
)
on conflict do nothing;

-- Sample maintenance records
insert into public.maintenance_records (
  property_id, type, title, scheduled_at, completed_at, staff_name, status, priority, notes
) values
(
  '00000000-0000-0000-0000-000000000010',
  'maintenance', 'Revisión A/C habitación principal',
  now() - interval '5 days', now() - interval '5 days' + interval '1 hour',
  'Técnico Luis Méndez', 'completed', 'high',
  'A/C funcionando correctamente. Se limpió filtro.'
),
(
  '00000000-0000-0000-0000-000000000011',
  'inspection', 'Inspección mensual de rutina',
  now() - interval '3 days', now() - interval '3 days' + interval '2 hours',
  'Inspector Juan Pérez', 'completed', 'medium',
  'Todo en orden. Se reportó lámpara del baño secundario a reemplazar.'
)
on conflict do nothing;

-- Sample metrics
insert into public.property_metrics (
  property_id, metric_date,
  occupancy_rate, revenue_month, active_reservations_count, avg_daily_rate,
  review_score_airbnb, review_count_airbnb,
  recommended_rate, applied_rate
) values
(
  '00000000-0000-0000-0000-000000000010',
  current_date,
  78.5, 3200.00, 2, 145.00,
  4.92, 47,
  160.00, 145.00
),
(
  '00000000-0000-0000-0000-000000000011',
  current_date,
  65.0, 4100.00, 1, 210.00,
  4.87, 32,
  225.00, 210.00
)
on conflict (property_id, metric_date) do nothing;
