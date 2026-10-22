"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={t.nav.theme}
      className={cn("grid size-9 place-items-center text-muted-foreground transition-colors hover:text-foreground", className)}
    >
      {/* Os dois ícones ficam no DOM; o CSS escolhe, para não piscar antes de hidratar. */}
      <Sun size={18} className="hidden dark:block" />
      <Moon size={18} className="dark:hidden" />
    </button>
  );
}
