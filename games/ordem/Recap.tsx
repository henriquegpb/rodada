import type { PlayView } from "../types";
import { CATEGORIES, COLOR, MARK_EMOJI } from "./rules";
import type { OrdemFeedback, OrdemPuzzle } from "./types";

/** Resumo do Ordem: uma linha por tentativa, verde onde o país estava no lugar certo. */
export function OrdemRecap({ play }: { play: PlayView<OrdemPuzzle, OrdemFeedback> }) {
  if (!play.guesses.length) return null;
  return (
    <ol className="mx-auto flex w-fit flex-col gap-1.5">
      {play.guesses.map(({ feedback }, n) => (
        <li key={n} className="flex gap-1.5" aria-label={`Tentativa ${n + 1}: ${feedback.marks.filter((m) => m === "correct").length} de 5 no lugar certo`}>
          {feedback.marks.map((mark, i) => (
            <span key={i} className="size-7 rounded-md bg-secondary" style={mark === "correct" ? { background: COLOR } : undefined} />
          ))}
        </li>
      ))}
    </ol>
  );
}

/** A categoria do dia e uma linha de quadrados por tentativa: 🟩 no lugar certo, ⬛ fora. */
export function ordemShareGrid(play: PlayView<OrdemPuzzle, OrdemFeedback>): string {
  const { emoji, label } = CATEGORIES[play.puzzle.category];
  const grid = play.guesses.map((g) => g.feedback.marks.map((m) => MARK_EMOJI[m]).join("")).join("\n");
  return `${emoji} ${label}\n${grid}`;
}
