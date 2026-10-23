import { DAILY_SEED, createRng, pickDailyMany, shuffle } from "@/lib/daily/seed";
import type { GameEngine } from "../types";
import { getCountry, nameKey } from "../_shared/geo";
import shapes from "../pais/data/shapes.json";
import capitals from "./data/capitals.json";
import type { CapitalFeedback, CapitalPuzzle } from "./types";

export interface CapitalEntry {
  code: string;
  capital: string;
  aliases: string[];
  /** 1 = conhecida, 2 = média, 3 = difícil. */
  tier: number;
}

const entries: readonly CapitalEntry[] = capitals;
const paths: Record<string, string> = shapes;

/** Quantas perguntas de cada nível por dia, nesta ordem: começa fácil e termina difícil. */
const MIX: [tier: number, count: number][] = [
  [1, 3],
  [2, 4],
  [3, 3],
];
export const QUESTIONS = MIX.reduce((sum, [, count]) => sum + count, 0);

// Microestados viram um pontinho na silhueta: valem como resposta digitada, mas não são perguntados.
const eligible = entries.filter((e) => getCountry(e.code)?.shapeEligible);

/** Nome ou grafia alternativa → capital, para reconhecer o que foi digitado. */
const byName = new Map<string, { entry: CapitalEntry; name: string }>();
for (const entry of entries) {
  // A grafia sem acento ("Tripoli") não toma o lugar do nome principal ("Trípoli").
  for (const name of [entry.capital, ...entry.aliases]) {
    if (!byName.has(nameKey(name))) byName.set(nameKey(name), { entry, name });
  }
}

const cities = entries
  .map((e) => ({ name: e.capital, aliases: e.aliases }))
  .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

/** Três capitais erradas para as alternativas, de preferência do mesmo continente. */
function distractors(answer: CapitalEntry, rng: () => number): string[] {
  const continent = getCountry(answer.code)?.continent;
  const others = shuffle(
    entries.filter((e) => e.code !== answer.code),
    rng,
  );
  const near = others.filter((e) => getCountry(e.code)?.continent === continent);
  const far = others.filter((e) => getCountry(e.code)?.continent !== continent);
  return [...near, ...far].slice(0, 3).map((e) => e.capital);
}

export const engine: GameEngine<CapitalPuzzle, CapitalEntry[], CapitalFeedback> = {
  createChallenge(dateKey) {
    const answer = MIX.flatMap(([tier, count]) =>
      pickDailyMany(
        eligible.filter((e) => e.tier === tier),
        count,
        { slug: `capital:${tier}`, dateKey },
      ),
    );
    const rng = createRng(`${DAILY_SEED}:capital:choices:${dateKey}`);
    const questions = answer.map((e) => ({
      code: e.code,
      country: getCountry(e.code)!.name,
      path: paths[e.code],
      choices: shuffle([e.capital, ...distractors(e, rng)], rng),
    }));
    return { puzzle: { questions, cities }, answer };
  },

  checkGuess(input, answer, previous) {
    const question = answer[previous.length];
    if (!question) return { ok: false, error: "Você já respondeu todas" };
    const last = previous.length === answer.length - 1;
    const allRightSoFar = previous.every((g) => g.feedback.correct);

    // Pular conta como erro: a resposta é revelada e segue para o próximo.
    if (!input.trim()) {
      return { ok: true, solved: false, feedback: { code: question.code, city: "", answer: question.capital, correct: false } };
    }
    const match = byName.get(nameKey(input));
    if (!match) return { ok: false, error: "Essa não é uma capital da lista" };
    const correct = match.entry.code === question.code;
    return {
      ok: true,
      solved: correct && last && allRightSoFar,
      feedback: { code: question.code, city: match.name, answer: question.capital, correct },
    };
  },

  // Cada resposta já aparece no tabuleiro; não há uma resposta única a revelar no fim.
  describeAnswer: () => "",
};
