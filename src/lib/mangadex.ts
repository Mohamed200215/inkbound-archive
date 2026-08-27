import { Cover as MDCover, Manga as MDManga, Tag as MDTag, setGlobalLocale } from "mangadex-full-api";
import type { BuyLink, GenreSummary, Manga, MangaStatus, VolumeCover } from "@/types/manga";

setGlobalLocale("en");

/**
 * Curated accent palette used to color a title's generated placeholder
 * cover (shown while the real MangaDex cover loads, or if it's missing).
 * Picked deterministically from the manga's id so a given title always
 * gets the same accent across sessions.
 */
const ACCENT_PALETTE = [
  "#e63946",
  "#3a86ff",
  "#f59e0b",
  "#06b6d4",
  "#14b8a6",
  "#f97316",
  "#ec4899",
  "#a855f7",
  "#22c55e",
  "#f43f5e",
];

function accentForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return ACCENT_PALETTE[Math.abs(hash) % ACCENT_PALETTE.length];
}

/**
 * MangaDex serves cover art from a dedicated CDN host. The library's own
 * `Cover.url` getter points at `mangadex.org` (the web app, not the CDN),
 * which 404s for direct image loads — so this builds the correct URL
 * from the cover's file name instead of using that getter.
 * @see https://api.mangadex.org/docs/04-chapter/covers/
 */
function coverUrl(mangaId: string, fileName: string, size: 256 | 512 = 256): string {
  return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}.${size}.jpg`;
}

/** Strips MangaDex's markdown/BBCode description formatting down to plain text. */
function cleanSynopsis(raw: string): string {
  const firstParagraph = raw.split(/\r?\n\s*\r?\n/)[0] ?? raw;
  return firstParagraph
    .replace(/\[\/?[a-z=]+\]/gi, "")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * At least one Amazon + one BookWalker entry is always returned (as a
 * title search on that store if MangaDex has no confirmed official link),
 * so the "buy" section is never empty.
 */
function buildBuyLinks(mdManga: MDManga): BuyLink[] {
  const query = encodeURIComponent(mdManga.localTitle);
  const links: BuyLink[] = [];

  if (mdManga.links.amazon) {
    links.push({ label: "Amazon", url: mdManga.links.amazon, official: true });
  } else {
    links.push({
      label: "Search on Amazon",
      url: `https://www.amazon.com/s?k=${query}+manga`,
      official: false,
    });
  }

  if (mdManga.links.bookWalker) {
    links.push({ label: "BookWalker", url: mdManga.links.bookWalker, official: true });
  } else {
    links.push({
      label: "Search on BookWalker",
      url: `https://global.bookwalker.jp/search/?word=${query}`,
      official: false,
    });
  }

  if (mdManga.links.eBookJapan) {
    links.push({ label: "eBookJapan", url: mdManga.links.eBookJapan, official: true });
  }
  if (mdManga.links.cdJapan) {
    links.push({ label: "CDJapan", url: mdManga.links.cdJapan, official: true });
  }
  if (mdManga.links.officialEnglishTranslation) {
    links.push({
      label: "Read officially",
      url: mdManga.links.officialEnglishTranslation,
      official: true,
    });
  }

  return links;
}

export interface MangaStatsSummary {
  rating: number | null;
}

/** Fetches Bayesian ratings for a batch of manga in as few requests as possible. */
export async function fetchStats(ids: string[]): Promise<Record<string, MangaStatsSummary>> {
  const result: Record<string, MangaStatsSummary> = {};
  const CHUNK_SIZE = 100;

  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CHUNK_SIZE);
    if (chunk.length === 0) continue;
    const stats = await MDManga.getStatistics(chunk);
    for (const id of chunk) {
      const rating = stats[id]?.rating;
      const value = rating?.bayesian ?? rating?.average ?? null;
      result[id] = { rating: value === null ? null : Math.round(value * 10) / 10 };
    }
  }

  return result;
}

/** Maps a MangaDex `Manga` into our domain `Manga` shape. */
export async function toDomainManga(
  mdManga: MDManga,
  stats?: MangaStatsSummary,
): Promise<Manga> {
  const [authorRel] = mdManga.authors.length > 0 ? mdManga.authors : mdManga.artists;
  const authorPromise = authorRel ? authorRel.resolve() : Promise.resolve(null);
  const coverPromise = mdManga.mainCover?.resolve() ?? Promise.resolve(null);

  const [author, cover] = await Promise.all([authorPromise, coverPromise]);

  const genres = mdManga.tags
    .filter((tag) => tag.group === "genre")
    .map((tag) => tag.localName);

  return {
    id: mdManga.id,
    title: mdManga.localTitle,
    author: author?.name ?? "Unknown",
    genres: genres.length > 0 ? genres : mdManga.tags.map((tag) => tag.localName).slice(0, 2),
    status: mdManga.status as MangaStatus,
    chapters: mdManga.lastChapter ? Number.parseFloat(mdManga.lastChapter) || null : null,
    rating: stats?.rating ?? null,
    synopsis: cleanSynopsis(mdManga.localDescription) || "No synopsis available.",
    year: mdManga.year,
    coverImage: cover ? coverUrl(mdManga.id, cover.fileName) : null,
    accent: accentForId(mdManga.id),
    buyLinks: buildBuyLinks(mdManga),
  };
}

/**
 * Runs `fn` over `items` with at most `limit` in flight at once.
 *
 * `toDomainManga` resolves a cover + author relationship per title, and
 * each `.resolve()` turned out to hit the network for real (confirmed via
 * requests to `/cover/{id}` in the browser) rather than reading from the
 * `includes` payload as the library's own docs claim. Firing that
 * unbounded across a 200-title catalog meant 200+ concurrent requests to
 * MangaDex on a single page load — almost certainly why this app has felt
 * slow and crash-prone. Capping concurrency fixes it regardless of
 * whether that's a library bug or a misuse on our end.
 */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await fn(items[current]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
}

const DETAIL_RESOLUTION_CONCURRENCY = 8;

async function toDomainMangaList(mdMangaList: MDManga[]): Promise<Manga[]> {
  const stats = await fetchStats(mdMangaList.map((m) => m.id));
  return mapWithConcurrency(mdMangaList, DETAIL_RESOLUTION_CONCURRENCY, (m) =>
    toDomainManga(m, stats[m.id]),
  );
}

const SEARCH_INCLUDES = ["cover_art", "author", "artist"] as const;
/** Restricted to general-audience content — broaden if the app adds age-gating. */
const CONTENT_RATING = ["safe"] as const;

const PAGE_SIZE = 100;

/**
 * Loads the most-followed titles as a browsable "catalog" — pages are
 * fetched sequentially (not in parallel) to stay well under MangaDex's
 * rate limit. This is the working set behind the genre grid's "All" tab
 * and the A–Z index; it isn't literally every manga on MangaDex (100k+
 * titles isn't something a client-side app should try to hold at once).
 */
export async function fetchCatalog(totalLimit = 200): Promise<Manga[]> {
  const pageCount = Math.ceil(totalLimit / PAGE_SIZE);
  const collected: MDManga[] = [];

  for (let page = 0; page < pageCount; page++) {
    const results = await MDManga.search({
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      order: { followedCount: "desc" },
      contentRating: [...CONTENT_RATING],
      includes: [...SEARCH_INCLUDES],
      hasAvailableChapters: true,
    });
    collected.push(...results);
    if (results.length < PAGE_SIZE) break;
  }

  return toDomainMangaList(collected);
}

export async function fetchFeatured(limit = 12): Promise<Manga[]> {
  const results = await MDManga.search({
    limit,
    order: { followedCount: "desc" },
    contentRating: [...CONTENT_RATING],
    includes: [...SEARCH_INCLUDES],
    hasAvailableChapters: true,
  });
  return toDomainMangaList(results);
}

export async function fetchByGenre(tagId: string, limit = 24): Promise<Manga[]> {
  const results = await MDManga.search({
    limit,
    includedTags: [tagId],
    order: { followedCount: "desc" },
    contentRating: [...CONTENT_RATING],
    includes: [...SEARCH_INCLUDES],
    hasAvailableChapters: true,
  });
  return toDomainMangaList(results);
}

export async function searchTitles(query: string, limit = 8): Promise<Manga[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const results = await MDManga.search({
    title: trimmed,
    limit,
    contentRating: [...CONTENT_RATING],
    includes: [...SEARCH_INCLUDES],
  });
  return toDomainMangaList(results);
}

/**
 * Fetches specific titles by id — used for favourites, since a favourited
 * title (found via search) may not be one of the ~200 in the loaded
 * browse catalog.
 */
export async function fetchByIds(ids: string[]): Promise<Manga[]> {
  if (ids.length === 0) return [];
  const results = await MDManga.getMultiple(ids, {
    contentRating: [...CONTENT_RATING],
    includes: [...SEARCH_INCLUDES],
  });
  return toDomainMangaList(results);
}

export async function fetchGenres(): Promise<GenreSummary[]> {
  const tags = await MDTag.getAllTags();
  return tags
    .filter((tag) => tag.group === "genre")
    .map((tag) => ({ id: tag.id, name: tag.localName }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Fetches every cover MangaDex has for a title, one per volume where
 * publishers submit volume-specific art. Loaded lazily — only when a
 * title's detail view opens — since most covers never get looked at.
 */
export async function fetchVolumeCovers(mangaId: string): Promise<VolumeCover[]> {
  const covers = await MDCover.getMangaCovers(mangaId);

  return covers
    .map((cover) => ({
      volume: cover.volume,
      coverImage: coverUrl(mangaId, cover.fileName, 512),
    }))
    .sort((a, b) => {
      const av = a.volume === null ? Number.NaN : Number.parseFloat(a.volume);
      const bv = b.volume === null ? Number.NaN : Number.parseFloat(b.volume);
      if (Number.isNaN(av) && Number.isNaN(bv)) return 0;
      if (Number.isNaN(av)) return 1;
      if (Number.isNaN(bv)) return -1;
      return av - bv;
    });
}
