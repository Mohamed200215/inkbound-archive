import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchByIds, fetchMangaDetail, searchTitles } from "@/lib/anilist";

/** Minimal AniList `Media` fixture — override only the fields a test cares about. */
function media(overrides: Record<string, unknown> = {}) {
  return {
    id: 30013,
    title: { romaji: "ONE PIECE", english: "One Piece" },
    genres: ["Action", "Adventure"],
    status: "RELEASING",
    chapters: null,
    averageScore: 91,
    startDate: { year: 1997 },
    description: "A pirate story.",
    coverImage: { extraLarge: "https://example.com/large.jpg", large: "https://example.com/med.jpg" },
    staff: { edges: [{ role: "Story & Art", node: { name: { full: "Eiichiro Oda" } } }] },
    externalLinks: [],
    ...overrides,
  };
}

/** Stubs `global.fetch` to resolve once with the given GraphQL `data` payload. */
function mockGraphQLResponse(data: unknown, opts: { ok?: boolean; status?: number } = {}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    json: async () => ({ data }),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchTitles", () => {
  it("returns an empty list without calling the API for a blank query", async () => {
    const fetchMock = mockGraphQLResponse({ Page: { media: [] } });
    expect(await searchTitles("")).toEqual([]);
    expect(await searchTitles("   ")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps a matched title into the domain Manga shape", async () => {
    mockGraphQLResponse({ Page: { media: [media()] } });
    const [result] = await searchTitles("one piece");

    expect(result).toMatchObject({
      id: "30013",
      title: "One Piece",
      author: "Eiichiro Oda",
      genres: ["Action", "Adventure"],
      status: "ongoing",
      rating: 9.1,
      year: 1997,
      coverImage: "https://example.com/large.jpg",
    });
  });
});

describe("fetchByIds", () => {
  it("returns an empty list without calling the API when given no ids", async () => {
    const fetchMock = mockGraphQLResponse({ Page: { media: [] } });
    expect(await fetchByIds([])).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("drops non-numeric ids before requesting", async () => {
    const fetchMock = mockGraphQLResponse({ Page: { media: [] } });
    await fetchByIds(["not-a-number"]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when the API returns GraphQL errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: null, errors: [{ message: "Not Found." }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchByIds(["1"])).rejects.toThrow("Not Found.");
  });

  it.each([
    ["FINISHED", "completed"],
    ["RELEASING", "ongoing"],
    ["NOT_YET_RELEASED", "ongoing"],
    ["CANCELLED", "cancelled"],
    ["HIATUS", "hiatus"],
    ["SOME_UNKNOWN_FUTURE_STATUS", "ongoing"],
  ])("maps AniList status %s to %s", async (aniListStatus, expected) => {
    mockGraphQLResponse({ Page: { media: [media({ status: aniListStatus })] } });
    const [result] = await fetchByIds(["30013"]);
    expect(result.status).toBe(expected);
  });

  it("strips HTML and cuts at the first paragraph break in the synopsis", async () => {
    mockGraphQLResponse({
      Page: {
        media: [
          media({
            description:
              "First paragraph with <i>italics</i> and a &mdash; dash.<br><br>Second paragraph should be dropped.",
          }),
        ],
      },
    });
    const [result] = await fetchByIds(["30013"]);
    expect(result.synopsis).toBe("First paragraph with italics and a — dash.");
  });

  it("falls back to a placeholder synopsis when AniList has none", async () => {
    mockGraphQLResponse({ Page: { media: [media({ description: null })] } });
    const [result] = await fetchByIds(["30013"]);
    expect(result.synopsis).toBe("No synopsis available.");
  });

  it("prefers the story/art credit over other staff roles for the author", async () => {
    mockGraphQLResponse({
      Page: {
        media: [
          media({
            staff: {
              edges: [
                { role: "Assistant", node: { name: { full: "Someone Else" } } },
                { role: "Story & Art", node: { name: { full: "The Real Author" } } },
              ],
            },
          }),
        ],
      },
    });
    const [result] = await fetchByIds(["30013"]);
    expect(result.author).toBe("The Real Author");
  });

  it("falls back to 'Unknown' when there's no staff credit at all", async () => {
    mockGraphQLResponse({ Page: { media: [media({ staff: null })] } });
    const [result] = await fetchByIds(["30013"]);
    expect(result.author).toBe("Unknown");
  });

  it("upgrades to an official Amazon link when AniList has one, and keeps the generic search fallback for BookWalker", async () => {
    mockGraphQLResponse({
      Page: {
        media: [media({ externalLinks: [{ site: "Amazon", url: "https://amazon.com/dp/xyz" }] })],
      },
    });
    const [result] = await fetchByIds(["30013"]);

    expect(result.buyLinks).toContainEqual({
      label: "Amazon",
      url: "https://amazon.com/dp/xyz",
      official: true,
    });
    expect(result.buyLinks.find((l) => l.label === "Search on BookWalker")).toMatchObject({
      official: false,
    });
  });
});

describe("fetchMangaDetail", () => {
  it("returns null for a non-numeric id without calling the API", async () => {
    const fetchMock = mockGraphQLResponse({ Media: null });
    expect(await fetchMangaDetail("abc")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null when AniList has no matching title", async () => {
    mockGraphQLResponse({ Media: null });
    expect(await fetchMangaDetail("999999")).toBeNull();
  });

  it("returns a fully-mapped Manga for a valid id", async () => {
    mockGraphQLResponse({ Media: media() });
    const result = await fetchMangaDetail("30013");
    expect(result).toMatchObject({ id: "30013", title: "One Piece", author: "Eiichiro Oda" });
  });
});
