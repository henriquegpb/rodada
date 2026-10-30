import { Lightbulb } from "lucide-react";
import type { PlayView } from "../types";
import { HEATS, HEAT_COLOR, HEAT_LABEL, heatCounts, hintCount } from "./rank";
import type { SentidoFeedback } from "./types";

/** Resumo do Sentido: quantos chutes caíram em cada faixa, sem entregar as palavras. */
export function SentidoRecap({ play }: { play: PlayView<unknown, SentidoFeedback> }) {
  const counts = heatCounts(play);
  const hints = hintCount(play);
  const max = Math.max(1, ...Object.values(counts));
  return (
    <div className="flex flex-col gap-2">
      {HEATS.map((heat) => (
        <div key={heat} className="grid grid-cols-[3.5rem_1fr_2.5rem] items-center gap-3 text-sm">
          <span className="text-muted-foreground">{HEAT_LABEL[heat]}</span>
          <span className="h-3 rounded-full bg-secondary">
            <span
              className="block h-full rounded-full"
              style={{ width: `${(counts[heat] / max) * 100}%`, background: HEAT_COLOR[heat] }}
            />
          </span>
          <span className="text-right font-semibold tabular-nums">{counts[heat]}</span>
        </div>
      ))}
      {hints > 0 && (
        <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <Lightbulb size={14} /> {hints} {hints === 1 ? "dica" : "dicas"}
        </p>
      )}
    </div>
  );
}
