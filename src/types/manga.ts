/**
 * Core domain types for the manga archive.
 *
 * These are deliberately independent of AniList's own response shapes —
 * `src/lib/anilist.ts` maps AniList data into this shape, so components
 * never touch the API's schema directly and a future source swap only
 * touches that one mapping file.
 */

export type MangaStatus = "ongoing" | "completed" | "hiatus" | "cancelled";

export interface Manga {
  /** AniList numeric media id, as a string. */
  id: string;
  title: string;
  author: string;
  /** Genre tags, e.g. ["Action", "Fantasy"]. */
  genres: string[];
  status: MangaStatus;
  /** Latest known chapter number; null if AniList hasn't reported one. */
  chapters: number | null;
  /** Community average score out of 10; null if not yet rated. */
  rating: number | null;
  synopsis: string;
  /** First publication year; null if AniList has none on record. */
  year: number | null;
  /**
   * Cover art image URL (AniList CDN). Null if this title has no cover,
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
  /** True for links AniList has confirmed for this exact title; false for generic search-by-title fallbacks. */
  official: boolean;
}

/**
 * A single volume's cover. Currently always empty — AniList only tracks
 * one cover per series, unlike MangaDex which this replaced — kept as a
 * type so the detail view's (currently dormant) volume picker still
 * type-checks against a future source that does provide these.
 */
export interface VolumeCover {
  volume: string | null;
  coverImage: string;
}

export interface GenreSummary {
  id: string;
  name: string;
}
