import type { PlayView } from "../types";
import { COLOR } from "./color";
import { Arm, Dial, Hub, Wedge, sweepBetween } from "./Dial";
import { HEAT, byRound } from "./heat";
import type { GrauFeedback, GrauPuzzle } from "./types";

/** Resumo do Grau: cada ângulo num mostrador pequeno, com a faixa de cada chute. */
export function GrauRecap({ play }: { play: PlayView<GrauPuzzle, GrauFeedback> }) {
  const { read, draw } = play.puzzle;
  const rounds = byRound(play.guesses);
  const readValue = rounds[1].find((f) => f.heat === 0)?.exact ?? (play.answerLabel ? Number.parseInt(play.answerLabel) : undefined);
  const rows = [
    { label: "Leia", value: readValue, from: read.from, sweep: sweepBetween(read.from, read.to), list: rounds[1] },
    { label: "Desenhe", value: draw.target, from: draw.from, sweep: draw.target, list: rounds[2] },
  ];
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row, i) => (
        <li key={row.label} className="flex items-center gap-4 rounded-lg bg-secondary px-3 py-2.5">
          <Dial className="size-14 shrink-0">
            <Wedge from={row.from} sweep={row.sweep} color={COLOR} r={80} width={12} />
            <Arm dir={row.from} width={20} />
            <Arm dir={row.from + row.sweep} width={20} />
            <Hub r={22} />
          </Dial>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              {i + 1} · {row.label}
              {row.value !== undefined && <strong className="ml-1.5 font-semibold tabular-nums text-foreground">{row.value}°</strong>}
            </p>
            {row.list.length > 0 ? (
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
                {row.list.map((f) => (
                  <span key={f.value} className="flex items-center gap-1">
                    <span className="size-2.5 rounded-full" style={{ background: HEAT[f.heat].color }} />
                    {f.value}°
                  </span>
                ))}
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">Não chegou neste</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Uma linha por ângulo jogado, com a faixa de cada chute. */
export function grauShareGrid(play: PlayView<GrauPuzzle, GrauFeedback>): string {
  const rounds = byRound(play.guesses);
  return (["1️⃣", "2️⃣"] as const)
    .map((tag, i) => {
      const list = rounds[(i + 1) as 1 | 2];
      return list.length ? `${tag} ${list.map((f) => HEAT[f.heat].emoji).join("")}` : "";
    })
    .filter(Boolean)
    .join("\n");
}
