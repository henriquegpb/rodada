"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import { normalize } from "@/lib/normalize";
import { cn } from "@/lib/utils";
import type { AttemptRules, BoardProps } from "../../types";
import { FLIP_STAGGER_MS, Keyboard, MARK_RANK, Tile, useWordEntry } from "../../palavra/kit";
import type { LetterMark } from "../../palavra/types";
import type { MultiWordFeedback, MultiWordPuzzle } from "./types";

/**
 * Tabuleiros lado a lado com uma linha de digitação compartilhada. Um tabuleiro resolvido para de
 * receber tentativas (fica com as linhas seguintes vazias) e ganha um contorno de acerto.
 */
export function MultiWordBoard({
  play,
  rules,
  submitGuess,
  tileSize,
  gridClass,
}: BoardProps<MultiWordPuzzle, MultiWordFeedback, AttemptRules> & {
  /** Classes de tamanho e fonte da casa. */
  tileSize: string;
  /** Distribuição dos tabuleiros na tela (ex.: 2 colunas no celular, 4 no desktop). */
  gridClass: string;
}) {
  const { maxAttempts } = rules;
  const { length, boards } = play.puzzle;
  const playing = play.status === "playing";
  const activeRow = play.guesses.length;
  const { letters, cursor, setCursor, shaking, stopShaking, revealing, type } = useWordEntry({
    length,
    playing,
    activeRow,
    submitGuess,
  });

  const settled = revealing === null ? play.guesses : play.guesses.slice(0, revealing);
  /** Em que tentativa cada tabuleiro foi resolvido (-1 = ainda aberto). */
  const solvedAt = useMemo(
    () =>
      Array.from({ length: boards }, (_, b) =>
        play.guesses.findIndex((g) => g.feedback.boards[b]?.every((m) => m === "correct")),
      ),
    [play.guesses, boards],
  );

  const keyMarks = useMemo(() => {
    const perBoard = Array.from({ length: boards }, () => new Map<string, LetterMark>());
    for (const { feedback } of settled) {
      feedback.boards.forEach((marks, b) => {
        if (!marks) return;
        feedback.letters.forEach((letter, i) => {
          const key = normalize(letter);
          const map = perBoard[b];
          if (!map.has(key) || MARK_RANK[marks[i]] > MARK_RANK[map.get(key)!]) map.set(key, marks[i]);
        });
      });
    }
    return (key: string) => perBoard.map((map) => map.get(key));
  }, [settled, boards]);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className={cn("grid w-fit gap-x-4 gap-y-5 [perspective:800px]", gridClass)}>
        {Array.from({ length: boards }, (_, b) => {
          const solved = solvedAt[b] >= 0 && (revealing === null || solvedAt[b] < revealing);
          return (
            <div
              key={b}
              aria-label={`Tabuleiro ${b + 1}${solved ? ", resolvido" : ""}`}
              className={cn(
                "relative grid gap-1 rounded-lg p-1.5 ring-2 ring-transparent transition-[box-shadow] duration-500",
                solved && "ring-success/70",
              )}
            >
              {solved && (
                <span className="absolute -right-2 -top-2 z-10 grid size-5 place-items-center rounded-full bg-success text-ink animate-pop">
                  <Check size={12} strokeWidth={3.5} />
                </span>
              )}
              {Array.from({ length: maxAttempts }, (_, row) => {
                const feedback = play.guesses[row]?.feedback;
                const marks = feedback?.boards[b];
                // Depois de resolvido o tabuleiro não recebe mais tentativas: linhas vazias.
                const after = feedback && !marks;
                const isActive = playing && row === activeRow && solvedAt[b] < 0;
                const flipping = row === revealing && Boolean(marks);
                // Comemora só o tabuleiro resolvido pela tentativa que acabou de entrar.
                const celebrating = row === solvedAt[b] && row === activeRow - 1 && revealing === null;
                return (
                  <div
                    key={row}
                    className={cn("grid gap-1", isActive && shaking && "animate-shake", after && "opacity-30")}
                    style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}
                    onAnimationEnd={stopShaking}
                  >
                    {Array.from({ length }, (_, col) => (
                      <Tile
                        key={col}
                        letter={marks ? feedback!.letters[col] : isActive ? letters[col] : ""}
                        mark={marks?.[col]}
                        active={isActive}
                        cursor={isActive && col === cursor}
                        flipping={flipping}
                        celebrating={Boolean(celebrating)}
                        delay={celebrating ? col * 90 : col * FLIP_STAGGER_MS}
                        size={tileSize}
                        onClick={() => setCursor(col)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="w-full max-w-[620px]">
        <Keyboard marks={keyMarks} boards={boards} disabled={!playing} onKey={type} />
      </div>
    </div>
  );
}
