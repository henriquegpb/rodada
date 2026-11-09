import type { Guess } from "../types";
import type { OrdemFeedback, OrdemMark } from "./types";

/*
 * O que o tabuleiro e a engine dividem. Não tem dado de resposta: pode ir para o navegador.
 */

export const COLOR = "#d94f8c";

/** Quantos países por dia. */
export const SIZE = 5;

/** Separador dos códigos na tentativa: "ru,br,ar,co,pt". */
export const SEPARATOR = ",";

export const encodeOrder = (codes: readonly string[]) => codes.join(SEPARATOR);

/** "17.098.246" km² → "17,1 mi km²"; "92.212" → "92 mil km²"; "316" → "316 km²". */
export function formatArea(km2: number): string {
  if (km2 >= 1_000_000) {
    return `${(km2 / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi km²`;
  }
  if (km2 >= 1_000) return `${Math.round(km2 / 1_000).toLocaleString("pt-BR")} mil km²`;
  return `${Math.round(km2).toLocaleString("pt-BR")} km²`;
}

export const MARK_EMOJI: Record<OrdemMark, string> = { correct: "🟩", wrong: "⬛" };

/** As posições que já estão certas na última tentativa. */
export function lockedPositions(guesses: readonly Guess<OrdemFeedback>[]): boolean[] {
  const last = guesses.at(-1)?.feedback;
  return Array.from({ length: SIZE }, (_, i) => last?.marks[i] === "correct");
}
