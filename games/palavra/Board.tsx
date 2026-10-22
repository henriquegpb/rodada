"use client";

import { useMemo } from "react";
import { normalize } from "@/lib/normalize";
import { cn } from "@/lib/utils";
import type { AttemptRules, BoardProps } from "../types";
import { FLIP_STAGGER_MS, Keyboard, MARK_RANK, Tile, useWordEntry } from "./kit";
import type { LetterMark, PalavraFeedback, PalavraPuzzle } from "./types";

export function PalavraBoard({ play, rules, submitGuess }: BoardProps<PalavraPuzzle, PalavraFeedback, AttemptRules>) {
  const { maxAttempts } = rules;
  const length = play.puzzle.length;
  const playing = play.status === "playing";
  const activeRow = play.guesses.length;
  const won = play.status === "won";
  const entry = useWordEntry({ length, playing, activeRow, submitGuess });
  const { letters, cursor, setCursor, shaking, stopShaking, revealing, type } = entry;

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
    <div className="flex flex-col items-center gap-8">
      <div className="grid gap-1.5 [perspective:800px]" aria-label="Tabuleiro">
        {Array.from({ length: maxAttempts }, (_, row) => {
          const guess = play.guesses[row]?.feedback;
          const isActive = playing && row === activeRow;
          const flipping = row === revealing;
          const celebrating = won && row === activeRow - 1 && revealing === null;
          return (
            <div
              key={row}
              className={cn("grid gap-1.5", isActive && shaking && "animate-shake")}
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
                  size="size-[min(15.5vw,64px)] text-[min(8vw,30px)]"
                  onClick={() => setCursor(col)}
                />
              ))}
            </div>
          );
        })}
      </div>

      <Keyboard marks={(k) => [keyMarks.get(k)]} boards={1} disabled={!playing} onKey={type} />
    </div>
  );
}
