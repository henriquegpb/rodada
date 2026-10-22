import { createRng, DAILY_SEED, pickDaily } from "@/lib/daily/seed";
import type { GameEngine } from "../types";
import { countries, findCountry, getCountry } from "../_shared/geo";
import { borderDistances, connects, shortestPath } from "../_shared/geo/borders";
import type { RotaAnswer, RotaFeedback, RotaPuzzle, RotaVerdict } from "./types";

/** Quantos países no meio do caminho mais curto o desafio pode ter. */
export const MIN_STOPS = 3;
export const MAX_STOPS = 5;

let pairs: [string, string][] | null = null;

/**
 * Pares de países que dão um bom desafio: ligados por terra, com 3 a 5 países no meio do caminho
 * mais curto, e nenhum dos dois é microestado (seria só um ponto no mapa).
 */
export function candidatePairs(): [string, string][] {
  if (pairs) return pairs;
  const ends = countries.filter((c) => c.shapeEligible).map((c) => c.code).sort();
  pairs = [];
  for (const a of ends) {
    const dist = borderDistances(a);
    for (const b of ends) {
      const stops = (dist.get(b) ?? 0) - 1;
      if (a < b && stops >= MIN_STOPS && stops <= MAX_STOPS) pairs.push([a, b]);
    }
  }
  return pairs;
}

function verdictOf(code: string, { start, end }: RotaAnswer): RotaVerdict {
  const fromStart = borderDistances(start);
  const toEnd = borderDistances(end);
  if (!fromStart.has(code) || !toEnd.has(code)) return "far";
  const detour = fromStart.get(code)! + toEnd.get(code)! - fromStart.get(end)!;
  return detour === 0 ? "route" : detour <= 2 ? "near" : "far";
}

export const engine: GameEngine<RotaPuzzle, RotaAnswer, RotaFeedback> = {
  createChallenge(dateKey) {
    const [a, b] = pickDaily(candidatePairs(), { slug: "rota", dateKey });
    // O sentido também é sorteado, senão a partida seria sempre o país de código menor.
    const flip = createRng(`${DAILY_SEED}:rota-sentido:${dateKey}`)() < 0.5;
    const [start, end] = flip ? [b, a] : [a, b];
    return { puzzle: { start, end, route: shortestPath(start, end).slice(1, -1) }, answer: { start, end } };
  },

  checkGuess(input, answer, previous) {
    const country = findCountry(input);
    if (!country) return { ok: false, error: "Não conhecemos esse país" };
    if (country.code === answer.start) return { ok: false, error: `${country.name} é o ponto de partida` };
    if (country.code === answer.end) return { ok: false, error: `${country.name} é o destino` };
    if (previous.some((g) => g.feedback.code === country.code)) {
      return { ok: false, error: "Você já tentou esse país" };
    }
    const through = [...previous.map((g) => g.feedback.code), country.code];
    return {
      ok: true,
      feedback: { code: country.code, name: country.name, verdict: verdictOf(country.code, answer) },
      solved: connects(answer.start, answer.end, through),
    };
  },

  describeAnswer: ({ start, end }) =>
    shortestPath(start, end)
      .map((code) => getCountry(code)?.name ?? code)
      .join(" → "),
};
