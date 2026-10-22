"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Delete, CornerDownLeft } from "lucide-react";
import { toast } from "sonner";
import { normalize } from "@/lib/normalize";
import { cn } from "@/lib/utils";
import type { AttemptRules, BoardProps } from "../types";
import type { LetterMark, PalavraFeedback, PalavraPuzzle } from "./types";

const KEY_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const FLIP_STAGGER_MS = 260;
const FLIP_MS = 520;
const MARK_RANK: Record<LetterMark, number> = { absent: 0, present: 1, correct: 2 };

const markClass: Record<LetterMark, string> = {
  correct: "border-tile-correct bg-tile-correct text-ink",
  present: "border-tile-present bg-tile-present text-white",
  absent: "border-tile-absent bg-tile-absent text-foreground/80",
};

export function PalavraBoard({ play, rules, submitGuess }: BoardProps<PalavraPuzzle, PalavraFeedback, AttemptRules>) {
  const { maxAttempts } = rules;
  const length = play.puzzle.length;
  const [letters, setLetters] = useState<string[]>(() => Array(length).fill(""));
  const [cursor, setCursor] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [busy, setBusy] = useState(false);
  /** Linha que acabou de ser enviada e está virando; o teclado só atualiza depois. */
  const [revealing, setRevealing] = useState<number | null>(null);
  const playing = play.status === "playing";
  const activeRow = play.guesses.length;

  const settledGuesses = revealing === null ? play.guesses : play.guesses.slice(0, revealing);
  const keyMarks = useMemo(() => {
    const marks = new Map<string, LetterMark>();
    for (const { feedback } of settledGuesses) {
      feedback.letters.forEach((letter, i) => {
        const key = normalize(letter);
        const mark = feedback.marks[i];
        if (MARK_RANK[mark] > MARK_RANK[marks.get(key) ?? "absent"] || !marks.has(key)) marks.set(key, mark);
      });
    }
    return marks;
  }, [settledGuesses]);

  const type = useCallback(
    (key: string) => {
      if (!playing || busy) return;
      if (key === "backspace") {
        const at = letters[cursor] ? cursor : Math.max(0, cursor - 1);
        setLetters(letters.map((l, i) => (i === at ? "" : l)));
        setCursor(at);
        return;
      }
      if (key === "arrowleft") return setCursor((c) => Math.max(0, c - 1));
      if (key === "arrowright") return setCursor((c) => Math.min(length - 1, c + 1));
      if (key === "enter") {
        const word = letters.join("");
        if (word.length < length) {
          setShaking(true);
          toast("Só palavras com 5 letras");
          return;
        }
        setBusy(true);
        submitGuess(word).then((error) => {
          setBusy(false);
          if (error) {
            setShaking(true);
            toast(error);
            return;
          }
          setRevealing(activeRow);
          setLetters(Array(length).fill(""));
          setCursor(0);
          window.setTimeout(() => setRevealing(null), FLIP_STAGGER_MS * (length - 1) + FLIP_MS);
        });
        return;
      }
      if (/^[a-zç]$/.test(key)) {
        const next = letters.map((l, i) => (i === cursor ? key : l));
        setLetters(next);
        // Pula para a próxima casa vazia, como quem digita espera.
        const empty = next.findIndex((l, i) => i > cursor && !l);
        setCursor(empty >= 0 ? empty : Math.min(length - 1, cursor + 1));
      }
    },
    [playing, busy, cursor, letters, length, submitGuess, activeRow],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [role=dialog]")) return;
      const key = e.key.toLowerCase();
      if (key === "enter" || key === "backspace" || key.startsWith("arrow") || /^[a-zç]$/.test(key)) {
        e.preventDefault();
        type(key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [type]);

  const won = play.status === "won";

  return (
    <div className="flex flex-col items-center gap-8">
      <div
        className="grid gap-1.5 [perspective:800px]"
        style={{ gridTemplateRows: `repeat(${maxAttempts}, minmax(0, 1fr))` }}
        aria-label="Tabuleiro"
      >
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
              onAnimationEnd={() => setShaking(false)}
            >
              {Array.from({ length }, (_, col) => {
                const letter = guess?.letters[col] ?? (isActive ? letters[col] : "");
                const mark = guess?.marks[col];
                const delay = col * FLIP_STAGGER_MS;
                return (
                  <button
                    key={col}
                    type="button"
                    tabIndex={isActive ? 0 : -1}
                    disabled={!isActive}
                    onClick={() => setCursor(col)}
                    aria-label={letter ? `${letter}${mark ? `, ${MARK_LABEL[mark]}` : ""}` : "vazio"}
                    className={cn(
                      "relative grid size-[min(15.5vw,64px)] place-items-center rounded-md border-2 text-[min(8vw,30px)] font-extrabold uppercase transition-colors select-none",
                      !mark && "border-tile-border bg-tile-empty",
                      !mark && letter && "border-tile-filled-border animate-pop",
                      mark && !flipping && markClass[mark],
                      isActive && col === cursor && "after:absolute after:inset-x-2.5 after:bottom-1.5 after:h-[3px] after:rounded-full after:bg-primary",
                      flipping && "animate-flip",
                      celebrating && "animate-hop",
                    )}
                    style={
                      flipping || celebrating
                        ? { animationDelay: `${celebrating ? col * 90 : delay}ms` }
                        : undefined
                    }
                  >
                    {flipping && mark ? <FlipFace mark={mark} delay={delay} letter={letter} /> : letter}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="flex w-full flex-col gap-1.5" aria-label="Teclado">
        {KEY_ROWS.map((row, i) => (
          <div key={row} className="flex justify-center gap-1.5">
            {[...row].map((k) => (
              <Key key={k} label={k} mark={keyMarks.get(k)} onPress={() => type(k)} disabled={!playing} />
            ))}
            {i === 1 && (
              <Key label="apagar" wide onPress={() => type("backspace")} disabled={!playing}>
                <Delete size={20} />
              </Key>
            )}
            {i === 2 && (
              <Key label="enter" wide onPress={() => type("enter")} disabled={!playing}>
                <span className="flex items-center gap-1 text-xs font-bold tracking-wide">
                  ENTER <CornerDownLeft size={14} />
                </span>
              </Key>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const MARK_LABEL: Record<LetterMark, string> = {
  correct: "lugar certo",
  present: "existe em outro lugar",
  absent: "não existe",
};

/** Durante o flip a cor só aparece quando a peça passa do meio da volta. */
function FlipFace({ mark, delay, letter }: { mark: LetterMark; delay: number; letter: string }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setShown(true), delay + FLIP_MS / 2);
    return () => window.clearTimeout(timer);
  }, [delay]);
  return (
    <span
      className={cn(
        "-m-0.5 grid size-[calc(100%+4px)] place-items-center rounded-md border-2",
        shown ? markClass[mark] : "border-tile-filled-border bg-tile-empty",
      )}
    >
      {letter}
    </span>
  );
}

function Key({
  label,
  mark,
  wide,
  disabled,
  onPress,
  children,
}: {
  label: string;
  mark?: LetterMark;
  wide?: boolean;
  disabled?: boolean;
  onPress: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        onPress();
        e.currentTarget.blur();
      }}
      className={cn(
        "grid h-14 min-w-0 place-items-center rounded-md text-[15px] font-bold uppercase transition-[background-color,transform] duration-150 active:scale-95 disabled:opacity-60 sm:h-[60px]",
        wide ? "flex-[1.6] px-2" : "flex-1",
        !mark && "bg-key text-key-foreground hover:brightness-125",
        (mark === "correct" || mark === "present") && markClass[mark],
        mark === "absent" && "bg-transparent text-muted-foreground/35",
      )}
    >
      {children ?? label}
    </button>
  );
}
