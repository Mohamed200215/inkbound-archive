import { useEffect, useState } from "react";
import { MangaCard } from "@/components/manga/MangaCard";
import { cn } from "@/lib/utils";
import { fetchByGenre } from "@/lib/mangadex";
import type { GenreSummary, Manga } from "@/types/manga";

interface GenreSectionProps {
  /** The loaded browse catalog, shown for the "All" chip (no extra fetch). */
  catalog: Manga[];
  genres: GenreSummary[];
}

const ALL_GENRE: GenreSummary = { id: "all", name: "All" };

export function GenreSection({ catalog, genres }: GenreSectionProps) {
  const [activeGenre, setActiveGenre] = useState<GenreSummary>(ALL_GENRE);
  const [genreResults, setGenreResults] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeGenre.id === "all") return;
    let cancelled = false;
    setLoading(true);
    fetchByGenre(activeGenre.id)
      .then((manga) => {
        if (!cancelled) setGenreResults(manga);
      })
      .catch(() => {
        if (!cancelled) setGenreResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeGenre]);

  const visible = activeGenre.id === "all" ? catalog : genreResults;

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
