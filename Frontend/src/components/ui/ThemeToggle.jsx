import { Moon, Sun } from "lucide-react";
import { cn } from "@/utils/cn";

export function ThemeToggle({ className, theme, isDark: legacyIsDark, onThemeChange, onToggle }) {
  const isDark = theme ? theme === "dark" : Boolean(legacyIsDark);

  const toggle = () => {
    if (onThemeChange) {
      onThemeChange(isDark ? "light" : "dark");
    } else {
      onToggle?.();
    }
  };

  return (
    <button
      type="button"
      className={cn("relative flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800", className)}
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
    >
      <Sun className={cn("absolute h-[1.15rem] w-[1.15rem] transition-all", isDark ? "scale-0 -rotate-90" : "scale-100 rotate-0")} />
      <Moon className={cn("absolute h-[1.15rem] w-[1.15rem] transition-all", isDark ? "scale-100 rotate-0" : "scale-0 rotate-90")} />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
