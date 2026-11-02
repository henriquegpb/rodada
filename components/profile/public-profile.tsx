"use client";

import { useToday } from "@/lib/daily/hooks";
import { useMe, useProfile } from "@/lib/ranking/client";
import { t } from "@/lib/i18n";
import { ProfileLayout, ProfileSide, ProfileSkeleton } from "./profile-layout";
import { EditButton, ProfileActivity } from "./profile-screen";

/** O Perfil de qualquer Conta, com as partidas que estão no servidor. */
export function PublicProfile({ handle }: { handle: string }) {
  const today = useToday();
  const { profile, error } = useProfile(handle);
  const me = useMe();
  if (error && !profile) return <p className="text-muted-foreground">{error}</p>;
  if (!profile || !today) return <ProfileSkeleton />;

  const { account, streak, daysPlayed, rolling, achievements, records } = profile;
  const finished = records.filter((r) => r.status !== "playing");
  const since = new Date(account.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const stats = [
    { label: t.stats.daysPlayed, value: daysPlayed },
    { label: t.stats.currentStreak, value: streak.current, flame: streak.doneToday },
    { label: t.stats.maxStreak, value: streak.max },
    ...(rolling ? [{ label: t.profile.rolling, value: rolling.position }] : []),
  ];

  return (
    <ProfileLayout
      side={
        <ProfileSide
          account={account}
          meta={t.profile.since(since)}
          // No próprio Perfil público também dá para editar.
          action={me?.id === account.id ? <EditButton me={me} bio={account.bio} /> : undefined}
          stats={stats}
          achievements={achievements}
        />
      }
    >
      {finished.length === 0 ? (
        <p className="text-muted-foreground">{t.stats.empty}</p>
      ) : (
        <ProfileActivity records={records} today={today} />
      )}
    </ProfileLayout>
  );
}
