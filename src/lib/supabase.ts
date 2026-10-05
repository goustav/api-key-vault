import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Profile = {
  id: string;
  username: string;
  created_at: string;
};

export type Provider = {
  id: string;
  user_id: string;
  name: string;
  dashboard_url: string | null;
  is_pinned: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
};

export type ApiKey = {
  id: string;
  provider_id: string;
  account_label: string;
  note: string | null;
  key_value: string;
  last_used_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
};

export type ProviderWithKeys = Provider & {
  api_keys: ApiKey[];
};
