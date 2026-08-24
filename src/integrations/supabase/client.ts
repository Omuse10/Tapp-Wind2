import { createClient } from "@supabase/supabase-js";

// Publishable (anon) key — safe to expose in frontend code.
export const SUPABASE_URL = "https://hpnqdokddgcvtlcvxnon.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_MKxhXhIW8htRXNY4bYI3iQ_bIY-2yG8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});