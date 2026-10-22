import { cn } from "@/lib/utils";
import type { PlayView } from "../types";
import type { LetterMark, PalavraFeedback } from "./types";

const markClass: Record<LetterMark, string> = {
  correct: "bg-tile-correct",
  present: "bg-tile-present",
  absent: "bg-tile-absent",
};

/** Resumo do Palavra: o tabuleiro em miniatura, só com as cores (sem entregar as letras). */
export function PalavraRecap({ play }: { play: PlayView<unknown, PalavraFeedback> }) {
  return (
    <div className="mx-auto flex w-fit flex-col gap-1">
      {play.guesses.map(({ feedback }, row) => (
        <div key={row} className="flex gap-1">
          {feedback.marks.map((mark, col) => (
            <span key={col} className={cn("size-6 rounded-[4px]", markClass[mark])} />
          ))}
        </div>
      ))}
    </div>
  );
}
