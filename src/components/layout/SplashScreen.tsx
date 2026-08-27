import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

const FADE_MS = 500;

interface SplashScreenProps {
  /** True while the archive is still loading — the cover stays up until this goes false. */
  loading: boolean;
}

/**
 * Full-screen cover shown while the initial MangaDex fetch (catalog,
 * featured, genres) is in flight. Fades out and unmounts once loading
 * finishes; reappears if `loading` goes true again (e.g. a retry).
 */
export function SplashScreen({ loading }: SplashScreenProps) {
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    if (loading) {
      setMounted(true);
      return;
    }
    const timer = window.setTimeout(() => setMounted(false), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [loading]);

  if (!mounted) return null;

  return (
    <div
      aria-hidden={!loading}
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-neutral-50 transition-opacity dark:bg-neutral-950",
        loading ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <img
        src={logo}
        alt="Inkbound Archive"
        className="h-24 w-auto animate-pulse sm:h-32"
      />
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading the archive from MangaDex...
      </div>
    </div>
  );
}
