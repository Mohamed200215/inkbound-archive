import { createContext } from "react";
import type { User } from "@supabase/supabase-js";

export interface AuthContextValue {
  user: User | null;
  /** True while the initial session is being restored on app load. */
  loading: boolean;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
