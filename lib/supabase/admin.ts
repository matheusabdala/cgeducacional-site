import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "@/lib/env";

let client: SupabaseClient | null = null;

/**
 * Cliente Supabase com a service role (ignora RLS). SÓ no servidor — hoje
 * usado apenas pelo Storage do módulo de assinatura. Nunca exponha ao browser.
 */
export function createAdminClient(): SupabaseClient {
  if (!client) {
    client = createClient(publicEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
