import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { PasswordRecoveryDialog } from "@/components/layout/PasswordRecoveryDialog";
import { SplashScreen } from "@/components/layout/SplashScreen";
import { AboutSection } from "@/components/manga/AboutSection";
import { AlphabeticalSection } from "@/components/manga/AlphabeticalSection";
import { FavoritesSection } from "@/components/manga/FavoritesSection";
import { FeaturedCarousel } from "@/components/manga/FeaturedCarousel";
import { GenreSection } from "@/components/manga/GenreSection";
import { LegalSection } from "@/components/manga/LegalSection";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthProvider";
import { FavoritesProvider } from "@/context/FavoritesProvider";
import { MangaDetailProvider } from "@/context/MangaDetailProvider";
import { ThemeProvider } from "@/context/ThemeProvider";
import { useArchiveData } from "@/hooks/useArchiveData";

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="mb-6 text-3xl font-bold text-neutral-900 sm:text-4xl dark:text-neutral-50">
      {title}
    </h2>
  );
}

function ArchiveContent() {
  const { catalog, catalogLoading, featured, genres, loading, error, retry } = useArchiveData();

  return (
    <div id="top" className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <SplashScreen loading={loading} />

      <Navbar />

      {error && (
        <div className="flex flex-col items-center gap-3 px-6 py-24 text-center">
          <p className="text-sm text-rose-500 dark:text-rose-400">
            Couldn't reach AniList: {error}
          </p>
          <Button variant="outline" size="sm" onClick={retry}>
            Try again
          </Button>
        </div>
      )}

      {!loading && !error && (
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <section id="featured" className="scroll-mt-16 pb-16">
            <SectionHeading title="Featured this week" />
            <FeaturedCarousel manga={featured} />
          </section>

          <section id="genres" className="scroll-mt-16 border-t border-black/5 pb-16 pt-16 dark:border-white/5">
            <SectionHeading title="By genre" />
            <GenreSection catalog={catalog} catalogLoading={catalogLoading} genres={genres} />
          </section>

          <section id="a-z" className="scroll-mt-16 border-t border-black/5 pb-16 pt-16 dark:border-white/5">
            <SectionHeading title="A–Z index" />
            <AlphabeticalSection manga={catalog} loading={catalogLoading} />
          </section>

          <section id="favourites" className="scroll-mt-16 border-t border-black/5 pb-16 pt-16 dark:border-white/5">
            <SectionHeading title="Favourites" />
            <FavoritesSection />
          </section>

          <section id="about" className="scroll-mt-16 border-t border-black/5 pt-16 dark:border-white/5">
            <SectionHeading title="About this site" />
            <AboutSection />
          </section>

          <section id="legal" className="scroll-mt-16 border-t border-black/5 pb-4 pt-16 dark:border-white/5">
            <SectionHeading title="Terms & privacy" />
            <LegalSection />
          </section>
        </main>
      )}

      <Footer />
      <Toaster position="bottom-right" />
      <PasswordRecoveryDialog />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FavoritesProvider>
          <MangaDetailProvider>
            <ArchiveContent />
          </MangaDetailProvider>
        </FavoritesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
