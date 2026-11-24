import { cn } from "@/lib/utils";
import type { PlayView } from "../types";
import { Creature } from "./art";
import { waterAt } from "./Scene";
import { MAX_POINTS, MILESTONES, depthAt, milestonesAt, pointsOf } from "./tiers";
import type { IncomumFeedback, IncomumPuzzle } from "./types";

/** Resumo do Incomum: os pontos, até onde o submarino desceu e os bichos que entraram na coleção. */
export function IncomumRecap({ play }: { play: PlayView<IncomumPuzzle, IncomumFeedback> }) {
  const points = pointsOf(play);
  const reached = milestonesAt(points);
  const last = MILESTONES[reached - 1];
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <strong className="text-lg tabular-nums">
        {points} de {MAX_POINTS} pontos
      </strong>
      <ol className="grid grid-cols-5 gap-1.5">
        {MILESTONES.map((m, i) => (
          <li
            key={m.name}
            className="grid size-11 place-items-center rounded-xl"
            style={{ background: i < reached ? waterAt(m.depth)[1] : "var(--secondary)" }}
            title={i < reached ? m.name : "Ainda não"}
          >
            <Creature art={m.art} className={cn("h-7 w-9", i >= reached && "opacity-25 brightness-0 dark:invert")} />
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted-foreground">
        Desceu até <strong className="text-foreground">−{Math.round(depthAt(points)).toLocaleString("pt-BR")} m</strong>
        {last && <> · último bicho: {last.name}</>} · {reached} de {MILESTONES.length}
      </p>
    </div>
  );
}
