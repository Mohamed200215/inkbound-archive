import { useMemo, useState, type ReactNode } from "react";
import { MangaDetailDialog } from "@/components/manga/MangaDetailDialog";
import { MangaDetailContext } from "@/context/manga-detail-context";
import type { Manga } from "@/types/manga";

export function MangaDetailProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Manga | null>(null);

  const value = useMemo(() => ({ open: (manga: Manga) => setSelected(manga) }), []);

  return (
    <MangaDetailContext.Provider value={value}>
      {children}
      <MangaDetailDialog
        manga={selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </MangaDetailContext.Provider>
  );
}
