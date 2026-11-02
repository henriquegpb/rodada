"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { games } from "@/games";
import type { GameMeta } from "@/games/types";
import { PillTabs } from "@/components/ui/pill-tabs";
import { HistoryGrid } from "@/components/stats/history-grid";
import { Distribution, StatStrip, statItems } from "@/components/stats/stats";
import { useToday } from "@/lib/daily/hooks";
import { usePlayRecords } from "@/lib/plays/hooks";
import { gameStats, overallStreak, type PlayRecord } from "@/lib/stats";
import { useMe, useProfile, type Me } from "@/lib/ranking/client";
import { t } from "@/lib/i18n";
import { EditProfile } from "./edit-profile";
import { profileHref } from "./profile-link";
import { ProfileLayout, ProfileSide, ProfileSkeleton } from "./profile-layout";

export function ProfileScreen() {
  const today = useToday();
  const local = usePlayRecords();
  const me = useMe();
  const { profile } = useProfile(me?.handle || null);
  // Enquanto a sessão não responde, não dá para saber qual Perfil mostrar.
  if (!today || me === undefined) return <ProfileSkeleton />;

  // No `?mock` as partidas vêm do Perfil de mentira; de verdade, deste navegador.
  const records = profile?.mock ? profile.records : local;
  const finished = records.filter((r) => r.status !== "playing");
  const streak = overallStreak(records, today);
  const stats = [
    { label: t.stats.played, value: finished.length },
    { label: t.stats.daysPlayed, value: new Set(finished.map((r) => r.dateKey)).size },
    { label: t.stats.currentStreak, value: streak.current, flame: streak.doneToday },
    { label: t.stats.maxStreak, value: streak.max },
  ];

  const side = me ? (
    <ProfileSide
      account={{ ...me, bio: profile?.account.bio, dev: profile?.account.dev }}
      action={<EditButton me={me} bio={profile?.account.bio ?? ""} />}
      stats={stats}
      // As Conquistas saem dos contadores do servidor: só para quem entrou.
      achievements={profile?.achievements ?? null}
      footer={
        me.handle && (
          <Link href={profileHref(me.handle)} className="text-xs font-semibold text-primary">
            {t.profile.seePublic}
          </Link>
        )
      }
    />
  ) : (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-5xl leading-[0.9]">{t.profile.title}</h1>
      <StatStrip items={stats} />
    </div>
  );

  return (
    <ProfileLayout side={side}>
      {finished.length === 0 ? (
        <p className="text-muted-foreground">
          {t.stats.empty}{" "}
          <Link href="/" className="font-semibold text-primary">
            {t.home.play}
          </Link>
        </p>
      ) : (
        <ProfileActivity records={records} today={today} note={t.profile.subtitle} />
      )}
    </ProfileLayout>
  );
}

/** "Editar perfil" e o modal que ele abre. */
export function EditButton({ me, bio }: { me: Me; bio: string }) {
  const [editing, setEditing] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-secondary text-sm font-semibold transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"
      >
        <Pencil size={14} /> {t.profile.edit}
      </button>
      <EditProfile me={me} bio={bio} open={editing} onOpenChange={setEditing} />
    </>
  );
}

/** A coluna da direita: os últimos 14 dias e as estatísticas de cada jogo. */
export function ProfileActivity({ records, today, note }: { records: PlayRecord[]; today: string; note?: string }) {
  const [slug, setSlug] = useState(games[0].meta.slug);
  const meta = games.find((g) => g.meta.slug === slug)!.meta;
  return (
    <>
      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4">
          <h2 className="font-display text-xl">{t.home.history}</h2>
          {note && <p className="text-xs text-muted-foreground">{note}</p>}
        </div>
        <HistoryGrid records={records} today={today} days={14} />
      </section>
      <section>
        <h2 className="font-display mb-3 text-xl">{t.stats.byGame}</h2>
        <PillTabs
          label={t.stats.byGame}
          value={slug}
          onChange={setSlug}
          options={games.map(({ meta: game }) => ({ key: game.slug, label: game.name, color: game.color }))}
        />
        <div role="tabpanel" className="mt-6">
          <GameTab meta={meta} records={records} today={today} />
        </div>
      </section>
    </>
  );
}

function GameTab({ meta, records, today }: { meta: GameMeta; records: PlayRecord[]; today: string }) {
  const stats = gameStats(records, meta.slug, meta.rules, today);
  return (
    // Empilhado: na coluna da direita do Perfil, lado a lado espreme os números.
    <div className="flex flex-col gap-8">
      <StatStrip items={statItems(stats, meta.rules)} className="max-w-xl" />
      {meta.rules.type === "attempts" && <Distribution distribution={stats.distribution} color={meta.color} />}
    </div>
  );
}
