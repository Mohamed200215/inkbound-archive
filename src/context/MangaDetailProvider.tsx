import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { MangaDetailContext } from "@/context/manga-detail-context";
import { fetchByIds } from "@/lib/anilist";
import type { Manga } from "@/types/manga";

/**
 * Split out of the main bundle — the detail view (plus the recommendation
 * cards it renders) is real weight most visits never need if a user just
 * browses the grid. Only requested once a title is actually opened; see
 * `everOpened` below for why it then stays mounted for the rest of the
 * session instead of being torn down and re-imported on every close.
 */
const MangaDetailDialog = lazy(() =>
  import("@/components/manga/MangaDetailDialog").then((m) => ({ default: m.MangaDetailDialog })),
);

const QUERY_PARAM = "manga";

function readMangaIdFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get(QUERY_PARAM);
}

/**
 * Makes the currently-open title shareable/bookmarkable as `?manga=<id>`
 * and wires it up to the browser's back/forward buttons, without pulling
 * in a router: opening pushes a history entry, closing either pops it
 * (when we're the ones who pushed it) or just strips the query param
 * (when the dialog was opened from a URL on load — there's no matching
 * "closed" entry to go back to in that case).
 */
export function MangaDetailProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Manga | null>(null);
  const [resolving, setResolving] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const pushedRef = useRef(false);

  const resolveFromId = useCallback(async (id: string) => {
    setEverOpened(true);
    setResolving(true);
    try {
      const [manga] = await fetchByIds([id]);
      setSelected(manga ?? null);
      if (!manga) toast.error("That title couldn't be found.");
    } catch {
      setSelected(null);
      toast.error("Couldn't load that title.");
    } finally {
      setResolving(false);
    }
  }, []);

  useEffect(() => {
    const id = readMangaIdFromUrl();
    if (id) void resolveFromId(id);

    function handlePopState() {
      const currentId = readMangaIdFromUrl();
      if (currentId) {
        void resolveFromId(currentId);
      } else {
        setSelected(null);
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [resolveFromId]);

  const open = useCallback((manga: Manga) => {
    setEverOpened(true);
    setSelected(manga);
    const url = new URL(window.location.href);
    url.searchParams.set(QUERY_PARAM, manga.id);
    pushedRef.current = true;
    window.history.pushState({ mangaId: manga.id }, "", url);
  }, []);

  const close = useCallback(() => {
    setSelected(null);
    if (pushedRef.current && readMangaIdFromUrl()) {
      pushedRef.current = false;
      window.history.back();
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete(QUERY_PARAM);
      window.history.replaceState({}, "", url);
    }
  }, []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <MangaDetailContext.Provider value={value}>
      {children}
      {everOpened && (
        <Suspense fallback={null}>
          <MangaDetailDialog
            manga={selected}
            loading={resolving && !selected}
            onOpenChange={(isOpen) => !isOpen && close()}
          />
        </Suspense>
      )}
    </MangaDetailContext.Provider>
  );
}
