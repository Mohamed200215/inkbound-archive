import { useCallback, useEffect, useState } from "react";
import { fetchCatalog, fetchFeatured, fetchGenres } from "@/lib/anilist";
import type { GenreSummary, Manga } from "@/types/manga";

interface ArchiveDataState {
  catalog: Manga[];
  featured: Manga[];
  genres: GenreSummary[];
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: ArchiveDataState = {
  catalog: [],
  featured: [],
  genres: [],
  loading: true,
  error: null,
};

/**
 * Loads the initial AniList data set: the browse catalog, featured titles,
 * and genre tags. Exposes `retry` since this hits a third-party API that
 * can transiently fail (rate limiting, a network blip) independent of
 * anything wrong with the app itself.
 */
export function useArchiveData(): ArchiveDataState & { retry: () => void } {
  const [state, setState] = useState<ArchiveDataState>(INITIAL_STATE);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    Promise.all([fetchCatalog(200), fetchFeatured(12), fetchGenres()])
      .then(([catalog, featured, genres]) => {
        if (cancelled) return;
        setState({ catalog, featured, genres, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load the archive from AniList.";
        setState({ catalog: [], featured: [], genres: [], loading: false, error: message });
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, retry };
}
