import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchCatalog, fetchFeatured, fetchGenres } from "@/lib/anilist";
import type { GenreSummary, Manga } from "@/types/manga";

interface ArchiveDataState {
  catalog: Manga[];
  /** True until the ~200-title catalog fetch resolves — independent of `loading`, see below. */
  catalogLoading: boolean;
  featured: Manga[];
  genres: GenreSummary[];
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: ArchiveDataState = {
  catalog: [],
  catalogLoading: true,
  featured: [],
  genres: [],
  loading: true,
  error: null,
};

/**
 * Loads the initial AniList data set. `featured` + `genres` are cheap
 * (small, fast queries) and gate `loading` — the splash screen and page
 * shell no longer wait on the full catalog. The ~200-title catalog fetch
 * is comparatively expensive (AniList takes noticeably longer per title
 * at that volume) and resolves independently via `catalogLoading`, which
 * only the catalog-dependent sections (genre "All" tab, A–Z index) block
 * on — so the page becomes usable in the time the fast path takes, not
 * however long the full catalog happens to take.
 *
 * Exposes `retry` since this hits a third-party API that can transiently
 * fail (rate limiting, a network blip) independent of anything wrong with
 * the app itself.
 */
export function useArchiveData(): ArchiveDataState & { retry: () => void } {
  const [state, setState] = useState<ArchiveDataState>(INITIAL_STATE);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ ...INITIAL_STATE });

    Promise.all([fetchFeatured(12), fetchGenres()])
      .then(([featured, genres]) => {
        if (cancelled) return;
        setState((prev) => ({ ...prev, featured, genres, loading: false }));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load the archive from AniList.";
        setState((prev) => ({ ...prev, loading: false, catalogLoading: false, error: message }));
      });

    fetchCatalog(200)
      .then((catalog) => {
        if (cancelled) return;
        setState((prev) => ({ ...prev, catalog, catalogLoading: false }));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState((prev) => ({ ...prev, catalogLoading: false }));
        const message = err instanceof Error ? err.message : "Failed to load the full catalog.";
        toast.error("Couldn't load the full catalog", { description: message });
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, retry };
}
