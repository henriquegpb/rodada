"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Eraser, Flag, Heart, Lightbulb, Undo2, Waypoints } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { BoardProps, LivesRules } from "../types";
import { TrilhaGrid, type Stroke } from "./Grid";
import { COLOR, HINT, HINTS, encodeSegment, hintsOf, lockedPath, mistakesOf, nextNumber, solutionPath } from "./rules";
import { colOf, linksOf, numberIndex, rowOf } from "./solver";
import type { TrilhaFeedback, TrilhaPuzzle } from "./types";

/**
 * Perto da borda entre duas casas, o dedo continua contando na casa de antes: sem essa folga, um
 * dedo parado bem na divisa faria o rascunho avançar e voltar sem parar.
 */
const EDGE = 0.15;

/** Onde fica o rascunho do trecho da vez: é só da pessoa, a engine não precisa dele. */
const draftKey = (slug: string, dateKey: string, practice?: boolean) =>
  `rodada:trilha-rascunho:${practice ? "treino:" : ""}${slug}:${dateKey}`;

function readDraft(key: string): number[] {
  try {
    const cells: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(cells) ? cells.filter(Number.isInteger) : [];
  } catch {
    return [];
  }
}

/** As três regras, cada uma num 3×3: o caminho que passa por tudo, os números em ordem e a parede. */
const RULE_CARDS: { text: string; path: number[]; numbers?: number[]; wall?: [number, number] }[] = [
  { text: "Uma vez em cada casa", path: [0, 1, 2, 5, 4, 3, 6, 7, 8] },
  { text: "Números em ordem", path: [6, 3, 0, 1, 4, 7, 8, 5, 2], numbers: [6, 1, 2] },
  { text: "Paredes não se cruzam", path: [3, 0, 1, 2, 5, 4, 7], wall: [4, 3] },
];

function RuleDiagram({ path, numbers = [], wall }: (typeof RULE_CARDS)[number]) {
  const at = (i: number) => [(i % 3) + 0.5, Math.floor(i / 3) + 0.5] as const;
  return (
    <svg viewBox="0 0 3 3" className="size-[42px] shrink-0" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={(i % 3) + 0.06} y={Math.floor(i / 3) + 0.06} width={0.88} height={0.88} rx={0.12} className="fill-foreground/10" />
      ))}
      {wall && <line x1={1} y1={1} x2={1} y2={2} strokeWidth={0.14} strokeLinecap="round" className="stroke-foreground" />}
      <polyline
        points={path.map((i) => at(i).join(",")).join(" ")}
        fill="none"
        stroke={COLOR}
        strokeWidth={0.32}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {numbers.map((cell, k) => (
        <g key={cell}>
          <circle cx={at(cell)[0]} cy={at(cell)[1]} r={0.3} className="fill-foreground" />
          <text x={at(cell)[0]} y={at(cell)[1]} textAnchor="middle" dominantBaseline="central" fontSize={0.38} fontWeight={700} className="fill-background">
            {k + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function TrilhaBoard({ play, rules, submitGuess, finish }: BoardProps<TrilhaPuzzle, TrilhaFeedback, LivesRules>) {
  const { size, numbers, walls } = play.puzzle;
  const total = size * size;
  const playing = play.status === "playing";
  const links = useMemo(() => linksOf(size, walls), [size, walls]);
  const numberAt = useMemo(() => numberIndex(size, numbers), [size, numbers]);
  const locked = lockedPath(numbers, play.guesses);
  const start = locked[locked.length - 1];
  const next = nextNumber(numbers, locked);
  const target = next === -1 ? undefined : numbers[next];
  const lives = rules.lives - mistakesOf(play);
  const hintsLeft = HINTS - hintsOf(play);

  /**
   * Dá para seguir da ponta do rascunho `cells` para `cell`? Vizinha sem parede no meio, livre, sem
   * número fora de ordem, e o último número só depois de todas as outras casas. O trecho que já
   * chegou no próximo número para ali, esperando ser conferido.
   */
  const canEnter = (cells: readonly number[], cell: number) => {
    const from = cells.length ? cells[cells.length - 1] : start;
    if (!playing || from === target || !links[from].includes(cell)) return false;
    if (locked.includes(cell) || cells.includes(cell)) return false;
    if (numberAt[cell] !== -1 && cell !== target) return false;
    return cell !== numbers[numbers.length - 1] || locked.length + cells.length + 1 === total;
  };

  // O rascunho salvo vale até a primeira casa que não segue as regras (o caminho pode ter mudado
  // em outra aba).
  const key = draftKey(play.slug, play.dateKey, play.practice);
  const [draft, setDraft] = useState<number[]>(() => {
    const cells: number[] = [];
    for (const cell of readDraft(key)) {
      if (!canEnter(cells, cell)) break;
      cells.push(cell);
    }
    return cells;
  });
  // O mesmo rascunho, sem esperar o render: o soltar do dedo lê o que o último arrasto deixou.
  const draftRef = useRef(draft);
  const [busy, setBusy] = useState(false);
  const dragging = useRef<number | null>(null);

  useEffect(() => {
    try {
      if (draft.length) localStorage.setItem(key, JSON.stringify(draft));
      else localStorage.removeItem(key);
    } catch {
      // Modo privado: o rascunho vale só nesta visita.
    }
  }, [key, draft]);

  function change(cells: number[]) {
    draftRef.current = cells;
    setDraft(cells);
  }

  /**
   * Leva a ponta até `cell`: voltar por cima do rascunho apaga o que vem depois; uma vizinha livre
   * entra no rascunho. Um dedo rápido pula casas: na mesma linha ou coluna (ou numa quina), o
   * rascunho segue casa por casa enquanto der.
   */
  function moveTo(cells: number[], cell: number): number[] {
    if (cell === start) return [];
    const back = cells.indexOf(cell);
    if (back !== -1) return cells.slice(0, back + 1);
    let out = cells;
    const from = out.length ? out[out.length - 1] : start;
    const rows = Math.abs(rowOf(size, cell) - rowOf(size, from));
    const cols = Math.abs(colOf(size, cell) - colOf(size, from));
    // Longe e fora da reta: espera o dedo chegar mais perto.
    if (rows && cols && rows + cols > 2) return out;
    for (let head = from; head !== cell; head = out[out.length - 1]) {
      const dr = rowOf(size, cell) - rowOf(size, head);
      const dc = colOf(size, cell) - colOf(size, head);
      const vertical = dr ? head + Math.sign(dr) * size : -1;
      const horizontal = dc ? head + Math.sign(dc) : -1;
      const step = (Math.abs(dr) >= Math.abs(dc) ? [vertical, horizontal] : [horizontal, vertical]).find(
        (c) => c !== -1 && canEnter(out, c),
      );
      if (step === undefined) break;
      out = [...out, step];
    }
    return out;
  }

  async function send(input: string) {
    if (busy) return;
    setBusy(true);
    const error = await submitGuess(input);
    setBusy(false);
    if (error) return toast(error);
    change([]);
  }

  /** Conferir: só quando o rascunho chegou no próximo número. */
  function commit() {
    const cells = draftRef.current;
    if (cells.length && cells[cells.length - 1] === target) void send(encodeSegment(cells));
  }

  function cellAt(e: PointerEvent<SVGSVGElement>): number | null {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * size;
    const y = ((e.clientY - rect.top) / rect.height) * size;
    const col = Math.floor(x);
    const row = Math.floor(y);
    if (col < 0 || row < 0 || col >= size || row >= size) return null;
    const inner = Math.min(x - col, 1 - (x - col), y - row, 1 - (y - row));
    if (dragging.current !== null && inner < EDGE) return null;
    return row * size + col;
  }

  // Começa a arrastar na ponta, em qualquer casa do rascunho (volta até ela) ou numa vizinha da ponta.
  function onPointerDown(e: PointerEvent<SVGSVGElement>) {
    const cell = cellAt(e);
    if (!playing || busy || cell === null) return;
    const cells = draftRef.current;
    if (cell !== start && !cells.includes(cell) && !canEnter(cells, cell)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = e.pointerId;
    change(moveTo(cells, cell));
  }
  function onPointerMove(e: PointerEvent<SVGSVGElement>) {
    if (dragging.current !== e.pointerId) return;
    const cell = cellAt(e);
    if (cell !== null) change(moveTo(draftRef.current, cell));
  }
  // Soltar o dedo no próximo número confere o trecho.
  function onPointerUp(e: PointerEvent<SVGSVGElement>) {
    if (dragging.current !== e.pointerId) return;
    dragging.current = null;
    commit();
  }

  // Teclado: as setas andam (voltar por cima apaga), Enter confere e Backspace apaga uma casa.
  function onKeyDown(e: KeyboardEvent<SVGSVGElement>) {
    if (!playing || busy) return;
    const cells = draftRef.current;
    const head = cells.length ? cells[cells.length - 1] : start;
    const moves: Record<string, number | null> = {
      ArrowUp: head >= size ? head - size : null,
      ArrowDown: head + size < total ? head + size : null,
      ArrowLeft: colOf(size, head) > 0 ? head - 1 : null,
      ArrowRight: colOf(size, head) < size - 1 ? head + 1 : null,
    };
    if (e.key in moves) {
      e.preventDefault();
      const cell = moves[e.key];
      const previous = cells.length > 1 ? cells[cells.length - 2] : start;
      if (cell === null) return;
      if (cells.length && cell === previous) change(cells.slice(0, -1));
      else if (canEnter(cells, cell)) change([...cells, cell]);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace") {
      e.preventDefault();
      change(cells.slice(0, -1));
    }
  }

  // Trecho errado: o caminho volta ao número de onde saiu, o trecho fica tracejado em vermelho até a
  // pessoa voltar a desenhar e o tabuleiro treme (a animação roda quando a classe entra).
  const latest = play.guesses.at(-1)?.feedback;
  const wrong = playing && latest && !latest.correct && !draft.length ? latest.cells : null;
  // Quem perde ou desiste vê o resto da solução.
  const solution = playing ? [] : solutionPath(play.answerLabel).slice(locked.length - 1);
  const strokes: Stroke[] = [
    { cells: locked, tone: "locked" },
    ...(solution.length > 1 ? [{ cells: solution, tone: "solution" as const }] : []),
    ...(wrong ? [{ cells: [start, ...wrong], tone: "wrong" as const }] : []),
    ...(playing && draft.length ? [{ cells: [start, ...draft], tone: "draft" as const }] : []),
  ];
  const head = draft.length ? draft[draft.length - 1] : start;
  const covered = playing ? locked.length + draft.length : locked.length;

  return (
    <div className="flex flex-col gap-5">
      <ul className="grid grid-cols-3 gap-2 text-xs text-muted-foreground sm:text-[13px]">
        {RULE_CARDS.map((rule) => (
          // No celular o desenho fica em cima do texto: lado a lado, "Paredes" não cabe no cartão.
          <li
            key={rule.text}
            className="flex flex-col items-center gap-1.5 rounded-md bg-secondary/60 p-2 text-center sm:flex-row sm:gap-2.5 sm:text-left"
          >
            <RuleDiagram {...rule} />
            <span className="leading-snug">{rule.text}</span>
          </li>
        ))}
      </ul>
      <p className="-mt-2 text-center text-xs text-muted-foreground sm:text-[13px]">
        Arraste a partir do <strong className="font-semibold text-foreground">1</strong>, de casa em casa. Ao chegar no próximo
        número, <strong className="font-semibold text-foreground">solte</strong> para conferir o trecho.
      </p>

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[15px] font-semibold tabular-nums" aria-label={`${covered} de ${total} casas`}>
          <Waypoints size={18} /> {covered}/{total}
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

      <div className={cn(wrong && "animate-shake")}>
        <TrilhaGrid
          puzzle={play.puzzle}
          strokes={strokes}
          head={playing ? head : undefined}
          next={playing ? target : undefined}
          pop={latest?.correct ? latest.cells[latest.cells.length - 1] : undefined}
          tabIndex={playing ? 0 : -1}
          role="application"
          aria-label={`Tabuleiro de ${size} por ${size}. Use as setas para andar e Enter para conferir o trecho.`}
          className={cn("touch-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring", playing && "cursor-pointer")}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (dragging.current = null)}
          onKeyDown={onKeyDown}
        />
      </div>

      {playing && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            <button
              type="button"
              disabled={!draft.length}
              onClick={() => change(draft.slice(0, -1))}
              className="flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
            >
              <Undo2 size={15} /> Desfazer
            </button>
            <button
              type="button"
              disabled={!draft.length}
              onClick={() => change([])}
              className="flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
            >
              <Eraser size={15} /> Apagar trecho
            </button>
          </div>
          <button
            type="button"
            disabled={busy || hintsLeft === 0}
            onClick={() => send(HINT)}
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
