import type { GameEngine } from "../types";
import { countries, findCountry } from "../_shared/geo";
import type { MundoFeedback, MundoPuzzle } from "./types";

/**
 * Não há resposta secreta: o desafio é a lista inteira, igual todo dia.
 * A engine só confere se o nome digitado é um país e se ainda não foi dito.
 */
export const engine: GameEngine<MundoPuzzle, null, MundoFeedback> = {
  createChallenge: () => ({ puzzle: { total: countries.length }, answer: null }),

  checkGuess(input, _answer, previous) {
    const country = findCountry(input, { byCode: false });
    if (!country) return { ok: false, error: "Não conhecemos esse país" };
    if (previous.some((g) => g.feedback.code === country.code)) {
      return { ok: false, error: `${country.name} já está na lista` };
    }
    return {
      ok: true,
      feedback: { code: country.code, name: country.name },
      solved: previous.length + 1 === countries.length,
    };
  },

  describeAnswer: () => "",
};
