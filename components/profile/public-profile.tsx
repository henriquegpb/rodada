"use client";

import { useState } from "react";
import { games } from "@/games";
import { SlidingUnderlineTabs } from "@/components/microkit/sliding-underline-tabs";
import { HistoryGrid } from "@/components/stats/history-grid";
import { StatStrip } from "@/components/stats/stats";
import { useToday } from "@/lib/daily/hooks";
import { useProfile } from "@/lib/ranking/client";
import { LEVELS, LEVEL_NAMES, type AchievementProgress } from "@/lib/achievements";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { AchievementBadge } from "./achievement-badge";
import { Avatar } from "./avatar";
import { GameTab } from "./profile-screen";

/** O Perfil de qualquer Conta, com as partidas que estão no servidor. */
export function PublicProfile({ handle }: { handle: string }) {
  const today = useToday();
  const { profile, error } = useProfile(handle);
  if (error && !profile) return <p className="text-muted-foreground">{error}</p>;
  if (!profile || !today) return <p className="text-sm text-muted-foreground">{t.profile.loading}</p>;

  const { account, streak, daysPlayed, rolling, achievements, records } = profile;
  const finished = records.filter((r) => r.status !== "playing");
  const since = new Date(account.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const overall = [
    { label: t.stats.daysPlayed, value: daysPlayed },
    { label: t.stats.currentStreak, value: streak.current },
    { label: t.stats.maxStreak, value: streak.max },
    ...(rolling ? [{ label: t.profile.rolling, value: rolling.position }] : []),
  ];

  return (
    <div className="flex flex-col gap-14">
      <header>
        <div className="flex items-center gap-5">
          <Avatar name={account.name} seed={account.id} image={account.image} className="size-20 font-display text-2xl" />
          <div className="min-w-0">
            <h1 className="truncate font-display text-5xl leading-[0.9]">{account.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              @{account.handle} · {t.profile.since(since)}
            </p>
          </div>
        </div>
        {account.bio && <p className="mt-5 max-w-xl">{account.bio}</p>}
        <StatStrip items={overall} className="mt-8 max-w-xl" />
      </header>

      {finished.length === 0 ? (
        <p className="text-muted-foreground">{t.stats.empty}</p>
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

      <section>
        <h2 className="font-display mb-4 text-xl">{t.profile.achievements}</h2>
        <Achievements items={achievements} />
      </section>
    </div>
  );
}

function Achievements({ items }: { items: AchievementProgress[] }) {
  // Primeiro as conquistadas, do Nível mais alto para o mais baixo.
  const order = (a: AchievementProgress) => (a.level ? LEVELS.indexOf(a.level) : -1);
  const sorted = [...items].sort((a, b) => order(b) - order(a));
  const [selected, setSelected] = useState<string | null>(null);
  const open = sorted.find((a) => a.id === selected);

  return (
    <div className="flex flex-col gap-5">
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-x-2 gap-y-4">
        {sorted.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              aria-pressed={a.id === selected}
              onClick={() => setSelected(a.id === selected ? null : a.id)}
              className={cn(
                "group flex w-full flex-col items-center gap-2 rounded-xl px-1 py-2 transition-colors hover:bg-card/60",
                a.id === selected && "bg-card",
              )}
            >
              <AchievementBadge achievement={a} className="transition-transform group-hover:scale-105" />
              <span
                className={cn(
                  "line-clamp-2 text-center text-xs leading-tight",
                  a.level ? "font-medium" : "text-muted-foreground",
                )}
              >
                {a.name}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {open && (
        <div className="flex max-w-md items-center gap-4 rounded-xl bg-card p-4">
          <AchievementBadge achievement={open} className="shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold">
              {open.name}
              {open.level && <span className="ml-2 text-xs text-muted-foreground">{LEVEL_NAMES[open.level]}</span>}
            </p>
            <p className="text-sm text-muted-foreground">{open.description}</p>
            <p className="mt-1 text-xs tabular-nums text-muted-foreground">
              {open.next ? t.profile.progress(open.value, open.next) : t.profile.maxed(open.value)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
