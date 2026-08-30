import { useEffect, useMemo, useState } from "react";
import { MangaCard } from "@/components/manga/MangaCard";
import { cn } from "@/lib/utils";
import { fetchByGenre } from "@/lib/anilist";
import type { GenreSummary, Manga, MangaStatus } from "@/types/manga";

type SortOption = "popularity" | "rating" | "newest";

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "popularity", label: "Popularity" },
  { id: "rating", label: "Highest rated" },
  { id: "newest", label: "Newest" },
];

const STATUS_OPTIONS: { id: MangaStatus | "all"; label: string }[] = [
  { id: "all", label: "All statuses" },
  { id: "ongoing", label: "Ongoing" },
  { id: "completed", label: "Completed" },
  { id: "hiatus", label: "Hiatus" },
  { id: "cancelled", label: "Cancelled" },
];

/** AniList already returns titles popularity-sorted, so "Popularity" is a no-op — everything else sorts client-side over whatever's already loaded. */
function sortManga(manga: Manga[], sort: SortOption): Manga[] {
  if (sort === "popularity") return manga;
  const sorted = [...manga];
  if (sort === "rating") {
    sorted.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
  } else {
    sorted.sort((a, b) => (b.year ?? -1) - (a.year ?? -1));
  }
  return sorted;
}

interface GenreSectionProps {
  /** The loaded browse catalog, shown for the "All" chip (no extra fetch). */
  catalog: Manga[];
  /** True while the ~200-title catalog is still loading — only blocks the "All" chip; other genres fetch independently. */
  catalogLoading: boolean;
  genres: GenreSummary[];
}

const ALL_GENRE: GenreSummary = { id: "all", name: "All" };

export function GenreSection({ catalog, catalogLoading, genres }: GenreSectionProps) {
  const [activeGenre, setActiveGenre] = useState<GenreSummary>(ALL_GENRE);
  const [genreResults, setGenreResults] = useState<Manga[]>([]);
  const [genreLoading, setGenreLoading] = useState(false);
  const [sort, setSort] = useState<SortOption>("popularity");
  const [statusFilter, setStatusFilter] = useState<MangaStatus | "all">("all");

  useEffect(() => {
    if (activeGenre.id === "all") return;
    let cancelled = false;
    setGenreLoading(true);
    fetchByGenre(activeGenre.id)
      .then((manga) => {
        if (!cancelled) setGenreResults(manga);
      })
      .catch(() => {
        if (!cancelled) setGenreResults([]);
      })
      .finally(() => {
        if (!cancelled) setGenreLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeGenre]);

  const isAll = activeGenre.id === "all";
  const base = isAll ? catalog : genreResults;
  const loading = isAll ? catalogLoading : genreLoading;

  const visible = useMemo(() => {
    const filtered = statusFilter === "all" ? base : base.filter((m) => m.status === statusFilter);
    return sortManga(filtered, sort);
  }, [base, statusFilter, sort]);

  return (
    <div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[ALL_GENRE, ...genres].map((genre) => (
          <button
            key={genre.id}
            type="button"
            onClick={() => setActiveGenre(genre)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              genre.id === activeGenre.id
                ? "border-teal-500/60 bg-teal-500/15 text-teal-700 dark:border-teal-400/60 dark:bg-teal-400/15 dark:text-teal-300"
                : "border-black/10 bg-black/[0.02] text-neutral-600 hover:border-black/25 hover:text-neutral-900 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-400 dark:hover:border-white/25 dark:hover:text-neutral-200",
            )}
          >
            {genre.name}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <select
          aria-label="Sort by"
          value={sort}
          onChange={(event) => setSort(event.target.value as SortOption)}
          className="rounded-md border border-black/10 bg-black/[0.02] px-2.5 py-1.5 text-xs font-medium text-neutral-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-300"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              Sort: {option.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as MangaStatus | "all")}
          className="rounded-md border border-black/10 bg-black/[0.02] px-2.5 py-1.5 text-xs font-medium text-neutral-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-300"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-neutral-500">
          Loading {activeGenre.name}...
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {visible.map((title) => (
            <MangaCard key={title.id} manga={title} widthClassName="w-full" />
          ))}
        </div>
      )}

      {!loading && visible.length === 0 && (
        <p className="py-12 text-center text-sm text-neutral-500">
          No titles found for {activeGenre.name}.
        </p>
      )}
    </div>
  );
}
