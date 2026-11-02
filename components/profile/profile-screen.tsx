"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { games } from "@/games";
import type { GameMeta } from "@/games/types";
import { SlidingUnderlineTabs } from "@/components/microkit/sliding-underline-tabs";
import { HistoryGrid } from "@/components/stats/history-grid";
import { Distribution, StatStrip, statItems } from "@/components/stats/stats";
import { useToday } from "@/lib/daily/hooks";
import { usePlayRecords } from "@/lib/plays/hooks";
import { gameStats, overallStreak, type PlayRecord } from "@/lib/stats";
import { useMe, useProfile } from "@/lib/ranking/client";
import { t } from "@/lib/i18n";
import { Avatar } from "./avatar";
import { EditProfile } from "./edit-profile";
import { profileHref } from "./profile-link";
import { Achievements } from "./achievement-badge";

export function ProfileScreen() {
  const today = useToday();
  const records = usePlayRecords();
  const me = useMe();
  const { profile } = useProfile(me?.handle || null);
  const [editing, setEditing] = useState(false);
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
        {me ? (
          <div className="flex flex-wrap items-center gap-5">
            <Avatar name={me.name} seed={me.id} image={me.image} className="size-20 font-display text-2xl" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-5xl leading-[0.9]">{me.name}</h1>
              {me.handle && <p className="mt-2 text-sm text-muted-foreground">@{me.handle}</p>}
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-semibold transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"
            >
              <Pencil size={14} /> {t.profile.edit}
            </button>
            <EditProfile me={me} bio={profile?.account.bio ?? ""} open={editing} onOpenChange={setEditing} />
          </div>
        ) : (
          <h1 className="font-display text-6xl leading-[0.9]">{t.profile.title}</h1>
        )}
        {me && profile?.account.bio && <p className="mt-5 max-w-xl">{profile.account.bio}</p>}
        <p className={me ? "mt-3 text-sm text-muted-foreground" : "mt-3 text-muted-foreground"}>{t.profile.subtitle}</p>
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

      {/* As Conquistas saem dos contadores do servidor: só para quem entrou. */}
      {me?.handle && profile && (
        <section>
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="font-display text-xl">{t.profile.achievements}</h2>
            <Link href={profileHref(me.handle)} className="text-sm font-semibold text-primary">
              {t.profile.seePublic}
            </Link>
          </div>
          <Achievements items={profile.achievements} />
        </section>
      )}
    </div>
  );
}

export function GameTab({ meta, records, today }: { meta: GameMeta; records: PlayRecord[]; today: string }) {
  const stats = gameStats(records, meta.slug, meta.rules, today);
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <StatStrip items={statItems(stats, meta.rules)} className="self-start" />
      {meta.rules.type === "attempts" && <Distribution distribution={stats.distribution} color={meta.color} />}
    </div>
  );
}
