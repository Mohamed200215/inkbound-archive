import type { BuyLink, GenreSummary, Manga, MangaStatus, VolumeCover } from "@/types/manga";

/**
 * AniList's public GraphQL API. Chosen to replace the previous MangaDex
 * integration (`mangadex-full-api`), which required a separate network
 * round trip per title to resolve its cover art and author — fanning out
 * to 200+ concurrent requests for a full catalog load and causing the
 * slow/crash-prone behaviour this file used to have. AniList returns
 * cover, author, genres, description, and score inline on every title, so
 * a whole catalog page loads in a single POST. No API key is required for
 * public reads, and the endpoint serves permissive CORS headers.
 * @see https://anilist.gitbook.io/anilist-apiv2-docs
 */
const ANILIST_ENDPOINT = "https://graphql.anilist.co";

/**
 * Curated accent palette used to color a title's generated placeholder
 * cover (shown while the real cover loads, or if it's missing). Picked
 * deterministically from the manga's id so a given title always gets the
 * same accent across sessions.
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

interface GraphQLResponse<T> {
  data: T | null;
  errors?: { message: string }[];
}

async function anilistRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const payload = (await response.json()) as GraphQLResponse<T>;
  if (!response.ok || payload.errors?.length) {
    const message = payload.errors?.[0]?.message ?? `AniList request failed (${response.status})`;
    throw new Error(message);
  }
  if (!payload.data) {
    throw new Error("AniList returned an empty response.");
  }
  return payload.data;
}

interface AniListMedia {
  id: number;
  title: { romaji: string | null; english: string | null };
  genres: string[];
  status: string | null;
  chapters: number | null;
  averageScore: number | null;
  startDate: { year: number | null } | null;
  description: string | null;
  coverImage: { extraLarge: string | null; large: string | null } | null;
  staff: { edges: { role: string; node: { name: { full: string } } }[] } | null;
  externalLinks: { site: string; url: string }[] | null;
}

const MEDIA_FIELDS = `
  id
  title { romaji english }
  genres
  status
  chapters
  averageScore
  startDate { year }
  description(asHtml: false)
  coverImage { extraLarge large }
  staff(perPage: 4, sort: RELEVANCE) {
    edges { role node { name { full } } }
  }
  externalLinks { site url }
`;

const STATUS_MAP: Record<string, MangaStatus> = {
  FINISHED: "completed",
  RELEASING: "ongoing",
  NOT_YET_RELEASED: "ongoing",
  CANCELLED: "cancelled",
  HIATUS: "hiatus",
};

/** Strips AniList's HTML-formatted description down to plain text. */
function cleanSynopsis(raw: string | null): string {
  if (!raw) return "";
  const firstParagraph = raw.split(/<br\s*\/?>\s*<br\s*\/?>/i)[0] ?? raw;
  return firstParagraph
    .replace(/<[^>]+>/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&hellip;/g, "…")
    .replace(/&(#0?39|apos);/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractAuthor(staff: AniListMedia["staff"]): string {
  const edges = staff?.edges ?? [];
  const creator = edges.find((edge) => /story|art|creator|mangaka/i.test(edge.role));
  return (creator ?? edges[0])?.node.name.full ?? "Unknown";
}

/**
 * AniList's manga listings rarely carry storefront links directly, so (as
 * with the previous MangaDex-backed version) Amazon + BookWalker search
 * links are always included, upgraded to official links when AniList has
 * them. Any known official reading sites AniList does list are appended.
 */
const KNOWN_READ_LINKS = [
  "VIZ",
  "MANGA Plus",
  "Shonen Jump",
  "Shonen Jump Plus",
  "Official Site",
  "eBookJapan",
  "CDJapan",
  "Crunchyroll",
];

function buildBuyLinks(title: string, externalLinks: AniListMedia["externalLinks"]): BuyLink[] {
  const query = encodeURIComponent(title);
  const bySite = new Map((externalLinks ?? []).map((link) => [link.site, link.url]));
  const links: BuyLink[] = [];

  const amazon = bySite.get("Amazon");
  links.push(
    amazon
      ? { label: "Amazon", url: amazon, official: true }
      : {
          label: "Search on Amazon",
          url: `https://www.amazon.com/s?k=${query}+manga`,
          official: false,
        },
  );

  const bookWalker = bySite.get("BookWalker") ?? bySite.get("BOOK☆WALKER");
  links.push(
    bookWalker
      ? { label: "BookWalker", url: bookWalker, official: true }
      : {
          label: "Search on BookWalker",
          url: `https://global.bookwalker.jp/search/?word=${query}`,
          official: false,
        },
  );

  for (const site of KNOWN_READ_LINKS) {
    const url = bySite.get(site);
    if (url) links.push({ label: site, url, official: true });
  }

  return links;
}

/** Maps an AniList `Media` entry into our domain `Manga` shape. */
function toDomainManga(media: AniListMedia): Manga {
  const id = String(media.id);
  const title = media.title.english ?? media.title.romaji ?? "Untitled";

  return {
    id,
    title,
    author: extractAuthor(media.staff),
    genres: media.genres,
    status: STATUS_MAP[media.status ?? ""] ?? "ongoing",
    chapters: media.chapters,
    rating: media.averageScore !== null ? Math.round(media.averageScore) / 10 : null,
    synopsis: cleanSynopsis(media.description) || "No synopsis available.",
    year: media.startDate?.year ?? null,
    coverImage: media.coverImage?.extraLarge ?? media.coverImage?.large ?? null,
    accent: accentForId(id),
    buyLinks: buildBuyLinks(title, media.externalLinks),
  };
}

const PAGE_SIZE = 50;

/**
 * Loads the most popular titles as a browsable "catalog" — this is the
 * working set behind the genre grid's "All" tab and the A–Z index; it
 * isn't literally every manga on AniList (tens of thousands of titles
 * isn't something a client-side app should try to hold at once). All
 * pages are fetched as aliased sub-queries in a single GraphQL request
 * instead of one request per page, to stay well clear of rate limits.
 */
export async function fetchCatalog(totalLimit = 200): Promise<Manga[]> {
  const pageCount = Math.ceil(totalLimit / PAGE_SIZE);
  const aliasedPages = Array.from(
    { length: pageCount },
    (_, i) => `
      page${i}: Page(page: ${i + 1}, perPage: ${PAGE_SIZE}) {
        media(type: MANGA, sort: POPULARITY_DESC, isAdult: false) {
          ${MEDIA_FIELDS}
        }
      }`,
  ).join("\n");

  const data = await anilistRequest<Record<string, { media: AniListMedia[] }>>(
    `query { ${aliasedPages} }`,
  );

  return Object.values(data)
    .flatMap((page) => page.media)
    .slice(0, totalLimit)
    .map(toDomainManga);
}

export async function fetchFeatured(limit = 12): Promise<Manga[]> {
  const data = await anilistRequest<{ Page: { media: AniListMedia[] } }>(
    `query($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: MANGA, sort: TRENDING_DESC, isAdult: false) {
          ${MEDIA_FIELDS}
        }
      }
    }`,
    { perPage: limit },
  );
  return data.Page.media.map(toDomainManga);
}

export async function fetchByGenre(genre: string, limit = 24): Promise<Manga[]> {
  const data = await anilistRequest<{ Page: { media: AniListMedia[] } }>(
    `query($genre: String, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: MANGA, genre: $genre, sort: POPULARITY_DESC, isAdult: false) {
          ${MEDIA_FIELDS}
        }
      }
    }`,
    { genre, perPage: limit },
  );
  return data.Page.media.map(toDomainManga);
}

export async function searchTitles(query: string, limit = 8): Promise<Manga[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const data = await anilistRequest<{ Page: { media: AniListMedia[] } }>(
    `query($search: String, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: MANGA, search: $search, isAdult: false) {
          ${MEDIA_FIELDS}
        }
      }
    }`,
    { search: trimmed, perPage: limit },
  );
  return data.Page.media.map(toDomainManga);
}

/**
 * Fetches specific titles by id — used for favourites, since a favourited
 * title (found via search) may not be one of the ~200 in the loaded
 * browse catalog.
 */
export async function fetchByIds(ids: string[]): Promise<Manga[]> {
  const numericIds = ids.map((id) => Number(id)).filter((id) => Number.isFinite(id));
  if (numericIds.length === 0) return [];

  const data = await anilistRequest<{ Page: { media: AniListMedia[] } }>(
    `query($ids: [Int], $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: MANGA, id_in: $ids) {
          ${MEDIA_FIELDS}
        }
      }
    }`,
    { ids: numericIds, perPage: numericIds.length },
  );
  return data.Page.media.map(toDomainManga);
}

/**
 * AniList's genres are a fixed, enum-backed list rather than a queryable
 * collection of taggable entities (confirmed via `GenreCollection`), so
 * this is hardcoded instead of fetched — one less network round trip on
 * every load. "Hentai" is excluded to match the `isAdult: false` filter
 * used everywhere else.
 */
const GENRES: readonly string[] = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Ecchi",
  "Fantasy",
  "Horror",
  "Mahou Shoujo",
  "Mecha",
  "Music",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
];

export async function fetchGenres(): Promise<GenreSummary[]> {
  return GENRES.map((name) => ({ id: name, name })).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * AniList doesn't expose per-volume cover art the way MangaDex did — it
 * only tracks one cover per series. This always returns an empty list, so
 * the detail view's volume picker simply doesn't render and only the
 * series cover shows.
 */
export async function fetchVolumeCovers(_mangaId: string): Promise<VolumeCover[]> {
  return [];
}
