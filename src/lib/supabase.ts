import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const localSupabaseUrl = import.meta.env.LOCAL_SUPABASE_URL || process.env.LOCAL_SUPABASE_URL;

function localPostgrestFetch(input: RequestInfo | URL, init?: RequestInit) {
  const sourceUrl = input instanceof Request ? input.url : String(input);
  const url = new URL(sourceUrl);
  url.pathname = url.pathname.replace(/^\/rest\/v1\/?/, '/');

  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
  headers.delete('apikey');
  headers.delete('authorization');

  return fetch(url, {
    ...init,
    headers,
  });
}

export const supabasePublicServer = (localSupabaseUrl || supabaseUrl) && supabaseAnonKey
  ? createClient(localSupabaseUrl || supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: localSupabaseUrl ? { fetch: localPostgrestFetch } : undefined,
      realtime: { transport: WebSocket },
    })
  : null;

export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
      realtime: { transport: WebSocket },
    })
  : null;
