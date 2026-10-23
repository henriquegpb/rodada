"use client";

import { useCallback, useState } from "react";
import { Check, Keyboard, LayoutGrid, SkipForward, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { BoardProps, QuizRules } from "../types";
import { nameKey } from "../_shared/geo";
import { SuggestInput, type Suggestion } from "../_shared/SuggestInput";
import type { CapitalFeedback, CapitalPuzzle, City } from "./types";

/** Digitar ou escolher entre 4: preferência de cada aparelho. */
const MODE_KEY = "rodada:capital:modo";
type Mode = "type" | "choose";

function readMode(): Mode {
  try {
    return localStorage.getItem(MODE_KEY) === "choose" ? "choose" : "type";
  } catch {
    return "type";
  }
}

/** Sugere pelo nome ou pela grafia que a pessoa está digitando ("Beij" mostra "Beijing"). */
function searchCities(cities: City[], query: string): Suggestion[] {
  const q = nameKey(query);
  if (!q) return [];
  const starts: Suggestion[] = [];
  const contains: Suggestion[] = [];
  for (const city of cities) {
    const names = [city.name, ...city.aliases];
    const start = names.find((n) => nameKey(n).startsWith(q));
    if (start) starts.push({ key: city.name, name: start });
    else {
      const inside = names.find((n) => nameKey(n).includes(q));
      if (inside) contains.push({ key: city.name, name: inside });
    }
  }
  return [...starts, ...contains].slice(0, 7);
}

export function CapitalBoard({ play, rules, submitGuess }: BoardProps<CapitalPuzzle, CapitalFeedback, QuizRules>) {
  const { questions, cities } = play.puzzle;
  const playing = play.status === "playing";
  const current = playing ? questions[play.guesses.length] : undefined;
  const last = play.guesses.at(-1)?.feedback;
  const [mode, setMode] = useState<Mode>(readMode);
  const [busy, setBusy] = useState(false);
  const search = useCallback((query: string) => searchCities(cities, query), [cities]);

  function switchMode() {
    const next = mode === "type" ? "choose" : "type";
    setMode(next);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {
      // Modo privado: vale só nesta visita.
    }
  }

  async function answer(input: string) {
    if (busy) return null;
    setBusy(true);
    const error = await submitGuess(input);
    setBusy(false);
    return error;
  }

  async function choose(city: string) {
    const error = await answer(city);
    if (error) toast(error);
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <ol className="flex gap-1.5" aria-label="Progresso">
        {Array.from({ length: rules.total }, (_, i) => {
          const g = play.guesses[i]?.feedback;
          return (
            <li
              key={i}
              aria-label={g ? `${i + 1}: ${g.correct ? "acertou" : "errou"}` : `${i + 1}`}
              className={cn(
                "h-2 flex-1 rounded-full bg-secondary transition-colors",
                g?.correct && "bg-success",
                g && !g.correct && "bg-destructive",
                current && i === play.guesses.length && "bg-foreground/40",
              )}
            />
          );
        })}
      </ol>

      {current && (
        <>
          <div key={current.code} className="flex flex-col items-center gap-4 rounded-lg bg-card px-6 py-6 animate-rise sm:gap-5 sm:py-8">
            <div className="flex w-full items-center justify-center gap-6 sm:gap-10">
              <svg
                viewBox="0 0 100 100"
                className="aspect-square w-full max-w-[120px] sm:max-w-[170px]"
                role="img"
                aria-label={`Silhueta de ${current.country}`}
              >
                <path d={current.path} className="fill-foreground" />
              </svg>
              <Flag code={current.code} className="w-full max-w-[120px] sm:max-w-[170px]" alt={`Bandeira de ${current.country}`} />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {play.guesses.length + 1} de {rules.total} · Qual é a capital?
              </p>
              <h2 className="font-display mt-1 text-3xl leading-tight">{current.country}</h2>
            </div>
          </div>

          {last && (
            <p
              key={play.guesses.length}
              className={cn("-mt-2 flex items-center justify-center gap-1.5 text-sm font-semibold animate-rise", last.correct ? "text-success" : "text-destructive")}
            >
              {last.correct ? <Check size={16} strokeWidth={3} /> : <X size={16} strokeWidth={3} />}
              {last.correct ? last.answer : `Era ${last.answer}`}
            </p>
          )}

          {mode === "type" ? (
            // O campo continua montado entre as perguntas: assim o teclado do celular não fecha.
            <SuggestInput onGuess={answer} search={search} placeholder="Digite a capital" />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {current.choices.map((city) => (
                <button
                  key={city}
                  type="button"
                  disabled={busy}
                  onClick={() => choose(city)}
                  className="min-h-14 rounded-md border border-border bg-card px-3 py-2 text-[15px] font-semibold transition-[background-color,transform] hover:bg-secondary active:scale-[.98] disabled:opacity-60"
                >
                  {city}
                </button>
              ))}
            </div>
          )}

          <div className="-mt-2 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={switchMode}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {mode === "type" ? <LayoutGrid size={15} /> : <Keyboard size={15} />}
              {mode === "type" ? "Ver 4 alternativas" : "Digitar a capital"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => choose("")}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Não sei <SkipForward size={15} />
            </button>
          </div>
        </>
      )}

      {play.guesses.length > 0 && <Answers play={play} />}
    </div>
  );
}

/** Bandeira do país, das mesmas imagens do jogo Bandeira (aqui o país não é segredo). */
function Flag({ code, alt, className }: { code: string; alt: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG local, sem ganho com next/image
    <img
      src={`/flags/${code}.svg`}
      alt={alt}
      draggable={false}
      className={cn("aspect-[4/3] rounded-[3px] object-cover ring-1 ring-black/10", className)}
    />
  );
}

/**
 * Cada país já respondido: a capital certa e, se errou, o que a pessoa disse. `compact` é o resumo
 * do resultado: uma linha por país, para os 10 caberem no modal.
 */
export function Answers({ play, compact = false }: { play: BoardProps<CapitalPuzzle, CapitalFeedback>["play"]; compact?: boolean }) {
  const { questions } = play.puzzle;
  return (
    <ol className="flex flex-col">
      {play.guesses.map(({ feedback: g }, i) => {
        const said = g.city ? <s>{g.city}</s> : "pulou";
        return (
          <li
            key={g.code}
            className={cn(
              "grid grid-cols-[1.25rem_1fr_auto] items-center gap-3",
              compact ? "py-1 text-sm" : "border-t border-border py-2.5 text-[15px]",
            )}
          >
            <span className="tabular-nums text-muted-foreground">{i + 1}</span>
            <span className={cn("flex min-w-0 items-center gap-2.5", compact && "gap-2")}>
              <Flag code={g.code} className={cn("shrink-0", compact ? "w-5" : "w-7")} alt="" />
              <span className={cn("min-w-0", compact && "truncate")}>
              <span className="font-semibold">{g.answer}</span>
              <span className="text-muted-foreground"> · {questions[i]?.country}</span>
              {!g.correct &&
                (compact ? (
                  <span className="text-muted-foreground"> ({said})</span>
                ) : (
                  <span className="block truncate text-xs text-muted-foreground">{said}</span>
                ))}
              </span>
            </span>
            <span
              className={cn(
                "grid place-items-center rounded-full",
                compact ? "size-5" : "size-7",
                g.correct ? "bg-success text-ink" : "bg-secondary text-destructive",
              )}
              aria-label={g.correct ? "acertou" : "errou"}
            >
              {g.correct ? <Check size={compact ? 12 : 14} strokeWidth={3} /> : <X size={compact ? 12 : 14} strokeWidth={3} />}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
