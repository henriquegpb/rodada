"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { ChevronDown, Flag, Lightbulb, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { shuffle } from "@/lib/daily/seed";
import { normalize } from "@/lib/normalize";
import { cn } from "@/lib/utils";
import type { BoardProps, PointsRules } from "../types";
import { COLOR } from "./color";
import { RANKS, pointsOf, rankIndex, rankThresholds } from "./score";
import type { ColmeiaFeedback, ColmeiaPuzzle } from "./types";

/** Duração de `animate-shake` (app/globals.css). */
const SHAKE_MS = 420;

/** Posição de cada hexágono (em larguras de hexágono a partir do centro), de cima para baixo. */
const SLOTS: [x: number, y: number][] = [
  [-0.52, -0.9],
  [0.52, -0.9],
  [-1.04, 0],
  [1.04, 0],
  [-0.52, 0.9],
  [0.52, 0.9],
];
const HEX = "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)";

export function ColmeiaBoard({ play, submitGuess, finish }: BoardProps<ColmeiaPuzzle, ColmeiaFeedback, PointsRules>) {
  const { center, maxPoints } = play.puzzle;
  const playing = play.status === "playing";
  const found = play.guesses.map((g) => g.feedback);
  const points = pointsOf(play);
  const letters = new Set([center, ...play.puzzle.outer]);

  const [outer, setOuter] = useState(play.puzzle.outer);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [dialog, setDialog] = useState<"ranks" | "hints" | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const latest = found.at(-1);

  async function send() {
    if (!typed || busy) return;
    setBusy(true);
    const error = await submitGuess(typed);
    setBusy(false);
    if (error) {
      toast(error);
      setShaking(true);
      window.setTimeout(() => setShaking(false), SHAKE_MS);
    }
    setTyped("");
  }

  /** Letra fora da colmeia nem entra: avisa e treme o que já foi digitado. */
  const onLetter = useEffectEvent((letter: string) => {
    if (!letters.has(letter)) {
      toast(`Não tem ${letter.toUpperCase()} na colmeia`, { id: "colmeia-letra" });
      setShaking(true);
      window.setTimeout(() => setShaking(false), SHAKE_MS);
      return;
    }
    setTyped((t) => (t.length < 19 ? t + letter : t));
  });

  // Teclado físico: letras digitam, Backspace apaga, Enter envia.
  const onEnter = useEffectEvent(send);
  useEffect(() => {
    if (!playing || dialog) return;
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "Enter") onEnter();
      else if (e.key === "Backspace") setTyped((t) => t.slice(0, -1));
      else if (/^\p{L}$/u.test(e.key)) onLetter(normalize(e.key));
      else return;
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, dialog]);

  const rank = rankIndex(points, maxPoints);
  const thresholds = rankThresholds(maxPoints);
  const next = thresholds[rank + 1];
  // Quem encerra vê as palavras que faltaram, na grafia da lista.
  const missed =
    !playing && play.answerLabel
      ? play.answerLabel.split(", ").filter((w) => !found.some((f) => f.word === w))
      : [];
  const sorted = [...found].sort((a, b) => a.word.localeCompare(b.word, "pt-BR"));

  return (
    <div className="flex flex-col gap-5">
      <button type="button" onClick={() => setDialog("ranks")} className="flex items-center gap-4 text-left">
        <span className="w-24 shrink-0">
          <strong className="block text-[15px]">{RANKS[rank].name}</strong>
          <span className="block text-xs text-muted-foreground">
            {next === undefined ? "Nível máximo" : `${next - points} para ${RANKS[rank + 1].name}`}
          </span>
        </span>
        <span className="relative flex flex-1 items-center justify-between">
          <span className="absolute inset-x-0 top-1/2 h-px bg-border" aria-hidden="true" />
          {thresholds.map((min, i) =>
            i === rank ? (
              <span
                key={i}
                className="relative grid size-9 place-items-center rounded-full text-sm font-bold tabular-nums text-ink"
                style={{ background: COLOR }}
              >
                {points}
              </span>
            ) : (
              <span
                key={i}
                className={cn("relative size-2.5 rounded-full", i < rank ? "" : "bg-secondary")}
                style={i < rank ? { background: COLOR } : undefined}
                title={`${RANKS[i].name}: ${min}`}
              />
            ),
          )}
        </span>
      </button>

      {found.length > 0 && (
        <div className="rounded-md bg-secondary/60">
          <button
            type="button"
            onClick={() => setListOpen(!listOpen)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[15px]"
            aria-expanded={listOpen}
          >
            <span className="min-w-0 truncate">
              {listOpen
                ? `${found.length} ${found.length === 1 ? "palavra" : "palavras"} · ${points} ${points === 1 ? "ponto" : "pontos"}`
                : [...found].reverse().map((f) => f.word).join(", ")}
            </span>
            <ChevronDown size={18} className={cn("shrink-0 transition-transform", listOpen && "rotate-180")} />
          </button>
          {listOpen && <WordList words={sorted} />}
        </div>
      )}

      {playing ? (
        <>
          <div className="flex h-10 items-center justify-center gap-0.5" aria-live="polite">
            {typed ? (
              <span className={cn("font-display text-3xl uppercase tracking-wide", shaking && "animate-shake")}>
                {[...typed].map((c, i) => (
                  <span key={i} style={c === center ? { color: COLOR } : undefined}>
                    {c}
                  </span>
                ))}
                <span className="ml-0.5 inline-block h-7 w-0.5 animate-pulse bg-foreground align-middle" />
              </span>
            ) : latest ? (
              <span key={found.length} className="animate-rise text-sm font-semibold text-muted-foreground">
                {latest.pangram ? "Pangrama! " : ""}
                {latest.word} +{latest.points}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">Toque nas letras ou digite</span>
            )}
          </div>

          <div className="relative mx-auto aspect-[1.25] w-full max-w-[300px]">
            <Cell letter={center} x={0} y={0} center onClick={() => setTyped((t) => t + center)} />
            {outer.map((letter, i) => (
              <Cell key={letter} letter={letter} x={SLOTS[i][0]} y={SLOTS[i][1]} onClick={() => setTyped((t) => t + letter)} />
            ))}
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setTyped(typed.slice(0, -1))}
              className="h-12 rounded-full border border-border px-5 text-[15px] font-semibold transition-colors hover:bg-secondary"
            >
              Apagar
            </button>
            <button
              type="button"
              onClick={() => setDialog("hints")}
              className="grid size-12 place-items-center rounded-full border border-border transition-colors hover:bg-secondary"
              aria-label="Dicas"
            >
              <Lightbulb size={19} />
            </button>
            <button
              type="button"
              onClick={() => setOuter(shuffle(outer, Math.random))}
              className="grid size-12 place-items-center rounded-full border border-border transition-colors hover:bg-secondary"
              aria-label="Embaralhar"
            >
              <Shuffle size={19} />
            </button>
            <button
              type="button"
              disabled={!typed || busy}
              onClick={send}
              className="h-12 rounded-full bg-foreground px-6 text-[15px] font-semibold text-background transition-opacity disabled:opacity-40"
            >
              Enviar
            </button>
          </div>

          {found.length > 0 && (
            <button
              type="button"
              onClick={() => finish()}
              className="mx-auto flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Flag size={15} /> Encerrar com {points} {points === 1 ? "ponto" : "pontos"}
            </button>
          )}
        </>
      ) : (
        missed.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              {missed.length} {missed.length === 1 ? "palavra faltou" : "palavras faltaram"}
            </h3>
            <p className="text-[15px] leading-relaxed text-muted-foreground">{missed.join(", ")}</p>
          </section>
        )
      )}

      <Dialog open={dialog === "ranks"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Níveis</DialogTitle>
            <DialogDescription>Pela fração dos {maxPoints} pontos possíveis hoje. Os mínimos de cada um:</DialogDescription>
          </DialogHeader>
          <ol className="flex flex-col gap-1.5 text-[15px]">
            {RANKS.map((r, i) => (
              <li key={r.name} className={cn("flex justify-between", i === rank && "font-bold")}>
                <span>{r.name}</span>
                <span className="tabular-nums text-muted-foreground">{thresholds[i]}</span>
              </li>
            ))}
          </ol>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "hints"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[460px]">
          <Hints puzzle={play.puzzle} found={found.filter((f) => !f.extra)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Cell({ letter, x, y, center = false, onClick }: { letter: string; x: number; y: number; center?: boolean; onClick(): void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute grid aspect-[1/1.1547] w-[30%] -translate-x-1/2 -translate-y-1/2 place-items-center text-2xl font-bold uppercase transition-transform active:scale-95",
        !center && "bg-secondary hover:bg-secondary/70",
        center && "text-ink",
      )}
      style={{
        left: `${50 + x * 30}%`,
        top: `${50 + y * 30 * 1.25}%`,
        clipPath: HEX,
        background: center ? COLOR : undefined,
      }}
    >
      {letter}
    </button>
  );
}

/** As palavras achadas, cada uma com o que valeu: 4 letras dá 1, maior dá 1 por letra, pangrama +7. */
function WordList({ words }: { words: ColmeiaFeedback[] }) {
  return (
    <div className="border-t border-border px-4 py-3">
      <ul className="grid grid-cols-2 gap-x-6 text-[15px] sm:grid-cols-3">
        {words.map((w) => (
          <li key={w.word} className="flex items-baseline justify-between gap-2 border-b border-border/60 py-1.5">
            <span className={cn("truncate", w.pangram && "font-bold")}>
              {w.word}
              {w.extra && <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">extra</span>}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">+{w.points}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        4 letras vale 1 ponto; a partir de 5, 1 por letra. Pangrama (as 7 letras) ganha mais 7. Extra é palavra
        válida menos comum: vale pontos, mas fica fora do total do dia.
      </p>
    </div>
  );
}

/**
 * As dicas do dia: quantas palavras faltam por letra inicial e tamanho, e pelas duas primeiras letras.
 * Contam só a lista oficial (`found` sem as extras).
 */
function Hints({ puzzle, found }: { puzzle: ColmeiaPuzzle; found: ColmeiaFeedback[] }) {
  const keys = found.map((f) => normalize(f.word));
  const starts = [puzzle.center, ...[...puzzle.outer].sort()].filter((c) => puzzle.grid[c]);
  const lengths = [...new Set(Object.values(puzzle.grid).flatMap((row) => Object.keys(row).map(Number)))].sort((a, b) => a - b);
  const left = (letter: string, length?: number) =>
    (length === undefined
      ? Object.values(puzzle.grid[letter] ?? {}).reduce((a, b) => a + b, 0)
      : (puzzle.grid[letter]?.[length] ?? 0)) -
    keys.filter((k) => k[0] === letter && (length === undefined || k.length === length)).length;
  const column = (length: number) => starts.reduce((sum, c) => sum + left(c, length), 0);
  const pairs = Object.entries(puzzle.pairs)
    .map(([pair, total]) => [pair, total - keys.filter((k) => k.startsWith(pair)).length] as const)
    .sort(([a], [b]) => a.localeCompare(b));
  const foundPangrams = found.filter((f) => f.pangram).length;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Dicas</DialogTitle>
        <DialogDescription>
          Faltam {puzzle.totalWords - found.length} de {puzzle.totalWords} palavras e {puzzle.pangrams - foundPangrams} de{" "}
          {puzzle.pangrams} {puzzle.pangrams === 1 ? "pangrama" : "pangramas"}. Os números contam só o que falta.
        </DialogDescription>
      </DialogHeader>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center text-sm tabular-nums">
          <thead>
            <tr>
              <th className="border border-border bg-secondary/60 p-1.5" />
              {lengths.map((l) => (
                <th key={l} className="border border-border bg-secondary/60 p-1.5">
                  {l}
                </th>
              ))}
              <th className="border border-border bg-secondary/60 p-1.5">Σ</th>
            </tr>
          </thead>
          <tbody>
            {starts.map((c) => (
              <tr key={c}>
                <th
                  className="border border-border bg-secondary/60 p-1.5 uppercase"
                  style={c === puzzle.center ? { color: COLOR } : undefined}
                >
                  {c}
                </th>
                {lengths.map((l) => (
                  <td key={l} className="border border-border p-1.5">
                    {left(c, l) || "-"}
                  </td>
                ))}
                <td className="border border-border p-1.5 font-bold">{left(c)}</td>
              </tr>
            ))}
            <tr>
              <th className="border border-border bg-secondary/60 p-1.5">Σ</th>
              {lengths.map((l) => (
                <td key={l} className="border border-border p-1.5 font-bold">
                  {column(l) || "-"}
                </td>
              ))}
              <td className="border border-border p-1.5 font-bold">{puzzle.totalWords - found.length}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground">Pelas duas primeiras letras:</p>
      <ul className="grid grid-cols-3 gap-x-4 text-sm uppercase tabular-nums">
        {pairs.map(([pair, count]) => (
          <li key={pair} className={cn("border-b border-border/60 py-1.5", !count && "text-muted-foreground/50 line-through")}>
            {pair} · {count}
          </li>
        ))}
      </ul>
    </>
  );
}
