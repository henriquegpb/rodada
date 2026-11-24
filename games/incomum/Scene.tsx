"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Creature } from "./art";
import { MAX_DEPTH, MAX_POINTS, MILESTONES, milestonesAt } from "./tiers";

/**
 * O mar do Incomum, da superfície ao fundo da Fossa das Marianas: a cor da água, os raios de sol, as
 * ondas, as bolhas, as algas do recife, a neve marinha e os pontinhos que brilham no escuro, tudo
 * pela profundidade do momento (`depth`, em metros).
 */

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Cor da água em cima e embaixo da tela, por profundidade. */
const WATER: [depth: number, top: string, bottom: string][] = [
  [0, "#8fdcff", "#1497e0"],
  [200, "#1fa2e6", "#0866b3"],
  [1000, "#0a6fbd", "#123f8c"],
  [3000, "#16307a", "#0f1c4d"],
  [6000, "#0d1538", "#060a1e"],
  [MAX_DEPTH, "#04060f", "#000000"],
];

function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(" ")})`;
}

/** Cor da água em cima e embaixo, a uma profundidade. */
export function waterAt(depth: number): [string, string] {
  const i = Math.max(0, WATER.findIndex(([d]) => d > depth) - 1);
  const [d0, t0, b0] = WATER[i];
  const [d1, t1, b1] = WATER[Math.min(i + 1, WATER.length - 1)];
  const t = d1 === d0 ? 0 : Math.min(1, (depth - d0) / (d1 - d0));
  return [mix(t0, t1, t), mix(b0, b1, t)];
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Profundidade animada até `target`: desce devagar no começo, acelera e freia, com mais tempo quanto
 * maior a descida. Abre já no alvo, sem animar. `arrived` diz que chegou no alvo atual.
 */
export function useDepth(target: number) {
  const [state, setState] = useState({ depth: target, target, arrived: true });
  const current = useRef(target);
  useEffect(() => {
    const from = current.current;
    const duration =
      reducedMotion() || target === from ? 1 : 700 + 2300 * Math.sqrt(Math.abs(target - from) / MAX_DEPTH);
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      const depth = from + (target - from) * eased;
      current.current = depth;
      setState({ depth, target, arrived: p === 1 });
      if (p < 1) frame = window.requestAnimationFrame(step);
    };
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [target]);
  return { depth: state.depth, arrived: state.arrived && state.target === target };
}

export function Ocean({
  depth,
  diving,
  glow: ring,
  className,
  children,
}: {
  depth: number;
  diving: boolean;
  /** Brilho em volta do card, na cor da raridade da resposta (0 a 4 = mais forte); null apaga. */
  glow?: { color: string; strength: number } | null;
  className?: string;
  children: ReactNode;
}) {
  const [top, bottom] = waterAt(depth);
  const sun = clamp(1 - depth / 700);
  const surface = clamp(1 - depth / 120);
  const reef = clamp(1 - Math.abs(depth - 600) / 700);
  const glow = clamp((depth - 2500) / 3500);
  return (
    <div
      data-ocean=""
      className={cn(
        "relative isolate overflow-hidden rounded-3xl text-white transition-[box-shadow] duration-500",
        className,
      )}
      style={{
        background: `linear-gradient(180deg, ${top}, ${bottom})`,
        boxShadow: ring
          ? `0 0 0 3px ${ring.color}, 0 0 ${18 + ring.strength * 12}px ${2 + ring.strength * 4}px ${ring.color}`
          : "0 0 0 0 transparent",
      }}
    >
      {/* Raios de sol entrando na água */}
      <div className="pointer-events-none absolute inset-0" style={{ opacity: sun * 0.9 }} aria-hidden="true">
        {[8, 26, 47, 66, 84].map((left, i) => (
          <span
            key={left}
            className="animate-sway absolute -top-10 h-[130%] origin-top"
            style={{
              left: `${left}%`,
              width: `${40 + (i % 3) * 22}px`,
              transform: `rotate(${12 - i * 5}deg)`,
              animationDelay: `${-i * 1.3}s`,
              background: "linear-gradient(180deg, rgb(255 255 255 / 0.35), rgb(255 255 255 / 0))",
              filter: "blur(6px)",
            }}
          />
        ))}
      </div>

      {/* Ondas da superfície: somem e sobem quando o submarino desce */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-16 overflow-hidden"
        style={{ opacity: surface, transform: `translateY(${-Math.min(depth, 200) * 0.4}px)` }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 800 40"
          preserveAspectRatio="none"
          className="animate-waves absolute top-0 left-0 h-10 w-[200%]"
        >
          <path
            d="M0 22 Q50 8 100 22 T200 22 T300 22 T400 22 T500 22 T600 22 T700 22 T800 22 V0 H0 Z"
            fill="rgb(255 255 255 / 0.55)"
          />
          <path
            d="M0 22 Q50 8 100 22 T200 22 T300 22 T400 22 T500 22 T600 22 T700 22 T800 22"
            fill="none"
            stroke="#fff"
            strokeWidth="3"
          />
        </svg>
      </div>

      {/* Algas do recife */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
        style={{ opacity: reef * 0.85 }}
        aria-hidden="true"
      >
        {[4, 11, 19, 72, 80, 90].map((left, i) => (
          <svg
            key={left}
            viewBox="0 0 40 160"
            className="animate-sway absolute bottom-0 h-full origin-bottom"
            style={{ left: `${left}%`, animationDelay: `${-i * 0.9}s`, height: `${60 + (i % 3) * 20}%` }}
          >
            <path
              d="M20 160 Q4 120 20 90 Q36 60 18 30 Q10 14 22 0"
              fill="none"
              stroke="#0f5132"
              strokeWidth="9"
              strokeLinecap="round"
            />
          </svg>
        ))}
      </div>

      {/* Pontinhos que brilham no fundo do mar */}
      <Specks opacity={glow} />

      {/* Neve marinha subindo sem parar: o submarino está sempre descendo. */}
      <MarineSnow diving={diving} opacity={0.45 + 0.55 * clamp(depth / 400)} />

      <Bubbles diving={diving} />

      {/* Escurece as bordas conforme desce */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 45% 55%, transparent 35%, rgb(0 0 0 / 0.55))",
          opacity: clamp(depth / 4000),
        }}
        aria-hidden="true"
      />

      {children}
    </div>
  );
}

/**
 * Neve marinha: farelos que passam subindo pela janela, devagar quando o submarino só afunda e
 * rápido quando ele desce de verdade.
 */
function MarineSnow({ diving, opacity }: { diving: boolean; opacity: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const anims = useRef<Animation[]>([]);
  useEffect(() => {
    const host = ref.current;
    if (!host || reducedMotion()) return;
    const made: HTMLSpanElement[] = [];
    for (let i = 0; i < 46; i++) {
      const s = document.createElement("span");
      const size = 1.5 + Math.random() * 2.5;
      Object.assign(s.style, {
        position: "absolute",
        left: `${Math.random() * 100}%`,
        top: "100%",
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "999px",
        background: `rgb(255 255 255 / ${0.35 + Math.random() * 0.4})`,
      });
      host.appendChild(s);
      made.push(s);
      const drift = (Math.random() - 0.5) * 40;
      anims.current.push(
        s.animate([{ transform: "translate(0, 0)" }, { transform: `translate(${drift}px, calc(-100cqh - 20px))` }], {
          duration: 7000 + Math.random() * 9000,
          delay: -Math.random() * 16000,
          iterations: Infinity,
          easing: "linear",
        }),
      );
    }
    return () => {
      anims.current = [];
      made.forEach((s) => s.remove());
    };
  }, []);
  useEffect(() => {
    for (const a of anims.current) a.updatePlaybackRate(diving ? 6 : 1);
  }, [diving]);
  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 [container-type:size]"
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}

/** Bolhas subindo; no mergulho sobem mais rápido (o submarino está descendo). */
function Bubbles({ diving }: { diving: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const anims = useRef<Animation[]>([]);
  useEffect(() => {
    const host = ref.current;
    if (!host || reducedMotion()) return;
    const made: HTMLSpanElement[] = [];
    for (let i = 0; i < 22; i++) {
      const b = document.createElement("span");
      const size = 4 + Math.random() * 12;
      Object.assign(b.style, {
        position: "absolute",
        left: `${Math.random() * 100}%`,
        bottom: "-20px",
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "999px",
        border: "2px solid rgb(255 255 255 / 0.55)",
        background: "rgb(255 255 255 / 0.12)",
      });
      host.appendChild(b);
      made.push(b);
      const sway = (Math.random() - 0.5) * 60;
      anims.current.push(
        b.animate(
          [
            { transform: "translate(0, 0)", opacity: 0 },
            { opacity: 0.9, offset: 0.1 },
            { transform: `translate(${sway}px, -60vh)`, opacity: 0.8, offset: 0.7 },
            { transform: `translate(${-sway / 2}px, -90vh)`, opacity: 0 },
          ],
          {
            duration: 5000 + Math.random() * 6000,
            delay: -Math.random() * 9000,
            iterations: Infinity,
            easing: "linear",
          },
        ),
      );
    }
    return () => {
      anims.current = [];
      made.forEach((b) => b.remove());
    };
  }, []);
  useEffect(() => {
    for (const a of anims.current) a.updatePlaybackRate(diving ? 4.5 : 1);
  }, [diving]);
  return <div ref={ref} className="pointer-events-none absolute inset-0" aria-hidden="true" />;
}

/** Pontinhos de luz (bichos bioluminescentes) piscando nas profundezas. */
function Specks({ opacity }: { opacity: number }) {
  const [specks, setSpecks] = useState<{ x: number; y: number; s: number; d: number; c: string }[]>([]);
  useEffect(() => {
    const colors = ["#5eead4", "#a5f3fc", "#c4b5fd", "#bef264"];
    const id = window.requestAnimationFrame(() =>
      setSpecks(
        Array.from({ length: 36 }, (_, i) => ({
          x: Math.random() * 100,
          y: Math.random() * 100,
          s: 2 + Math.random() * 4,
          d: Math.random() * 4,
          c: colors[i % colors.length],
        })),
      ),
    );
    return () => window.cancelAnimationFrame(id);
  }, []);
  if (opacity <= 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0" style={{ opacity }} aria-hidden="true">
      {specks.map((p, i) => (
        <span
          key={i}
          className="animate-twinkle absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.s,
            height: p.s,
            background: p.c,
            boxShadow: `0 0 ${p.s * 3}px ${p.c}`,
            animationDelay: `${-p.d}s`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * A régua da direita é o mapa da fossa e a coleção: um bicho a cada 70 pontos, à mesma distância um
 * do outro, colorido quando já foi alcançado e em silhueta quando ainda não. O próximo pisca e diz
 * quantos pontos faltam. `points` é a posição do submarino em pontos (acende os bichos na descida).
 */
export function TrenchRuler({ points, className }: { points: number; className?: string }) {
  const reached = milestonesAt(points);
  const at = (p: number) => `${(Math.min(p, MAX_POINTS) / MAX_POINTS) * 100}%`;
  return (
    <div className={cn("pointer-events-none relative", className)} aria-hidden="true">
      <span className="absolute top-0 bottom-0 left-[10.5px] w-[3px] rounded-full bg-white/25" />
      {MILESTONES.map((m, i) => {
        const got = i < reached;
        const next = i === reached;
        return (
          <div
            key={m.name}
            className="absolute left-0 flex -translate-y-1/2 items-center gap-1.5"
            style={{ top: at(m.points) }}
          >
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full transition duration-500",
                got ? "scale-110 bg-white/90 shadow-[0_0_10px_rgb(255_255_255/0.5)]" : "bg-black/30",
                next && "animate-pulse ring-2 ring-white/80",
              )}
            >
              <Creature art={m.art} className={cn("h-4 w-5", !got && "opacity-45 brightness-0 invert")} />
            </span>
            <span
              className={cn(
                "hidden text-[11px] leading-tight font-bold whitespace-nowrap sm:block",
                got ? "opacity-100" : next ? "opacity-90" : "opacity-40",
              )}
            >
              {got || next ? m.name : "???"}
              {next && (
                <span className="block font-mono text-[10px] font-normal opacity-85">
                  faltam {Math.ceil(m.points - points)} pts
                </span>
              )}
            </span>
          </div>
        );
      })}
      <span
        className="absolute left-[2.5px] size-[19px] -translate-y-1/2 rounded-full border-[3px] border-white bg-[#fbbf24] shadow-[0_0_12px_rgb(251_191_36/0.8)]"
        style={{ top: at(points) }}
      />
    </div>
  );
}
