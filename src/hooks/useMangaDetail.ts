import { useContext } from "react";
import { MangaDetailContext } from "@/context/manga-detail-context";

export function useMangaDetail() {
  const ctx = useContext(MangaDetailContext);
  if (!ctx) {
    throw new Error("useMangaDetail must be used within a MangaDetailProvider");
  }
  return ctx;
}
