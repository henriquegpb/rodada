import type { GameRules, PlayStatus } from "@/games/types";

/**
 * Pontos de uma partida, para o ranking dos grupos.
 * Tentativas: quanto menos, mais pontos; derrota vale zero (6 tentativas → 6 a 1).
 * Tempo: um ponto por item achado.
 */
export function scorePlay(rules: GameRules, status: PlayStatus, count: number): number {
  if (rules.type === "timed") return count;
  if (status !== "won") return 0;
  return rules.maxAttempts + 1 - count;
}
