import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfigured } from '@/lib/supabase/config';

let client: SupabaseClient | null = null;

/** One shared browser client, or null when Supabase is not configured. Only the public key is ever used here. */
export function getBrowserClient(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (!client) {
    client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }
  return client;
}
