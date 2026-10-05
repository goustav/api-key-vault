/*
# Create providers and api_keys tables (single-tenant, no auth)

1. New Tables
- `providers`
  - `id` (uuid, primary key)
  - `name` (text, not null) — e.g. "OpenAI", "Stripe"
  - `dashboard_url` (text, nullable) — link to the provider's dashboard/portal
  - `created_at` (timestamptz, default now())
- `api_keys`
  - `id` (uuid, primary key)
  - `provider_id` (uuid, foreign key to providers, cascade delete)
  - `account_label` (text, not null) — e.g. "Work account", "Personal"
  - `note` (text, nullable) — small optional note like "free tier"
  - `key_value` (text, not null) — the actual API key string
  - `created_at` (timestamptz, default now())

2. Security
- RLS enabled on both tables.
- Anon + authenticated full CRUD since this is a single-tenant app with no sign-in (PIN lock is client-side only, not auth).
- api_keys policies allow access when the parent provider exists (but since it's all public single-tenant data, simple true checks suffice).

3. Important Notes
- No user_id columns — no auth flow in this app.
- The PIN lock is a client-side gate only; Supabase access uses the anon key.
- Cascade delete: deleting a provider removes all its keys automatically.
*/

CREATE TABLE IF NOT EXISTS providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  dashboard_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  account_label text NOT NULL,
  note text,
  key_value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Providers: CRUD for anon + authenticated
DROP POLICY IF EXISTS "anon_select_providers" ON providers;
CREATE POLICY "anon_select_providers" ON providers FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_providers" ON providers;
CREATE POLICY "anon_insert_providers" ON providers FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_providers" ON providers;
CREATE POLICY "anon_update_providers" ON providers FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_providers" ON providers;
CREATE POLICY "anon_delete_providers" ON providers FOR DELETE
TO anon, authenticated USING (true);

-- API Keys: CRUD for anon + authenticated
DROP POLICY IF EXISTS "anon_select_api_keys" ON api_keys;
CREATE POLICY "anon_select_api_keys" ON api_keys FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_api_keys" ON api_keys;
CREATE POLICY "anon_insert_api_keys" ON api_keys FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_api_keys" ON api_keys;
CREATE POLICY "anon_update_api_keys" ON api_keys FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_api_keys" ON api_keys;
CREATE POLICY "anon_delete_api_keys" ON api_keys FOR DELETE
TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_api_keys_provider_id ON api_keys(provider_id);
