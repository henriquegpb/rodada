"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Check, CornerDownLeft, X } from "lucide-react";
import { toast } from "sonner";
import { FocusInput } from "@/components/microkit/focus-input";
import { cn } from "@/lib/utils";
import type { AttemptRules, BoardProps } from "../types";
import { COLOR } from "./color";
import { ARM, Arm, Dial, Hub, Wedge, dirAt, polar, sweepBetween } from "./Dial";
import { HEAT, byRound, currentRound } from "./heat";
import type { GrauFeedback, GrauPuzzle, GrauRound } from "./types";

type RoundState = "locked" | "playing" | "solved" | "failed";

export function GrauBoard({ play, rules, submitGuess }: BoardProps<GrauPuzzle, GrauFeedback, AttemptRules>) {
  const { read, draw } = play.puzzle;
  const playing = play.status === "playing";
  const round = currentRound(play.guesses);
  const rounds = byRound(play.guesses);
  const left = rules.maxAttempts - play.guesses.length;

  const state: Record<GrauRound, RoundState> = {
    1: round === 2 ? "solved" : playing ? "playing" : "failed",
    2: round === 1 ? "locked" : play.status === "won" ? "solved" : playing ? "playing" : "failed",
  };

  // Quem acabou de acertar o 1º continua vendo ele até clicar para seguir; quem volta à página
  // cai direto no ângulo da vez.
  const [view, setView] = useState<GrauRound>(round);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<number | null>(() => rounds[2].at(-1)?.value ?? null);
  const dragging = useRef(false);

  const readSweep = sweepBetween(read.from, read.to);
  const readExact =
    rounds[1].find((f) => f.heat === 0)?.exact ??
    (state[1] === "failed" && play.answerLabel ? Number.parseInt(play.answerLabel) : undefined);
  const drawing = view === 2 && state[2] === "playing";
  const drawn = rounds[2].at(-1);
  const canConfirm = drawing && !busy && draft !== null && draft !== 0 && !rounds[2].some((f) => f.value === draft);

  async function send(input: string) {
    setBusy(true);
    const error = await submitGuess(input);
    setBusy(false);
    if (error) toast(error);
    return !error;
  }

  async function submitRead(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    if (await send(text)) {
      setText("");
      inputRef.current?.focus();
    }
  }

  function confirmDraw() {
    if (canConfirm) void send(String(draft));
  }

  function point(e: PointerEvent<SVGSVGElement>) {
    setDraft(sweepBetween(draw.from, dirAt(e.currentTarget, e.clientX, e.clientY)));
  }

  function onKey(e: KeyboardEvent<SVGSVGElement>) {
    const step = e.shiftKey ? 10 : 1;
    const delta = e.key === "ArrowUp" || e.key === "ArrowRight" ? step : e.key === "ArrowDown" || e.key === "ArrowLeft" ? -step : 0;
    if (delta) {
      e.preventDefault();
      setDraft((d) => (((d ?? 0) + delta) % 360 + 360) % 360);
    } else if (e.key === "Enter") {
      e.preventDefault();
      confirmDraw();
    }
  }

  const list = rounds[view];
  const last = list.at(-1);

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Ângulos" className="mx-auto flex w-fit gap-1 rounded-full bg-secondary p-1">
        {([1, 2] as const).map((r) => (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={view === r}
            disabled={state[r] === "locked"}
            onClick={() => setView(r)}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors disabled:opacity-40",
              view === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {state[r] === "solved" ? (
              <Check size={15} className="text-success" />
            ) : state[r] === "failed" ? (
              <X size={15} className="text-destructive" />
            ) : null}
            {r} · {r === 1 ? "Leia" : "Desenhe"}
          </button>
        ))}
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">{view === 1 ? "Quanto mede este ângulo?" : "Desenhe um ângulo de"}</p>
        <p className="font-display text-5xl leading-tight tabular-nums">
          {view === 1 ? (readExact !== undefined ? `${readExact}°` : "?") : `${draw.target}°`}
        </p>
      </div>

      <div className="mx-auto w-full max-w-[380px]">
        {view === 1 ? (
          <Dial aria-label="Ângulo para ler">
            <Wedge from={read.from} sweep={readSweep} color={COLOR} />
            {/* Terminado o ângulo, os chutes errados aparecem como braços finos, para comparar. */}
            {state[1] !== "playing" &&
              rounds[1]
                .filter((f) => f.heat > 0)
                .map((f) => (
                  <Arm key={f.value} dir={read.from + f.value} width={3} length={ARM - 12} className="" style={{ stroke: HEAT[f.heat].color, opacity: 0.7 }} />
                ))}
            <Arm dir={read.from} />
            <Arm dir={read.to} />
            <Hub />
          </Dial>
        ) : (
          <Dial
            aria-label="Arraste para desenhar o ângulo. Setas giram o braço, Enter confirma."
            tabIndex={drawing ? 0 : -1}
            className={cn("rounded-full outline-none focus-visible:ring-4 focus-visible:ring-ring/40", drawing && "cursor-grab touch-none active:cursor-grabbing")}
            onPointerDown={(e) => {
              if (!drawing) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              dragging.current = true;
              point(e);
            }}
            onPointerMove={(e) => dragging.current && point(e)}
            onPointerUp={() => (dragging.current = false)}
            onPointerCancel={() => (dragging.current = false)}
            onKeyDown={drawing ? onKey : undefined}
          >
            {drawing ? (
              draft !== null && <Wedge from={draw.from} sweep={draft} color={COLOR} />
            ) : (
              drawn && <Wedge from={draw.from} sweep={drawn.value} color={COLOR} />
            )}
            {rounds[2]
              .filter((f) => f !== drawn || drawing)
              .map((f) => (
                <Arm key={f.value} dir={draw.from + f.value} width={3} length={ARM - 12} className="" style={{ stroke: HEAT[f.heat].color, opacity: 0.7 }} />
              ))}
            {state[2] === "solved" || state[2] === "failed" ? (
              <>
                <Arm dir={draw.from + draw.target} width={5} dashed={state[2] === "failed"} className="" style={{ stroke: HEAT[0].color }} />
                {drawn && <Arm dir={draw.from + drawn.value} className="" style={{ stroke: COLOR }} />}
              </>
            ) : (
              draft !== null && <Handle dir={draw.from + draft} />
            )}
            <Arm dir={draw.from} />
            <Hub />
          </Dial>
        )}
      </div>

      <p className="min-h-6 text-center text-[15px]" aria-live="polite">
        <Message view={view} state={state[view]} list={list} last={last} readExact={readExact} hasDraft={draft !== null} />
      </p>

      {view === 1 && state[1] === "playing" && (
        <form onSubmit={submitRead} className="relative mx-auto w-full max-w-xs">
          <FocusInput
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value.replace(/\D/g, "").slice(0, 3))}
            inputMode="numeric"
            autoComplete="off"
            placeholder="Quantos graus?"
            aria-label="Quantos graus mede o ângulo"
            className="h-14 rounded-md pr-14 text-[17px] tabular-nums"
          />
          <button
            type="submit"
            disabled={busy || !text}
            aria-label="Chutar"
            className="absolute right-2 top-2 grid size-10 place-items-center rounded-[5px] bg-primary text-primary-foreground transition-[opacity,transform] active:scale-95 disabled:opacity-30"
          >
            <CornerDownLeft size={18} strokeWidth={2.5} />
          </button>
        </form>
      )}

      {view === 1 && state[1] === "solved" && state[2] === "playing" && (
        <button
          type="button"
          onClick={() => setView(2)}
          className="mx-auto flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"
        >
          Agora desenhe {draw.target}° <ArrowRight size={18} />
        </button>
      )}

      {drawing && (
        <button
          type="button"
          onClick={confirmDraw}
          disabled={!canConfirm}
          className="mx-auto flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground transition-[filter,opacity,transform] hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
        >
          <Check size={18} /> Confirmar
        </button>
      )}

      {playing && state[view] === "playing" && (
        <p className="-mt-2 text-center text-sm text-muted-foreground">
          {left === 1 ? "Resta 1 tentativa" : `Restam ${left} tentativas`}
          {round === 1 ? " para os dois ângulos" : ""}
        </p>
      )}

      {list.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-2">
          {list.map((f) => (
            <li key={f.value} className="flex animate-rise items-center gap-1.5 rounded-full bg-secondary py-1.5 pl-2.5 pr-3.5 text-sm font-medium">
              <span className="size-2.5 rounded-full" style={{ background: HEAT[f.heat].color }} />
              <span className="tabular-nums">{f.value}°</span>
              <Direction dir={f.dir} round={view} />
              <span className="text-muted-foreground">{HEAT[f.heat].label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Bolinha na ponta do braço que se arrasta. */
function Handle({ dir }: { dir: number }) {
  const [x, y] = polar(dir, ARM);
  return (
    <>
      <Arm dir={dir} className="" style={{ stroke: COLOR }} />
      <circle cx={x} cy={y} r={15} className="fill-card" stroke={COLOR} strokeWidth={6} />
    </>
  );
}

function Direction({ dir, round }: { dir: -1 | 0 | 1; round: GrauRound }) {
  if (dir === 0) return <Check size={14} className="text-success" aria-label="acertou" />;
  const label = dir === 1 ? (round === 1 ? "é maior" : "abra mais") : round === 1 ? "é menor" : "feche mais";
  const Icon = dir === 1 ? ArrowUp : ArrowDown;
  return <Icon size={14} aria-label={label} />;
}

function Message({
  view,
  state,
  list,
  last,
  readExact,
  hasDraft,
}: {
  view: GrauRound;
  state: RoundState;
  list: GrauFeedback[];
  last?: GrauFeedback;
  readExact?: number;
  hasDraft: boolean;
}) {
  if (state === "solved" && last) {
    return (
      <>
        <strong style={{ color: HEAT[0].color }}>Acertou {list.length === 1 ? "de primeira" : `em ${list.length}`}!</strong>{" "}
        <span className="text-muted-foreground">
          {view === 1 ? `O ângulo mede ${readExact}°.` : `Você desenhou ${last.value}°.`}
        </span>
      </>
    );
  }
  if (state === "failed") {
    const closest = [...list].sort((a, b) => a.heat - b.heat)[0];
    return (
      <span className="text-muted-foreground">
        {view === 1 ? `O ângulo media ${readExact}°.` : closest ? `Não deu: o mais perto foi ${closest.value}°.` : "Não deu dessa vez."}
      </span>
    );
  }
  if (!last) {
    return (
      <span className="text-muted-foreground">
        {view === 1
          ? "Chute quantos graus tem a abertura marcada. Vale errar por até 2°."
          : hasDraft
            ? "Gire até achar que chegou e confirme."
            : "Arraste em volta do mostrador para abrir o ângulo."}
      </span>
    );
  }
  const heat = HEAT[last.heat];
  const hint = view === 1 ? (last.dir === 1 ? "o ângulo é maior" : "o ângulo é menor") : last.dir === 1 ? "abra mais" : "feche mais";
  return (
    <>
      <strong style={{ color: heat.color }}>{heat.label}</strong>
      <span className="text-muted-foreground">
        {" "}
        · {last.value}°: {hint}
      </span>
    </>
  );
}
