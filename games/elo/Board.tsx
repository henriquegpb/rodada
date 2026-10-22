"use client";

import { useState } from "react";
import { Flag, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { shuffle } from "@/lib/daily/seed";
import { cn } from "@/lib/utils";
import type { BoardProps, UnlimitedRules } from "../types";
import { LEVEL_COLOR } from "./levels";
import { EloRecap } from "./Recap";
import { GUESS_SEPARATOR, parseGroups } from "./text";
import type { EloFeedback, EloGroup, EloPuzzle } from "./types";

const GROUP_SIZE = 4;
/** Duração de `animate-shake` (app/globals.css). */
const SHAKE_MS = 420;

export function EloBoard({ play, submitGuess, finish }: BoardProps<EloPuzzle, EloFeedback, UnlimitedRules>) {
  const playing = play.status === "playing";
  const guesses = play.guesses.map((g) => g.feedback);
  const latest = guesses.at(-1);

  const found = guesses.flatMap((g) => (g.group ? [g.group] : []));
  // Quem desiste vê os grupos que faltaram, remontados a partir da resposta.
  const missed =
    play.status === "lost" && play.answerLabel
      ? parseGroups(play.answerLabel).filter((g) => !found.some((f) => f.level === g.level))
      : [];
  const taken = new Set(found.flatMap((g) => g.words));

  const [order, setOrder] = useState(play.puzzle.words);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [shaking, setShaking] = useState(false);
  // Palavras que acabaram de virar grupo saem da seleção sozinhas.
  const picked = selected.filter((w) => !taken.has(w));
  const remaining = order.filter((w) => !taken.has(w));

  function toggle(word: string) {
    if (!playing || busy) return;
    if (picked.includes(word)) return setSelected(picked.filter((w) => w !== word));
    if (picked.length === GROUP_SIZE) return;
    const next = [...picked, word];
    setSelected(next);
    // A quarta palavra marcada já é o chute.
    if (next.length === GROUP_SIZE) submit(next);
  }

  async function submit(words: string[]) {
    setBusy(true);
    const error = await submitGuess(words.join(GUESS_SEPARATOR));
    setBusy(false);
    if (error) {
      toast(error);
      return;
    }
    // Errou: as escolhidas tremem e continuam marcadas. Acertou: elas já viraram grupo e nada treme.
    setShaking(true);
    window.setTimeout(() => setShaking(false), SHAKE_MS);
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="min-h-6 text-center text-[15px]" aria-live="polite">
        {play.status === "won" ? (
          <strong>Você ligou tudo!</strong>
        ) : play.status === "lost" ? (
          <span className="text-muted-foreground">Os grupos que faltaram estão logo abaixo.</span>
        ) : !latest ? (
          <span className="text-muted-foreground">Escolha 4 palavras com algo em comum.</span>
        ) : latest.group ? (
          <strong style={{ color: LEVEL_COLOR[latest.group.level] }}>{latest.group.label}</strong>
        ) : latest.oneAway ? (
          <strong>Quase! Faltou uma.</strong>
        ) : (
          <span className="text-muted-foreground">Essas quatro não formam um grupo.</span>
        )}
      </p>

      <div className="flex flex-col gap-2">
        {found.map((g) => (
          <GroupRow key={g.level} group={g} />
        ))}
        {missed.map((g) => (
          <GroupRow key={g.level} group={g} muted />
        ))}

        {playing && (
          <div className="grid grid-cols-4 gap-2">
            {remaining.map((word) => {
              const on = picked.includes(word);
              return (
                <button
                  key={word}
                  type="button"
                  onClick={() => toggle(word)}
                  aria-pressed={on}
                  className={cn(
                    "flex h-16 items-center justify-center rounded-md px-0.5 font-bold leading-tight transition-colors sm:h-20",
                    word.length > 8 ? "text-[clamp(9px,2.7vw,13px)]" : "text-[clamp(11px,3.4vw,15px)]",
                    on ? "bg-foreground text-background" : "bg-secondary hover:bg-secondary/70",
                    on && shaking && "animate-shake",
                  )}
                >
                  {word}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {playing && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setOrder(shuffle(order, Math.random))}
            className="flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Shuffle size={15} /> Embaralhar
          </button>
          <button
            type="button"
            onClick={() => setSelected([])}
            disabled={picked.length === 0}
            className="h-10 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            Desmarcar
          </button>
        </div>
      )}

      {guesses.length > 0 && (
        <section className="flex flex-col items-center gap-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {guesses.length} {guesses.length === 1 ? "chute" : "chutes"}
          </h3>
          <EloRecap play={play} />
        </section>
      )}

      {playing && guesses.length > 0 && (
        <button
          type="button"
          onClick={() => finish()}
          className="mx-auto flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Flag size={15} /> Desistir e ver a resposta
        </button>
      )}
    </div>
  );
}

/** Um grupo resolvido: faixa na cor do nível com o tema e as 4 palavras. Apagada se a pessoa desistiu. */
function GroupRow({ group, muted }: { group: EloGroup; muted?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-16 animate-rise flex-col items-center justify-center rounded-md px-3 text-center text-white sm:h-20",
        muted && "opacity-60",
      )}
      style={{ background: LEVEL_COLOR[group.level] }}
    >
      <strong className="text-[15px] font-bold">{group.label}</strong>
      <span className="text-[13px] font-medium">{group.words.join(", ")}</span>
    </div>
  );
}
