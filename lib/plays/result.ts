import type { GameRules, Guess, PlayStatus } from "@/games/types";

/** A partida acabou, ganhando ou não. */
export const isFinished = (status: PlayStatus) => status !== "playing";

/** Terminar já é o resultado (itens achados, acertos), não só ganhar. */
const scoredByCount = (rules: GameRules) => rules.type === "timed" || rules.type === "quiz" || rules.type === "points";

/**
 * O número que vai no placar: tentativas aceitas (no jogo com tempo, itens achados); no quiz,
 * respostas certas; por pontos, a soma dos pontos; por vidas, os erros.
 */
export function playCount(rules: GameRules, guesses: readonly Guess[]): number {
  if (rules.type === "lives") return guesses.filter((g) => !(g.feedback as { correct: boolean }).correct).length;
  if (rules.type === "points") return guesses.reduce((sum, g) => sum + (g.feedback as { points: number }).points, 0);
  if (rules.type !== "quiz") return guesses.length;
  return guesses.filter((g) => (g.feedback as { correct?: boolean }).correct).length;
}

/**
 * Placar curto da partida, igual para a UI e o compartilhamento.
 * Tentativas: "3/6" ou "X/6". Sem limite: "8 chutes" ou "X". Tempo: "142/197". Quiz: "7/10".
 * Pontos: "84 pts". Vidas: "Sem erros", "1 erro" ou "X".
 * `count` vem de `playCount`.
 */
export function formatResult(rules: GameRules, status: PlayStatus, count: number): string {
  if (rules.type === "timed" || rules.type === "quiz") return `${count}/${rules.total}`;
  if (rules.type === "points") return `${count} pts`;
  if (rules.type === "lives") return status !== "won" ? "X" : count === 0 ? "Sem erros" : `${count} ${count === 1 ? "erro" : "erros"}`;
  if (rules.type === "unlimited") return status === "won" ? `${count} ${count === 1 ? "chute" : "chutes"}` : "X";
  return status === "won" ? `${count}/${rules.maxAttempts}` : `X/${rules.maxAttempts}`;
}

/**
 * Como fica a partida depois de mais uma tentativa aceita: acertou, acabaram as tentativas ou as
 * vidas, respondeu a última pergunta do quiz, ou segue.
 */
export function statusAfter(rules: GameRules, guesses: readonly Guess[], solved: boolean): PlayStatus {
  if (solved) return "won";
  const outOfAttempts =
    (rules.type === "attempts" && guesses.length >= rules.maxAttempts) ||
    (rules.type === "lives" && playCount(rules, guesses) >= rules.lives);
  if (outOfAttempts) return "lost";
  // No quiz a última resposta encerra; a engine marca `solved` quando acertou todas.
  if (rules.type === "quiz" && guesses.length >= rules.total) return "done";
  return "playing";
}

/**
 * Encerrar antes da hora: com tempo é só o fim do relógio e por pontos é ficar com os que tem
 * ("done"); nos outros, desistir é perder.
 */
export const giveUpStatus = (rules: GameRules): PlayStatus =>
  rules.type === "timed" || rules.type === "points" ? "done" : "lost";

/**
 * O dia conta para a sequência do jogo? Por tentativas, só vitória; com tempo, quiz e pontos, basta terminar.
 */
export function countsForStreak(rules: GameRules, status: PlayStatus): boolean {
  return scoredByCount(rules) ? isFinished(status) : status === "won";
}
