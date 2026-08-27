import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { FavoritesContext } from "@/context/favorites-context";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const STORAGE_KEY = "manga-archive:favorites";

function loadLocalFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Set();
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Favourites live in localStorage for guests. Signing in merges any guest
 * favourites into the account (once) and switches Supabase into the
 * source of truth; signing out reverts to localStorage.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(loadLocalFavorites);
  const syncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(favoriteIds)));
    }
  }, [favoriteIds, user]);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      syncedUserId.current = null;
      return;
    }
    if (syncedUserId.current === user.id) return;
    syncedUserId.current = user.id;

    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("manga_id")
        .eq("user_id", user.id);

      if (error) {
        toast.error("Couldn't load your saved favourites", { description: error.message });
        return;
      }

      const remoteIds = new Set((data ?? []).map((row) => row.manga_id as string));
      const localOnlyIds = Array.from(loadLocalFavorites()).filter((id) => !remoteIds.has(id));

      if (localOnlyIds.length > 0) {
        const { error: insertError } = await supabase
          .from("favorites")
          .insert(localOnlyIds.map((mangaId) => ({ user_id: user.id, manga_id: mangaId })));
        if (!insertError) {
          for (const id of localOnlyIds) remoteIds.add(id);
        }
      }

      if (!cancelled) {
        setFavoriteIds(remoteIds);
        window.localStorage.removeItem(STORAGE_KEY);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggleFavorite = useCallback(
    (id: string) => {
      const willFavorite = !favoriteIds.has(id);

      setFavoriteIds((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });

      if (!user || !isSupabaseConfigured) return;

      const mutation = willFavorite
        ? supabase.from("favorites").insert({ user_id: user.id, manga_id: id })
        : supabase.from("favorites").delete().eq("user_id", user.id).eq("manga_id", id);

      mutation.then(({ error }) => {
        if (!error) return;
        toast.error("Couldn't sync that favourite", { description: error.message });
        // Roll back the optimistic update since the write failed.
        setFavoriteIds((current) => {
          const next = new Set(current);
          if (willFavorite) next.delete(id);
          else next.add(id);
          return next;
        });
      });
    },
    [user, favoriteIds],
  );

  const isFavorite = useCallback((id: string) => favoriteIds.has(id), [favoriteIds]);

  const value = useMemo(
    () => ({ favoriteIds, isFavorite, toggleFavorite }),
    [favoriteIds, isFavorite, toggleFavorite],
  );

  return (
    <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
  );
}
