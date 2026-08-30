export function AboutSection() {
  return (
    <div className="max-w-2xl">
      <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        Inkbound Archive is a single-page home for browsing manga by genre,
        alphabetically, or by what's trending. Titles, covers, genres, and
        ratings are pulled live from{" "}
        <a
          href="https://anilist.co"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-neutral-400 underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          AniList
        </a>
        . Search queries AniList directly as you type, favourites are saved
        to this browser, and the light/dark toggle is remembered between
        visits.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        The genre and A–Z sections index a working set of the ~200
        most-popular titles, not AniList's full library — search reaches
        everything else. Login/Sign up is a working form shell with no
        account backend behind it yet. All manga data and cover art belong
        to their original creators and publishers; this site is an unofficial,
        non-commercial client of the public AniList API.
      </p>
    </div>
  );
}
