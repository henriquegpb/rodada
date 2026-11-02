import { roundGames } from "@/games";

/**
 * Conquistas: medalhas que sobem de Nível conforme uma métrica da Conta cresce, como as do GitHub.
 *
 * Nada de "desbloqueio" fica gravado: o Nível sai sempre dos contadores da Conta. Por isso uma
 * Conquista nova vale para o histórico de todo mundo e mudar um limiar vale para todos.
 */

export const LEVELS = ["bronze", "prata", "ouro", "diamante"] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_NAMES: Record<Level, string> = { bronze: "Bronze", prata: "Prata", ouro: "Ouro", diamante: "Diamante" };

/** O que o servidor conta de cada Conta; é a única fonte das Conquistas. */
export interface Counters {
  /** Dias com pelo menos um jogo terminado. */
  daysPlayed: number;
  maxStreak: number;
  /** Dias com todos os jogos da Rodada terminados. */
  fullRounds: number;
  /** Por slug: partidas do dia terminadas e Jogos perfeitos (Nota 100). */
  byGame: Record<string, { plays: number; perfect: number }>;
}

export const EMPTY_COUNTERS: Counters = { daysPlayed: 0, maxStreak: 0, fullRounds: 0, byGame: {} };

export interface Achievement {
  id: string;
  name: string;
  description: string;
  /** Valor mínimo de cada Nível, de Bronze a Diamante, em ordem crescente. */
  thresholds: readonly [number, number, number, number];
  metric(counters: Counters): number;
}

const perGame = roundGames.flatMap(({ meta }): Achievement[] => [
  {
    id: `fiel-${meta.slug}`,
    name: `Fiel ao ${meta.name}`,
    description: `Partidas do dia terminadas no ${meta.name}`,
    thresholds: [10, 50, 200, 500],
    metric: (c) => c.byGame[meta.slug]?.plays ?? 0,
  },
  {
    id: `perfeito-${meta.slug}`,
    name: `Perfeito no ${meta.name}`,
    description: `Jogos perfeitos no ${meta.name}`,
    thresholds: [1, 10, 50, 150],
    metric: (c) => c.byGame[meta.slug]?.perfect ?? 0,
  },
]);

/** Registro das Conquistas, na ordem em que aparecem no Perfil. */
export const achievements: Achievement[] = [
  {
    id: "dias-jogados",
    name: "Assíduo",
    description: "Dias com pelo menos um jogo terminado",
    thresholds: [7, 30, 100, 365],
    metric: (c) => c.daysPlayed,
  },
  {
    id: "sequencia",
    name: "Em chamas",
    description: "Maior Sequência de dias seguidos",
    thresholds: [7, 30, 100, 365],
    metric: (c) => c.maxStreak,
  },
  {
    id: "rodada-completa",
    name: "Rodada completa",
    description: "Dias com todos os jogos da Rodada terminados",
    thresholds: [1, 10, 50, 200],
    metric: (c) => c.fullRounds,
  },
  ...perGame,
];

export interface AchievementProgress {
  id: string;
  name: string;
  description: string;
  /** Nível atual; null antes do Bronze. */
  level: Level | null;
  value: number;
  /** Quanto a métrica precisa chegar para o próximo Nível; null no Diamante. */
  next: number | null;
}

function levelOf(achievement: Achievement, value: number): Level | null {
  let level: Level | null = null;
  achievement.thresholds.forEach((min, i) => {
    if (value >= min) level = LEVELS[i];
  });
  return level;
}

export function achievementProgress(counters: Counters): AchievementProgress[] {
  return achievements.map((a) => {
    const value = a.metric(counters);
    const level = levelOf(a, value);
    const nextIndex = level ? LEVELS.indexOf(level) + 1 : 0;
    return {
      id: a.id,
      name: a.name,
      description: a.description,
      level,
      value,
      next: a.thresholds[nextIndex] ?? null,
    };
  });
}

/** As Conquistas que subiram de Nível entre dois retratos dos contadores (para o aviso). */
export function levelUps(before: Counters, after: Counters): { id: string; name: string; level: Level }[] {
  return achievements.flatMap((a) => {
    const was = levelOf(a, a.metric(before));
    const now = levelOf(a, a.metric(after));
    return now && now !== was ? [{ id: a.id, name: a.name, level: now }] : [];
  });
}
