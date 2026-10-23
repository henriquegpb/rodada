"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, Flame, Gamepad2, LayoutGrid, Star, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { games, getGame, rootGame } from "@/games";
import { preloadEngine } from "@/games/engines";
import type { GameMeta } from "@/games/types";
import { Countdown } from "@/components/countdown";
import { SidebarPreview } from "@/components/game/game-preview";
import { Logo, LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { SpotlightNav } from "@/components/microkit/spotlight-indicator";
import { ExpandingIconTabs } from "@/components/microkit/expanding-icon-tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import BranchedMenu from "@/components/BranchedMenu";
import { useToday } from "@/lib/daily/hooks";
import { usePlayRecords, useRound } from "@/lib/plays/hooks";
import type { DayStatus } from "@/lib/plays/status";
import { formatResult } from "@/lib/plays/result";
import { NO_STREAK, overallStreak } from "@/lib/stats";
import { trackEvent } from "@/lib/analytics";
import { notePath } from "@/lib/nav-history";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";


/**
 * Desktop: barra lateral que também é o placar da rodada (cada jogo com o status de hoje).
 * Celular: barra fina no topo e navegação embaixo.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { round } = useRound();

  // Anota a página atual depois que ela montou: as animações de entrada sabem de onde se veio.
  useEffect(() => notePath(pathname), [pathname]);

  // As páginas dos jogos já ficam prontas: clicar no menu troca na hora, sem esperar a rede.
  useEffect(() => {
    for (const g of games) router.prefetch(`/${g.meta.slug}`);
  }, [router]);

  // Prévia em vídeo ao lado do jogo em que o mouse está. Sair de um item só fecha depois de um
  // instante: passando direto para o vizinho, o card desliza em vez de piscar.
  const [preview, setPreview] = useState<{ slug: string; anchor: DOMRect; open: boolean } | null>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  function showPreview(slug: string, row: HTMLElement) {
    preloadEngine(slug);
    window.clearTimeout(hideTimer.current);
    setPreview({ slug, anchor: row.getBoundingClientRect(), open: true });
  }
  function hidePreview() {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setPreview((p) => p && { ...p, open: false }), 120);
  }
  const previewMeta = preview ? getGame(preview.slug)?.meta : undefined;

  const homeItem = { href: "/", label: t.nav.home, leading: <LayoutGrid size={17} strokeWidth={2} /> };
  const profileItem = {
    href: "/perfil",
    label: t.nav.profile,
    heading: t.nav.you,
    leading: <UserRound size={17} strokeWidth={2} />,
  };
  // Os jogos da rodada como galhos de uma árvore (React Bits · Branched Menu).
  const gamesMenu = [
    {
      label: "",
      children: round.map(({ meta, status }) => ({
        value: meta.slug,
        label: meta.name,
        color: meta.color,
        icon: <span className="size-2.5 rounded-[3px]" style={{ background: meta.color }} />,
        trailing: <RoundStatus meta={meta} status={status} />,
      })),
    },
  ];

  return (
    // A página tem a altura da tela e não rola: quem rola é só a coluna de conteúdo.
    // Assim a sidebar nunca sai do lugar nem aparece o "elástico" do scroll em volta dela.
    <div className="h-dvh overflow-hidden lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden h-dvh flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <Logo className="px-3" />
        <div className="mt-8">
          <SpotlightNav items={[homeItem]} activeHref={pathname} label={t.nav.home} />
          <div className="mt-3 pl-2">
            <BranchedMenu
              items={gamesMenu}
              // Nos modos (Dupla, Quadra) o galho aceso continua sendo o do Palavra.
              active={rootGame(pathname.slice(1))?.meta.slug ?? ""}
              onSelect={(slug) => router.push(`/${slug}`)}
              onHover={showPreview}
              onHoverEnd={hidePreview}
              color="var(--sidebar-foreground)"
              accentColor="#ff6a1a"
              lineColor="var(--border)"
              width={204}
              rowHeight={38}
              indent={36}
              fontSize={15}
              className="!w-full"
            />
          </div>
          <SpotlightNav items={[profileItem]} activeHref={pathname} label={t.nav.profile} />
        </div>
        <div className="mt-auto border-t border-sidebar-border px-3 pt-5">
          <GitHubStar />
          <div className="flex items-center justify-between">
            <Countdown />
            <ThemeToggle className="-mr-2" />
          </div>
        </div>
      </aside>
      {preview && previewMeta && <SidebarPreview meta={previewMeta} anchor={preview.anchor} open={preview.open} />}

      <div className="flex h-dvh min-w-0 flex-col overflow-y-auto overflow-x-hidden overscroll-none">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md lg:hidden">
          <div className="flex h-14 items-center gap-4 px-4">
            <Link href="/" aria-label={t.brand.name}>
              <LogoMark />
            </Link>
            <div className="ml-auto flex items-center gap-4">
              <Countdown />
              <StreakLine />
              <ThemeToggle className="-mr-2" />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 sm:px-8 sm:pt-12 lg:pb-16">{children}</main>
      </div>

      <div className="fixed inset-x-3 bottom-3 z-40 lg:hidden">
        <MobileNav pathname={pathname} />
      </div>
    </div>
  );
}

/**
 * Celular: Hoje · Jogos · Perfil. Com 9 jogos não cabe um ícone para cada; "Jogos" abre a lista
 * (e, dentro de um jogo, mostra o nome e o ícone dele).
 */
function MobileNav({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const { round } = useRound();
  const currentSlug = rootGame(pathname.slice(1))?.meta.slug;
  const current = round.find((r) => r.meta.slug === currentSlug)?.meta;
  return (
    <>
      <ExpandingIconTabs
        label="Navegação"
        activeHref={pathname}
        items={[
          { href: "/", label: t.nav.home, icon: LayoutGrid },
          {
            label: current?.name ?? t.nav.gamesShort,
            icon: current?.icon ?? Gamepad2,
            color: current?.color,
            active: Boolean(current),
            onSelect: () => setOpen(true),
          },
          { href: "/perfil", label: t.nav.profile, icon: UserRound },
        ]}
      />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[80dvh] rounded-t-2xl pb-6">
          <SheetHeader>
            <SheetTitle className="font-display text-xl">{t.nav.gamesShort}</SheetTitle>
          </SheetHeader>
          <ul className="flex flex-col gap-1 overflow-y-auto px-4">
            {round.map(({ meta, status }) => (
              <li key={meta.slug}>
                <Link
                  href={`/${meta.slug}`}
                  onClick={() => setOpen(false)}
                  aria-current={current?.slug === meta.slug ? "page" : undefined}
                  className="flex h-12 items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition-colors hover:bg-secondary aria-[current=page]:bg-secondary"
                >
                  <span className="size-3 rounded-[3px]" style={{ background: meta.color }} />
                  {meta.name}
                  <span className="ml-auto">
                    <RoundStatus meta={meta} status={status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </>
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

const REPO_URL = "https://github.com/henriquegpb/rodada";

/** Convite discreto para dar uma estrela no repositório (o projeto é open source). */
function GitHubStar() {
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("github_star_clicked", {})}
      className="group mb-4 flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      <svg viewBox="0 0 16 16" className="size-3.5 fill-current" aria-hidden="true">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>
      {t.nav.github}
      <Star size={13} className="ml-auto transition-colors group-hover:fill-[#ffc21a] group-hover:text-[#ffc21a]" />
    </a>
  );
}

/** Sequência geral no topo do celular (no desktop ela fica na home). */
function StreakLine() {
  const today = useToday();
  const records = usePlayRecords();
  const streak = today ? overallStreak(records, today) : NO_STREAK;
  return (
    <span
      className="flex items-center gap-1.5 text-sm text-muted-foreground"
      title={t.stats.overallStreakHint}
    >
      {/* Acesa só quando hoje já conta; o número de ontem continua até o fim do dia. */}
      <Flame size={16} className={streak.doneToday ? "fill-primary text-primary" : ""} />
      <span className="font-semibold tabular-nums text-foreground">{streak.current}</span>
    </span>
  );
}
