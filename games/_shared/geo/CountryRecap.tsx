import { ArrowUp, Check } from "lucide-react";
import type { PlayView } from "../../types";
import { DIRECTION_DEG } from "./index";
import type { CountryFeedback } from "./types";

const SEGMENTS = 5;

/** Resumo dos jogos de país: cada chute com uma barra de proximidade em 5 partes e a direção. */
export function CountryRecap({ play, color }: { play: PlayView<unknown, CountryFeedback>; color: string }) {
  return (
    <ol className="flex flex-col gap-2">
      {play.guesses.map(({ feedback: g }, i) => {
        const correct = g.direction === null;
        const filled = Math.floor(g.proximity / (100 / SEGMENTS));
        return (
          <li key={g.code} className="grid grid-cols-[1rem_1fr_auto_1.75rem] items-center gap-3 text-sm">
            <span className="tabular-nums text-muted-foreground">{i + 1}</span>
            <span className="truncate font-medium">{g.name}</span>
            <span className="flex gap-[3px]" aria-label={`${g.proximity}% de proximidade`}>
              {Array.from({ length: SEGMENTS }, (_, s) => (
                <span
                  key={s}
                  className="h-3 w-4 rounded-[3px] bg-secondary"
                  style={s < filled ? { background: color } : undefined}
                />
              ))}
            </span>
            <span
              className="grid size-7 place-items-center rounded-full bg-secondary"
              style={correct ? { background: color, color: "var(--ink)" } : undefined}
            >
              {correct ? (
                <Check size={14} strokeWidth={3} />
              ) : (
                <ArrowUp size={14} strokeWidth={2.5} style={{ transform: `rotate(${DIRECTION_DEG[g.direction!]}deg)` }} />
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
