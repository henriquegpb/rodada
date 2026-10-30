import type { GameRules, PlayStatus } from "@/games/types";

/**
 * Pontos de uma partida, para o ranking dos grupos.
 * Tentativas: quanto menos, mais pontos; derrota vale zero (6 tentativas → 6 a 1).
 * Sem limite: 10 pontos acertando de primeira, um a menos por chute, mínimo 1; desistir vale zero.
 * Tempo: um ponto por item achado. Quiz: um ponto por acerto. Pontos: os do próprio jogo.
 * Vidas: uma por vida que sobrou (3 vidas sem errar → 3); perder vale zero.
 */
export function scorePlay(rules: GameRules, status: PlayStatus, count: number): number {
  if (rules.type === "timed" || rules.type === "quiz" || rules.type === "points") return count;
  if (status !== "won") return 0;
  if (rules.type === "unlimited") return Math.max(1, 11 - count);
  if (rules.type === "lives") return rules.lives - count;
  return rules.maxAttempts + 1 - count;
}
