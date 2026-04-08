-- Add support for multiple emails per owner
-- The primary email stays in `owners.email`. Additional emails (aliases the
-- owner may use to write to support) go into `additional_emails`.
-- n8n "Supabase - Buscar Propietario" should match against either:
--   or=(email.eq.<sender>,additional_emails.cs.{<sender>})

ALTER TABLE owners
  ADD COLUMN IF NOT EXISTS additional_emails text[] NOT NULL DEFAULT '{}';

-- GIN index for fast contains-lookups from n8n
CREATE INDEX IF NOT EXISTS idx_owners_additional_emails
  ON owners USING gin (additional_emails);

COMMENT ON COLUMN owners.additional_emails IS
  'Extra email aliases the owner may use to contact support. Matched by n8n in addition to owners.email.';
