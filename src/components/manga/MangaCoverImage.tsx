import { useState } from "react";
import { MangaCoverArt } from "@/components/manga/MangaCoverArt";
import type { Manga } from "@/types/manga";

interface MangaCoverImageProps {
  manga: Manga;
  className?: string;
}

/**
 * Real MangaDex cover art layered over the generated placeholder tile.
 * The placeholder always renders first, so a missing cover, a slow
 * network, or a broken image URL all resolve to the same visible
 * fallback instead of a blank tile.
 */
export function MangaCoverImage({ manga, className }: MangaCoverImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <>
      <MangaCoverArt manga={manga} className={className} />
      {manga.coverImage && !failed && (
        <img
          src={manga.coverImage}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className={`${className ?? ""} h-full w-full object-cover`}
        />
      )}
    </>
  );
}
