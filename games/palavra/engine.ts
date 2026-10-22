import { pickDaily } from "@/lib/daily/seed";
import { normalize } from "@/lib/normalize";
import type { GameEngine } from "../types";
import answers from "./data/answers.json";
import valid from "./data/valid.json";
import type { LetterMark, PalavraFeedback, PalavraPuzzle } from "./types";

export const WORD_LENGTH = 5;

/** Forma normalizada → grafia com acento, para mostrar "CORAÇÃO" mesmo digitando "coracao". */
const dictionary = new Map(valid.map((w) => [normalize(w), w]));

/**
 * Compara duas palavras já normalizadas. Duas passadas para letras repetidas:
 * primeiro as posições exatas consomem as letras da resposta, depois as que sobraram
 * marcam "existe" da esquerda para a direita.
 */
export function evaluate(guess: string, answer: string): LetterMark[] {
  const marks: LetterMark[] = Array(guess.length).fill("absent");
  const remaining = new Map<string, number>();

  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answer[i]) marks[i] = "correct";
    else remaining.set(answer[i], (remaining.get(answer[i]) ?? 0) + 1);
  }
  for (let i = 0; i < guess.length; i++) {
    if (marks[i] === "correct") continue;
    const left = remaining.get(guess[i]) ?? 0;
    if (left > 0) {
      marks[i] = "present";
      remaining.set(guess[i], left - 1);
    }
  }
  return marks;
}

export const engine: GameEngine<PalavraPuzzle, string, PalavraFeedback> = {
  createChallenge(dateKey) {
    const answer = pickDaily(answers, { slug: "palavra", dateKey });
    return { puzzle: { length: WORD_LENGTH }, answer };
  },

  checkGuess(input, answer, previous) {
    const guess = normalize(input);
    if (guess.length !== WORD_LENGTH) return { ok: false, error: "Só palavras com 5 letras" };
    const word = dictionary.get(guess);
    if (!word) return { ok: false, error: "Essa palavra não está no dicionário" };
    if (previous.some((g) => normalize(g.input) === guess)) {
      return { ok: false, error: "Você já tentou essa palavra" };
    }
    const marks = evaluate(guess, normalize(answer));
    return {
      ok: true,
      feedback: { letters: [...word], marks },
      solved: marks.every((m) => m === "correct"),
    };
  },

  describeAnswer: (answer) => answer.toUpperCase(),
};
