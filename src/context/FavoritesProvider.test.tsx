import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/context/AuthProvider";
import { FavoritesProvider } from "@/context/FavoritesProvider";
import { useFavorites } from "@/hooks/useFavorites";

// Forces guest mode regardless of any real Supabase credentials in the
// local .env — favourites in that mode are localStorage-only and never
// touch the network, which is exactly what these tests exercise.
vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: false,
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  },
}));

const STORAGE_KEY = "manga-archive:favorites";

function TestConsumer() {
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();
  return (
    <div>
      <p data-testid="count">{favoriteIds.size}</p>
      <p data-testid="has-30013">{isFavorite("30013") ? "yes" : "no"}</p>
      <button type="button" onClick={() => toggleFavorite("30013")}>
        toggle
      </button>
    </div>
  );
}

function renderConsumer() {
  return render(
    <AuthProvider>
      <FavoritesProvider>
        <TestConsumer />
      </FavoritesProvider>
    </AuthProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("FavoritesProvider (guest mode)", () => {
  it("starts empty when localStorage has no saved favourites", () => {
    renderConsumer();
    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.getByTestId("has-30013")).toHaveTextContent("no");
  });

  it("restores previously-saved favourites from localStorage on mount", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(["30013"]));
    renderConsumer();
    expect(screen.getByTestId("has-30013")).toHaveTextContent("yes");
  });

  it("toggling adds then removes an id, persisting to localStorage each time", async () => {
    const user = userEvent.setup();
    renderConsumer();

    await user.click(screen.getByRole("button", { name: "toggle" }));
    expect(screen.getByTestId("has-30013")).toHaveTextContent("yes");
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]")).toEqual(["30013"]);

    await user.click(screen.getByRole("button", { name: "toggle" }));
    expect(screen.getByTestId("has-30013")).toHaveTextContent("no");
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]")).toEqual([]);
  });

  it("ignores corrupted localStorage data instead of crashing", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not valid json");
    renderConsumer();
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });
});
