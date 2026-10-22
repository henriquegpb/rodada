"use client";

import { useMemo } from "react";
import { games } from "@/games";
import type { GameMeta } from "@/games/types";
import { useToday } from "@/lib/daily/hooks";
import type { PlayRecord } from "@/lib/stats";
import { statusOf, type DayStatus } from "./status";
import { playKey, usePlays } from "./store";

/** Partidas no formato que as estatísticas usam. */
export function usePlayRecords(): PlayRecord[] {
  const plays = usePlays();
  return useMemo(
    () =>
      Object.values(plays).map((p) => ({
        slug: p.slug,
        dateKey: p.dateKey,
        status: p.status,
        count: p.guesses.length,
      })),
    [plays],
  );
}

/** Situação de cada jogo da rodada de hoje, na ordem do registro. */
export function useRound(): { today: string | null; round: { meta: GameMeta; status: DayStatus }[] } {
  const today = useToday();
  const plays = usePlays();
  const round = games.map((g) => ({
    meta: g.meta,
    status: today ? statusOf(plays[playKey(g.meta.slug, today)]) : ({ kind: "new" } as DayStatus),
  }));
  return { today, round };
}
