import { cn } from "@/lib/utils";
import type { PlayView } from "../../types";
import type { LetterMark } from "../../palavra/types";
import type { MultiWordFeedback } from "./types";

const markClass: Record<LetterMark, string> = {
  correct: "bg-tile-correct",
  present: "bg-tile-present",
  absent: "bg-tile-absent",
};

/** Resumo: os tabuleiros em miniatura lado a lado, só com as cores. */
export function MultiWordRecap({ play }: { play: PlayView<unknown, MultiWordFeedback> }) {
  const boards = play.guesses[0]?.feedback.boards.length ?? 0;
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {Array.from({ length: boards }, (_, b) => (
        <div key={b} className="flex flex-col gap-0.5">
          {play.guesses.map(({ feedback }, row) => {
            const marks = feedback.boards[b];
            return marks ? (
              <div key={row} className="flex gap-0.5">
                {marks.map((m, i) => (
                  <span key={i} className={cn("size-3.5 rounded-[3px]", markClass[m])} />
                ))}
              </div>
            ) : null;
          })}
        </div>
      ))}
    </div>
  );
}

const EMOJI: Record<LetterMark, string> = { correct: "🟧", present: "🟦", absent: "⬛" };

/** Compartilhamento: em quantas tentativas cada palavra saiu e a grade de cada tabuleiro. */
export function multiWordShareGrid(play: PlayView<unknown, MultiWordFeedback>): string {
  const boards = play.guesses[0]?.feedback.boards.length ?? 0;
  const lines: string[] = [];
  for (let b = 0; b < boards; b++) {
    const rows = play.guesses.map((g) => g.feedback.boards[b]).filter((m): m is LetterMark[] => Boolean(m));
    const solved = rows.at(-1)?.every((m) => m === "correct");
    lines.push(`${b + 1}ª palavra: ${solved ? `${rows.length} tentativas` : "não saiu"}`);
    lines.push(...rows.map((marks) => marks.map((m) => EMOJI[m]).join("")));
    if (b < boards - 1) lines.push("");
  }
  return lines.join("\n");
}
