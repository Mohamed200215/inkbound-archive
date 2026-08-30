import logo from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="border-t border-black/10 py-8 dark:border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 text-center sm:px-6">
        <p className="flex items-center gap-1.5 text-sm font-black tracking-tight text-neutral-700 dark:text-neutral-300">
          <img src={logo} alt="" className="h-5 w-auto" />
          INKBOUND<span className="text-teal-500 dark:text-teal-400">.</span>
        </p>
        <p className="text-xs text-neutral-500">
          Manga data and cover art via AniList &middot; unofficial, non-commercial client
        </p>
      </div>
    </footer>
  );
}
