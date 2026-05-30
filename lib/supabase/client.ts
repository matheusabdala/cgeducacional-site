import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

/** Cliente Supabase para uso em Client Components (browser). */
export function createClient() {
  return createBrowserClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
  );
}
