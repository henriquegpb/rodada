import { Crown, Heart, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlayView } from "../types";
import { regionsOf, solutionCells } from "./Board";
import { REGION_COLORS, RULES, hintsOf, mistakesOf } from "./rules";
import type { RainhasFeedback, RainhasPuzzle } from "./types";

/** Resumo das Rainhas: o tabuleiro em miniatura com as rainhas, as vidas que sobraram e as dicas. */
export function RainhasRecap({ play }: { play: PlayView<RainhasPuzzle, RainhasFeedback> }) {
  const { size } = play.puzzle;
  const placed = play.guesses.filter((g) => g.feedback.correct).map((g) => g.feedback.cell);
  const solution = solutionCells(play.answerLabel, size);
  const lives = RULES.lives - mistakesOf(play);
  const hints = hintsOf(play);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="grid w-40 gap-px" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
        {regionsOf(play.puzzle).map((g, i) => (
          <span key={i} className="grid aspect-square place-items-center rounded-[2px] text-ink" style={{ background: REGION_COLORS[g] }}>
            {(placed.includes(i) || solution.includes(i)) && (
              <Crown className={cn("size-[70%]", placed.includes(i) ? "fill-ink" : "opacity-40")} strokeWidth={2} />
            )}
          </span>
        ))}
      </div>
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
