import { Loader2, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMangaDetail } from "@/hooks/useMangaDetail";
import { cn } from "@/lib/utils";
import { searchTitles } from "@/lib/anilist";
import type { Manga } from "@/types/manga";

interface SearchBarProps {
  className?: string;
}

const DEBOUNCE_MS = 350;

export function SearchBar({ className }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(false);
  const { open: openDetail } = useMangaDetail();
  const containerRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(title: Manga) {
    setOpen(false);
    setQuery("");
    openDetail(title);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-black/[0.03] px-3 py-1.5 focus-within:border-teal-500/50 dark:border-white/10 dark:bg-white/[0.04] dark:focus-within:border-teal-400/50">
        <Search className="h-4 w-4 shrink-0 text-neutral-500" />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              (event.target as HTMLInputElement).blur();
            } else if (event.key === "Enter" && results[0]) {
              handleSelect(results[0]);
            }
          }}
          placeholder="Search titles..."
          aria-label="Search manga titles"
          className="w-32 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-500 outline-none sm:w-48 dark:text-neutral-100"
        />
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-neutral-500" />
        ) : (
          query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                setOpen(false);
              }}
              className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )
        )}
      </div>

      {open && query.trim() && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 overflow-hidden rounded-lg border border-black/10 bg-white shadow-xl shadow-black/10 dark:border-white/10 dark:bg-neutral-950 dark:shadow-black/50">
          {loading && results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-neutral-500">Searching...</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-neutral-500">
              No titles match "{query}".
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((title) => (
                <li key={title.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(title)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <span
                      className="h-8 w-6 shrink-0 overflow-hidden rounded-sm bg-cover bg-center"
                      style={{
                        backgroundColor: title.accent,
                        backgroundImage: title.coverImage ? `url(${title.coverImage})` : undefined,
                      }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-neutral-900 dark:text-neutral-100">
                        {title.title}
                      </span>
                      <span className="block truncate text-xs text-neutral-500">
                        {title.genres.join(", ")}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
