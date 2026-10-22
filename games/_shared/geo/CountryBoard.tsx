"use client";

import { useId, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowUp, Check, CornerDownLeft } from "lucide-react";
import { toast } from "sonner";
import { FocusInput } from "@/components/microkit/focus-input";
import { cn } from "@/lib/utils";
import type { AttemptRules, BoardProps } from "../../types";
import { formatDistance, searchCountries, type Direction } from "./index";
import type { CountryFeedback } from "./types";

const DIRECTION_DEG: Record<Direction, number> = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SO: 225, O: 270, NO: 315 };

/** Tabuleiro dos jogos de país. `visual` é o que muda entre eles: bandeira, silhueta… */
export function CountryBoard<P>({
  play,
  rules,
  submitGuess,
  visual,
}: BoardProps<P, CountryFeedback, AttemptRules> & { visual: ReactNode }) {
  const { maxAttempts } = rules;
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastAdded, setLastAdded] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const playing = play.status === "playing";

  const guessed = useMemo(() => new Set(play.guesses.map((g) => g.feedback.code)), [play.guesses]);
  const suggestions = useMemo(
    () => searchCountries(query, 7).filter((c) => !guessed.has(c.code)),
    [query, guessed],
  );

  async function submit(value: string) {
    if (!value.trim() || busy) return;
    setBusy(true);
    const error = await submitGuess(value);
    setBusy(false);
    if (error) {
      toast(error);
      return;
    }
    setLastAdded(play.guesses.length);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="grid min-h-[260px] place-items-center rounded-lg bg-card px-6 py-10">{visual}</div>

      {playing && (
        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            submit(open && suggestions[highlight] ? suggestions[highlight].name : query);
          }}
        >
          <FocusInput
            ref={inputRef}
            value={query}
            placeholder="Digite um país"
            autoComplete="off"
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            className="h-14 rounded-md pr-14 text-[17px]"
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlight((h) => Math.min(suggestions.length - 1, h + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight((h) => Math.max(0, h - 1));
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
          />
          <button
            type="submit"
            disabled={busy || !query.trim()}
            className="absolute right-2 top-2 grid size-10 place-items-center rounded-[5px] bg-primary text-primary-foreground transition-[opacity,transform] active:scale-95 disabled:opacity-30"
            aria-label="Chutar"
          >
            <CornerDownLeft size={18} strokeWidth={2.5} />
          </button>
          {open && suggestions.length > 0 && (
            <ul
              id={listId}
              role="listbox"
              className="absolute inset-x-0 top-full z-20 mt-1.5 overflow-hidden rounded-md border border-border bg-popover py-1 shadow-2xl shadow-black/40 animate-rise"
            >
              {suggestions.map((c, i) => (
                <li
                  key={c.code}
                  role="option"
                  aria-selected={i === highlight}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    submit(c.name);
                  }}
                  onPointerEnter={() => setHighlight(i)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between px-4 py-2.5 text-[15px]",
                    i === highlight ? "bg-secondary text-foreground" : "text-muted-foreground",
                  )}
                >
                  {c.name}
                  {i === highlight && <CornerDownLeft size={14} className="text-muted-foreground" />}
                </li>
              ))}
            </ul>
          )}
        </form>
      )}

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
