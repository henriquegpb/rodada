"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AttemptRules, BoardProps } from "../types";
import { COLOR, encodeOrder, formatArea, lockedPositions } from "./rules";
import type { OrdemFeedback, OrdemItem, OrdemPuzzle } from "./types";

function Flag({ code, className }: { code: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- SVG estático de public/flags, sem otimização
  return <img src={`/flags/${code}.svg`} alt="" className={cn("rounded-[3px] object-cover shadow-sm", className)} />;
}

/**
 * Tabuleiro do Ordem: os 5 países numa lista, do maior (em cima) para o menor (embaixo). Toque num
 * país e depois em outro para trocar os dois de lugar, ou use as setas. O que já está no lugar certo
 * fica travado e mostra a área.
 */
export function OrdemBoard({ play, rules, submitGuess }: BoardProps<OrdemPuzzle, OrdemFeedback, AttemptRules>) {
  const playing = play.status === "playing";
  const names = new Map(play.puzzle.items.map((i) => [i.code, i.name]));
  const last = play.guesses.at(-1)?.feedback;
  const locked = lockedPositions(play.guesses);
  const tried = new Set(play.guesses.map((g) => encodeOrder(g.feedback.order)));

  // A lista começa na última tentativa (ou na ordem do sorteio) e a pessoa mexe a partir dela.
  const [draft, setDraft] = useState<string[]>(() => last?.order ?? play.puzzle.items.map((i) => i.code));
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const order = playing ? draft : (last?.order ?? draft);
  const repeated = tried.has(encodeOrder(draft));
  const left = rules.maxAttempts - play.guesses.length;

  function swap(a: number, b: number) {
    setDraft((d) => {
      const next = [...d];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  }

  /** A posição livre mais próxima acima (-1) ou abaixo (1), pulando as travadas. */
  function neighbor(from: number, dir: -1 | 1): number | null {
    for (let i = from + dir; i >= 0 && i < order.length; i += dir) if (!locked[i]) return i;
    return null;
  }

  function pick(i: number) {
    if (!playing || locked[i]) return;
    if (selected === null) return setSelected(i);
    if (selected !== i) swap(selected, i);
    setSelected(null);
  }

  function move(i: number, dir: -1 | 1) {
    const to = neighbor(i, dir);
    if (to === null) return;
    swap(i, to);
    setSelected(null);
  }

  async function confirm() {
    if (busy || repeated) return;
    setBusy(true);
    const error = await submitGuess(encodeOrder(draft));
    setBusy(false);
    setSelected(null);
    if (error) toast(error);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <p className="text-center text-sm text-muted-foreground">
        {playing
          ? selected !== null
            ? `Agora toque onde ${names.get(order[selected])} deve ficar`
            : "Do maior para o menor, em área. Toque em dois países para trocar."
          : play.status === "won"
            ? "Ordem certa!"
            : "Acabaram as tentativas"}
      </p>

      <ol className="flex flex-col gap-2" aria-label="Países, do maior para o menor">
        {order.map((code, i) => {
          const isLocked = playing ? locked[i] : last?.marks[i] === "correct";
          const area = isLocked ? last?.areas[i] : null;
          const wrong = !playing && last?.marks[i] === "wrong";
          return (
            <li key={code} className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-right text-xs font-medium text-muted-foreground">
                {i === 0 ? "Maior" : i === order.length - 1 ? "Menor" : `${i + 1}º`}
              </span>
              <button
                type="button"
                onClick={() => pick(i)}
                disabled={!playing || isLocked}
                aria-pressed={selected === i}
                className={cn(
                  "flex h-14 min-w-0 flex-1 items-center gap-3 rounded-lg border-2 bg-secondary px-3 text-left transition-[border-color,transform] active:scale-[0.99] disabled:cursor-default disabled:active:scale-100",
                  selected === i ? "border-foreground" : "border-transparent",
                  wrong && "opacity-60",
                )}
                style={isLocked ? { borderColor: COLOR } : undefined}
              >
                <Flag code={code} className="h-7 w-10 shrink-0" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-semibold">{names.get(code)}</span>
                  {area != null && (
                    <span className="text-xs font-medium tabular-nums" style={{ color: COLOR }}>
                      {formatArea(area)}
                    </span>
                  )}
                </span>
                {isLocked && (
                  <span className="shrink-0" style={{ color: COLOR }}>
                    {playing ? <Lock className="size-4" aria-label="travado" /> : <Check className="size-4" aria-label="certo" />}
                  </span>
                )}
              </button>
              {playing && (
                <span className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={isLocked || neighbor(i, -1) === null}
                    aria-label={`Subir ${names.get(code)}`}
                    className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-25"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={isLocked || neighbor(i, 1) === null}
                    aria-label={`Descer ${names.get(code)}`}
                    className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-25"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {playing && (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={confirm}
            disabled={busy || repeated}
            className="flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground transition-[filter,opacity,transform] hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
          >
            <Check className="size-5" />
            Confirmar ordem
          </button>
          <p className="text-xs text-muted-foreground">
            {repeated ? "Você já tentou essa ordem" : left === 1 ? "Última tentativa" : `${left} tentativas restantes`}
          </p>
        </div>
      )}

      {play.guesses.length > 0 && <History guesses={play.guesses.map((g) => g.feedback)} items={play.puzzle.items} />}
    </div>
  );
}

/** As tentativas anteriores, uma linha de bandeiras cada, com o verde nas posições certas. */
function History({ guesses, items }: { guesses: OrdemFeedback[]; items: OrdemItem[] }) {
  const names = new Map(items.map((i) => [i.code, i.name]));
  return (
    <section className="flex flex-col gap-1.5 border-t pt-4">
      <h3 className="text-xs font-medium text-muted-foreground">Tentativas</h3>
      <ol className="flex flex-col gap-1.5">
        {guesses.map((g, n) => (
          <li key={n} className="flex items-center gap-2">
            <span className="w-4 text-xs tabular-nums text-muted-foreground">{n + 1}</span>
            {g.order.map((code, i) => (
              <span
                key={code}
                title={`${i + 1}º ${names.get(code)}: ${g.marks[i] === "correct" ? "certo" : "errado"}`}
                className="rounded-[5px] border-2 p-0.5"
                style={{ borderColor: g.marks[i] === "correct" ? COLOR : "transparent" }}
              >
                <Flag code={code} className={cn("h-5 w-7", g.marks[i] === "wrong" && "opacity-50")} />
              </span>
            ))}
            <span className="sr-only">{g.marks.filter((m) => m === "correct").length} de 5 no lugar certo</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
