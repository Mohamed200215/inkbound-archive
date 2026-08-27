import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      onClick={toggleTheme}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2 text-sm text-neutral-700 transition-colors hover:border-black/25 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-300 dark:hover:border-white/25",
        className,
      )}
    >
      <span className="flex items-center gap-2">
        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        {isDark ? "Dark" : "Light"} mode
      </span>
      <span
        className="relative ml-auto inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-neutral-700 transition-colors data-[on=true]:bg-teal-400/80"
        data-on={isDark}
      >
        <span
          className="inline-block h-4 w-4 translate-x-0.5 rounded-full bg-white transition-transform data-[on=true]:translate-x-4"
          data-on={isDark}
        />
      </span>
    </button>
  );
}
