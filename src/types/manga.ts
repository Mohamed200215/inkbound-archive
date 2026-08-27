/**
 * Core domain types for the manga archive.
 *
 * These are deliberately independent of MangaDex's own response shapes —
 * `src/lib/mangadex.ts` maps MangaDex data into this shape, so components
 * never touch the API's schema directly and a future source swap only
 * touches that one mapping file.
 */

export type MangaStatus = "ongoing" | "completed" | "hiatus" | "cancelled";

export interface Manga {
  /** MangaDex UUID. */
  id: string;
  title: string;
  author: string;
  /** Genre tags, e.g. ["Action", "Fantasy"]. */
  genres: string[];
  status: MangaStatus;
  /** Latest known chapter number; null if MangaDex hasn't reported one. */
  chapters: number | null;
  /** Bayesian-weighted community rating out of 10; null if not yet rated. */
  rating: number | null;
  synopsis: string;
  /** First publication year; null if MangaDex has none on record. */
  year: number | null;
  /**
   * Cover art image URL (MangaDex CDN). Null if this title has no cover,
   * in which case the UI falls back to a generated placeholder tile.
   */
  coverImage: string | null;
  /**
   * Hex accent color driving the generated placeholder tile — used as a
   * fallback while the real cover loads or if it fails/is missing.
   * Derived deterministically from the manga's id.
   */
  accent: string;
  /** Where to legally read or buy this title. Always has at least the generic fallback links. */
  buyLinks: BuyLink[];
}

export interface BuyLink {
  label: string;
  url: string;
  /** True for links MangaDex has confirmed for this exact title; false for generic search-by-title fallbacks. */
  official: boolean;
}

/** A single volume's cover, fetched on demand when a title's detail view opens. */
export interface VolumeCover {
  /** Volume number as MangaDex reports it (e.g. "1", "12"); null if uncategorized. */
  volume: string | null;
  coverImage: string;
}

export interface GenreSummary {
  id: string;
  name: string;
}
