import type { PlayView } from "../types";
import { countriesByContinent } from "./continents";
import type { MundoFeedback } from "./types";

/** Resumo do Mundo: uma barra de progresso por continente. */
export function MundoRecap({ play, color }: { play: PlayView<unknown, MundoFeedback>; color: string }) {
  const found = new Set(play.guesses.map((g) => g.feedback.code));
  return (
    <ul className="flex flex-col gap-2.5">
      {countriesByContinent.map((c) => {
        const n = c.countries.filter((x) => found.has(x.code)).length;
        return (
          <li key={c.id} className="grid grid-cols-[8.5rem_1fr_3.25rem] items-center gap-3 text-sm">
            <span className="truncate font-medium">{c.name}</span>
            <span className="h-2 overflow-hidden rounded-full bg-secondary">
              <span
                className="block h-full rounded-full"
                style={{ width: `${(100 * n) / c.countries.length}%`, background: color }}
              />
            </span>
            <span className="text-right tabular-nums text-muted-foreground">
              {n}/{c.countries.length}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
