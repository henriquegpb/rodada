"use client";

import { useRef, useState, type PointerEvent } from "react";
import { ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { BoardProps, PointsRules } from "../types";
import { COLOR, REFERENCE_COLOR } from "./color";
import { Figure } from "./Figure";
import { RoundBars } from "./Recap";
import { ROUNDS, SCENE, aspectOf, formatSize, layout, pointsColor, usesWidth } from "./scene";
import type { EscalaFeedback, EscalaPuzzle, EscalaRound, Measure } from "./types";

const { W, H, GROUND, LEFT } = SCENE;

function sceneOf(round: EscalaRound) {
  const refAspect = aspectOf(round.reference.shape);
  const targetAspect = aspectOf(round.target.shape);
  const L = layout({ measure: round.reference.measure, size: round.reference.size, aspect: refAspect }, { measure: round.target.measure, aspect: targetAspect });
  /** Altura em pixels de algo com `size` metros no lado perguntado. */
  const heightOf = (size: number, measure: Measure, aspect: number) => (usesWidth(measure) ? size / aspect : size) * L.ppm;
  return {
    ...L,
    refHeight: heightOf(round.reference.size, round.reference.measure, refAspect),
    targetHeight: (size: number) => heightOf(size, round.target.measure, targetAspect),
    targetAspect,
  };
}

const firstDraft = (round: EscalaRound) => {
  const s = sceneOf(round);
  return Math.min(s.max, Math.max(s.min, round.reference.size));
};

export function EscalaBoard({ play, submitGuess, finish }: BoardProps<EscalaPuzzle, EscalaFeedback, PointsRules>) {
  const { rounds } = play.puzzle;
  const results = play.guesses.map((g) => g.feedback);
  const playing = play.status === "playing";
  // Rodadas cujo resultado a pessoa já viu; voltando à página, não repete a revelação.
  const [seen, setSeen] = useState(results.length);
  const [draft, setDraft] = useState(() => (results.length < ROUNDS ? firstDraft(rounds[results.length]) : 0));
  const [viewing, setViewing] = useState(ROUNDS - 1);
  const [busy, setBusy] = useState(false);
  const dragging = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const revealing = results.length > seen;
  const summary = !revealing && results.length === ROUNDS;
  const guessing = playing && !revealing && !summary;
  const shown = summary ? viewing : revealing ? results.length - 1 : results.length;
  const round = rounds[shown];
  const scene = sceneOf(round);
  const result = results[shown] as EscalaFeedback | undefined;
  const value = guessing ? draft : (result?.guess ?? draft);
  const total = results.reduce((sum, r) => sum + r.points, 0);

  async function confirm() {
    if (busy) return;
    setBusy(true);
    const error = await submitGuess(String(Number(draft.toPrecision(4))));
    setBusy(false);
    if (error) toast(error);
  }

  function next() {
    setSeen(results.length);
    if (results.length < ROUNDS) setDraft(firstDraft(rounds[results.length]));
    else void finish();
  }

  function drag(e: PointerEvent<SVGSVGElement>) {
    const ctm = svgRef.current?.getScreenCTM();
    if (!ctm) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    // Projeta o ponteiro na diagonal do alvo (do canto de baixo à esquerda ao de cima à direita).
    const bh = scene.targetHeight(1);
    const bw = bh * scene.targetAspect;
    const g = ((p.x - scene.x0) * bw + (GROUND - p.y) * bh) / (bw * bw + bh * bh);
    setDraft(Math.min(scene.max, Math.max(scene.min, g)));
  }

  const height = scene.targetHeight(value);
  const slider = Math.round((1000 * Math.log(draft / scene.min)) / Math.log(scene.max / scene.min));
  const off = result ? Math.round(Math.abs(result.guess / result.actual - 1) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4 text-sm text-muted-foreground">
        <span>
          Rodada <strong className="tabular-nums text-foreground">{shown + 1}</strong>/{ROUNDS}
        </span>
        <span>
          <strong className="tabular-nums text-foreground">{total}</strong> pontos
        </span>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-border bg-card">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className={cn("block w-full select-none", guessing && "touch-none cursor-nwse-resize")}
          aria-label={guessing ? `Arraste para mudar o tamanho de ${round.target.name}` : undefined}
          onPointerDown={(e) => {
            if (!guessing) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            dragging.current = true;
            drag(e);
          }}
          onPointerMove={(e) => dragging.current && drag(e)}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
        >
          <defs>
            <pattern id="escala-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0 H0 V40" fill="none" className="stroke-foreground/[0.05]" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#escala-grid)" />
          <rect y={GROUND} width={W} height={H - GROUND} className="fill-foreground/[0.03]" />
          <line x1="0" y1={GROUND} x2={W} y2={GROUND} className="stroke-border" strokeWidth="3" />

          <Figure shape={round.reference.shape} x={LEFT} height={scene.refHeight} fill={REFERENCE_COLOR} />
          {/* Linha da altura da referência, para comparar. */}
          <line
            x1={LEFT}
            x2={W}
            y1={GROUND - scene.refHeight}
            y2={GROUND - scene.refHeight}
            stroke={REFERENCE_COLOR}
            strokeDasharray="3 7"
            strokeWidth="1.5"
            opacity=".35"
          />

          {result && <Figure shape={round.target.shape} x={scene.x0} height={scene.targetHeight(result.actual)} className="fill-foreground/25" />}
          <Figure shape={round.target.shape} x={scene.x0} height={height} fill={COLOR} style={{ opacity: result ? 0.8 : 1 }} />
        </svg>

        {result && (
          <div className="absolute left-3 top-3 animate-rise rounded-lg bg-background/90 px-4 py-3 backdrop-blur sm:left-5 sm:top-5">
            <p className="font-display leading-none">
              <span className="text-5xl tabular-nums" style={{ color: pointsColor(result.points) }}>
                {result.points}
              </span>
              <span className="text-xl text-muted-foreground"> /100</span>
            </p>
            <p className="mt-2 text-sm">
              Seu palpite: <strong className="tabular-nums">{formatSize(result.guess)}</strong>
            </p>
            <p className="text-sm">
              De verdade: <strong className="tabular-nums">{formatSize(result.actual)}</strong>
            </p>
            <p className="text-sm text-muted-foreground">{off === 0 ? "Na mosca!" : `Errou por ${off}%`}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 text-[15px] leading-relaxed">
          <p>
            <span className="text-muted-foreground">Referência: </span>
            <strong style={{ color: REFERENCE_COLOR }}>{round.reference.name}</strong>
            <span className="text-muted-foreground">
              {" "}
              · {formatSize(round.reference.size)} de {round.reference.measure}
            </span>
          </p>
          <p>
            <strong style={{ color: COLOR }}>{round.target.name}</strong>
            <span className="text-muted-foreground">
              {" "}
              · {result ? `${formatSize(result.actual)} de ${round.target.measure}` : `acerte o tamanho (${round.target.measure})`}
            </span>
          </p>
        </div>
        {guessing ? (
          <PrimaryButton onClick={confirm} disabled={busy}>
            <Check size={18} /> Confirmar
          </PrimaryButton>
        ) : revealing ? (
          <PrimaryButton onClick={next}>
            {results.length === ROUNDS ? "Ver resultado" : "Próxima"} <ArrowRight size={18} />
          </PrimaryButton>
        ) : summary && playing ? (
          <PrimaryButton onClick={() => finish()}>
            Ver resultado <ArrowRight size={18} />
          </PrimaryButton>
        ) : null}
      </div>

      {guessing && (
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={1000}
            value={slider}
            onChange={(e) => setDraft(scene.min * Math.pow(scene.max / scene.min, Number(e.target.value) / 1000))}
            aria-label={`Tamanho de ${round.target.name}`}
            aria-valuetext={formatSize(draft)}
            className="h-2 flex-1 cursor-pointer"
            style={{ accentColor: COLOR }}
          />
          <span className="w-20 text-right text-sm font-semibold tabular-nums">{formatSize(draft)}</span>
        </div>
      )}

      {summary && (
        <section className="mt-2 animate-rise">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Suas rodadas · toque numa para rever</h3>
          <RoundBars rounds={rounds} results={results} selected={viewing} onSelect={setViewing} />
        </section>
      )}
    </div>
  );
}

function PrimaryButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="ml-auto flex h-12 items-center gap-2 rounded-full bg-primary px-7 font-semibold text-primary-foreground transition-[filter,opacity,transform] hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
    >
      {children}
    </button>
  );
}
