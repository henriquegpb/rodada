import { pickDaily } from "@/lib/daily/seed";
import type { GameEngine } from "../types";
import { countries, findCountry, getCountry } from "../_shared/geo";
import distances from "./data/distances.json";
import type { CalorFeedback, CalorPuzzle } from "./types";

const index = new Map(distances.codes.map((code, i) => [code, i]));
const n = distances.codes.length;

/** Menor distância em km entre as fronteiras de dois países (tabela gerada em scripts/build-data.ts). */
export function borderDistance(a: string, b: string): number {
  if (a === b) return 0;
  let i = index.get(a)!;
  let j = index.get(b)!;
  if (i > j) [i, j] = [j, i];
  // Triângulo superior da matriz, linha por linha.
  return distances.km[i * n - (i * (i + 1)) / 2 + (j - i - 1)];
}

export const engine: GameEngine<CalorPuzzle, string, CalorFeedback> = {
  createChallenge(dateKey) {
    // Microestados ficam de fora da resposta: no globo seriam um ponto invisível.
    const pool = countries.filter((c) => c.shapeEligible);
    return { puzzle: {}, answer: pickDaily(pool, { slug: "calor", dateKey }).code };
  },

  checkGuess(input, answer, previous) {
    const country = findCountry(input);
    if (!country) return { ok: false, error: "Não conhecemos esse país" };
    if (previous.some((g) => g.feedback.code === country.code)) {
      return { ok: false, error: "Você já tentou esse país" };
    }
    return {
      ok: true,
      feedback: { code: country.code, name: country.name, km: borderDistance(country.code, answer) },
      solved: country.code === answer,
    };
  },

  describeAnswer: (code) => getCountry(code)?.name ?? code,
};
