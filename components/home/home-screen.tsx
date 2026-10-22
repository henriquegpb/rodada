"use client";

import Link from "next/link";
import { ArrowRight, Check, Flame, X } from "lucide-react";
import { getGame } from "@/games";
import type { GameMeta } from "@/games/types";
import { HoverGlideGroup } from "@/components/microkit/hover-glide-cards";
import { HistoryGrid } from "@/components/stats/history-grid";
import { challengeNumber } from "@/lib/daily/date";
import { usePlayRecords, useRound } from "@/lib/plays/hooks";
import { formatResult } from "@/lib/plays/result";
import type { DayStatus } from "@/lib/plays/status";
import { gameStats, overallStreak } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

export function HomeScreen() {
  const { today, round } = useRound();
  const records = usePlayRecords();
  const streak = today ? overallStreak(records, today).current : 0;
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
          <div>
            <p className="text-xs text-muted-foreground">{t.home.streak}</p>
            <p className="mt-1 flex items-center gap-2">
              <Flame size={30} className={streak > 0 ? "fill-primary text-primary" : "text-muted-foreground"} />
              <span className="font-display text-5xl leading-none tabular-nums">{streak}</span>
              <span className="self-end pb-1 text-sm text-muted-foreground">{t.home.streakDays(streak)}</span>
            </p>
          </div>
        </div>

        <HoverGlideGroup label={t.nav.games} className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {round.map(({ meta, status }, i) => (
            <GameTile
              key={meta.slug}
              index={i}
              meta={meta}
              status={status}
              streak={today ? gameStats(records, meta.slug, meta.rules, today).streak.current : 0}
            />
          ))}
        </HoverGlideGroup>
      </section>

      {today && (
        <section>
          <h2 className="font-display mb-4 text-xl">{t.home.history}</h2>
          <HistoryGrid records={records} today={today} days={14} />
        </section>
      )}
    </div>
  );
}

/** Capa do jogo: chapada na cor do jogo, com a ilustração, o status de hoje e a sequência do jogo. */
function GameTile({
  index,
  meta,
  status,
  streak,
}: {
  index: number;
  meta: GameMeta;
  status: DayStatus;
  streak: number;
}) {
  const Cover = getGame(meta.slug)!.Cover;
  return (
    <Link
      href={`/${meta.slug}`}
      data-glide-card=""
      className="group relative flex aspect-[5/4] flex-col overflow-hidden rounded-xl p-5 text-ink outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:aspect-[4/5]"
      style={{ background: meta.color }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-2.5">
          <span className="font-display text-sm">0{index + 1}</span>
          <span
            className={cn("flex items-center gap-0.5 text-sm font-bold tabular-nums", !streak && "opacity-45")}
            title={`${t.home.streak}: ${streak}`}
          >
            <Flame size={15} className={streak ? "fill-current" : ""} />
            {streak}
          </span>
        </span>
        <Stamp status={status} meta={meta} />
      </div>
      <Cover className="mx-auto my-auto w-[80%] max-w-[240px] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-rotate-2 group-hover:scale-[1.05]" />
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-[26px] leading-none">{meta.name}</h3>
          <p className="mt-1.5 text-sm font-medium opacity-70">{meta.tagline}</p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-white transition-transform duration-300 group-hover:translate-x-0.5">
          <ArrowRight size={18} />
        </span>
      </div>
    </Link>
  );
}

function Stamp({ status, meta }: { status: DayStatus; meta: GameMeta }) {
  const base = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums";
  if (status.kind === "new") return <span className={`${base} border-2 border-ink/80`}>{t.status.play}</span>;
  if (status.kind === "playing") return <span className={`${base} bg-white/75`}>{t.status.playing}</span>;
  const result = formatResult(meta.rules, status.kind, status.count);
  return (
    <span className={cn(base, "text-white", status.kind === "lost" ? "bg-ink/80" : "bg-ink")}>
      {status.kind === "won" && <Check size={13} strokeWidth={3} />}
      {status.kind === "lost" && <X size={13} strokeWidth={3} />}
      {result}
    </span>
  );
}
