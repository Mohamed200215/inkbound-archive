import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { AuthContext } from "@/context/auth-context";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const NOT_CONFIGURED_ERROR =
  "Login isn't set up yet — this project needs a Supabase URL and anon key (see .env.example).";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Supabase redirects here after a password-reset email link is clicked,
    // establishing a temporary "recovery" session and firing this event —
    // that's the app's cue to prompt for a new password.
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const clearPasswordRecovery = useCallback(() => setPasswordRecovery(false), []);

  const value = useMemo(
    () => ({
      user,
      loading,
      passwordRecovery,
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
      async resetPassword(email: string) {
        if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR };
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        return { error: error?.message ?? null };
      },
      async updatePassword(newPassword: string) {
        if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_ERROR };
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (!error) setPasswordRecovery(false);
        return { error: error?.message ?? null };
      },
      clearPasswordRecovery,
    }),
    [user, loading, passwordRecovery, clearPasswordRecovery],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
