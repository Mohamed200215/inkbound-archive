import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * True once real Supabase credentials are configured. Auth/favourites
 * features check this and fall back to guest (localStorage-only) mode
 * when it's false, so the app still runs before `.env` is filled in.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set — " +
      "login and cross-device favourites are disabled. See .env.example.",
  );
}

/**
 * Always defined so imports don't need to null-check, but points at a
 * placeholder host when unconfigured — never actually called in that
 * state because callers check `isSupabaseConfigured` first.
 */
export const supabase = createClient(
  url ?? "https://placeholder.supabase.co",
  anonKey ?? "placeholder-anon-key",
);
