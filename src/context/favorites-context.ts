import { createContext } from "react";

export interface FavoritesContextValue {
  favoriteIds: ReadonlySet<string>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
}

export const FavoritesContext = createContext<FavoritesContextValue | null>(
  null,
);
