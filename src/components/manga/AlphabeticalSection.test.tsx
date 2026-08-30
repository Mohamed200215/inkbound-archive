import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AlphabeticalSection } from "@/components/manga/AlphabeticalSection";
import type { Manga } from "@/types/manga";

vi.mock("@/hooks/useFavorites", () => ({
  useFavorites: () => ({ toggleFavorite: vi.fn(), isFavorite: () => false, favoriteIds: new Set() }),
}));

vi.mock("@/hooks/useMangaDetail", () => ({
  useMangaDetail: () => ({ open: vi.fn() }),
}));

function makeManga(id: string, title: string): Manga {
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

describe("AlphabeticalSection", () => {
  it("shows a loading message instead of the index while the catalog is loading", () => {
    render(<AlphabeticalSection manga={[]} loading />);
    expect(screen.getByText("Loading the full catalog...")).toBeInTheDocument();
  });

  it("groups titles under their first letter, uppercased and alphabetically", () => {
    render(
      <AlphabeticalSection
        manga={[makeManga("1", "berserk"), makeManga("2", "Attack on Titan"), makeManga("3", "bleach")]}
      />,
    );

    // The letter-group headings live in `<section id="az-{letter}">` wrappers —
    // scoped lookup avoids matching MangaCard's own (unrelated) title headings.
    const letterSections = document.querySelectorAll('[id^="az-"]');
    const letters = Array.from(letterSections).map((el) => el.id);
    expect(letters).toEqual(["az-A", "az-B"]);
    expect(screen.getByText("Attack on Titan")).toBeInTheDocument();
    expect(screen.getByText("berserk")).toBeInTheDocument();
    expect(screen.getByText("bleach")).toBeInTheDocument();
  });

  it("groups titles with no leading letter under '#'", () => {
    render(<AlphabeticalSection manga={[makeManga("1", "86 -Eighty Six-")]} />);
    expect(screen.getByRole("heading", { level: 3, name: /^#/ })).toBeInTheDocument();
  });

  it("only enables jump-to-letter links for letters that have titles", () => {
    render(<AlphabeticalSection manga={[makeManga("1", "Zetsuen no Tempest")]} />);
    const zLink = screen.getByRole("link", { name: "Z" });
    expect(zLink).toHaveAttribute("href", "#az-Z");
    const aLink = screen.getByText("A");
    expect(aLink.tagName).toBe("A");
    expect(aLink).not.toHaveAttribute("href");
  });
});
