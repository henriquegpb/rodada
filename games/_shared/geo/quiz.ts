import type { PlayView } from "../../types";

/** Uma pergunta dos quizzes de geografia (Capital, Bandeira): as 4 alternativas, já embaralhadas. */
export interface QuizQuestion {
  choices: string[];
}

/** O que os quizzes guardam de cada resposta: o país da pergunta, a resposta certa e se acertou. */
export interface QuizFeedback {
  code: string;
  answer: string;
  correct: boolean;
}

/** Duas linhas de 5, como um cartão de respostas. */
export function quizShareGrid(play: PlayView<unknown, QuizFeedback>): string {
  const marks = play.guesses.map((g) => (g.feedback.correct ? "🟩" : "🟥"));
  return [marks.slice(0, 5).join(""), marks.slice(5).join("")].filter(Boolean).join("\n");
}
