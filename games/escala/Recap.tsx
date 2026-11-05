import { cn } from "@/lib/utils";
import type { PlayView } from "../types";
import { COLOR } from "./color";
import { pointsEmoji } from "./scene";
import type { EscalaFeedback, EscalaPuzzle, EscalaRound } from "./types";

/** Uma barra por rodada, com a nota. Com `onSelect`, cada linha vira botão para rever a rodada. */
export function RoundBars({
  rounds,
  results,
  selected,
  onSelect,
}: {
  rounds: EscalaRound[];
  results: EscalaFeedback[];
  selected?: number;
  onSelect?: (i: number) => void;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {rounds.map((r, i) => {
        const points = results[i]?.points ?? 0;
        const content = (
          <>
            <span className="w-32 shrink-0 truncate text-sm text-muted-foreground sm:w-48">
              {i + 1} · {r.target.name}
            </span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-foreground/[0.07]">
              <span
                className="block h-full rounded-full transition-[width] duration-500"
                style={{ width: `${points}%`, background: COLOR, opacity: selected === undefined || selected === i ? 1 : 0.55 }}
              />
            </span>
            <span className="w-9 shrink-0 text-right font-semibold tabular-nums">{results[i] ? points : "–"}</span>
          </>
        );
        return (
          <li key={i}>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(i)}
                className={cn("flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-secondary", selected === i && "bg-secondary")}
              >
                {content}
              </button>
            ) : (
              <div className="flex items-center gap-3 px-1 py-1.5">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function EscalaRecap({ play }: { play: PlayView<EscalaPuzzle, EscalaFeedback> }) {
  return <RoundBars rounds={play.puzzle.rounds} results={play.guesses.map((g) => g.feedback)} />;
}

/** Um quadrado por rodada, pela nota, e as notas embaixo. */
export function escalaShareGrid(play: PlayView<EscalaPuzzle, EscalaFeedback>): string {
  const points = play.guesses.map((g) => g.feedback.points);
  if (!points.length) return "";
  return `${points.map(pointsEmoji).join("")}\n${points.join(" · ")}`;
}
