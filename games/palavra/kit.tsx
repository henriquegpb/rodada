"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type InputEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { CornerDownLeft, Delete } from "lucide-react";
import { toast } from "sonner";
import { normalize } from "@/lib/normalize";
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
/**
 * Folga da linha da vez ao rolar até ela no celular: a barra do topo (56px) em cima e o teclado
 * preso embaixo (12 + 180 + 80 = 272px), para a linha nunca ficar atrás deles.
 */
export const ACTIVE_ROW_SCROLL = "max-lg:scroll-mt-16 max-lg:scroll-mb-[288px]";
/**
 * O input escondido do teclado do celular sempre guarda este caractere invisível: se ele some,
 * a pessoa apagou (com o campo vazio o Android nem avisa o apagar).
 */
const SENTINEL = "\u200b";

export const markClass: Record<LetterMark, string> = {
  correct: "border-tile-correct bg-tile-correct text-white",
  present: "border-tile-present bg-tile-present text-ink",
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
 * No celular, tocar no tabuleiro (`openKeyboard`) foca um input escondido (`input`, que o tabuleiro
 * desenha) e abre o teclado do próprio aparelho; enquanto ele está aberto (`native`), o virtual sai.
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
  /** Linha da vez (o tabuleiro liga o ref nela). */
  const rowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [native, setNative] = useState(false);

  // No celular o teclado fica preso embaixo da tela: a linha da vez rola para não ficar atrás dele.
  // O do aparelho cobre quase metade da tela (e no iPhone a página nem encolhe): a linha vai ao meio.
  useEffect(() => {
    rowRef.current?.scrollIntoView({ block: native ? "center" : "nearest", behavior: "smooth" });
  }, [activeRow, native]);

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

  /** Só em tela de toque: no computador o teclado físico já funciona sem foco nenhum. */
  function openKeyboard() {
    const input = inputRef.current;
    if (!playing || !input || !window.matchMedia("(pointer: coarse)").matches) return;
    // Já focado, mas com o teclado fechado (o "voltar" do Android): só blur + focus reabre.
    input.blur();
    input.focus({ preventScroll: true });
  }

  const input = {
    ref: inputRef,
    "aria-label": "Digitar palavra",
    defaultValue: SENTINEL,
    autoCapitalize: "none",
    autoCorrect: "off",
    autoComplete: "off",
    spellCheck: false,
    enterKeyHint: "send" as const,
    // 16px: com fonte menor o iPhone dá zoom na página ao focar.
    className: "pointer-events-none absolute left-1/2 top-0 size-px text-base opacity-0",
    onFocus: () => setNative(true),
    onBlur: () => setNative(false),
    onKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
      const key = e.key.toLowerCase();
      if (key === "enter" || key === "backspace" || key.startsWith("arrow")) {
        e.preventDefault();
        type(key);
      }
    },
    // No celular as letras chegam aqui (o keydown delas costuma vir como "Unidentified").
    onInput(e: InputEvent<HTMLInputElement>) {
      const value = e.currentTarget.value;
      e.currentTarget.value = SENTINEL;
      if (!value.includes(SENTINEL)) return type("backspace");
      const letter = normalize(value.replace(SENTINEL, "")).replace(/[^a-z]/g, "").slice(-1);
      if (letter) type(letter);
    },
  };

  return {
    letters,
    cursor,
    setCursor,
    shaking,
    stopShaking: () => setShaking(false),
    revealing,
    type,
    rowRef,
    input,
    native,
    openKeyboard,
  };
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
        // Casa desabilitada deixa o toque passar: tocar em qualquer linha abre o teclado do celular.
        "relative grid place-items-center rounded-md border-2 font-extrabold uppercase transition-colors select-none disabled:pointer-events-none",
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
 * No celular ele fica preso embaixo da tela, logo acima da navegação, para nunca precisar rolar
 * até ele; por isso precisa ser o último filho da coluna do tabuleiro. A folga para a navegação
 * já vem no próprio teclado, então ele avança sobre a do `main` (-mb-28) para não sobrar um vão.
 * Com o teclado do aparelho aberto (`standby`) ele fica invisível, mas guarda o espaço: assim a
 * última linha ainda consegue subir até o meio da tela.
 */
export function Keyboard({
  marks,
  boards,
  disabled,
  standby,
  onKey,
  className,
}: {
  marks(key: string): (LetterMark | undefined)[];
  boards: number;
  disabled: boolean;
  standby: boolean;
  onKey(key: string): void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-1.5 max-lg:sticky max-lg:bottom-0 max-lg:z-20 max-lg:-mb-28 max-lg:bg-background max-lg:pb-20 max-lg:pt-3",
        standby && "max-lg:invisible",
        className,
      )}
      aria-label="Teclado"
    >
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
