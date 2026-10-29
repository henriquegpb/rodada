"use client";

import { useRef, useState } from "react";
import { CornerDownLeft, Flag, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { FocusInput } from "@/components/microkit/focus-input";
import { cn } from "@/lib/utils";
import type { BoardProps, UnlimitedRules } from "../types";
import { HEAT_COLOR, HINT, closeness, heatOf, hintCount } from "./rank";
import type { SentidoFeedback, SentidoPuzzle } from "./types";

export function SentidoBoard({ play, submitGuess, finish }: BoardProps<SentidoPuzzle, SentidoFeedback, UnlimitedRules>) {
  const playing = play.status === "playing";
  const guesses = play.guesses.map((g) => g.feedback);
  const latest = guesses.at(-1);
  const sorted = [...guesses].sort((a, b) => a.rank - b.rank);
  const hints = hintCount(play);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function send(input: string) {
    if (busy) return;
    setBusy(true);
    const error = await submitGuess(input);
    setBusy(false);
    if (error) toast(error);
    else if (input !== HINT) setQuery("");
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-5">
      {playing ? (
        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) send(query);
          }}
        >
          <FocusInput
            ref={inputRef}
            value={query}
            placeholder="Digite uma palavra"
            aria-label="Palavra"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className="h-14 rounded-md pr-14 text-[17px]"
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={busy || !query.trim()}
            className="absolute right-2 top-2 grid size-10 place-items-center rounded-[5px] bg-primary text-primary-foreground transition-[opacity,transform] active:scale-95 disabled:opacity-30"
            aria-label="Chutar"
          >
            <CornerDownLeft size={18} strokeWidth={2.5} />
          </button>
        </form>
      ) : (
        <p className="text-center text-[15px]">
          {play.status === "won" ? (
            <>
              Você achou <strong>{latest?.word}</strong>.
            </>
          ) : (
            <>
              A palavra era <strong>{play.answerLabel}</strong>.
            </>
          )}
        </p>
      )}

      {latest && playing && (
        <div key={play.guesses.length} className="animate-rise">
          <Row guess={latest} highlight />
        </div>
      )}

      {guesses.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            {guesses.length} {guesses.length === 1 ? "chute" : "chutes"}
            {hints > 0 && ` · ${hints} ${hints === 1 ? "dica" : "dicas"}`}
          </h3>
          <ol className="flex flex-col gap-1.5">
            {sorted.map((g) => (
              <li key={g.word}>
                <Row guess={g} highlight={g === latest} />
              </li>
            ))}
          </ol>
        </section>
      )}

      {playing && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => send(HINT)}
            className="flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Lightbulb size={15} /> Dica
          </button>
          {guesses.length > 0 && (
            <button
              type="button"
              onClick={() => finish()}
              className="flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Flag size={15} /> Desistir e ver a resposta
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Um chute: a barra cresce e muda de cor quanto mais perto da palavra secreta. */
function Row({ guess, highlight = false }: { guess: SentidoFeedback; highlight?: boolean }) {
  const heat = heatOf(guess.rank);
  return (
    <div
      className={cn(
        "relative flex h-11 items-center justify-between overflow-hidden rounded-md bg-secondary px-4 text-[15px] font-semibold",
        highlight && "ring-2 ring-foreground",
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 opacity-35 transition-[width] duration-500"
        style={{ width: `${closeness(guess.rank)}%`, background: HEAT_COLOR[heat] }}
      />
      <span className="relative flex items-center gap-1.5">
        {guess.word}
        {guess.hint && <Lightbulb size={13} className="text-muted-foreground" aria-label="dica" />}
      </span>
      <span className="relative tabular-nums">{guess.rank.toLocaleString("pt-BR")}</span>
    </div>
  );
}
