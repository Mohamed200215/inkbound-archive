import { BookMarked, Heart, Info, Menu, SortAsc } from "lucide-react";
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

const NAV_ITEMS = [
  { id: "featured", label: "Featured", icon: BookMarked },
  { id: "genres", label: "Genres", icon: SortAsc },
  { id: "a-z", label: "A–Z", icon: SortAsc },
  { id: "favourites", label: "Favourites", icon: Heart },
  { id: "about", label: "About", icon: Info },
] as const;

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const { favoriteIds } = useFavorites();
  const { user, signOut } = useAuth();

  function handleNavigate(id: string) {
    setOpen(false);
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
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
