import { pickDaily } from "@/lib/daily/seed";
import type { GameEngine } from "../../types";
import {
  bearing,
  type Country,
  distanceKm,
  findCountry,
  getCountry,
  proximity,
  toDirection,
} from "./index";
import type { CountryFeedback } from "./types";

/**
 * Engine comum aos jogos de adivinhar país: muda só o conjunto de respostas
 * e o que o jogador vê (bandeira, silhueta…).
 */
export function createCountryEngine<P>({
  slug,
  pool,
  puzzleFor,
}: {
  slug: string;
  pool: readonly Country[];
  puzzleFor(country: Country): P;
}): GameEngine<P, string, CountryFeedback> {
  return {
    createChallenge(dateKey) {
      const country = pickDaily(pool, { slug, dateKey });
      return { puzzle: puzzleFor(country), answer: country.code };
    },

    checkGuess(input, answerCode, previous) {
      const guess = findCountry(input);
      if (!guess) return { ok: false, error: "Não conhecemos esse país" };
      if (previous.some((g) => g.feedback.code === guess.code)) {
        return { ok: false, error: "Você já tentou esse país" };
      }
      const answer = getCountry(answerCode)!;
      const solved = guess.code === answer.code;
      const km = solved ? 0 : distanceKm(guess, answer);
      return {
        ok: true,
        solved,
        feedback: {
          code: guess.code,
          name: guess.name,
          distanceKm: Math.round(km),
          direction: solved ? null : toDirection(bearing(guess, answer)),
          proximity: solved ? 100 : proximity(km),
        },
      };
    },

    describeAnswer: (code) => getCountry(code)?.name ?? code,
  };
}
