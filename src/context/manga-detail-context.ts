import { createContext } from "react";
import type { Manga } from "@/types/manga";

export interface MangaDetailContextValue {
  open: (manga: Manga) => void;
}

export const MangaDetailContext = createContext<MangaDetailContextValue | null>(null);
