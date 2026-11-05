"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getGame } from "@/games";
import { preloadEngine } from "@/games/engines";
import type { GameMeta } from "@/games/types";
import { GameVideo } from "@/components/game/game-preview";
import { HoverGlideGroup } from "@/components/microkit/hover-glide-cards";
import { StreakFlame } from "@/components/streak/streak-flame";
import { challengeNumber } from "@/lib/daily/date";
import { useRound } from "@/lib/plays/hooks";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

export function HomeScreen() {
  const { today, round } = useRound();
  const date = today
    ? new Date(`${today}T12:00:00Z`).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      })
    : "";

  return (
    <div className="flex flex-col gap-16">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-8">
          <div>
            <p className="h-5 text-sm text-muted-foreground first-letter:uppercase">{date}</p>
            <h1 className="font-display mt-1 text-6xl leading-[0.9] sm:text-7xl">
              {t.home.round} <span className="text-primary">{today ? challengeNumber(today) : ""}</span>
            </h1>
          </div>
          <StreakFlame />
        </div>

        <HoverGlideGroup label={t.nav.games} className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {round.map(({ meta }) => (
            <GameTile key={meta.slug} meta={meta} />
          ))}
        </HoverGlideGroup>
      </section>

    </div>
  );
}

/**
 * Capa do jogo: chapada na cor do jogo, com a ilustração, o nome e a chamada.
 * Com o mouse em cima, a ilustração dá lugar a um vídeo do jogo sendo jogado (só com mouse: no
 * toque o card já abre o jogo). O vídeo só entra na página no primeiro hover.
 */
function GameTile({ meta }: { meta: GameMeta }) {
  const Cover = getGame(meta.slug)!.Cover;
  const [hovered, setHovered] = useState(false);
  const [seen, setSeen] = useState(false);
  return (
    <Link
      href={`/${meta.slug}`}
      onPointerEnter={(e) => {
        preloadEngine(meta.slug);
        if (e.pointerType !== "mouse") return;
        setHovered(true);
        setSeen(true);
      }}
      onPointerLeave={() => setHovered(false)}
      data-glide-card=""
      className="group relative flex aspect-[16/10] flex-col overflow-hidden rounded-xl p-5 text-ink lg:aspect-square lg:p-4 outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={{ background: meta.color }}
    >
      <div className="relative my-auto grid place-items-center">
        <Cover
          className={cn(
            "mx-auto w-[62%] max-w-[220px] lg:w-[84%] transition-[transform,opacity] duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-rotate-2 group-hover:scale-[1.05]",
            hovered && "opacity-0",
          )}
        />
        {seen && (
          <GameVideo
            slug={meta.slug}
            playing={hovered}
            // z-[2]: à frente do destaque do HoverGlideGroup (z-[1]), que clareia o card e apagaria o vídeo.
            className={cn(
              "absolute inset-x-0 top-1/2 z-[2] -translate-y-1/2 rounded-lg shadow-xl shadow-black/30 ring-2 ring-ink transition-opacity duration-300",
              hovered ? "opacity-100" : "opacity-0",
            )}
          />
        )}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-[26px] leading-none lg:text-[22px]">{meta.name}</h3>
          <p className="mt-1.5 text-[13px] font-medium leading-snug opacity-70">{meta.tagline}</p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-white transition-transform duration-300 group-hover:translate-x-0.5">
          <ArrowRight size={18} />
        </span>
      </div>
    </Link>
  );
}
