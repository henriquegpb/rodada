import type { GameRules, PlayStatus } from "@/games/types";

/** A partida acabou, ganhando ou não. */
export const isFinished = (status: PlayStatus) => status !== "playing";

/**
 * Placar curto da partida, igual para a UI e o compartilhamento.
 * Tentativas: "3/6" ou "X/6". Tempo: "142/197".
 * `count` é o número de tentativas aceitas (no jogo com tempo, itens achados).
 */
export function formatResult(rules: GameRules, status: PlayStatus, count: number): string {
  if (rules.type === "timed") return `${count}/${rules.total}`;
  return status === "won" ? `${count}/${rules.maxAttempts}` : `X/${rules.maxAttempts}`;
}

/**
 * O dia conta para a sequência do jogo? Por tentativas, só vitória; com tempo, basta terminar.
 */
export function countsForStreak(rules: GameRules, status: PlayStatus): boolean {
  return rules.type === "timed" ? isFinished(status) : status === "won";
}
