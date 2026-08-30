import { ExternalLink, Heart, Loader2, Share2, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MangaCard } from "@/components/manga/MangaCard";
import { MangaCoverImage } from "@/components/manga/MangaCoverImage";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useFavorites } from "@/hooks/useFavorites";
import { fetchRecommendations, fetchVolumeCovers } from "@/lib/anilist";
import { cn } from "@/lib/utils";
import type { Manga, VolumeCover } from "@/types/manga";

const STATUS_LABEL: Record<Manga["status"], string> = {
  ongoing: "Ongoing",
  completed: "Completed",
  hiatus: "On Hiatus",
  cancelled: "Cancelled",
};

interface MangaDetailDialogProps {
  manga: Manga | null;
  /** True while resolving a title from a `?manga=` URL param on load — keeps the dialog open with a spinner instead of flashing closed-then-open. */
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The expanded view for a title: cover (with a per-volume picker when the
 * data source has volume-specific art) on one side, series info and
 * "where to read/buy" links on the other. Opened from any manga card
 * via `useMangaDetail()`. AniList only tracks one cover per series, so
 * `fetchVolumeCovers` always resolves empty and the picker doesn't render.
 *
 * `MangaDetailProvider` mirrors the open title into a `?manga=` URL param,
 * so every title here is shareable/bookmarkable — the "Copy link" button
 * just surfaces that.
 */
export function MangaDetailDialog({ manga, loading = false, onOpenChange }: MangaDetailDialogProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [volumes, setVolumes] = useState<VolumeCover[]>([]);
  const [volumesLoading, setVolumesLoading] = useState(false);
  const [selectedVolume, setSelectedVolume] = useState<VolumeCover | null>(null);
  const [recommendations, setRecommendations] = useState<Manga[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);

  useEffect(() => {
    setSelectedVolume(null);
    if (!manga) {
      setVolumes([]);
      setRecommendations([]);
      return;
    }

    let cancelled = false;

    setVolumesLoading(true);
    fetchVolumeCovers(manga.id)
      .then((covers) => {
        if (!cancelled) setVolumes(covers);
      })
      .catch(() => {
        if (!cancelled) setVolumes([]);
      })
      .finally(() => {
        if (!cancelled) setVolumesLoading(false);
      });

    setRecsLoading(true);
    fetchRecommendations(manga.id)
      .then((recs) => {
        if (!cancelled) setRecommendations(recs);
      })
      .catch(() => {
        if (!cancelled) setRecommendations([]);
      })
      .finally(() => {
        if (!cancelled) setRecsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [manga]);

  if (!manga && !loading) return null;

  async function handleCopyLink() {
    if (!manga) return;
    const url = new URL(window.location.href);
    url.searchParams.set("manga", manga.id);
    try {
      await navigator.clipboard.writeText(url.toString());
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  }

  const favorited = manga ? isFavorite(manga.id) : false;
  const displayedManga = manga && selectedVolume ? { ...manga, coverImage: selectedVolume.coverImage } : manga;

  return (
    <Dialog open={Boolean(manga) || loading} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-h-[85vh] w-full max-w-3xl gap-0 overflow-hidden p-0 sm:max-h-[80vh] sm:max-w-3xl"
      >
        <DialogTitle className="sr-only">{manga?.title ?? "Loading title"}</DialogTitle>

        {!manga || !displayedManga ? (
          <div className="flex h-64 items-center justify-center gap-2 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading title...
          </div>
        ) : (
          <div className="flex max-h-[85vh] flex-col overflow-y-auto sm:max-h-[80vh] sm:flex-row sm:overflow-hidden">
            {/* Cover + volume picker */}
            <div className="shrink-0 border-b border-black/10 bg-neutral-100 p-5 dark:border-white/10 dark:bg-neutral-900 sm:w-64 sm:overflow-y-auto sm:border-b-0 sm:border-r">
              <div className="relative mx-auto aspect-[2/3] w-40 overflow-hidden rounded-lg border border-black/10 shadow-md dark:border-white/10 sm:w-full">
                <MangaCoverImage manga={displayedManga} className="absolute inset-0" />
              </div>

              {volumesLoading && (
                <p className="mt-3 text-center text-xs text-neutral-500 sm:text-left">
                  Loading volumes...
                </p>
              )}

              {volumes.length > 0 && (
                <div className="mt-3">
                  <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-neutral-500 sm:text-left">
                    Volumes
                  </p>
                  <div className="mt-1.5 flex flex-wrap justify-center gap-1 sm:justify-start">
                    <button
                      type="button"
                      onClick={() => setSelectedVolume(null)}
                      className={cn(
                        "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                        selectedVolume === null
                          ? "border-teal-500/60 bg-teal-500/15 text-teal-700 dark:border-teal-400/60 dark:bg-teal-400/15 dark:text-teal-300"
                          : "border-black/10 text-neutral-600 hover:border-black/25 dark:border-white/10 dark:text-neutral-400 dark:hover:border-white/25",
                      )}
                    >
                      Series
                    </button>
                    {volumes.map((vol) => (
                      <button
                        key={`${vol.volume ?? "none"}-${vol.coverImage}`}
                        type="button"
                        onClick={() => setSelectedVolume(vol)}
                        className={cn(
                          "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                          selectedVolume === vol
                            ? "border-teal-500/60 bg-teal-500/15 text-teal-700 dark:border-teal-400/60 dark:bg-teal-400/15 dark:text-teal-300"
                            : "border-black/10 text-neutral-600 hover:border-black/25 dark:border-white/10 dark:text-neutral-400 dark:hover:border-white/25",
                        )}
                      >
                        Vol. {vol.volume ?? "—"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1 overflow-y-auto p-6">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-xl font-bold leading-tight text-neutral-900 dark:text-neutral-50">
                  {manga.title}
                </h2>
                <button
                  type="button"
                  onClick={() => void handleCopyLink()}
                  aria-label="Copy link to this title"
                  title="Copy link"
                  className="shrink-0 rounded-full p-1.5 text-neutral-500 transition-colors hover:bg-black/5 hover:text-neutral-900 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-neutral-500">{manga.author}</p>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {manga.rating !== null ? manga.rating.toFixed(1) : "—"}
                </span>
                <span>{STATUS_LABEL[manga.status]}</span>
                {manga.year !== null && <span>{manga.year}</span>}
                {manga.chapters !== null && <span>Ch. {manga.chapters}</span>}
                {selectedVolume && <span>Viewing Vol. {selectedVolume.volume ?? "—"} cover</span>}
              </div>

              <button
                type="button"
                onClick={() => toggleFavorite(manga.id)}
                className={cn(
                  "mt-3 flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  favorited
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : "border-black/10 text-neutral-600 hover:border-black/25 dark:border-white/10 dark:text-neutral-300 dark:hover:border-white/25",
                )}
              >
                <Heart className={cn("h-3.5 w-3.5", favorited && "fill-current")} />
                {favorited ? "Favourited" : "Add to favourites"}
              </button>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {manga.genres.map((genre) => (
                  <Badge
                    key={genre}
                    className="border-transparent text-[10px]"
                    style={{ backgroundColor: `${manga.accent}22`, color: manga.accent }}
                  >
                    {genre}
                  </Badge>
                ))}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {manga.synopsis}
              </p>

              <div className="mt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Where to read or buy
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {manga.buyLinks.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                        link.official
                          ? "border-teal-500/40 text-teal-700 hover:border-teal-500/70 dark:border-teal-400/30 dark:text-teal-300 dark:hover:border-teal-400/60"
                          : "border-black/10 text-neutral-600 hover:border-black/25 dark:border-white/10 dark:text-neutral-400 dark:hover:border-white/25",
                      )}
                    >
                      {link.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>

              {(recsLoading || recommendations.length > 0) && (
                <div className="mt-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    You might also like
                  </h3>
                  {recsLoading ? (
                    <p className="mt-2 text-xs text-neutral-500">Loading...</p>
                  ) : (
                    <div className="-mx-1 mt-2 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {recommendations.map((rec) => (
                        <MangaCard key={rec.id} manga={rec} widthClassName="w-24" />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
