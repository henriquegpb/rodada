import { pickDaily } from "@/lib/daily/seed";
import type { GameEngine } from "../types";
import { HINT, HINTS } from "./rules";
import type { RainhasFeedback, RainhasPuzzle } from "./types";

/** Um tabuleiro gerado em scripts/build-rainhas.ts. */
export interface RainhasBoard {
  regions: string;
  /** Coluna da rainha em cada linha. */
  queens: number[];
}

/**
 * Engine das Rainhas para um tamanho: o tabuleiro do dia e a conferência de cada rainha contra a
 * solução (que é única). Cada tamanho é um modo, com desafio e estatísticas próprios.
 */
export function createRainhasEngine(
  slug: string,
  size: number,
  boards: readonly RainhasBoard[],
): GameEngine<RainhasPuzzle, number[], RainhasFeedback> {
  return {
    createChallenge(dateKey) {
      const board = pickDaily(boards, { slug, dateKey });
      return { puzzle: { size, regions: board.regions }, answer: board.queens };
    },

    checkGuess(input, queens, previous) {
      const placed = new Set(previous.filter((g) => g.feedback.correct).map((g) => g.feedback.cell));
      if (input === HINT) {
        if (previous.filter((g) => g.feedback.hint).length >= HINTS) return { ok: false, error: "Acabaram as dicas" };
        // Revela a rainha da primeira linha que ainda não tem.
        const row = queens.findIndex((c, r) => !placed.has(r * size + c));
        const cell = row * size + queens[row];
        return { ok: true, solved: placed.size + 1 === size, feedback: { cell, correct: true, hint: true } };
      }
      const cell = Number(input);
      if (!Number.isInteger(cell) || cell < 0 || cell >= size * size) return { ok: false, error: "Casa inválida" };
      if (previous.some((g) => g.feedback.cell === cell)) return { ok: false, error: "Essa casa já foi jogada" };
      const correct = queens[Math.floor(cell / size)] === cell % size;
      return {
        ok: true,
        solved: correct && placed.size + 1 === size,
        feedback: { cell, correct },
      };
    },

    // O tabuleiro mostra a solução no fim; não há uma resposta em texto.
    describeAnswer: (queens) => queens.join(","),
  };
}
