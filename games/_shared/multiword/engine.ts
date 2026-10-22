import { pickDaily } from "@/lib/daily/seed";
import { normalize } from "@/lib/normalize";
import type { GameEngine, Guess } from "../../types";
import { answers, checkWord, evaluate, WORD_LENGTH } from "../../palavra/engine";
import type { MultiWordFeedback, MultiWordPuzzle } from "./types";

const solvedIn = (feedback: MultiWordFeedback, board: number) =>
  feedback.boards[board]?.every((m) => m === "correct") ?? false;

/** Tabuleiros já resolvidos depois destas tentativas. */
export function solvedBoards(guesses: readonly Guess<MultiWordFeedback>[], boards: number): boolean[] {
  return Array.from({ length: boards }, (_, b) => guesses.some((g) => solvedIn(g.feedback, b)));
}

/**
 * Várias palavras ao mesmo tempo (Dupla, Quadra): cada tentativa vale para todos os tabuleiros
 * ainda abertos. Mesmas palavras, dicionário e regras de cor do Palavra.
 */
export function createMultiWordEngine(slug: string, boards: number): GameEngine<MultiWordPuzzle, string[], MultiWordFeedback> {
  return {
    createChallenge(dateKey) {
      // Uma palavra por tabuleiro, todas diferentes.
      const picked: string[] = [];
      for (let b = 0; b < boards; b++) {
        let attempt = 0;
        let word = pickDaily(answers, { slug: `${slug}:${b}`, dateKey });
        while (picked.includes(word)) word = pickDaily(answers, { slug: `${slug}:${b}:${++attempt}`, dateKey });
        picked.push(word);
      }
      return { puzzle: { length: WORD_LENGTH, boards }, answer: picked };
    },

    checkGuess(input, answer, previous) {
      const checked = checkWord(input, previous.map((g) => g.input));
      if (!checked.ok) return checked;
      const before = solvedBoards(previous, boards);
      const feedback: MultiWordFeedback = {
        letters: [...checked.word],
        boards: answer.map((word, b) => (before[b] ? null : evaluate(checked.guess, normalize(word)))),
      };
      const after = before.map((done, b) => done || solvedIn(feedback, b));
      return { ok: true, feedback, solved: after.every(Boolean) };
    },

    describeAnswer: (answer) => answer.map((w) => w.toUpperCase()).join(" · "),
  };
}
