"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { playSound, preloadSound } from "@/components/sounds/react-bits-sound";
import tink from "@/components/sounds/tink";

/**
 * A festa de cada raridade. A óbvia só levanta poeira, sem graça; comum e incomum soltam bolhas. A
 * rara já é festa: faíscas em duas ondas, raios, confete, clarão e o card pulsando. A raríssima é a
 * festa toda: três ondas, chuva de confete, o card tremendo, clarão forte e um acorde no fim.
 * `flash` é a força do clarão (0 = sem); `waves`, quantas ondas de faíscas; `confetti`, quantos papéis.
 */
export const PARTY = [
  { burst: 14, kind: "dust", flash: 0, rays: false, waves: 1, confetti: 0, shake: false, notes: [-7], chord: [] },
  { burst: 14, kind: "bubbles", flash: 0, rays: false, waves: 1, confetti: 0, shake: false, notes: [0, 4], chord: [] },
  {
    burst: 24,
    kind: "bubbles",
    flash: 0,
    rays: false,
    waves: 1,
    confetti: 0,
    shake: false,
    notes: [0, 4, 7],
    chord: [],
  },
  {
    burst: 44,
    kind: "sparks",
    flash: 0.45,
    rays: true,
    waves: 2,
    confetti: 50,
    shake: false,
    notes: [0, 4, 7, 12, 16],
    chord: [12, 16, 19],
  },
  {
    burst: 64,
    kind: "sparks",
    flash: 0.8,
    rays: true,
    waves: 3,
    confetti: 120,
    shake: true,
    notes: [0, 4, 7, 12, 16, 19, 24],
    chord: [12, 16, 19, 24],
  },
] as const;

export type BurstKind = (typeof PARTY)[number]["kind"];

/** Espaço entre as notas do arpejo, em ms. */
const NOTE_GAP = 75;

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** O "tink" é sintetizado na primeira vez em cada altura: prepara todas antes da primeira resposta. */
export function usePreloadNotes() {
  useEffect(() => {
    for (const pitch of new Set(PARTY.flatMap((p) => [...p.notes, ...p.chord]))) preloadSound(tink, { pitch });
  }, []);
}

/** Toca o arpejo da raridade (e, nas raras, um acorde no fim) e vibra o celular nas raras. */
export function cheer(tier: number) {
  const { notes, chord } = PARTY[tier];
  notes.forEach((pitch, i) => {
    window.setTimeout(() => playSound(tink, { pitch }).catch(() => {}), i * NOTE_GAP);
  });
  const end = notes.length * NOTE_GAP + 120;
  for (const pitch of chord) window.setTimeout(() => playSound(tink, { pitch }).catch(() => {}), end);
  if (tier >= 3) navigator.vibrate?.(tier === 4 ? [60, 50, 60, 50, 60, 80, 220] : [50, 60, 90]);
}

/**
 * O card inteiro comemora a rara e a raríssima: o brilho em volta pulsa e, na raríssima, o card treme
 * quando a palavra bate.
 */
export function shakeCard(card: HTMLElement, tier: number, color: string) {
  if (reducedMotion() || tier < 3) return;
  const glow = (spread: number, blur: number) => `0 0 0 4px ${color}, 0 0 ${blur}px ${spread}px ${color}`;
  card.animate([{ boxShadow: glow(14, 60) }, { boxShadow: glow(tier === 4 ? 36 : 24, tier === 4 ? 130 : 95) }], {
    duration: 650,
    iterations: tier === 4 ? 6 : 4,
    direction: "alternate",
    easing: "ease-in-out",
  });
  if (PARTY[tier].shake) {
    card.animate(
      [
        { transform: "translate(0, 0)" },
        { transform: "translate(-7px, 3px) rotate(-0.6deg)" },
        { transform: "translate(7px, -3px) rotate(0.6deg)" },
        { transform: "translate(-5px, 2px)" },
        { transform: "translate(4px, -1px)" },
        { transform: "translate(0, 0)" },
      ],
      { duration: 480, delay: 330, easing: "ease-out" },
    );
  }
}

/** Chuva de confete caindo pelo card todo (o pai precisa ser `relative` e cortar o que sai). */
export function Confetti({ count, colors }: { count: number; colors: readonly string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = ref.current;
    if (!host || !count || reducedMotion()) return;
    const pieces: HTMLSpanElement[] = [];
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("span");
      const w = 5 + Math.random() * 5;
      Object.assign(piece.style, {
        position: "absolute",
        left: `${Math.random() * 100}%`,
        top: "-16px",
        width: `${w}px`,
        height: `${w * (1.4 + Math.random())}px`,
        borderRadius: "2px",
        background: colors[i % colors.length],
      });
      host.appendChild(piece);
      pieces.push(piece);
      const sway = (Math.random() - 0.5) * 120;
      const spin = (Math.random() - 0.5) * 1080;
      piece.animate(
        [
          { transform: "translate(0, 0) rotate(0deg)", opacity: 1 },
          { transform: `translate(${sway * 0.6}px, 55cqh) rotate(${spin * 0.6}deg)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${sway}px, calc(100cqh + 20px)) rotate(${spin}deg)`, opacity: 0.6 },
        ],
        {
          duration: 1800 + Math.random() * 1400,
          delay: Math.random() * 700,
          easing: "cubic-bezier(.25,.6,.5,1)",
          fill: "both",
        },
      );
    }
    return () => pieces.forEach((p) => p.remove());
  }, [count, colors]);
  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden [container-type:size]"
      aria-hidden="true"
    />
  );
}

/** Número que sobe de 0 até `target`, acelerando no começo e freando no fim. */
export function useCountUp(target: number, ms = 700) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const length = reducedMotion() ? 1 : ms;
    let frame = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / length);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = window.requestAnimationFrame(step);
    };
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [target, ms]);
  return value;
}

/**
 * Estouro saindo do centro do elemento pai (que precisa ser `relative`): poeira caindo, bolhas
 * subindo ou faíscas que brilham.
 */
export function Burst({
  count,
  color,
  kind,
  delay = 0,
}: {
  count: number;
  color: string;
  kind: BurstKind;
  /** Ondas seguidas: a segunda e a terceira saem um pouco depois. */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = ref.current;
    if (!host || !count || reducedMotion()) return;
    const glow = kind === "sparks";
    const sand = kind === "dust";
    const pieces: HTMLSpanElement[] = [];
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("span");
      const size = sand ? 3 + Math.random() * 4 : glow ? 4 + Math.random() * 6 : 8 + Math.random() * 14;
      const tint = sand ? (i % 2 ? "#cbd5e1" : "#94a3b8") : i % 3 === 0 ? color : glow ? "#ecfeff" : "#ffffff";
      Object.assign(piece.style, {
        position: "absolute",
        left: "50%",
        top: "50%",
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "999px",
        pointerEvents: "none",
        ...(sand
          ? { background: tint }
          : glow
            ? { background: tint, boxShadow: `0 0 ${size * 3}px ${size}px ${tint}` }
            : { border: `2.5px solid ${tint}`, background: "rgb(255 255 255 / 0.15)" }),
      });
      host.appendChild(piece);
      pieces.push(piece);
      // Poeira espirra pouco, para os lados, e cai; o resto estoura em roda.
      const angle = sand
        ? (i % 2 ? 0 : Math.PI) + (Math.random() - 0.5) * 0.9
        : (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const distance = sand ? 30 + Math.random() * 70 : 80 + Math.random() * 150;
      const x = Math.cos(angle) * distance;
      const y = sand ? -10 - Math.random() * 20 : Math.sin(angle) * distance;
      piece.animate(
        [
          { transform: "translate(-50%, -50%) scale(0.3)", opacity: 1 },
          { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1)`, opacity: 1, offset: 0.55 },
          // Bolha sobe e estoura; faísca se apaga devagar.
          {
            transform: `translate(calc(-50% + ${x * 1.1}px), calc(-50% + ${sand ? 70 : y - (glow ? 10 : 70)}px)) scale(${glow ? 0.4 : sand ? 0.8 : 1.2})`,
            opacity: 0,
          },
        ],
        {
          duration: (glow ? 1600 : 1000) + Math.random() * 600,
          easing: "cubic-bezier(.17,.84,.44,1)",
          delay: delay + Math.random() * 120,
          // "both": a onda atrasada fica escondida até sair.
          fill: "both",
        },
      );
    }
    return () => pieces.forEach((p) => p.remove());
  }, [count, color, kind, delay]);
  return <div ref={ref} className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true" />;
}

/** Clarão rápido na tela toda, na cor da zona. */
export function Flash({ color, strength = 0.7 }: { color: string; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    if (!mounted || reducedMotion()) return;
    ref.current?.animate([{ opacity: strength }, { opacity: 0 }], {
      duration: 900,
      easing: "ease-out",
      fill: "forwards",
    });
  }, [mounted, strength]);
  if (!mounted) return null;
  return createPortal(
    <div
      ref={ref}
      className="pointer-events-none fixed inset-0 z-50 opacity-0"
      style={{ background: `radial-gradient(circle at 50% 50%, #ecfeff, ${color} 45%, transparent 80%)` }}
      aria-hidden="true"
    />,
    document.body,
  );
}

/** Raios de luz girando atrás do bicho, nas zonas fundas. */
export function Rays({ color }: { color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reducedMotion()) return;
    const spin = ref.current?.animate([{ rotate: "0deg" }, { rotate: "360deg" }], {
      duration: 12000,
      iterations: Infinity,
    });
    return () => spin?.cancel();
  }, []);
  return (
    <div
      ref={ref}
      className="pointer-events-none absolute top-1/2 left-1/2 size-[360px] -translate-x-1/2 -translate-y-1/2"
      style={{
        background: `repeating-conic-gradient(from 0deg, color-mix(in oklab, ${color} 45%, transparent) 0deg 8deg, transparent 8deg 22deg)`,
        maskImage: "radial-gradient(circle, #000 12%, transparent 62%)",
        WebkitMaskImage: "radial-gradient(circle, #000 12%, transparent 62%)",
      }}
      aria-hidden="true"
    />
  );
}

/**
 * A entrada da raridade, diferente em cada uma: a óbvia cai e assenta, a comum estala, a incomum
 * chega balançando, a rara acende devagar e a raríssima bate com tudo. Sem resposta, só afunda.
 */
export function entrance(el: HTMLElement, tier: number) {
  if (reducedMotion()) return;
  const moves: [Keyframe[], number, string][] = [
    [
      [
        { transform: "translateY(-46px)", opacity: 0 },
        { transform: "translateY(4px)", opacity: 1, offset: 0.7 },
        { transform: "translateY(0)", opacity: 1 },
      ],
      520,
      "ease-in",
    ],
    [
      [
        { transform: "scale(0.2) rotate(-25deg)", opacity: 0 },
        { transform: "scale(1.18) rotate(6deg)", opacity: 1, offset: 0.6 },
        { transform: "scale(1) rotate(0)", opacity: 1 },
      ],
      560,
      "cubic-bezier(.3,1.4,.5,1)",
    ],
    [
      [
        { transform: "scale(0.3) rotate(-10deg)", opacity: 0 },
        { transform: "scale(1.15) rotate(6deg)", opacity: 1, offset: 0.45 },
        { transform: "scale(0.96) rotate(-3deg)", opacity: 1, offset: 0.7 },
        { transform: "scale(1) rotate(0)", opacity: 1 },
      ],
      850,
      "cubic-bezier(.2,.8,.3,1)",
    ],
    [
      [
        { transform: "scale(0.4)", opacity: 0, filter: "brightness(2.5)" },
        { transform: "scale(1.12)", opacity: 1, filter: "brightness(1.8)", offset: 0.55 },
        { transform: "scale(1)", opacity: 1, filter: "brightness(1)" },
      ],
      1000,
      "ease-out",
    ],
    [
      [
        { transform: "scale(2.8) rotate(-8deg)", opacity: 0 },
        { transform: "scale(0.9) rotate(2deg)", opacity: 1, offset: 0.6 },
        { transform: "scale(1.06) rotate(0)", opacity: 1, offset: 0.8 },
        { transform: "scale(1) rotate(0)", opacity: 1 },
      ],
      620,
      "cubic-bezier(.3,1.3,.5,1)",
    ],
  ];
  const sink: [Keyframe[], number, string] = [
    [
      { transform: "translateY(-12px)", opacity: 0 },
      { transform: "translateY(0)", opacity: 0.85 },
    ],
    500,
    "ease-out",
  ];
  const [frames, duration, easing] = tier < 0 ? sink : moves[tier];
  el.animate(frames, { duration, easing, fill: "both" });
}
