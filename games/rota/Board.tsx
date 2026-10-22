"use client";

import { useMemo, useState } from "react";
import { Lightbulb, LocateFixed, Minus, Plus } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { AttemptRules, BoardProps } from "../types";
import { getCountry } from "../_shared/geo";
import { CountryInput } from "../_shared/geo/CountryInput";
import { usePanZoom, type View } from "../_shared/geo/usePanZoom";
import map from "../_shared/geo/world-map.json";
import { END_COLOR, START_COLOR, VERDICT_COLOR, VERDICT_LABEL } from "./colors";
import type { RotaFeedback, RotaPuzzle, RotaVerdict } from "./types";

const paths: Record<string, string> = map.paths;
const dots: Record<string, number[]> = map.dots;
const bounds: Record<string, number[]> = map.bounds;
const anchors: Record<string, number[]> = map.anchors;
const WORLD = { width: map.width, height: map.height };

const HINTS = ["Mostrar o próximo país", "Mostrar todos os contornos", "Mostrar as iniciais"] as const;

/**
 * Enquadra o mapa: a parte principal da partida e do destino, mais o ponto central de cada país do
 * caminho (a Rússia inteira, por exemplo, abriria o mapa no mundo todo). Folga e proporção 16:10.
 */
function frame(start: string, end: string, route: string[]): View {
  const point = (code: string) => {
    const [x, y] = anchors[code];
    return [x, y, x, y];
  };
  const boxes = [bounds[start], bounds[end], ...route.map(point)].filter(Boolean);
  let x0 = Math.min(...boxes.map((b) => b[0]));
  let y0 = Math.min(...boxes.map((b) => b[1]));
  let x1 = Math.max(...boxes.map((b) => b[2]));
  let y1 = Math.max(...boxes.map((b) => b[3]));
  const pad = Math.max(x1 - x0, y1 - y0) * 0.12 + 6;
  [x0, y0, x1, y1] = [x0 - pad, y0 - pad, x1 + pad, y1 + pad];
  const [w, h] = [x1 - x0, y1 - y0];
  if (w / h < 1.6) {
    const extra = h * 1.6 - w;
    x0 -= extra / 2;
    x1 += extra / 2;
  } else {
    const extra = w / 1.6 - h;
    y0 -= extra / 2;
    y1 += extra / 2;
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

const hintKey = (dateKey: string) => `rodada:rota-dicas:${dateKey}`;

function readHints(dateKey: string): number {
  try {
    return Number(localStorage.getItem(hintKey(dateKey)) ?? 0);
  } catch {
    return 0;
  }
}

export default function RotaBoard({ play, rules, submitGuess }: BoardProps<RotaPuzzle, RotaFeedback, AttemptRules>) {
  const { start, end, route } = play.puzzle;
  const playing = play.status === "playing";
  // O tabuleiro só monta no navegador (depois de a partida carregar), então dá para ler o localStorage aqui.
  const [hints, setHints] = useState(() => readHints(play.dateKey));
  const guessed = useMemo(() => new Map(play.guesses.map((g) => [g.feedback.code, g.feedback.verdict])), [play.guesses]);
  const exclude = useMemo(() => new Set([start, end, ...guessed.keys()]), [start, end, guessed]);
  const initialView = useMemo(() => frame(start, end, route), [start, end, route]);
  const { svgRef, viewBox, handlers, zoomIn, zoomOut, reset } = usePanZoom(initialView, WORLD);

  const nextHidden = route.find((c) => !guessed.has(c));
  /** Contornos de dica: o próximo país do caminho, todos eles, ou o caminho inteiro no fim. */
  const outlined = !playing ? route : hints >= 2 ? route : hints >= 1 && nextHidden ? [nextHidden] : [];

  function takeHint() {
    const next = Math.min(HINTS.length, hints + 1);
    setHints(next);
    trackEvent("hint_used", { game: "rota", hint: next, practice: Boolean(play.practice) });
    try {
      localStorage.setItem(hintKey(play.dateKey), String(next));
    } catch {}
  }

  const name = (code: string) => getCountry(code)?.name ?? code;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-lg leading-snug">
        De{" "}
        <strong className="font-semibold" style={{ color: START_COLOR }}>
          {name(start)}
        </strong>{" "}
        até{" "}
        <strong className="font-semibold" style={{ color: END_COLOR }}>
          {name(end)}
        </strong>
        , só por terra.
        <span className="mt-1 block text-sm text-muted-foreground">
          Diga os países no caminho até ligar um ao outro.
        </span>
      </p>

      <div className="relative overflow-hidden rounded-lg bg-card">
        <svg
          ref={svgRef}
          viewBox={viewBox}
          className="aspect-[16/10] w-full cursor-grab touch-none select-none active:cursor-grabbing"
          role="img"
          aria-label="Mapa da rota"
          {...handlers}
        >
          <path d={map.graticule} fill="none" stroke="var(--border)" strokeWidth={0.4} />
          {hints >= 2 &&
            Object.entries(paths).map(([code, d]) => (
              <path key={`all-${code}`} d={d} fill="none" stroke="var(--input)" strokeWidth={0.4} />
            ))}
          {outlined.map((code) => (
            <Shape key={`hint-${code}`} code={code} fill="var(--foreground)" fillOpacity={0.08} stroke="var(--foreground)" dashed />
          ))}
          {[...guessed].map(([code, verdict]) => (
            <Shape key={code} code={code} fill={VERDICT_COLOR[verdict]} />
          ))}
          <Shape code={start} fill={START_COLOR} />
          <Shape code={end} fill={END_COLOR} />
        </svg>
        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          <MapButton label="Aproximar" onClick={zoomIn}>
            <Plus size={16} />
          </MapButton>
          <MapButton label="Afastar" onClick={zoomOut}>
            <Minus size={16} />
          </MapButton>
          <MapButton label="Recentralizar" onClick={reset}>
            <LocateFixed size={16} />
          </MapButton>
        </div>
      </div>

      {playing && <CountryInput onGuess={submitGuess} exclude={exclude} />}

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            Chutes · {play.guesses.length}/{rules.maxAttempts}
          </h3>
          <Legend />
        </div>
        {play.guesses.length === 0 ? (
          <p className="text-sm text-muted-foreground/70">Nenhum chute ainda.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {play.guesses.map(({ feedback }) => (
              <li
                key={feedback.code}
                className="flex items-center gap-2 rounded-full bg-secondary py-1.5 pl-2.5 pr-3.5 text-sm font-medium animate-rise"
              >
                <span className="size-2.5 rounded-full" style={{ background: VERDICT_COLOR[feedback.verdict] }} />
                {feedback.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      {playing && (
        <section>
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Lightbulb size={15} /> Dicas · {hints}/{HINTS.length}
          </h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {HINTS.map((label, i) => (
              <button
                key={label}
                type="button"
                disabled={i !== hints}
                onClick={takeHint}
                className={cn(
                  "h-11 rounded-md border border-border px-3 text-sm font-medium transition-colors",
                  i < hints && "border-transparent bg-secondary text-muted-foreground",
                  i === hints && "hover:border-foreground/40 hover:bg-secondary/50",
                  i > hints && "opacity-40",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {hints >= 3 && (
            <p className="mt-3 text-sm">
              Iniciais do caminho:{" "}
              <span className="font-mono font-semibold tracking-wider">
                {route.map((c) => name(c)[0]).join(" · ")}
              </span>
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function Shape({
  code,
  fill,
  fillOpacity,
  stroke,
  dashed,
}: {
  code: string;
  fill: string;
  fillOpacity?: number;
  stroke?: string;
  dashed?: boolean;
}) {
  const common = {
    fill,
    fillOpacity,
    stroke: stroke ?? "var(--card)",
    strokeWidth: dashed ? 1.2 : 0.5,
    strokeDasharray: dashed ? "4 3" : undefined,
    vectorEffect: "non-scaling-stroke" as const,
  };
  if (paths[code]) return <path d={paths[code]} {...common} className="transition-[fill] duration-500" />;
  const [x, y] = dots[code] ?? [];
  return x === undefined ? null : <circle cx={x} cy={y} r={2.5} {...common} />;
}

function MapButton({ label, onClick, children }: { label: string; onClick(): void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-9 place-items-center rounded-md border border-border bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
    >
      {children}
    </button>
  );
}

function Legend() {
  return (
    <span className="flex gap-3 text-xs text-muted-foreground">
      {(Object.keys(VERDICT_LABEL) as RotaVerdict[]).map((v) => (
        <span key={v} className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: VERDICT_COLOR[v] }} />
          {VERDICT_LABEL[v]}
        </span>
      ))}
    </span>
  );
}
