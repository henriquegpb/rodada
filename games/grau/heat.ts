import type { Guess } from "../types";
import type { GrauFeedback, GrauRound } from "./types";

/** Vale errar por até 2° para mais ou para menos. */
export const TOLERANCE = 2;

/** Faixas de erro em graus, da resposta para fora. A primeira é o acerto. */
export const HEAT = [
  { max: TOLERANCE, label: "Acertou", emoji: "🟩", color: "#22c47e" },
  { max: 5, label: "Fervendo", emoji: "🟥", color: "#e5484d" },
  { max: 10, label: "Quente", emoji: "🟧", color: "#f97316" },
  { max: 20, label: "Morno", emoji: "🟨", color: "#eab308" },
  { max: 45, label: "Frio", emoji: "🟦", color: "#38bdf8" },
  { max: Infinity, label: "Gelado", emoji: "⬜", color: "#94a3b8" },
] as const;

/** A faixa de um erro de `off` graus (0 = acertou). */
export const heatOf = (off: number) => HEAT.findIndex((h) => off <= h.max);

/** Os chutes de cada ângulo, na ordem. */
export function byRound(guesses: readonly Guess<GrauFeedback>[]): Record<GrauRound, GrauFeedback[]> {
  const feedback = guesses.map((g) => g.feedback);
  return { 1: feedback.filter((f) => f.round === 1), 2: feedback.filter((f) => f.round === 2) };
}

/** O ângulo da vez: o segundo começa quando o primeiro é resolvido. */
export const currentRound = (guesses: readonly Guess<GrauFeedback>[]): GrauRound =>
  guesses.some((g) => g.feedback.round === 1 && g.feedback.heat === 0) ? 2 : 1;
