"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
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
  // No fundo da fossa (ou além) não há trecho seguinte: fica a cor do último.
  const next = WATER.findIndex(([d]) => d > depth);
  const i = next === -1 ? WATER.length - 2 : Math.max(0, next - 1);
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

      {/* As paredes da fossa e o que passa por ela: tudo sobe enquanto o submarino desce. */}
      <Scenery depth={depth} />

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
 * A largura de cada parede de rocha (fração do card): quase nada perto da superfície, abrindo devagar
 * na descida e se fechando de vez na zona hadal, dentro da fossa.
 */
function wallWidth(depth: number) {
  return 0.045 + 0.075 * Math.pow(clamp(depth / 6000), 0.7) + 0.08 * clamp((depth - 6000) / 4000);
}

/** A cor da rocha (no fundo da parede e na borda): escura na água clara, um pouco mais clara no breu. */
function rockAt(depth: number): [base: string, edge: string] {
  const t = clamp(depth / 5000);
  return [mix("#04213a", "#161f3a", t), mix("#2b7fa8", "#4a5f96", t)];
}

/** O recorte de uma parede (a borda de dentro à direita), repetido para baixo sem emenda. */
const tile = (path: string, height: number) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 ${height}" preserveAspectRatio="none"><path d="${path}"/></svg>`,
  )}")`;
const FRONT_WALL = tile(
  "M0 0 H72 L86 34 L66 70 L80 104 L94 128 L74 160 L60 196 L82 226 L68 258 L90 280 L72 300 H0 Z",
  300,
);
const BACK_WALL = tile(
  "M0 0 H60 Q92 40 70 90 Q50 140 84 190 Q100 230 66 280 Q44 330 78 380 Q88 400 60 420 H0 Z",
  420,
);

/** Recorta a parede e a faz subir com a descida (`--scroll`); `speed` menor é mais longe. */
function wallStyle(image: string, height: number, speed: number): CSSProperties {
  const position = `0 calc(var(--scroll, 0) * ${-speed}px)`;
  return {
    maskImage: image,
    WebkitMaskImage: image,
    maskSize: `100% ${height}px`,
    WebkitMaskSize: `100% ${height}px`,
    maskRepeat: "repeat-y",
    WebkitMaskRepeat: "repeat-y",
    maskPosition: position,
    WebkitMaskPosition: position,
  };
}

const FISH = "M1 10 Q10 1 24 5 L38 0 L33 10 L38 20 L24 15 Q10 19 1 10 Z";
const svg = (viewBox: string, body: string) =>
  `<svg viewBox="${viewBox}" fill="currentColor" style="display:block;width:100%;height:auto">${body}</svg>`;

/** O que passa pela janela na descida, em silhueta, olhando para a esquerda. */
const PASSING = {
  peixe: { width: 34, svg: svg("0 0 40 20", `<path d="${FISH}"/>`) },
  cardume: {
    width: 84,
    svg: svg(
      "0 0 96 56",
      [
        [2, 18, 1],
        [30, 2, 0.8],
        [44, 30, 0.9],
        [66, 12, 0.75],
      ]
        .map(([x, y, s]) => `<path transform="translate(${x} ${y}) scale(${s})" d="${FISH}"/>`)
        .join(""),
    ),
  },
  "agua-viva": {
    width: 30,
    svg: svg(
      "0 0 36 48",
      `<path d="M2 18 Q2 2 18 2 Q34 2 34 18 Q26 15 18 18 Q10 15 2 18 Z"/><path d="M8 18 Q5 30 9 44 M15 19 Q13 32 16 46 M22 19 Q24 32 21 46 M29 18 Q32 30 28 44" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>`,
    ),
  },
  lula: {
    width: 56,
    svg: svg(
      "0 0 60 22",
      `<path d="M28 11 Q38 1 58 11 Q38 21 28 11 Z"/><ellipse cx="28" cy="11" rx="6" ry="5"/><path d="M26 8 Q16 4 3 6 M26 11 Q14 11 1 12 M26 14 Q16 18 3 17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`,
    ),
  },
  lanterna: {
    width: 42,
    svg: svg(
      "0 0 48 26",
      `<path transform="translate(8 5)" d="${FISH}"/><path d="M12 10 Q8 1 3 4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="3" cy="4" r="3" fill="#5eead4" style="filter:drop-shadow(0 0 4px #5eead4)"/>`,
    ),
  },
  pedra: {
    width: 86,
    svg: svg(
      "0 0 100 60",
      `<path d="M0 6 L30 2 L58 10 L84 22 L98 36 L80 46 L52 52 L22 58 L0 56 Z"/><path d="M4 8 L30 4 L56 12 L80 24" fill="none" stroke="rgb(255 255 255 / 0.16)" stroke-width="3" stroke-linecap="round"/>`,
    ),
  },
} as const;
type PassingKind = keyof typeof PASSING;

/** O que passa em cada camada do mar: peixes perto da superfície, bichos que brilham e rocha no fundo. */
function passingAt(depth: number): PassingKind[] {
  if (depth < 30) return ["peixe", "cardume"];
  if (depth < 200) return ["peixe", "cardume", "peixe", "pedra"];
  if (depth < 1000) return ["cardume", "peixe", "agua-viva", "lula", "pedra"];
  if (depth < 4000) return ["agua-viva", "lanterna", "lula", "pedra", "pedra"];
  return ["lanterna", "pedra", "pedra", "agua-viva"];
}

/** Uma coisa passando: o elemento, onde está (px do topo) e a velocidade (menor = mais longe). */
interface Thing {
  el: HTMLDivElement;
  y: number;
  speed: number;
}

const THINGS = 9;
/** Margem em cima e embaixo do card, para as coisas entrarem e saírem fora de vista. */
const MARGIN = 110;

/** Sorteia o que a coisa vira ao entrar por baixo: um bicho da camada do momento, ou uma pedra na parede. */
function dress(thing: Thing, depth: number, width: number) {
  const kinds = passingAt(depth);
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  const far = Math.random();
  const rock = kind === "pedra";
  // No celular, pedra e cardume menores, para não tomarem o card.
  const size = Math.min(PASSING[kind].width, width * (rock ? 0.16 : 0.2)) * (1 - far * 0.4);
  thing.speed = 0.95 - far * 0.45;
  const right = Math.random() < 0.5;
  const edge = wallWidth(depth) * 100;
  const sizePct = (size / Math.max(width, 1)) * 100;
  // A pedra entra um pouco na parede, para sair dela; o resto passa no meio.
  const left = rock
    ? right
      ? 100 - edge - sizePct * 0.75
      : edge - sizePct * 0.25
    : 16 + Math.random() * Math.max(0, 62 - sizePct);
  const deep = depth > 1200;
  Object.assign(thing.el.style, {
    left: `${left}%`,
    width: `${size}px`,
    color: rock ? rockAt(depth)[0] : deep ? "#c7d7fe" : "#062b4f",
    opacity: String(rock ? 0.95 : (deep ? 0.3 : 0.38) * (1 - far * 0.35)),
  });
  thing.el.innerHTML = PASSING[kind].svg;
  // O peixe nada para um lado ou para o outro; a pedra sai da parede do lado dela.
  const flip = rock ? right : Math.random() < 0.5;
  (thing.el.firstElementChild as SVGElement).style.scale = flip ? "-1 1" : "1 1";
}

interface SceneryState {
  things: Thing[];
  /** Quanto o cenário já subiu, em px. */
  scroll: number;
  /** A profundidade do último quadro (NaN antes do primeiro). */
  depth: number;
  time: number;
}

/**
 * Um quadro da descida: tudo sobe o tanto que a profundidade mudou, com a raiz para os mergulhos
 * grandes não virarem borrão. O que sai por cima volta por baixo, já como coisa da camada nova.
 */
function descend(s: SceneryState, box: HTMLDivElement, host: HTMLDivElement, depth: number) {
  const now = performance.now();
  const width = box.clientWidth;
  if (Number.isNaN(s.depth)) {
    for (const t of s.things) {
      dress(t, depth, width);
      t.el.style.transform = `translate3d(0, ${t.y}px, 0)`;
    }
  } else if (depth > s.depth) {
    const dt = Math.min(0.05, Math.max(0.004, (now - s.time) / 1000));
    const step = 22 * Math.sqrt((depth - s.depth) * dt);
    const height = box.clientHeight;
    s.scroll += step;
    for (const t of s.things) {
      t.y -= step * t.speed;
      if (t.y < -MARGIN) {
        t.y += height + 2 * MARGIN;
        dress(t, depth, width);
      }
      t.el.style.transform = `translate3d(0, ${t.y}px, 0)`;
    }
    host.style.setProperty("--scroll", s.scroll.toFixed(1));
  }
  s.depth = depth;
  s.time = now;
}

/**
 * As paredes de rocha dos lados e as coisas que passam (peixes, águas-vivas, pedras). Tudo sobe
 * enquanto o submarino desce, mais rápido quanto mais rápido ele desce, e para quando ele chega: dá
 * para ver que ele está descendo e entrando na fossa, com as paredes se fechando no fundo.
 */
function Scenery({ depth }: { depth: number }) {
  const host = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const sim = useRef<SceneryState | null>(null);

  useEffect(() => {
    const box = layer.current;
    if (!box || reducedMotion()) return;
    const height = box.clientHeight || 500;
    const things = Array.from({ length: THINGS }, (_, i) => {
      const el = document.createElement("div");
      Object.assign(el.style, { position: "absolute", top: "0", willChange: "transform" });
      box.appendChild(el);
      return { el, y: -MARGIN + ((i + Math.random() * 0.8) / THINGS) * (height + 2 * MARGIN), speed: 1 };
    });
    sim.current = { things, scroll: 0, depth: NaN, time: performance.now() };
    return () => {
      sim.current = null;
      things.forEach((t) => t.el.remove());
    };
  }, []);

  useEffect(() => {
    if (sim.current && layer.current && host.current) descend(sim.current, layer.current, host.current, depth);
  }, [depth]);

  const wall = wallWidth(depth);
  const [rock, rim] = rockAt(depth);
  const fade = clamp((depth - 10) / 120);
  const walls = (front: boolean) =>
    [false, true].map((right) => (
      <div
        key={`${front}-${right}`}
        className="absolute inset-y-0"
        style={{
          [right ? "right" : "left"]: 0,
          width: `${(front ? wall : wall * 1.6 + 0.03) * 100}%`,
          // A da direita é a da esquerda espelhada, com outro passo para não parecer igual.
          scale: right ? "-1 1" : undefined,
          opacity: fade * (front ? 0.95 : 0.45),
          background: `linear-gradient(90deg, ${rock}, ${rim})`,
          ...(front
            ? wallStyle(FRONT_WALL, right ? 340 : 300, 1)
            : wallStyle(BACK_WALL, right ? 470 : 420, 0.5)),
        }}
      />
    ));
  return (
    <div ref={host} className="pointer-events-none absolute inset-0" aria-hidden="true">
      {walls(false)}
      <div ref={layer} className="absolute inset-0" />
      {walls(true)}
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
