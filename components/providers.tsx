"use client";

import { ThemeProvider } from "next-themes";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { flushPending } from "@/lib/plays/sync";
import { useImportOnLogin } from "@/lib/ranking/client";

export function Providers({ children }: { children: ReactNode }) {
  // Partidas que não chegaram ao servidor (sem conexão) vão quando o app abre.
  useEffect(() => void flushPending(), []);
  useImportOnLogin();

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <TooltipProvider delayDuration={300}>
        {children}
        <Toaster position="top-center" />
      </TooltipProvider>
    </ThemeProvider>
  );
}
