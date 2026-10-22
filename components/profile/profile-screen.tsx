"use client";

import Link from "next/link";
import { games } from "@/games";
import type { GameMeta } from "@/games/types";
import { SlidingUnderlineTabs } from "@/components/microkit/sliding-underline-tabs";
import { HistoryGrid } from "@/components/stats/history-grid";
import { Distribution, StatStrip, statItems } from "@/components/stats/stats";
import { useToday } from "@/lib/daily/hooks";
import { usePlayRecords } from "@/lib/plays/hooks";
import { gameStats, overallStreak, type PlayRecord } from "@/lib/stats";
import { t } from "@/lib/i18n";

export function ProfileScreen() {
  const today = useToday();
  const records = usePlayRecords();
  if (!today) return null;

  const finished = records.filter((r) => r.status !== "playing");
  const streak = overallStreak(records, today);
  const overall = [
    { label: t.stats.played, value: finished.length },
    { label: t.stats.daysPlayed, value: new Set(finished.map((r) => r.dateKey)).size },
    { label: t.stats.currentStreak, value: streak.current },
    { label: t.stats.maxStreak, value: streak.max },
  ];

  return (
    <div className="flex flex-col gap-14">
      <header>
        <h1 className="font-display text-6xl leading-[0.9]">{t.profile.title}</h1>
        <p className="mt-3 text-muted-foreground">{t.profile.subtitle}</p>
        <StatStrip items={overall} className="mt-8 max-w-xl" />
      </header>

      {finished.length === 0 ? (
        <p className="text-muted-foreground">
          {t.stats.empty}{" "}
          <Link href="/" className="font-semibold text-primary">
            {t.home.play}
          </Link>
        </p>
      ) : (
        <>
          <section>
            <h2 className="font-display mb-4 text-xl">{t.home.history}</h2>
            <HistoryGrid records={records} today={today} days={14} />
          </section>
          <section>
            <SlidingUnderlineTabs
              label={t.stats.byGame}
              tabs={games.map(({ meta }) => ({
                label: meta.name,
                content: <GameTab meta={meta} records={records} today={today} />,
              }))}
            />
          </section>
        </>
      )}
    </div>
  );
}

function GameTab({ meta, records, today }: { meta: GameMeta; records: PlayRecord[]; today: string }) {
  const stats = gameStats(records, meta.slug, meta.rules, today);
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <StatStrip items={statItems(stats, meta.rules)} className="self-start" />
      {meta.rules.type === "attempts" && <Distribution distribution={stats.distribution} color={meta.color} />}
    </div>
  );
}
