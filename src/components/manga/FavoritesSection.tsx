import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { MangaCard } from "@/components/manga/MangaCard";
import { useFavorites } from "@/hooks/useFavorites";
import { fetchByIds } from "@/lib/anilist";
import type { Manga } from "@/types/manga";

export function FavoritesSection() {
  const { favoriteIds } = useFavorites();
  const [favorited, setFavorited] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(false);

  const ids = Array.from(favoriteIds).sort().join(",");

  useEffect(() => {
    if (!ids) {
      setFavorited([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchByIds(ids.split(","))
      .then((manga) => {
        if (!cancelled) setFavorited(manga);
      })
      .catch(() => {
        if (!cancelled) setFavorited([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  if (!ids) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-black/10 py-16 text-center dark:border-white/10">
        <Heart className="h-8 w-8 text-neutral-300 dark:text-neutral-700" />
        <p className="text-sm text-neutral-500">
          No favourites yet. Tap the heart on any cover to save it here.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <p className="py-12 text-center text-sm text-neutral-500">
        Loading your favourites...
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {favorited.map((title) => (
        <MangaCard key={title.id} manga={title} widthClassName="w-full" />
      ))}
    </div>
  );
}
