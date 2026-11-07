/**
 * Pembungkus `createClient` Supabase untuk Node 20.
 *
 * `@supabase/supabase-js` 2.118 mewajibkan WebSocket native (Node 22+).
 * API ini hanya memakai Postgres, Storage, dan Auth — tanpa realtime — jadi
 * cukup beri implementasi WebSocket dari paket `ws` agar tetap jalan.
 */
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const DEFAULT_OPTIONS = {
  auth: { persistSession: false, autoRefreshToken: false },
};

export function createSupabaseClient(url, key, options = {}) {
  return createClient(url, key, {
    ...DEFAULT_OPTIONS,
    ...options,
    auth: { ...DEFAULT_OPTIONS.auth, ...(options.auth || {}) },
    realtime: { transport: WebSocket, ...(options.realtime || {}) },
  });
}
