"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { CornerDownLeft, Delete } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { LetterMark } from "./types";

/**
 * Peças, teclado e digitação dos jogos de palavra (Palavra, Dupla, Quadra).
 * O tabuleiro de cada jogo só decide quantas grades desenhar e como colorir.
 */

const KEY_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
export const FLIP_STAGGER_MS = 260;
export const FLIP_MS = 520;
export const MARK_RANK: Record<LetterMark, number> = { absent: 0, present: 1, correct: 2 };

export const markClass: Record<LetterMark, string> = {
  correct: "border-tile-correct bg-tile-correct text-ink",
  present: "border-tile-present bg-tile-present text-white",
  absent: "border-tile-absent bg-tile-absent text-foreground/80",
};

const MARK_LABEL: Record<LetterMark, string> = {
  correct: "lugar certo",
  present: "existe em outro lugar",
  absent: "não existe",
};

/**
 * A linha que está sendo digitada: letras, cursor (clique numa casa para editar), Enter, apagar,
 * setas e teclado físico. Depois de um chute aceito, `revealing` marca a linha que está virando.
 */
export function useWordEntry({
  length,
  playing,
  activeRow,
  submitGuess,
}: {
  length: number;
  playing: boolean;
  activeRow: number;
  submitGuess(input: string): Promise<string | null>;
}) {
  const [letters, setLetters] = useState<string[]>(() => Array(length).fill(""));
  const [cursor, setCursor] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [busy, setBusy] = useState(false);
  /** Linha que acabou de ser enviada e está virando; o teclado só atualiza depois. */
  const [revealing, setRevealing] = useState<number | null>(null);

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
          toast(`Só palavras com ${length} letras`);
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

  return { letters, cursor, setCursor, shaking, stopShaking: () => setShaking(false), revealing, type };
}

/** Uma casa do tabuleiro. `size` controla o tamanho (o Quadra usa casas menores). */
export function Tile({
  letter,
  mark,
  active,
  cursor,
  flipping,
  celebrating,
  delay,
  size,
  onClick,
}: {
  letter: string;
  mark?: LetterMark;
  active: boolean;
  cursor: boolean;
  flipping: boolean;
  celebrating: boolean;
  delay: number;
  size: string;
  onClick(): void;
}) {
  return (
    <button
      type="button"
      tabIndex={active ? 0 : -1}
      disabled={!active}
      onClick={onClick}
      aria-label={letter ? `${letter}${mark ? `, ${MARK_LABEL[mark]}` : ""}` : "vazio"}
      className={cn(
        "relative grid place-items-center rounded-md border-2 font-extrabold uppercase transition-colors select-none",
        size,
        !mark && "border-tile-border bg-tile-empty",
        !mark && letter && "border-tile-filled-border animate-pop",
        mark && !flipping && markClass[mark],
        cursor && "after:absolute after:inset-x-[18%] after:bottom-[8%] after:h-[3px] after:rounded-full after:bg-primary",
        flipping && "animate-flip",
        celebrating && "animate-hop",
      )}
      style={flipping || celebrating ? { animationDelay: `${delay}ms` } : undefined}
    >
      {flipping && mark ? <FlipFace mark={mark} delay={delay} letter={letter} /> : letter}
    </button>
  );
}

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

const segmentClass: Record<LetterMark, string> = {
  correct: "bg-tile-correct",
  present: "bg-tile-present",
  absent: "bg-transparent",
};

/**
 * Teclado virtual. `marks(key)` devolve a cor da tecla em cada tabuleiro: com um tabuleiro a tecla
 * inteira ganha a cor; com vários, ela se divide em partes (lado a lado ou em quadrantes).
 */
export function Keyboard({
  marks,
  boards,
  disabled,
  onKey,
}: {
  marks(key: string): (LetterMark | undefined)[];
  boards: number;
  disabled: boolean;
  onKey(key: string): void;
}) {
  return (
    <div className="flex w-full flex-col gap-1.5" aria-label="Teclado">
      {KEY_ROWS.map((row, i) => (
        <div key={row} className="flex justify-center gap-1.5">
          {[...row].map((k) => (
            <Key key={k} label={k} marks={marks(k)} boards={boards} onPress={() => onKey(k)} disabled={disabled} />
          ))}
          {i === 1 && (
            <Key label="apagar" wide onPress={() => onKey("backspace")} disabled={disabled}>
              <Delete size={20} />
            </Key>
          )}
          {i === 2 && (
            <Key label="enter" wide onPress={() => onKey("enter")} disabled={disabled}>
              <span className="flex items-center gap-1 text-xs font-bold tracking-wide">
                ENTER <CornerDownLeft size={14} />
              </span>
            </Key>
          )}
        </div>
      ))}
    </div>
  );
}

function Key({
  label,
  marks = [],
  boards = 1,
  wide,
  disabled,
  onPress,
  children,
}: {
  label: string;
  marks?: (LetterMark | undefined)[];
  boards?: number;
  wide?: boolean;
  disabled?: boolean;
  onPress(): void;
  children?: ReactNode;
}) {
  const known = marks.filter(Boolean) as LetterMark[];
  // A letra não existe em nenhum tabuleiro em que já foi testada: a tecla apaga.
  const dead = known.length > 0 && known.length === marks.length && known.every((m) => m === "absent");
  const single = boards === 1 ? marks[0] : undefined;
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
        "relative grid h-14 min-w-0 place-items-center overflow-hidden rounded-md text-[15px] font-bold uppercase transition-[background-color,transform] duration-150 active:scale-95 disabled:opacity-60 sm:h-[60px]",
        wide ? "flex-[1.6] px-2" : "flex-1",
        dead ? "bg-transparent text-muted-foreground/35" : single && single !== "absent" ? markClass[single] : "bg-key text-key-foreground hover:brightness-125",
      )}
    >
      {boards > 1 && !dead && known.length > 0 && (
        // Uma parte da tecla por tabuleiro: metades com 2, quadrantes com 4.
        <span
          aria-hidden="true"
          className="absolute inset-0 grid"
          style={{ gridTemplateColumns: `repeat(${boards === 4 ? 2 : boards}, 1fr)`, gridTemplateRows: boards === 4 ? "1fr 1fr" : "1fr" }}
        >
          {marks.map((m, b) => (
            <span key={b} className={m ? segmentClass[m] : "bg-transparent"} />
          ))}
        </span>
      )}
      <span className="relative">{children ?? label}</span>
    </button>
  );
}
