-- Add unique indexes on notion_id for owners and properties
-- This allows upsert by notion_id for owners without email
create unique index if not exists idx_owners_notion_id on public.owners(notion_id) where notion_id is not null;
create unique index if not exists idx_properties_notion_id on public.properties(notion_id) where notion_id is not null;
