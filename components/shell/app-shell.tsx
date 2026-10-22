"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Flame, LayoutGrid, UserRound, X } from "lucide-react";
import type { ReactNode } from "react";
import { games } from "@/games";
import type { GameMeta } from "@/games/types";
import { Countdown } from "@/components/countdown";
import { Logo, LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { SpotlightNav } from "@/components/microkit/spotlight-indicator";
import { ExpandingIconTabs } from "@/components/microkit/expanding-icon-tabs";
import { useToday } from "@/lib/daily/hooks";
import { challengeNumber } from "@/lib/daily/date";
import { usePlayRecords, useRound } from "@/lib/plays/hooks";
import type { DayStatus } from "@/lib/plays/status";
import { formatResult } from "@/lib/plays/result";
import { overallStreak } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

const mobileItems = [
  { href: "/", label: t.nav.home, icon: LayoutGrid },
  ...games.map((g) => ({ href: `/${g.meta.slug}`, label: g.meta.name, icon: g.meta.icon })),
  { href: "/perfil", label: t.nav.profile, icon: UserRound },
];

/**
 * Desktop: barra lateral que também é o placar da rodada (cada jogo com o status de hoje).
 * Celular: barra fina no topo e navegação embaixo.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { today, round } = useRound();

  const sidebarItems = [
    { href: "/", label: t.nav.home, leading: <LayoutGrid size={17} strokeWidth={2} /> },
    ...round.map(({ meta, status }, i) => ({
      href: `/${meta.slug}`,
      label: meta.name,
      heading: i === 0 ? `${t.nav.games}${today ? ` · Nº ${challengeNumber(today)}` : ""}` : undefined,
      leading: <span className="size-3 rounded-[3px]" style={{ background: meta.color }} />,
      trailing: <RoundStatus meta={meta} status={status} />,
    })),
    { href: "/perfil", label: t.nav.profile, heading: t.nav.you, leading: <UserRound size={17} strokeWidth={2} /> },
  ];

  return (
    // A página tem a altura da tela e não rola: quem rola é só a coluna de conteúdo.
    // Assim a sidebar nunca sai do lugar nem aparece o "elástico" do scroll em volta dela.
    <div className="h-dvh overflow-hidden lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden h-dvh flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <Logo className="px-3" />
        <div className="mt-8">
          <SpotlightNav items={sidebarItems} activeHref={pathname} label="Navegação" />
        </div>
        <div className="mt-auto border-t border-sidebar-border px-3 pt-5">
          <StreakLine />
          <div className="mt-3 flex items-center justify-between">
            <Countdown />
            <ThemeToggle className="-mr-2" />
          </div>
        </div>
      </aside>

      <div className="flex h-dvh min-w-0 flex-col overflow-y-auto overflow-x-hidden overscroll-none">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md lg:hidden">
          <div className="flex h-14 items-center gap-4 px-4">
            <Link href="/" aria-label={t.brand.name}>
              <LogoMark />
            </Link>
            <div className="ml-auto flex items-center gap-4">
              <Countdown />
              <StreakLine compact />
              <ThemeToggle className="-mr-2" />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 sm:px-8 sm:pt-12 lg:pb-16">{children}</main>
      </div>

      <div className="fixed inset-x-3 bottom-3 z-40 lg:hidden">
        <ExpandingIconTabs items={mobileItems} activeHref={pathname} label="Navegação" />
      </div>
    </div>
  );
}

function RoundStatus({ meta, status }: { meta: GameMeta; status: DayStatus }) {
  if (status.kind === "new") return null;
  if (status.kind === "playing") return <span className="block size-1.5 rounded-full bg-primary" aria-label="em andamento" />;
  const result = formatResult(meta.rules, status.kind, status.count);
  return (
    <span
      className={cn("flex items-center gap-1 text-xs font-semibold tabular-nums", status.kind === "lost" && "text-muted-foreground")}
      style={status.kind === "lost" ? undefined : { color: meta.color }}
    >
      {status.kind === "won" && <Check size={14} strokeWidth={3} />}
      {status.kind === "lost" && <X size={14} strokeWidth={3} />}
      {result}
    </span>
  );
}

function StreakLine({ compact }: { compact?: boolean }) {
  const today = useToday();
  const records = usePlayRecords();
  const streak = today ? overallStreak(records, today).current : 0;
  return (
    <span
      className="flex items-center gap-1.5 text-sm text-muted-foreground"
      title={t.stats.overallStreakHint}
    >
      <Flame size={16} className={streak > 0 ? "fill-primary text-primary" : ""} />
      <span className="font-semibold tabular-nums text-foreground">{streak}</span>
      {!compact && <span>{streak === 1 ? "dia seguido" : "dias seguidos"}</span>}
    </span>
  );
}
