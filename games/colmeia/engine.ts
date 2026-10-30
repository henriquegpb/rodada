import { DAILY_SEED, createRng, pickDaily, shuffle } from "@/lib/daily/seed";
import { normalize } from "@/lib/normalize";
import type { GameEngine } from "../types";
import puzzles from "./data/puzzles.json";
import { MIN_LENGTH, isPangram, wordPoints } from "./score";
import type { ColmeiaFeedback, ColmeiaPuzzle } from "./types";

/** Uma colmeia do dia, gerada em scripts/build-colmeia.ts. */
export interface ColmeiaEntry {
  /** As 7 letras sem acento, em ordem alfabética. */
  letters: string;
  center: string;
  /** A lista oficial: palavras comuns, que contam no total, nas dicas e no "achou todas". */
  words: string[];
  /** Palavras válidas menos comuns: também valem pontos, para ninguém ter palavra de verdade recusada. */
  extra: string[];
}

export const PUZZLES: readonly ColmeiaEntry[] = puzzles;

export const engine: GameEngine<ColmeiaPuzzle, ColmeiaEntry, ColmeiaFeedback> = {
  createChallenge(dateKey) {
    const entry = pickDaily(PUZZLES, { slug: "colmeia", dateKey });
    const keys = entry.words.map(normalize);
    const grid: ColmeiaPuzzle["grid"] = {};
    const pairs: ColmeiaPuzzle["pairs"] = {};
    for (const key of keys) {
      const row = (grid[key[0]] ??= {});
      row[key.length] = (row[key.length] ?? 0) + 1;
      pairs[key.slice(0, 2)] = (pairs[key.slice(0, 2)] ?? 0) + 1;
    }
    const rng = createRng(`${DAILY_SEED}:colmeia:${dateKey}`);
    return {
      puzzle: {
        outer: shuffle([...entry.letters].filter((c) => c !== entry.center), rng),
        center: entry.center,
        totalWords: keys.length,
        maxPoints: keys.reduce((sum, k) => sum + wordPoints(k), 0),
        pangrams: keys.filter(isPangram).length,
        grid,
        pairs,
      },
      answer: entry,
    };
  },

  checkGuess(input, answer, previous) {
    // Acento e cedilha não importam: "cidada" vale "cidadã", "caca" vale "caça".
    const key = normalize(input);
    if (key.length < MIN_LENGTH) return { ok: false, error: "Muito curta: são pelo menos 4 letras" };
    if ([...key].some((c) => !answer.letters.includes(c))) return { ok: false, error: "Tem letra fora da colmeia" };
    if (!key.includes(answer.center)) {
      return { ok: false, error: `Falta a letra do meio (${answer.center.toUpperCase()})` };
    }
    const word = answer.words.find((w) => normalize(w) === key);
    const extra = word ? undefined : answer.extra.find((w) => normalize(w) === key);
    if (!word && !extra) return { ok: false, error: "Essa não está na lista" };
    if (previous.some((g) => g.feedback.word === (word ?? extra))) return { ok: false, error: "Você já achou essa" };
    const official = previous.filter((g) => !g.feedback.extra).length + (word ? 1 : 0);
    const feedback: ColmeiaFeedback = { word: (word ?? extra)!, points: wordPoints(key), pangram: isPangram(key) };
    if (extra) feedback.extra = true;
    return { ok: true, solved: official === answer.words.length, feedback };
  },

  // O tabuleiro mostra no fim as palavras que faltaram.
  describeAnswer: (entry) => entry.words.join(", "),
};
