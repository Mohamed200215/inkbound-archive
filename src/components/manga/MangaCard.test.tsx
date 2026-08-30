import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MangaCard } from "@/components/manga/MangaCard";
import type { Manga } from "@/types/manga";

const { toggleFavorite, isFavorite, open } = vi.hoisted(() => ({
  toggleFavorite: vi.fn(),
  isFavorite: vi.fn(() => false),
  open: vi.fn(),
}));

vi.mock("@/hooks/useFavorites", () => ({
  useFavorites: () => ({ toggleFavorite, isFavorite, favoriteIds: new Set() }),
}));

vi.mock("@/hooks/useMangaDetail", () => ({
  useMangaDetail: () => ({ open }),
}));

const BASE_MANGA: Manga = {
  id: "30013",
  title: "One Piece",
  author: "Eiichiro Oda",
  genres: ["Action", "Adventure"],
  status: "ongoing",
  chapters: 1100,
  rating: 9.1,
  synopsis: "A pirate story.",
  year: 1997,
  coverImage: null,
  accent: "#3a86ff",
  buyLinks: [],
};

beforeEach(() => {
  toggleFavorite.mockClear();
  isFavorite.mockClear().mockReturnValue(false);
  open.mockClear();
});

describe("MangaCard", () => {
  it("shows title, rating, chapter count, and author", () => {
    render(<MangaCard manga={BASE_MANGA} />);
    expect(screen.getByText("One Piece")).toBeInTheDocument();
    expect(screen.getByText("9.1")).toBeInTheDocument();
    expect(screen.getByText("Ch. 1100")).toBeInTheDocument();
    expect(screen.getByText("Eiichiro Oda")).toBeInTheDocument();
  });

  it("hides the author line when author data hasn't been fetched (lean catalog listing)", () => {
    render(<MangaCard manga={{ ...BASE_MANGA, author: "Unknown" }} />);
    expect(screen.queryByText("Unknown")).not.toBeInTheDocument();
  });

  it("opens the detail view when the card is clicked", async () => {
    const user = userEvent.setup();
    render(<MangaCard manga={BASE_MANGA} />);
    await user.click(screen.getByRole("button", { name: "View details for One Piece" }));
    expect(open).toHaveBeenCalledWith(BASE_MANGA);
  });

  it("toggles the favourite without opening the detail view", async () => {
    const user = userEvent.setup();
    render(<MangaCard manga={BASE_MANGA} />);
    await user.click(screen.getByRole("button", { name: "Add One Piece to favourites" }));
    expect(toggleFavorite).toHaveBeenCalledWith("30013");
    expect(open).not.toHaveBeenCalled();
  });

  it("reflects a favourited state with the remove label", () => {
    isFavorite.mockReturnValue(true);
    render(<MangaCard manga={BASE_MANGA} />);
    expect(screen.getByRole("button", { name: "Remove One Piece from favourites" })).toBeInTheDocument();
  });
});
