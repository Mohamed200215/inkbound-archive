import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MangaCard } from "@/components/manga/MangaCard";
import { Button } from "@/components/ui/button";
import type { Manga } from "@/types/manga";

interface FeaturedCarouselProps {
  manga: Manga[];
}

const AUTOPLAY_INTERVAL_MS = 5000;

/**
 * Horizontally scrolling, arrow-driven showcase for featured/trending
 * titles. Auto-advances on an interval and pauses whenever the visitor is
 * interacting with it (hover, focus, touch, or manual drag).
 */
export function FeaturedCarousel({ manga }: FeaturedCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  const scrollByCards = useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;

    const card = track.querySelector<HTMLElement>("[data-carousel-card]");
    const step = card ? card.offsetWidth + 20 : track.clientWidth * 0.8;

    const atEnd =
      track.scrollLeft + track.clientWidth >= track.scrollWidth - step / 2;
    const atStart = track.scrollLeft <= step / 2;

    if (direction === 1 && atEnd) {
      track.scrollTo({ left: 0, behavior: "smooth" });
    } else if (direction === -1 && atStart) {
      track.scrollTo({ left: track.scrollWidth, behavior: "smooth" });
    } else {
      track.scrollBy({ left: direction * step, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    if (paused || manga.length < 2) return;
    const id = window.setInterval(() => scrollByCards(1), AUTOPLAY_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused, manga.length, scrollByCards]);

  if (manga.length === 0) return null;

  return (
    <div
      className="group/carousel relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <button
        type="button"
        aria-label="Scroll featured manga left"
        onClick={() => scrollByCards(-1)}
        className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/70 p-2 text-neutral-200 backdrop-blur-sm transition hover:bg-black/90 sm:flex md:-left-5"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {manga.map((title) => (
          <div
            key={title.id}
            data-carousel-card
            className="snap-start"
          >
            <MangaCard manga={title} widthClassName="w-[70vw] max-w-72 sm:w-64 lg:w-72" />
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Scroll featured manga right"
        onClick={() => scrollByCards(1)}
        className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/70 p-2 text-neutral-200 backdrop-blur-sm transition hover:bg-black/90 sm:flex md:-right-5"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Mobile-only affordance since the side arrows are hidden below `sm` */}
      <div className="mt-3 flex justify-center gap-4 sm:hidden">
        <Button variant="outline" size="icon" onClick={() => scrollByCards(-1)} aria-label="Previous">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => scrollByCards(1)} aria-label="Next">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
