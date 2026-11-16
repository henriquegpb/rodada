import type { Guess, LivesRules, PlayView } from "../types";
import type { TrilhaFeedback } from "./types";

/*
 * O que o tabuleiro e a engine dividem. Não tem dado de resposta: pode ir para o navegador.
 */

export const COLOR = "#22c3a6";

/** Lado do tabuleiro: 7×7, 49 casas. */
export const SIZE = 7;

export const RULES: LivesRules = { type: "lives", lives: 3 };

/** Tentativa que pede uma dica em vez de mandar um trecho desenhado. */
export const HINT = "?";
export const HINTS = 3;

/** Separador das casas do trecho na tentativa: "8,15,16,9". */
export const SEPARATOR = ",";

export const encodeSegment = (cells: readonly number[]) => cells.join(SEPARATOR);

/** A solução que a engine manda no fim (`answerLabel`): o caminho inteiro, casa por casa. */
export const solutionPath = (label: string | undefined) => (label ? label.split(SEPARATOR).map(Number) : []);

/** O caminho que já vale: o 1 e, depois dele, os trechos certos (desenhados ou de dica), em ordem. */
export function lockedPath(numbers: readonly number[], guesses: readonly Guess<TrilhaFeedback>[]): number[] {
  return [numbers[0], ...guesses.flatMap((g) => (g.feedback.correct ? g.feedback.cells : []))];
}

/** O próximo número a alcançar (a partir de 0), ou -1 se o caminho já chegou no último. */
export function nextNumber(numbers: readonly number[], locked: readonly number[]): number {
  return numbers.findIndex((cell) => !locked.includes(cell));
}

export const mistakesOf = (play: PlayView<unknown, TrilhaFeedback>) => play.guesses.filter((g) => !g.feedback.correct).length;
export const hintsOf = (play: PlayView<unknown, TrilhaFeedback>) => play.guesses.filter((g) => g.feedback.hint).length;

/** Vidas que sobraram, em corações, e as dicas usadas. */
export function shareGrid(play: PlayView<unknown, TrilhaFeedback>): string {
  const left = Math.max(0, RULES.lives - mistakesOf(play));
  const hints = hintsOf(play);
  const hearts = "❤️".repeat(left) + "🖤".repeat(RULES.lives - left);
  return hints ? `${hearts}\n💡 ${hints} ${hints === 1 ? "dica" : "dicas"}` : hearts;
}
