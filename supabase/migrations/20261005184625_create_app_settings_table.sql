/*
# Create app_settings table for master password storage

1. New Tables
- `app_settings`
  - `id` (int, primary key, fixed to 1 for single-row singleton)
  - `password_hash` (text, not null) — SHA-256 hash of the master password
  - `updated_at` (timestamptz, default now())

2. Security
- RLS enabled on `app_settings`.
- Anon + authenticated full CRUD (single-tenant, no auth flow).
- The password is stored as a SHA-256 hash (via pgcrypto), never as plaintext.

3. Important Notes
- Only one row ever exists (id = 1), seeded with the initial master password hash.
- pgcrypto extension is enabled for digest() function used during seed.
- The client also hashes with Web Crypto API (SHA-256) before comparing/updating.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  password_hash text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_app_settings" ON app_settings;
CREATE POLICY "anon_select_app_settings" ON app_settings FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_app_settings" ON app_settings;
CREATE POLICY "anon_insert_app_settings" ON app_settings FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_app_settings" ON app_settings;
CREATE POLICY "anon_update_app_settings" ON app_settings FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_app_settings" ON app_settings;
CREATE POLICY "anon_delete_app_settings" ON app_settings FOR DELETE
TO anon, authenticated USING (true);

-- Seed the initial master password hash ("YOUR_NAME_HERE")
INSERT INTO app_settings (id, password_hash)
VALUES (1, encode(digest('YOUR_NAME_HERE', 'sha256'), 'hex'))
ON CONFLICT (id) DO NOTHING;
