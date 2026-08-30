export function LegalSection() {
  return (
    <div className="grid max-w-3xl gap-8 sm:grid-cols-2">
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Terms of use
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          Inkbound Archive is a free, non-commercial personal project. It's provided as-is, with
          no uptime or accuracy guarantees — titles, ratings, and cover art are pulled live from
          AniList and can change or go missing on their end without notice. Don't rely on it for
          anything important.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          All manga titles, artwork, and synopses belong to their original creators and
          publishers. This site doesn't host, sell, or claim rights to any of it — it only links
          out to official storefronts and reading platforms where available.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Privacy
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          Creating an account stores your email and password with{" "}
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-neutral-400 underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            Supabase
          </a>
          , used only to sign you in and sync your favourites across devices. Nothing is sold,
          shared with advertisers, or used for anything beyond that.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          Without an account, favourites are kept in your browser's local storage only and never
          leave your device. Search queries go straight to AniList's public API and aren't logged
          by this site.
        </p>
      </div>

      <p className="text-xs text-neutral-500 sm:col-span-2">
        Questions or issues? Open one on{" "}
        <a
          href="https://github.com/Mohamed200215/inkbound-archive/issues"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-neutral-400 underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          GitHub
        </a>
        .
      </p>
    </div>
  );
}
