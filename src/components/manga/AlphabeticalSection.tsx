import { useMemo } from "react";
import { MangaCard } from "@/components/manga/MangaCard";
import type { Manga } from "@/types/manga";

interface AlphabeticalSectionProps {
  manga: Manga[];
  /** True while the ~200-title catalog is still loading. */
  loading?: boolean;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function AlphabeticalSection({ manga, loading = false }: AlphabeticalSectionProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, Manga[]>();
    for (const title of [...manga].sort((a, b) => a.title.localeCompare(b.title))) {
      const letter = /[A-Z]/i.test(title.title.charAt(0))
        ? title.title.charAt(0).toUpperCase()
        : "#";
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(title);
    }
    return map;
  }, [manga]);

  const availableLetters = useMemo(
    () => new Set(grouped.keys()),
    [grouped],
  );

  if (loading) {
    return (
      <p className="py-12 text-center text-sm text-neutral-500">
        Loading the full catalog...
      </p>
    );
  }

  return (
    <div>
      <nav
        aria-label="Jump to letter"
        className="sticky top-16 z-10 -mx-4 mb-8 flex flex-wrap gap-1 border-y border-black/5 bg-neutral-50/90 px-4 py-3 backdrop-blur-sm sm:mx-0 sm:rounded-lg sm:border dark:border-white/5 dark:bg-neutral-950/90"
      >
        {LETTERS.map((letter) => {
          const available = availableLetters.has(letter);
          return (
            <a
              key={letter}
              href={available ? `#az-${letter}` : undefined}
              aria-disabled={!available}
              className={
                available
                  ? "flex h-7 w-7 items-center justify-center rounded text-xs font-semibold text-neutral-700 transition-colors hover:bg-teal-500/15 hover:text-teal-700 dark:text-neutral-300 dark:hover:bg-teal-400/15 dark:hover:text-teal-300"
                  : "flex h-7 w-7 items-center justify-center rounded text-xs font-semibold text-neutral-300 dark:text-neutral-700"
              }
            >
              {letter}
            </a>
          );
        })}
      </nav>

      <div className="space-y-10">
        {Array.from(grouped.entries()).map(([letter, titles]) => (
          <section key={letter} id={`az-${letter}`} className="scroll-mt-32">
            <h3 className="mb-4 text-lg font-bold text-neutral-800 dark:text-neutral-200">
              {letter}
              <span className="ml-2 text-xs font-normal text-neutral-500">
                {titles.length} title{titles.length === 1 ? "" : "s"}
              </span>
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {titles.map((title) => (
                <MangaCard key={title.id} manga={title} widthClassName="w-full" />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
