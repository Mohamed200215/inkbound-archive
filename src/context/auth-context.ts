import { createContext } from "react";
import type { User } from "@supabase/supabase-js";

export interface AuthContextValue {
  user: User | null;
  /** True while the initial session is being restored on app load. */
  loading: boolean;
  /** True once Supabase has confirmed a password-recovery link was clicked — the app should prompt for a new password. */
  passwordRecovery: boolean;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  /** Dismisses the recovery prompt without changing the password (e.g. the user closes the dialog). */
  clearPasswordRecovery: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
