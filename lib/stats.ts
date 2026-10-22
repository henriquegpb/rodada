import type { GameRules, PlayStatus } from "@/games/types";
import { addDays } from "@/lib/daily/date";
import { countsForStreak, isFinished } from "@/lib/plays/result";

/** O mínimo de uma partida que as estatísticas precisam. */
export interface PlayRecord {
  slug: string;
  dateKey: string;
  status: PlayStatus;
  /** Tentativas aceitas; no jogo com tempo, itens achados. */
  count: number;
}

export interface Streak {
  current: number;
  max: number;
}

export interface GameStats {
  played: number;
  /** 0–100. Só faz sentido em jogos por tentativas. */
  winRate: number;
  /** Jogos por tentativas: distribution[i] = vitórias em i+1 tentativas. */
  distribution: number[];
  /** Jogos com tempo: melhor resultado e média. */
  best: number;
  average: number;
  streak: Streak;
}

/**
 * Sequência de dias consecutivos em que `qualifies` é verdade.
 * A atual continua viva até o fim do dia seguinte: quem jogou ontem e ainda não jogou hoje mantém.
 */
export function computeStreak(days: Map<string, boolean>, today: string): Streak {
  let current = 0;
  let cursor = days.has(today) ? today : addDays(today, -1);
  while (days.get(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  let max = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of [...days.keys()].sort()) {
    if (!days.get(date)) {
      run = 0;
    } else {
      run = previous && addDays(previous, 1) === date && days.get(previous) ? run + 1 : 1;
      max = Math.max(max, run);
    }
    previous = date;
  }
  return { current, max };
}

export function gameStats(plays: PlayRecord[], slug: string, rules: GameRules, today: string): GameStats {
  const finished = plays.filter((p) => p.slug === slug && isFinished(p.status));
  const wins = finished.filter((p) => p.status === "won");
  const distribution = rules.type === "attempts" ? Array<number>(rules.maxAttempts).fill(0) : [];
  if (rules.type === "attempts") for (const w of wins) distribution[w.count - 1]++;
  const counts = finished.map((p) => p.count);
  return {
    played: finished.length,
    winRate: finished.length ? Math.round((100 * wins.length) / finished.length) : 0,
    distribution,
    best: counts.length ? Math.max(...counts) : 0,
    average: counts.length ? Math.round(counts.reduce((a, b) => a + b, 0) / counts.length) : 0,
    streak: computeStreak(new Map(finished.map((p) => [p.dateKey, countsForStreak(rules, p.status)])), today),
  };
}

/** Sequência geral: dias em que terminou pelo menos um jogo, ganhando ou não. */
export function overallStreak(plays: PlayRecord[], today: string): Streak {
  return computeStreak(new Map(plays.filter((p) => isFinished(p.status)).map((p) => [p.dateKey, true])), today);
}
