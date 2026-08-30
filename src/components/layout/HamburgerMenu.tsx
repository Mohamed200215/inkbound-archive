import { BookMarked, Heart, Info, Loader2, Menu, Scale, Search, SortAsc, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { useMangaDetail } from "@/hooks/useMangaDetail";
import { useTitleSearch } from "@/hooks/useTitleSearch";
import type { Manga } from "@/types/manga";

const NAV_ITEMS = [
  { id: "featured", label: "Featured", icon: BookMarked },
  { id: "genres", label: "Genres", icon: SortAsc },
  { id: "a-z", label: "A–Z", icon: SortAsc },
  { id: "favourites", label: "Favourites", icon: Heart },
  { id: "about", label: "About", icon: Info },
  { id: "legal", label: "Terms & privacy", icon: Scale },
] as const;

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const { favoriteIds } = useFavorites();
  const { user, signOut } = useAuth();
  const { open: openDetail } = useMangaDetail();
  const { query, setQuery, results, loading } = useTitleSearch();

  function handleNavigate(id: string) {
    setOpen(false);
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    });
  }

  function handleSelect(title: Manga) {
    setOpen(false);
    setQuery("");
    openDetail(title);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          className="text-neutral-700 hover:bg-black/5 hover:text-neutral-900 dark:text-neutral-200 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="border-black/10 bg-white text-neutral-900 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-100">
        <SheetHeader>
          <SheetTitle className="text-neutral-900 dark:text-neutral-100">Menu</SheetTitle>
          {user ? (
            <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
              <span className="truncate">Signed in as {user.email}</span>
              <button
                type="button"
                onClick={() => void signOut()}
                className="shrink-0 font-medium text-teal-600 hover:underline dark:text-teal-400"
              >
                Log out
              </button>
            </div>
          ) : (
            <p className="text-xs text-neutral-500">
              Browsing as a guest — log in to sync favourites across devices.
            </p>
          )}
        </SheetHeader>

        {/* Mirrors the navbar's SearchBar, which hides below `sm:` since it
            doesn't fit next to this button at mobile widths — this is
            mobile's only entry point to search. */}
        <div className="px-4">
          <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-black/[0.03] px-3 py-1.5 focus-within:border-teal-500/50 dark:border-white/10 dark:bg-white/[0.04] dark:focus-within:border-teal-400/50">
            <Search className="h-4 w-4 shrink-0 text-neutral-500" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && results[0]) handleSelect(results[0]);
              }}
              placeholder="Search titles..."
              aria-label="Search manga titles"
              className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-500 outline-none dark:text-neutral-100"
            />
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-neutral-500" />
            ) : (
              query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                  className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )
            )}
          </div>

          {query.trim() && (
            <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-black/10 dark:border-white/10">
              {loading && results.length === 0 ? (
                <p className="px-3 py-2.5 text-sm text-neutral-500">Searching...</p>
              ) : results.length === 0 ? (
                <p className="px-3 py-2.5 text-sm text-neutral-500">No titles match "{query}".</p>
              ) : (
                <ul className="py-1">
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

        <nav className="flex flex-col gap-1 px-4">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleNavigate(id)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-neutral-700 transition-colors hover:bg-black/5 dark:text-neutral-200 dark:hover:bg-white/5"
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-neutral-500" />
                {label}
              </span>
              {id === "favourites" && favoriteIds.size > 0 && (
                <span className="rounded-full bg-teal-400/15 px-2 py-0.5 text-xs font-semibold text-teal-300">
                  {favoriteIds.size}
                </span>
              )}
            </button>
          ))}
        </nav>

        <SheetFooter>
          <ThemeToggle className="w-full" />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
