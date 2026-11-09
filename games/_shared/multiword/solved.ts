import type { Guess } from "../../types";
import type { MultiWordFeedback } from "./types";

/*
 * Fica fora de engine.ts porque o tabuleiro também usa: a engine importa a lista de respostas, e o
 * que o tabuleiro importa vai para o navegador.
 */

export const solvedIn = (feedback: MultiWordFeedback, board: number) =>
  feedback.boards[board]?.every((m) => m === "correct") ?? false;

/** Tabuleiros já resolvidos depois destas tentativas. */
export function solvedBoards(guesses: readonly Guess<MultiWordFeedback>[], boards: number): boolean[] {
  return Array.from({ length: boards }, (_, b) => guesses.some((g) => solvedIn(g.feedback, b)));
}
