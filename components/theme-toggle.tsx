"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { trackEvent } from "@/lib/analytics";
import { switchTheme } from "@/lib/theme-transition";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  function toggle() {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    switchTheme(next, setTheme);
    trackEvent("theme_changed", { theme: next });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t.nav.theme}
      className={cn("grid size-9 place-items-center text-muted-foreground transition-colors hover:text-foreground", className)}
    >
      {/* Os dois ícones ficam no DOM; o CSS escolhe, para não piscar antes de hidratar. */}
      <Sun size={18} className="hidden dark:block" />
      <Moon size={18} className="dark:hidden" />
    </button>
  );
}
