"use client";

import { games } from "@/games";
import { SlidingUnderlineTabs } from "@/components/microkit/sliding-underline-tabs";
import { HistoryGrid } from "@/components/stats/history-grid";
import { StatStrip } from "@/components/stats/stats";
import { useToday } from "@/lib/daily/hooks";
import { useProfile } from "@/lib/ranking/client";
import { t } from "@/lib/i18n";
import { Achievements } from "./achievement-badge";
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
