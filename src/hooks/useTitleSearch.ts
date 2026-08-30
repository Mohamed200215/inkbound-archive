import { useEffect, useRef, useState } from "react";
import { searchTitles } from "@/lib/anilist";
import type { Manga } from "@/types/manga";

const DEBOUNCE_MS = 350;

/**
 * Debounced AniList title search, shared between the desktop `SearchBar`
 * and the mobile menu's search field (see `HamburgerMenu`) — the mobile
 * nav needed its own search entry point since the persistent desktop
 * search bar doesn't fit next to the hamburger button at narrow widths.
 */
export function useTitleSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    const thisRequest = ++requestId.current;
    setLoading(true);
    const timer = window.setTimeout(() => {
      searchTitles(trimmed)
        .then((titles) => {
          if (requestId.current === thisRequest) setResults(titles);
        })
        .catch(() => {
          if (requestId.current === thisRequest) setResults([]);
        })
        .finally(() => {
          if (requestId.current === thisRequest) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query]);

  return { query, setQuery, results, loading };
}
