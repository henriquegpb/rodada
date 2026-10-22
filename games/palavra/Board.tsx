"use client";

import { useMemo } from "react";
import { normalize } from "@/lib/normalize";
import { cn } from "@/lib/utils";
import type { AttemptRules, BoardProps } from "../types";
import { ACTIVE_ROW_SCROLL, FLIP_STAGGER_MS, Keyboard, MARK_RANK, Tile, useWordEntry } from "./kit";
import type { LetterMark, PalavraFeedback, PalavraPuzzle } from "./types";

export function PalavraBoard({ play, rules, submitGuess }: BoardProps<PalavraPuzzle, PalavraFeedback, AttemptRules>) {
  const { maxAttempts } = rules;
  const length = play.puzzle.length;
  const playing = play.status === "playing";
  const activeRow = play.guesses.length;
  const won = play.status === "won";
  const entry = useWordEntry({ length, playing, activeRow, submitGuess });
  const { letters, cursor, setCursor, shaking, stopShaking, revealing, type, rowRef, input, native, openKeyboard } = entry;

  const settledGuesses = revealing === null ? play.guesses : play.guesses.slice(0, revealing);
  const keyMarks = useMemo(() => {
    const marks = new Map<string, LetterMark>();
    for (const { feedback } of settledGuesses) {
      feedback.letters.forEach((letter, i) => {
        const key = normalize(letter);
        const mark = feedback.marks[i];
        if (!marks.has(key) || MARK_RANK[mark] > MARK_RANK[marks.get(key)!]) marks.set(key, mark);
      });
    }
    return marks;
  }, [settledGuesses]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Tocar em qualquer parte do tabuleiro abre o teclado do celular. */}
      <div className="relative grid gap-1.5 [perspective:800px]" aria-label="Tabuleiro" onClick={openKeyboard}>
        <input {...input} />
        {Array.from({ length: maxAttempts }, (_, row) => {
          const guess = play.guesses[row]?.feedback;
          const isActive = playing && row === activeRow;
          const flipping = row === revealing;
          const celebrating = won && row === activeRow - 1 && revealing === null;
          return (
            <div
              key={row}
              ref={isActive ? rowRef : undefined}
              className={cn("grid gap-1.5", ACTIVE_ROW_SCROLL, isActive && shaking && "animate-shake")}
              style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}
              onAnimationEnd={stopShaking}
            >
              {Array.from({ length }, (_, col) => (
                <Tile
                  key={col}
                  letter={guess?.letters[col] ?? (isActive ? letters[col] : "")}
                  mark={guess?.marks[col]}
                  active={isActive}
                  cursor={isActive && col === cursor}
                  flipping={flipping}
                  celebrating={celebrating}
                  delay={celebrating ? col * 90 : col * FLIP_STAGGER_MS}
                  // No celular as 6 linhas cabem entre a barra do topo, a legenda e o teclado (56 + 16 + 272 + vãos).
                  size="size-[min(15.5vw,64px)] max-lg:size-[clamp(40px,calc((100dvh_-_398px)/6),min(15.5vw,64px))] text-[min(8vw,30px)]"
                  onClick={() => setCursor(col)}
                />
              ))}
            </div>
          );
        })}
      </div>

      <Legend />

      <Keyboard marks={(k) => [keyMarks.get(k)]} boards={1} disabled={!playing} standby={native} onKey={type} />
    </div>
  );
}

const LEGEND: [LetterMark, string, string][] = [
  ["correct", "bg-tile-correct", "Lugar certo"],
  ["present", "bg-tile-present", "Outro lugar"],
  ["absent", "bg-tile-absent", "Não tem"],
];

/** O que cada cor quer dizer, numa linha só: no celular ela entra na conta do tamanho das casas. */
function Legend() {
  return (
    <ul className="flex h-4 items-center gap-4 text-xs text-muted-foreground" aria-label="Legenda das cores">
      {LEGEND.map(([mark, swatch, label]) => (
        <li key={mark} className="flex items-center gap-1.5">
          <span className={cn("size-3 rounded-[3px]", swatch)} />
          {label}
        </li>
      ))}
    </ul>
  );
}
