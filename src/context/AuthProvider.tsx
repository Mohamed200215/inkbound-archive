import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { AuthContext } from "@/context/auth-context";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const NOT_CONFIGURED_ERROR =
  "Login isn't set up yet — this project needs a Supabase URL and anon key (see .env.example).";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      async signUp(email: string, password: string) {
        if (!isSupabaseConfigured) {
          return { error: NOT_CONFIGURED_ERROR, needsEmailConfirmation: false };
        }
        const { data, error } = await supabase.auth.signUp({ email, password });
        return {
          error: error?.message ?? null,
          needsEmailConfirmation: !error && !data.session,
        };
      },
      async signIn(email: string, password: string) {
        if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR };
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },
      async signOut() {
        if (!isSupabaseConfigured) return;
        await supabase.auth.signOut();
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
