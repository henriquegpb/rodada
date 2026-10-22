import type { PlayView } from "../types";
import { formatDistance } from "../_shared/geo";
import { ANSWER_COLOR, heatColor } from "./heat";
import type { CalorFeedback } from "./types";

/** Resumo do Calor: os chutes do mais perto ao mais longe, com a cor da distância. */
export function CalorRecap({ play }: { play: PlayView<unknown, CalorFeedback> }) {
  const answer = play.status === "won" ? play.guesses.at(-1)?.feedback.code : undefined;
  const sorted = [...play.guesses].map((g) => g.feedback).sort((a, b) => a.km - b.km);
  return (
    <ul className="flex flex-wrap justify-center gap-2">
      {sorted.map((g) => (
        <li key={g.code} className="flex items-center gap-2 rounded-full bg-secondary py-1.5 pl-2.5 pr-3.5 text-sm font-medium">
          <span
            className="size-2.5 rounded-full"
            style={{ background: g.code === answer ? ANSWER_COLOR : heatColor(g.km) }}
          />
          {g.name}
          {g.code !== answer && <span className="text-xs tabular-nums text-muted-foreground">{formatDistance(g.km)}</span>}
        </li>
      ))}
    </ul>
  );
}
