// Server-side Supabase client. Uses the SERVICE ROLE key, which must NEVER be
// exposed to the browser. These functions only run on Vercel (serverless), so
// the key stays on the server. Files starting with "_" are treated as helpers
// by Vercel, not as routable API endpoints.
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // If Supabase isn't configured yet, return null so the app still works
  // (generation works without saving). Endpoints handle the null case.
  if (!url || !key) return null;
  if (cached) return cached;
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
