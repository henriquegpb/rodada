import type { PlayView } from "../types";
import type { SentidoFeedback } from "./types";

/** Tentativa que pede uma dica em vez de chutar uma palavra. */
export const HINT = "?";

export type Heat = "near" | "warm" | "far";
export const HEATS: Heat[] = ["near", "warm", "far"];

/** Até que posição vai cada faixa: verde até 300, amarelo até 1500, vermelho depois. */
const NEAR = 300;
const WARM = 1500;
/** Mais ou menos o tamanho do vocabulário, para a barra de proximidade. */
const VOCABULARY = 28_000;

export function heatOf(rank: number): Heat {
  return rank <= NEAR ? "near" : rank <= WARM ? "warm" : "far";
}

export const HEAT_COLOR: Record<Heat, string> = { near: "var(--success)", warm: "#f5b301", far: "var(--destructive)" };
export const HEAT_LABEL: Record<Heat, string> = { near: "Perto", warm: "Morno", far: "Longe" };
const HEAT_EMOJI: Record<Heat, string> = { near: "🟩", warm: "🟨", far: "🟥" };

/** Largura da barra (0–100), em escala log: de 1 a 10 anda tanto quanto de 1000 a 10 000. */
export function closeness(rank: number): number {
  return Math.max(3, Math.round(100 * (1 - Math.log(rank) / Math.log(VOCABULARY))));
}

export function heatCounts(play: PlayView<unknown, SentidoFeedback>): Record<Heat, number> {
  const counts: Record<Heat, number> = { near: 0, warm: 0, far: 0 };
  for (const g of play.guesses) counts[heatOf(g.feedback.rank)]++;
  return counts;
}

export const hintCount = (play: PlayView<unknown, SentidoFeedback>) => play.guesses.filter((g) => g.feedback.hint).length;

/** Uma linha por faixa, com quadrados na proporção dos chutes (até 8), e as dicas. */
export function shareGrid(play: PlayView<unknown, SentidoFeedback>): string {
  const counts = heatCounts(play);
  const hints = hintCount(play);
  const lines = HEATS.filter((h) => counts[h]).map(
    (h) => `${HEAT_EMOJI[h].repeat(Math.min(8, Math.max(1, Math.round(counts[h] / 10))))} ${counts[h]}`,
  );
  if (hints) lines.push(`💡 ${hints} ${hints === 1 ? "dica" : "dicas"}`);
  return lines.join("\n");
}
