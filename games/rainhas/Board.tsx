"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Crown, Eraser, Flag, Heart, Lightbulb, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { BoardProps, LivesRules } from "../types";
import { HINT, HINTS, REGION_COLORS, hintsOf, mistakesOf } from "./rules";
import { conflicts } from "./solver";
import type { RainhasFeedback, RainhasPuzzle } from "./types";

/** Intervalo máximo entre os dois toques que põem a rainha. */
const DOUBLE_TAP_MS = 350;

/** Onde ficam os X de cada partida: são só da pessoa, a engine não precisa deles. */
const marksKey = (slug: string, dateKey: string, practice?: boolean) =>
  `rodada:rainhas-marcas:${practice ? "treino:" : ""}${slug}:${dateKey}`;

function readMarks(key: string): number[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]") as number[];
  } catch {
    return [];
  }
}

export const regionsOf = (puzzle: RainhasPuzzle) => [...puzzle.regions].map((c) => c.charCodeAt(0) - 97);

/** A solução que a engine manda no fim (`answerLabel`): a coluna da rainha em cada linha. */
export const solutionCells = (label: string | undefined, size: number) =>
  label ? label.split(",").map((c, row) => row * size + Number(c)) : [];

/**
 * As três regras, cada uma num 3×3 com a rainha e os X que ela causa. Casas numeradas de 0 a 8,
 * linha a linha; `region` são as casas da mesma cor da rainha.
 */
const RULE_CARDS: { text: string; queen: number; marks: number[]; region?: number[] }[] = [
  { text: "1 rainha por cor", queen: 4, marks: [0, 1, 3], region: [0, 1, 3, 4] },
  { text: "1 por linha e coluna", queen: 4, marks: [1, 3, 5, 7] },
  { text: "Rainhas não se encostam", queen: 4, marks: [0, 1, 2, 3, 5, 6, 7, 8] },
];

function RuleDiagram({ queen, marks, region }: { queen: number; marks: number[]; region?: number[] }) {
  return (
    <span className="grid size-[42px] shrink-0 grid-cols-3 grid-rows-3 gap-[2px]" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <span
          key={i}
          className="grid place-items-center rounded-[2px] bg-foreground/10 text-ink"
          style={region?.includes(i) ? { background: REGION_COLORS[0] } : undefined}
        >
          {i === queen ? (
            <Crown className={cn("size-[11px]", region ? "fill-ink" : "fill-foreground text-foreground")} strokeWidth={2} />
          ) : marks.includes(i) ? (
            <X className={cn("size-[9px]", !region?.includes(i) && "text-foreground/70")} strokeWidth={3} />
          ) : null}
        </span>
      ))}
    </span>
  );
}

export function RainhasBoard({ play, rules, submitGuess, finish }: BoardProps<RainhasPuzzle, RainhasFeedback, LivesRules>) {
  const { size } = play.puzzle;
  const regions = regionsOf(play.puzzle);
  const playing = play.status === "playing";
  const queens = play.guesses.filter((g) => g.feedback.correct).map((g) => g.feedback.cell);
  const wrong = new Set(play.guesses.filter((g) => !g.feedback.correct).map((g) => g.feedback.cell));
  const lives = rules.lives - mistakesOf(play);
  const hintsLeft = HINTS - hintsOf(play);
  // Quem perde ou desiste vê onde estavam as rainhas que faltaram.
  const missed = playing ? [] : solutionCells(play.answerLabel, size).filter((c) => !queens.includes(c));
  // Casas que nenhuma rainha pode ocupar por causa das que já estão no tabuleiro.
  const blocked = (i: number) => queens.some((q) => conflicts(size, regions, q, i));

  const key = marksKey(play.slug, play.dateKey, play.practice);
  const [marks, setMarks] = useState<number[]>(() => readMarks(key));
  const [history, setHistory] = useState<number[][]>([]);
  const [busy, setBusy] = useState(false);
  const drag = useRef<{ start: number; last: number; moved: boolean; erase: boolean } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(marks));
    } catch {
      // Modo privado: os X valem só nesta visita.
    }
  }, [key, marks]);

  const free = (i: number) => !queens.includes(i) && !wrong.has(i) && !blocked(i);

  function changeMarks(next: number[]) {
    setHistory((h) => [...h.slice(-50), marks]);
    setMarks(next);
  }

  // Rainha errada: a casa treme (a animação roda quando a classe entra) e fica marcada; a vida
  // perdida aparece nos corações.
  const latest = play.guesses.at(-1)?.feedback;
  const shaking = latest && !latest.correct ? latest.cell : null;

  async function place(cell: number | typeof HINT) {
    if (busy) return;
    setBusy(true);
    const error = await submitGuess(String(cell));
    setBusy(false);
    if (error) return toast(error);
    if (cell !== HINT) setMarks((m) => m.filter((x) => x !== cell));
  }

  /**
   * Um toque põe ou tira o X. Dois toques seguidos na mesma casa põem a rainha (a jogada que conta):
   * o X do primeiro toque volta a ser como era antes.
   */
  const lastTap = useRef<{ cell: number; at: number; before: number[] } | null>(null);
  function tap(cell: number, now: number) {
    if (!free(cell)) return;
    const previous = lastTap.current;
    if (previous && previous.cell === cell && now - previous.at < DOUBLE_TAP_MS) {
      lastTap.current = null;
      setMarks(previous.before);
      setHistory((h) => h.slice(0, -1));
      place(cell);
      return;
    }
    lastTap.current = { cell, at: now, before: marks };
    changeMarks(marks.includes(cell) ? marks.filter((x) => x !== cell) : [...marks, cell]);
  }

  const cellAt = (e: PointerEvent) => {
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-cell]");
    return el ? Number(el.dataset.cell) : null;
  };

  // Arrastar marca (ou desmarca, se começou num X) todas as casas por onde o dedo passa.
  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    const cell = cellAt(e);
    if (!playing || cell === null) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { start: cell, last: cell, moved: false, erase: marks.includes(cell) };
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    const cell = d && cellAt(e);
    if (!d || cell === null || cell === d.last) return;
    if (!d.moved) setHistory((h) => [...h.slice(-50), marks]);
    d.moved = true;
    d.last = cell;
    setMarks((m) => {
      const touched = [d.start, cell].filter(free);
      return d.erase ? m.filter((x) => !touched.includes(x)) : [...new Set([...m, ...touched])];
    });
  }
  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) tap(d.start, e.timeStamp);
  }

  return (
    <div className="flex flex-col gap-5">
      <ul className="grid grid-cols-3 gap-2 text-xs text-muted-foreground sm:text-[13px]">
        {RULE_CARDS.map((rule) => (
          <li key={rule.text} className="flex items-center gap-2.5 rounded-md bg-secondary/60 p-2">
            <RuleDiagram {...rule} />
            <span className="leading-snug">{rule.text}</span>
          </li>
        ))}
      </ul>
      <p className="-mt-2 text-center text-xs text-muted-foreground sm:text-[13px]">
        Um toque marca ou tira o <strong className="font-semibold text-foreground">X</strong>. Dois toques seguidos põem a{" "}
        <strong className="font-semibold text-foreground">rainha</strong>. Arraste para marcar várias casas.
      </p>

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[15px] font-semibold tabular-nums">
          <Crown size={18} /> {queens.length}/{size}
        </span>
        <span className="flex gap-1" aria-label={`${lives} de ${rules.lives} vidas`}>
          {Array.from({ length: rules.lives }, (_, i) => (
            <Heart
              key={i}
              size={20}
              className={cn("transition-colors", i < lives ? "fill-destructive text-destructive" : "text-muted-foreground/40")}
            />
          ))}
        </span>
      </div>

      <div
        className="grid touch-none select-none gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (drag.current = null)}
      >
        {regions.map((g, i) => {
          const queen = queens.includes(i);
          const solution = missed.includes(i);
          const autoX = playing && !queen && !wrong.has(i) && blocked(i);
          return (
            <button
              key={i}
              type="button"
              data-cell={i}
              tabIndex={-1}
              aria-label={`Linha ${Math.floor(i / size) + 1}, coluna ${(i % size) + 1}${queen ? ", rainha" : ""}`}
              className={cn(
                "grid aspect-square place-items-center rounded-[4px] text-ink transition-[filter]",
                playing && free(i) && "hover:brightness-110",
                wrong.has(i) && "ring-2 ring-inset ring-destructive",
                shaking === i && "animate-shake",
              )}
              style={{ background: REGION_COLORS[g] }}
            >
              {queen ? (
                <Crown className="size-[62%] fill-ink" strokeWidth={1.5} />
              ) : solution ? (
                <Crown className="size-[62%] opacity-40" strokeWidth={2} />
              ) : wrong.has(i) ? (
                <X className="size-[55%] text-destructive" strokeWidth={3} />
              ) : marks.includes(i) || autoX ? (
                <X className={cn("size-[42%]", autoX && !marks.includes(i) ? "opacity-35" : "opacity-80")} strokeWidth={2.5} />
              ) : null}
            </button>
          );
        })}
      </div>

      {playing && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            <button
              type="button"
              disabled={!history.length}
              onClick={() => {
                setMarks(history.at(-1) ?? []);
                setHistory(history.slice(0, -1));
              }}
              className="flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
            >
              <Undo2 size={15} /> Desfazer
            </button>
            <button
              type="button"
              disabled={!marks.length}
              onClick={() => changeMarks([])}
              className="flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
            >
              <Eraser size={15} /> Limpar X
            </button>
          </div>
          <button
            type="button"
            disabled={busy || hintsLeft === 0}
            onClick={() => place(HINT)}
            className="flex h-10 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-semibold transition-colors hover:bg-secondary disabled:opacity-40"
          >
            <Lightbulb size={15} /> Dica · {hintsLeft}
          </button>
        </div>
      )}

      {playing && play.guesses.length > 0 && (
        <button
          type="button"
          onClick={() => finish()}
          className="mx-auto flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Flag size={15} /> Desistir e ver a solução
        </button>
      )}
    </div>
  );
}
