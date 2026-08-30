import { Heart, Star } from "lucide-react";
import { MangaCoverImage } from "@/components/manga/MangaCoverImage";
import { Badge } from "@/components/ui/badge";
import { useFavorites } from "@/hooks/useFavorites";
import { useMangaDetail } from "@/hooks/useMangaDetail";
import { cn } from "@/lib/utils";
import type { Manga } from "@/types/manga";

const STATUS_LABEL: Record<Manga["status"], string> = {
  ongoing: "Ongoing",
  completed: "Completed",
  hiatus: "On Hiatus",
  cancelled: "Cancelled",
};

interface MangaCardProps {
  manga: Manga;
  className?: string;
  /** Fixed width; omit to let the card fill its grid/flex cell. */
  widthClassName?: string;
}

export function MangaCard({ manga, className, widthClassName }: MangaCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { open } = useMangaDetail();
  const favorited = isFavorite(manga.id);

  return (
    <article
      id={`manga-${manga.id}`}
      className={cn(
        "group relative shrink-0 scroll-mt-28 rounded-lg transition-shadow duration-500",
        widthClassName,
        className,
      )}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-white/10 bg-neutral-950 shadow-lg shadow-black/40 transition-transform duration-300 group-hover:-translate-y-1">
        <button
          type="button"
          onClick={() => open(manga)}
          aria-label={`View details for ${manga.title}`}
          className="absolute inset-0 h-full w-full cursor-pointer text-left"
        >
          <MangaCoverImage manga={manga} className="absolute inset-0" />

          <Badge
            variant="outline"
            className="absolute left-2 top-2 border-white/20 bg-black/60 text-[10px] font-semibold uppercase tracking-wide text-neutral-200 backdrop-blur-sm"
          >
            {STATUS_LABEL[manga.status]}
          </Badge>

          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-3">
            <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-white">
              {manga.title}
            </h3>
            {manga.author !== "Unknown" && (
              <p className="text-xs text-neutral-400">{manga.author}</p>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1 text-xs font-medium text-amber-400">
                <Star className="h-3 w-3 fill-amber-400" />
                {manga.rating !== null ? manga.rating.toFixed(1) : "—"}
              </div>
              <span className="text-[11px] text-neutral-500">
                {manga.chapters !== null ? `Ch. ${manga.chapters}` : "—"}
              </span>
            </div>
          </div>

          {/* Hover-revealed synopsis */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-black/85 p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div className="flex flex-wrap gap-1 pb-2">
              {manga.genres.map((genre) => (
                <Badge
                  key={genre}
                  className="border-transparent text-[10px]"
                  style={{ backgroundColor: `${manga.accent}33`, color: manga.accent }}
                >
                  {genre}
                </Badge>
              ))}
            </div>
            <p className="line-clamp-5 text-xs leading-relaxed text-neutral-200">
              {manga.synopsis}
            </p>
          </div>
        </button>

        <button
          type="button"
          aria-pressed={favorited}
          aria-label={favorited ? `Remove ${manga.title} from favourites` : `Add ${manga.title} to favourites`}
          onClick={() => toggleFavorite(manga.id)}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm transition-colors hover:bg-black/80"
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              favorited ? "fill-rose-500 text-rose-500" : "text-neutral-200",
            )}
          />
        </button>
      </div>
    </article>
  );
}
