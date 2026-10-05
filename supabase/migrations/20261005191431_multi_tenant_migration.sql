/*
# Multi-tenant migration: user profiles, ownership, soft-delete, pinning

## Overview
Migrates the existing single-tenant providers/api_keys schema to multi-tenant with Google OAuth.
Each user sees only their own data via RLS with auth.uid() ownership checks.
Adds soft-delete (trash system), pin-to-top, last-used tracking, and ping URLs.

## 1. New Tables
- `profiles`
  - `id` (uuid, PK, references auth.users) — matches the auth user's ID
  - `username` (text, not null) — display name chosen by user on first login
  - `created_at` (timestamptz)

## 2. Modified Tables & New Columns

### providers (existing table, new columns added)
- `user_id` (uuid, NOT NULL, DEFAULT auth.uid(), references auth.users ON DELETE CASCADE) — owner
- `is_pinned` (boolean, DEFAULT false) — pinned to top of dashboard
- `is_deleted` (boolean, DEFAULT false) — soft-delete flag for trash
- `deleted_at` (timestamptz, nullable) — when moved to trash

### api_keys (existing table, new columns added)
- `last_used_at` (timestamptz, nullable) — when the key was last copied
- `is_deleted` (boolean, DEFAULT false) — soft-delete flag for trash
- `deleted_at` (timestamptz, nullable) — when moved to trash

## 3. Security (RLS)
- profiles: owner-scoped SELECT + UPDATE (users see/edit only their own profile)
- providers: owner-scoped CRUD via auth.uid() = user_id
- api_keys: owner-scoped via parent provider ownership check (EXISTS subquery)
- All policies TO authenticated only (Google OAuth required)
- user_id has DEFAULT auth.uid() so client inserts without passing user_id still work

## 4. Important Notes
- This is NOT a DROP/recreate — existing columns are preserved, only ADD columns
- DO block with IF NOT EXISTS ensures idempotency
- Profiles table is separate from auth.users (stores app-specific username)
- Soft-delete: is_deleted=true moves item to trash; hard delete removes the row
*/
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==================== PROFILES TABLE ====================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ==================== PROVIDERS: ADD COLUMNS ====================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'providers' AND column_name = 'user_id') THEN
    ALTER TABLE providers ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'providers' AND column_name = 'is_pinned') THEN
    ALTER TABLE providers ADD COLUMN is_pinned boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'providers' AND column_name = 'is_deleted') THEN
    ALTER TABLE providers ADD COLUMN is_deleted boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'providers' AND column_name = 'deleted_at') THEN
    ALTER TABLE providers ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

-- ==================== API_KEYS: ADD COLUMNS ====================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_keys' AND column_name = 'last_used_at') THEN
    ALTER TABLE api_keys ADD COLUMN last_used_at timestamptz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_keys' AND column_name = 'is_deleted') THEN
    ALTER TABLE api_keys ADD COLUMN is_deleted boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_keys' AND column_name = 'deleted_at') THEN
    ALTER TABLE api_keys ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

-- ==================== PROVIDERS: REPLACE POLICIES ====================
-- Remove old single-tenant anon policies
DROP POLICY IF EXISTS "anon_select_providers" ON providers;
DROP POLICY IF EXISTS "anon_insert_providers" ON providers;
DROP POLICY IF EXISTS "anon_update_providers" ON providers;
DROP POLICY IF EXISTS "anon_delete_providers" ON providers;

DROP POLICY IF EXISTS "select_own_providers" ON providers;
CREATE POLICY "select_own_providers" ON providers FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_providers" ON providers;
CREATE POLICY "insert_own_providers" ON providers FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_providers" ON providers;
CREATE POLICY "update_own_providers" ON providers FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_providers" ON providers;
CREATE POLICY "delete_own_providers" ON providers FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- ==================== API_KEYS: REPLACE POLICIES ====================
-- Remove old single-tenant anon policies
DROP POLICY IF EXISTS "anon_select_api_keys" ON api_keys;
DROP POLICY IF EXISTS "anon_insert_api_keys" ON api_keys;
DROP POLICY IF EXISTS "anon_update_api_keys" ON api_keys;
DROP POLICY IF EXISTS "anon_delete_api_keys" ON api_keys;

-- Owner-scoped via parent provider ownership check
DROP POLICY IF EXISTS "select_own_api_keys" ON api_keys;
CREATE POLICY "select_own_api_keys" ON api_keys FOR SELECT
TO authenticated USING (
  EXISTS (SELECT 1 FROM providers WHERE providers.id = api_keys.provider_id AND providers.user_id = auth.uid())
);

DROP POLICY IF EXISTS "insert_own_api_keys" ON api_keys;
CREATE POLICY "insert_own_api_keys" ON api_keys FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM providers WHERE providers.id = api_keys.provider_id AND providers.user_id = auth.uid())
);

DROP POLICY IF EXISTS "update_own_api_keys" ON api_keys;
CREATE POLICY "update_own_api_keys" ON api_keys FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM providers WHERE providers.id = api_keys.provider_id AND providers.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM providers WHERE providers.id = api_keys.provider_id AND providers.user_id = auth.uid())
);

DROP POLICY IF EXISTS "delete_own_api_keys" ON api_keys;
CREATE POLICY "delete_own_api_keys" ON api_keys FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM providers WHERE providers.id = api_keys.provider_id AND providers.user_id = auth.uid())
);

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_providers_user_id ON providers(user_id);
CREATE INDEX IF NOT EXISTS idx_providers_is_deleted ON providers(is_deleted);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_deleted ON api_keys(is_deleted);

-- ==================== DROP OLD APP_SETTINGS ====================
-- The old password-based app_settings table is no longer needed (replaced by Google OAuth)
DROP TABLE IF EXISTS app_settings;
