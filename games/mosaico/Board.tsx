"use client";

import { cn } from "@/lib/utils";
import type { AttemptRules, BoardProps } from "../types";
import { CountryBoard } from "../_shared/geo/CountryBoard";
import type { CountryFeedback } from "../_shared/geo/types";
import { COLS, ROWS, type MosaicoPuzzle } from "./types";

/**
 * A bandeira começa com uma peça à mostra; cada erro revela mais uma, na ordem sorteada do dia.
 * No fim da partida, tudo aparece.
 */
export function MosaicoBoard(props: BoardProps<MosaicoPuzzle, CountryFeedback, AttemptRules>) {
  const { play } = props;
  const shown = play.status === "playing" ? play.guesses.length + 1 : COLS * ROWS;
  const revealed = new Set(play.puzzle.order.slice(0, shown));

  return (
    <CountryBoard
      {...props}
      visual={
        <div className="relative aspect-[4/3] w-full max-w-[420px] overflow-hidden rounded-[4px] shadow-[0_16px_40px_rgba(0,0,0,.4)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG local, sem ganho com next/image */}
          <img src={play.puzzle.image} alt="" className="absolute inset-0 size-full object-cover" draggable={false} />
          <div
            className="absolute inset-0 grid gap-[3px] bg-transparent"
            style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}
            role="img"
            aria-label={`Bandeira do dia, ${revealed.size} de ${COLS * ROWS} peças reveladas`}
          >
            {Array.from({ length: COLS * ROWS }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "grid place-items-center bg-secondary text-2xl font-extrabold text-muted-foreground/40 outline outline-[3px] outline-card transition-[opacity,transform] duration-500 ease-[cubic-bezier(.22,1,.36,1)]",
                  revealed.has(i) && "scale-95 opacity-0",
                )}
              >
                ?
              </span>
            ))}
          </div>
        </div>
      }
    />
  );
}
