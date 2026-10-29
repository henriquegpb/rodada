"use client";

import { useState, type ReactNode } from "react";
import { Check, Keyboard, LayoutGrid, SkipForward, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { BoardProps, PlayView, QuizRules } from "../../types";
import { SuggestInput, type Suggestion } from "../SuggestInput";
import type { QuizFeedback, QuizQuestion } from "./quiz";

type Mode = "type" | "choose";

/** Digitar ou escolher entre 4: preferência de cada aparelho, guardada em `key`. */
function readMode(key: string): Mode {
  try {
    return localStorage.getItem(key) === "choose" ? "choose" : "type";
  } catch {
    return "type";
  }
}

/**
 * Tabuleiro dos quizzes de geografia: uma pergunta por vez, uma resposta cada, digitando ou
 * escolhendo entre 4. `card` é o que muda entre eles (silhueta e nome do país, bandeira…).
 */
export function QuizBoard<Q extends QuizQuestion, F extends QuizFeedback>({
  play,
  rules,
  submitGuess,
  questions,
  card,
  answers,
  search,
  placeholder,
  typeLabel,
  modeKey,
}: Pick<BoardProps<unknown, F, QuizRules>, "play" | "rules" | "submitGuess"> & {
  questions: readonly Q[];
  /** Conteúdo do cartão da pergunta; `index` começa em 0. */
  card(question: Q, index: number): ReactNode;
  /** Lista do que já foi respondido, embaixo do tabuleiro. */
  answers: ReactNode;
  search(query: string): Suggestion[];
  placeholder: string;
  /** Botão que volta a digitar ("Digitar a capital"). */
  typeLabel: string;
  modeKey: string;
}) {
  const playing = play.status === "playing";
  const index = play.guesses.length;
  const current = playing ? questions[index] : undefined;
  const last = play.guesses.at(-1)?.feedback;
  const [mode, setMode] = useState<Mode>(() => readMode(modeKey));
  const [busy, setBusy] = useState(false);

  function switchMode() {
    const next = mode === "type" ? "choose" : "type";
    setMode(next);
    try {
      localStorage.setItem(modeKey, next);
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

  async function choose(choice: string) {
    const error = await answer(choice);
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
                current && i === index && "bg-foreground/40",
              )}
            />
          );
        })}
      </ol>

      {current && (
        <>
          <div key={`card-${index}`} className="flex flex-col items-center gap-4 rounded-lg bg-card px-6 py-6 animate-rise sm:gap-5 sm:py-8">
            {card(current, index)}
          </div>

          {last && (
            <p
              key={`last-${index}`}
              className={cn("-mt-2 flex items-center justify-center gap-1.5 text-sm font-semibold animate-rise", last.correct ? "text-success" : "text-destructive")}
            >
              {last.correct ? <Check size={16} strokeWidth={3} /> : <X size={16} strokeWidth={3} />}
              {last.correct ? last.answer : `Era ${last.answer}`}
            </p>
          )}

          {mode === "type" ? (
            // O campo continua montado entre as perguntas: assim o teclado do celular não fecha.
            <SuggestInput onGuess={answer} search={search} placeholder={placeholder} />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {current.choices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  disabled={busy}
                  onClick={() => choose(choice)}
                  className="min-h-14 rounded-md border border-border bg-card px-3 py-2 text-[15px] font-semibold transition-[background-color,transform] hover:bg-secondary active:scale-[.98] disabled:opacity-60"
                >
                  {choice}
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
              {mode === "type" ? "Ver 4 alternativas" : typeLabel}
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

      {play.guesses.length > 0 && answers}
    </div>
  );
}

/** Bandeira de um país pelo código, das imagens de public/flags. */
export function Flag({ code, alt, className }: { code: string; alt: string; className?: string }) {
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
 * Cada pergunta já respondida: a bandeira, a resposta certa e, se errou, o que a pessoa disse.
 * `compact` é o resumo do resultado: uma linha por pergunta, para as 10 caberem no modal.
 */
export function QuizAnswers<F extends QuizFeedback>({
  play,
  title,
  said,
  compact = false,
}: {
  play: PlayView<unknown, F>;
  /** Texto principal da linha; `index` começa em 0. */
  title(feedback: F, index: number): ReactNode;
  /** O que a pessoa respondeu (vazio quando pulou). */
  said(feedback: F): string;
  compact?: boolean;
}) {
  return (
    <ol className="flex flex-col">
      {play.guesses.map(({ feedback: g }, i) => {
        const reply = said(g) ? <s>{said(g)}</s> : "pulou";
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
                {title(g, i)}
                {!g.correct &&
                  (compact ? (
                    <span className="text-muted-foreground"> ({reply})</span>
                  ) : (
                    <span className="block truncate text-xs text-muted-foreground">{reply}</span>
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
