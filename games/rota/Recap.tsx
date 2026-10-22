import type { PlayView } from "../types";
import { VERDICT_COLOR } from "./colors";
import type { RotaFeedback } from "./types";

/** Resumo da Rota: os chutes na ordem, cada um com a cor de quão perto do caminho ficou. */
export function RotaRecap({ play }: { play: PlayView<unknown, RotaFeedback> }) {
  return (
    <ul className="flex flex-wrap justify-center gap-2">
      {play.guesses.map(({ feedback }) => (
        <li key={feedback.code} className="flex items-center gap-2 rounded-full bg-secondary py-1.5 pl-2.5 pr-3.5 text-sm font-medium">
          <span className="size-2.5 rounded-full" style={{ background: VERDICT_COLOR[feedback.verdict] }} />
          {feedback.name}
        </li>
      ))}
    </ul>
  );
}
