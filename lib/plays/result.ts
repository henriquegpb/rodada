import type { GameRules, Guess, PlayStatus } from "@/games/types";

/** A partida acabou, ganhando ou não. */
export const isFinished = (status: PlayStatus) => status !== "playing";

/** Terminar já é o resultado (itens achados, acertos), não só ganhar. */
const scoredByCount = (rules: GameRules) => rules.type === "timed" || rules.type === "quiz";

/**
 * O número que vai no placar: tentativas aceitas (no jogo com tempo, itens achados); no quiz,
 * respostas certas.
 */
export function playCount(rules: GameRules, guesses: readonly Guess[]): number {
  if (rules.type !== "quiz") return guesses.length;
  return guesses.filter((g) => (g.feedback as { correct?: boolean }).correct).length;
}

/**
 * Placar curto da partida, igual para a UI e o compartilhamento.
 * Tentativas: "3/6" ou "X/6". Sem limite: "8 chutes" ou "X". Tempo: "142/197". Quiz: "7/10".
 * `count` vem de `playCount`.
 */
export function formatResult(rules: GameRules, status: PlayStatus, count: number): string {
  if (rules.type === "timed" || rules.type === "quiz") return `${count}/${rules.total}`;
  if (rules.type === "unlimited") return status === "won" ? `${count} ${count === 1 ? "chute" : "chutes"}` : "X";
  return status === "won" ? `${count}/${rules.maxAttempts}` : `X/${rules.maxAttempts}`;
}

/**
 * O dia conta para a sequência do jogo? Por tentativas, só vitória; com tempo e no quiz, basta terminar.
 */
export function countsForStreak(rules: GameRules, status: PlayStatus): boolean {
  return scoredByCount(rules) ? isFinished(status) : status === "won";
}
