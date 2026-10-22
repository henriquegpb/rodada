"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowUp, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttemptRules, BoardProps } from "../../types";
import { CountryInput } from "./CountryInput";
import { DIRECTION_DEG, formatDistance } from "./index";
import type { CountryFeedback } from "./types";

/** Tabuleiro dos jogos de país. `visual` é o que muda entre eles: bandeira, silhueta… */
export function CountryBoard<P>({
  play,
  rules,
  submitGuess,
  visual,
}: BoardProps<P, CountryFeedback, AttemptRules> & { visual: ReactNode }) {
  const { maxAttempts } = rules;
  const [lastAdded, setLastAdded] = useState<number | null>(null);
  const playing = play.status === "playing";
  const guessed = useMemo(() => new Set(play.guesses.map((g) => g.feedback.code)), [play.guesses]);

  async function guess(name: string) {
    const error = await submitGuess(name);
    if (!error) setLastAdded(play.guesses.length);
    return error;
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="grid min-h-[260px] place-items-center rounded-lg bg-card px-6 py-10">{visual}</div>

      {playing && <CountryInput onGuess={guess} exclude={guessed} />}

      <table className="w-full text-[15px]">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="w-8 pb-2 font-normal">#</th>
            <th className="pb-2 font-normal">País</th>
            <th className="pb-2 text-right font-normal">Distância</th>
            <th className="w-16 pb-2 text-center font-normal">Rumo</th>
            <th className="w-14 pb-2 text-right font-normal">Perto</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxAttempts }, (_, i) => {
            const g = play.guesses[i]?.feedback;
            const correct = g?.direction === null;
            return (
              <tr
                key={i}
                className={cn("h-12 border-t border-border", i === lastAdded && "animate-rise")}
                style={correct ? { color: "var(--tile-correct)" } : undefined}
              >
                <td className="tabular-nums text-muted-foreground">{i + 1}</td>
                {g ? (
                  <>
                    <td className="truncate font-semibold">{g.name}</td>
                    <td className="text-right tabular-nums">{formatDistance(g.distanceKm)}</td>
                    <td>
                      <span className="mx-auto grid size-8 place-items-center rounded-full bg-secondary">
                        {correct ? (
                          <Check size={16} strokeWidth={3} />
                        ) : (
                          <ArrowUp
                            size={16}
                            strokeWidth={2.5}
                            style={{ transform: `rotate(${DIRECTION_DEG[g.direction!]}deg)` }}
                            aria-label={`direção ${g.direction}`}
                          />
                        )}
                      </span>
                    </td>
                    <td className="text-right font-semibold tabular-nums" style={{ color: heat(g.proximity) }}>
                      {g.proximity}%
                    </td>
                  </>
                ) : (
                  <td colSpan={4} className="text-muted-foreground/40">
                    —
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Proximidade em cor: longe = apagado, perto = laranja do Rodada. */
function heat(proximity: number): string {
  return `color-mix(in oklab, var(--tile-correct) ${Math.round(proximity ** 1.6 / 100 ** 0.6)}%, var(--muted-foreground))`;
}
