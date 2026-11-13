import { Heart, Lightbulb } from "lucide-react";
import type { PlayView } from "../types";
import { TrilhaGrid, type Stroke } from "./Grid";
import { RULES, hintsOf, lockedPath, mistakesOf, solutionPath } from "./rules";
import type { TrilhaFeedback, TrilhaPuzzle } from "./types";

/** Resumo da Trilha: o tabuleiro em miniatura com o caminho, as vidas que sobraram e as dicas. */
export function TrilhaRecap({ play }: { play: PlayView<TrilhaPuzzle, TrilhaFeedback> }) {
  const locked = lockedPath(play.puzzle.numbers, play.guesses);
  const rest = solutionPath(play.answerLabel).slice(locked.length - 1);
  const strokes: Stroke[] = [{ cells: locked, tone: "locked" }, ...(rest.length > 1 ? [{ cells: rest, tone: "solution" as const }] : [])];
  const lives = RULES.lives - mistakesOf(play);
  const hints = hintsOf(play);
  return (
    <div className="flex flex-col items-center gap-3">
      <TrilhaGrid puzzle={play.puzzle} strokes={strokes} className="w-40" aria-hidden="true" />
      <p className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="flex gap-0.5" aria-label={`${lives} de ${RULES.lives} vidas`}>
          {Array.from({ length: RULES.lives }, (_, i) => (
            <Heart key={i} size={15} className={i < lives ? "fill-destructive text-destructive" : "text-muted-foreground/40"} />
          ))}
        </span>
        {hints > 0 && (
          <span className="flex items-center gap-1">
            <Lightbulb size={14} /> {hints} {hints === 1 ? "dica" : "dicas"}
          </span>
        )}
      </p>
    </div>
  );
}
