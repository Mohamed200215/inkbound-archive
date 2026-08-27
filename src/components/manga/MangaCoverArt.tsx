import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Manga } from "@/types/manga";

interface MangaCoverArtProps {
  manga: Manga;
  className?: string;
}

/** Mixes a hex color toward black (negative percent) or white (positive). */
function shade(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const target = percent < 0 ? 0 : 255;
  const amount = Math.abs(percent);
  const mix = (channel: number) => Math.round(channel + (target - channel) * amount);

  const r = mix((num >> 16) & 0xff);
  const g = mix((num >> 8) & 0xff);
  const b = mix(num & 0xff);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Procedurally generated stand-in cover art, used until the API supplies
 * real cover images. Each title gets a bold duotone field in its accent
 * color plus a halftone screentone texture (a nod to manga print
 * production), so placeholders read as "manga covers" rather than empty
 * tiles.
 */
export function MangaCoverArt({ manga, className }: MangaCoverArtProps) {
  const mark = useMemo(() => manga.title.trim().charAt(0).toUpperCase(), [manga.title]);
  const deep = useMemo(() => shade(manga.accent, -0.55), [manga.accent]);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        background: `linear-gradient(155deg, ${manga.accent} 0%, ${deep} 60%, #0a0a0c 100%)`,
      }}
      aria-hidden="true"
    >
      {/* Screentone / halftone texture */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-soft-light"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.9) 1.4px, transparent 1.6px)",
          backgroundSize: "8px 8px",
        }}
      />
      {/* Diagonal accent bar */}
      <div className="absolute -left-8 top-8 h-1 w-[140%] -rotate-[14deg] bg-white/30" />

      {/* Oversized initial watermark */}
      <span
        className="absolute -bottom-8 -right-3 font-black leading-none tracking-tighter text-white/20 select-none"
        style={{ fontSize: "8.5rem" }}
      >
        {mark}
      </span>

      {/* Bottom scrim so overlaid title/author text stays legible */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
    </div>
  );
}
