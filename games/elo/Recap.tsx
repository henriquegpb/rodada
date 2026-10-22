import { cn } from "@/lib/utils";
import type { PlayView } from "../types";
import { LEVEL_COLOR } from "./levels";
import type { EloFeedback } from "./types";

/** Resumo do Elo: uma linha por chute, na cor do grupo quando acertou (sem entregar as palavras). */
export function EloRecap({ play, className }: { play: PlayView<unknown, EloFeedback>; className?: string }) {
  return (
    <div className={cn("mx-auto flex w-fit flex-col gap-1", className)}>
      {play.guesses.map(({ feedback }, row) => (
        <div key={row} className="flex gap-1">
          {feedback.words.map((_, col) => (
            <span
              key={col}
              className={cn("size-5 rounded-[4px]", !feedback.group && "bg-tile-absent")}
              style={feedback.group ? { background: LEVEL_COLOR[feedback.group.level] } : undefined}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
