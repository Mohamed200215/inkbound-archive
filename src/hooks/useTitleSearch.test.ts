import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useTitleSearch } from "@/hooks/useTitleSearch";
import type { Manga } from "@/types/manga";

const { searchTitles } = vi.hoisted(() => ({ searchTitles: vi.fn() }));

vi.mock("@/lib/anilist", () => ({ searchTitles }));

function manga(id: string, title: string): Manga {
  return {
    id,
    title,
    author: "Someone",
    genres: [],
    status: "ongoing",
    chapters: null,
    rating: null,
    synopsis: "",
    year: null,
    coverImage: null,
    accent: "#3a86ff",
    buyLinks: [],
  };
}

afterEach(() => {
  searchTitles.mockReset();
  vi.useRealTimers();
});

describe("useTitleSearch", () => {
  it("starts with no query and no results, without calling the API", () => {
    const { result } = renderHook(() => useTitleSearch());
    expect(result.current.query).toBe("");
    expect(result.current.results).toEqual([]);
    expect(searchTitles).not.toHaveBeenCalled();
  });

  it("debounces before searching, and reports loading while in flight", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    searchTitles.mockResolvedValue([manga("1", "Naruto")]);

    const { result } = renderHook(() => useTitleSearch());
    act(() => result.current.setQuery("naruto"));

    // Still within the debounce window — no request yet.
    expect(searchTitles).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    expect(searchTitles).toHaveBeenCalledWith("naruto");
    await waitFor(() => expect(result.current.results).toEqual([manga("1", "Naruto")]));
    expect(result.current.loading).toBe(false);
  });

  it("clears results when the query is cleared", async () => {
    searchTitles.mockResolvedValue([manga("1", "Naruto")]);
    const { result } = renderHook(() => useTitleSearch());

    act(() => result.current.setQuery("naruto"));
    await waitFor(() => expect(result.current.results.length).toBe(1));

    act(() => result.current.setQuery(""));
    expect(result.current.results).toEqual([]);
  });

  it("ignores a stale response if a newer search has since started", async () => {
    let resolveFirst!: (v: Manga[]) => void;
    searchTitles
      .mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce([manga("2", "Bleach")]);

    const { result } = renderHook(() => useTitleSearch());

    act(() => result.current.setQuery("nar"));
    await waitFor(() => expect(searchTitles).toHaveBeenCalledTimes(1));

    act(() => result.current.setQuery("ble"));
    await waitFor(() => expect(searchTitles).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.results).toEqual([manga("2", "Bleach")]));

    // The first ("nar") request resolves late — its result must not clobber "ble"'s.
    act(() => resolveFirst([manga("1", "Naruto")]));
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current.results).toEqual([manga("2", "Bleach")]);
  });
});
