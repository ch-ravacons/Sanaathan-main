import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { AppConfig } from '../../../shared/config.js';

const clients = new Map<string, SupabaseClient>();

export function getSupabaseClient(config: AppConfig): SupabaseClient {
  const cacheKey = `${config.supabaseUrl}::${config.supabaseServiceRoleKey}`;
  if (clients.has(cacheKey)) {
    return clients.get(cacheKey)!;
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error('Supabase configuration missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  const client = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  clients.set(cacheKey, client);
  return client;
}
