# Inkbound Archive

A single-page manga archive — browse by genre, alphabetically, or by what's trending, with real-time search and cross-device favourites.

Manga data, cover art, and genre tags come live from the [AniList GraphQL API](https://anilist.gitbook.io/anilist-apiv2-docs). Accounts and favourites are backed by [Supabase](https://supabase.com); favourites work for guests too (stored locally) and get merged into an account on first login.

## Features

- **Live catalog** — featured/trending carousel, genre browsing, and an A–Z index sourced from AniList's most-popular titles
- **Real-time search** — debounced, queries AniList's full library directly (not limited to the loaded catalog)
- **Manga detail view** — cover art, synopsis, ratings, and "where to read/buy" links (official links when AniList has them, search-based fallbacks otherwise)
- **Accounts & favourites** — email/password auth via Supabase; guests get localStorage-backed favourites that merge into the account on first login
- **Light/dark theme**, remembered between visits
- **Full-screen loading cover** while the initial data set loads

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · shadcn/ui (Radix primitives) · Supabase (Auth + Postgres) · AniList GraphQL API

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Supabase project's URL + anon key
npm run dev
```

The app runs fine without Supabase configured — it falls back to guest-only (localStorage) favourites and login is disabled with a clear message, so there's no hard dependency to get the manga-browsing side running.

To enable accounts and cross-device favourites:

1. Create a project at [supabase.com](https://supabase.com)
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in that project's SQL Editor — creates the `favorites` table with row-level security scoped to `auth.uid()`
3. Copy your project's URL and anon/publishable key (Settings → API) into `.env`

See `.env.example` for the exact variable names.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Typecheck, then build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Lint with oxlint |

## Project structure

```
src/
  components/
    layout/     # Navbar, search, hamburger menu, auth dialog, splash screen
    manga/      # Cards, carousel, genre/A-Z/favourites sections, detail dialog
    ui/         # shadcn/ui primitives
  context/      # Theme, auth, favourites, manga-detail providers
  hooks/        # Consumer hooks for the above
  lib/          # AniList client + domain mapping, Supabase client, utils
  types/        # Domain types (independent of AniList's own API shapes)
supabase/
  schema.sql    # favorites table + RLS policies
```

## Notes

- This is an unofficial, non-commercial client of the public AniList API. All manga data and cover art belong to their original creators and publishers.
- The genre and A–Z sections index a working set of AniList's ~200 most-popular titles, not its full library — search reaches everything else live.
- AniList tracks one cover per series (no per-volume art like MangaDex had), so the detail view no longer shows a volume picker.
