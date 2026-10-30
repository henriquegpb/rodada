import { DAILY_SEED, createRng, pickDailyMany, shuffle } from "@/lib/daily/seed";
import type { GameEngine } from "../types";
import { type Country, countries, findCountry, getCountry } from "../_shared/geo";
import tiers from "./data/tiers.json";
import type { BandeiraFeedback, BandeiraPuzzle } from "./types";

/** Códigos dos países por nível da bandeira: 1 = conhecida, 2 = média, 3 = difícil. */
export const TIERS: Record<string, string[]> = tiers;

/** Quantas perguntas de cada nível por dia, nesta ordem: começa fácil e termina difícil. */
const MIX: [tier: number, count: number][] = [
  [1, 3],
  [2, 4],
  [3, 3],
];
export const QUESTIONS = MIX.reduce((sum, [, count]) => sum + count, 0);

/** Três países errados para as alternativas, de preferência do mesmo continente. */
function distractors(answer: Country, rng: () => number): string[] {
  const others = shuffle(
    countries.filter((c) => c.code !== answer.code),
    rng,
  );
  const near = others.filter((c) => c.continent === answer.continent);
  const far = others.filter((c) => c.continent !== answer.continent);
  return [...near, ...far].slice(0, 3).map((c) => c.name);
}

export const engine: GameEngine<BandeiraPuzzle, string[], BandeiraFeedback> = {
  createChallenge(dateKey) {
    const answer = MIX.flatMap(([tier, count]) =>
      pickDailyMany(TIERS[tier], count, { slug: `bandeira:${tier}`, dateKey }),
    );
    const rng = createRng(`${DAILY_SEED}:bandeira:choices:${dateKey}`);
    const questions = answer.map((code) => {
      const country = getCountry(code)!;
      return {
        // Com o backend, vira uma rota que serve a bandeira sem identificar o código.
        image: `/flags/${code}.svg`,
        choices: shuffle([country.name, ...distractors(country, rng)], rng),
      };
    });
    return { puzzle: { questions }, answer };
  },

  checkGuess(input, answer, previous) {
    const code = answer[previous.length];
    if (!code) return { ok: false, error: "Você já respondeu todas" };
    const country = getCountry(code)!;
    const last = previous.length === answer.length - 1;
    const allRightSoFar = previous.every((g) => g.feedback.correct);

    // Pular conta como erro: a resposta é revelada e segue para a próxima.
    if (!input.trim()) {
      return { ok: true, solved: false, feedback: { code, name: "", answer: country.name, correct: false } };
    }
    // Sem o código: "al" digitado e enviado não vira Albânia.
    const guess = findCountry(input, { byCode: false });
    if (!guess) return { ok: false, error: "Esse não é um país da lista" };
    const correct = guess.code === code;
    return {
      ok: true,
      solved: correct && last && allRightSoFar,
      feedback: { code, name: guess.name, answer: country.name, correct },
    };
  },

  // Cada resposta já aparece no tabuleiro; não há uma resposta única a revelar no fim.
  describeAnswer: () => "",
};
