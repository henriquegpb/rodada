"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { geoCentroid, geoGraticule10, geoOrthographic, geoPath, type GeoPermissibleObjects } from "d3-geo";
import type { Feature, MultiPolygon } from "geojson";
import globe from "./data/globe.json";

type Rotation = [number, number];

const SIZE = 500;
const RADIUS = 236;
const countryShapes: Record<string, number[][][][]> = globe.countries;

const features = Object.entries(countryShapes).map(
  ([code, coordinates]): Feature<MultiPolygon, { code: string }> => ({
    type: "Feature",
    properties: { code },
    geometry: { type: "MultiPolygon", coordinates },
  }),
);
const otherLand: Feature<MultiPolygon> = {
  type: "Feature",
  properties: {},
  geometry: { type: "MultiPolygon", coordinates: globe.other },
};
const graticule = geoGraticule10();
const sphere: GeoPermissibleObjects = { type: "Sphere" };

/** Rotação que põe o país no centro do globo. */
function rotationFor(code: string): Rotation {
  const feature = features.find((f) => f.properties.code === code);
  if (!feature) return [0, 0];
  const [lng, lat] = geoCentroid(feature);
  return [-lng, Math.max(-60, Math.min(60, -lat))];
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Atrito do embalo: fração da velocidade que sobra a cada 16 ms. Alto de propósito: só um embalinho. */
const FRICTION = 0.86;
/** Teto da velocidade ao soltar (graus por ms), para um arraste forte não sair girando longe. */
const MAX_SPEED = 0.35;
/** Abaixo disso (graus por ms) o globo para. */
const MIN_SPEED = 0.002;
/** Se o dedo ficou parado mais que isso antes de soltar, não há embalo. */
const RELEASE_WINDOW_MS = 80;

/**
 * Globo em projeção ortográfica (d3-geo). Arrastar gira; sem nada para mostrar ele gira devagar;
 * quando `focus` muda, roda até o país.
 */
export function Globe({ colors, focus }: { colors: ReadonlyMap<string, string>; focus: string | null }) {
  const [rotation, setRotation] = useState<Rotation>(() => (focus ? rotationFor(focus) : [-10, -12]));
  const current = useRef(rotation);
  const drag = useRef<{ x: number; y: number; from: Rotation } | null>(null);
  /** Velocidade do arraste em graus por ms, medida entre os últimos movimentos. */
  const velocity = useRef({ lng: 0, lat: 0, at: 0 });
  const touched = useRef(Boolean(focus));
  const animation = useRef<number | null>(null);

  const apply = (r: Rotation) => {
    current.current = r;
    setRotation(r);
  };

  // Gira devagar enquanto ninguém mexeu e não há chute para mostrar.
  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const spin = (now: number) => {
      if (!touched.current) {
        const [lng, lat] = current.current;
        apply([lng + ((now - last) / 1000) * 6, lat]);
      }
      last = now;
      frame = requestAnimationFrame(spin);
    };
    frame = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Roda até o país do último chute, pelo caminho mais curto.
  useEffect(() => {
    if (!focus) return;
    touched.current = true;
    velocity.current = { lng: 0, lat: 0, at: 0 };
    const from = current.current;
    const to = rotationFor(focus);
    const dLng = ((to[0] - from[0] + 540) % 360) - 180;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      const k = easeInOut(t);
      apply([from[0] + dLng * k, from[1] + (to[1] - from[1]) * k]);
      if (t < 1) animation.current = requestAnimationFrame(step);
    };
    if (animation.current) cancelAnimationFrame(animation.current);
    animation.current = requestAnimationFrame(step);
    return () => {
      if (animation.current) cancelAnimationFrame(animation.current);
    };
  }, [focus]);

  const path = useMemo(() => {
    const projection = geoOrthographic()
      .scale(RADIUS)
      .translate([SIZE / 2, SIZE / 2])
      .rotate(rotation)
      .clipAngle(90);
    return geoPath(projection);
  }, [rotation]);

  function onPointerDown(e: PointerEvent<SVGSVGElement>) {
    touched.current = true;
    // Pegar o globo para qualquer giro em andamento: embalo ou rotação até um chute.
    if (animation.current) cancelAnimationFrame(animation.current);
    velocity.current = { lng: 0, lat: 0, at: performance.now() };
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, from: current.current };
  }

  /** Solta com embalo: continua na velocidade do gesto e desacelera por atrito até parar. */
  function release() {
    if (!drag.current) return;
    drag.current = null;
    const v = velocity.current;
    if (performance.now() - v.at > RELEASE_WINDOW_MS) return;
    // Mantém a direção do gesto, mas limita a força.
    const speed = Math.hypot(v.lng, v.lat);
    const k = speed > MAX_SPEED ? MAX_SPEED / speed : 1;
    let [lng, lat] = [v.lng * k, v.lat * k];
    let last = performance.now();
    const coast = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;
      const [rLng, rLat] = current.current;
      apply([rLng + lng * dt, Math.max(-80, Math.min(80, rLat + lat * dt))]);
      const decay = FRICTION ** (dt / 16);
      lng *= decay;
      lat *= decay;
      if (Math.hypot(lng, lat) > MIN_SPEED) animation.current = requestAnimationFrame(coast);
    };
    animation.current = requestAnimationFrame(coast);
  }

  function onPointerMove(e: PointerEvent<SVGSVGElement>) {
    if (!drag.current) return;
    // Converte pixels da tela em graus, proporcional ao tamanho que o globo tem na página.
    const scale = 180 / (Math.PI * e.currentTarget.getBoundingClientRect().width * (RADIUS / SIZE));
    const { x, y, from } = drag.current;
    const lat = Math.max(-80, Math.min(80, from[1] - (e.clientY - y) * scale));
    const next: Rotation = [from[0] + (e.clientX - x) * scale, lat];
    // Velocidade suavizada: média entre a anterior e a do último trecho, para o embalo não "pular".
    const now = performance.now();
    const dt = Math.max(1, now - velocity.current.at);
    const [pLng, pLat] = current.current;
    velocity.current = {
      lng: velocity.current.lng * 0.4 + ((next[0] - pLng) / dt) * 0.6,
      lat: velocity.current.lat * 0.4 + ((next[1] - pLat) / dt) * 0.6,
      at: now,
    };
    apply(next);
  }

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="w-full cursor-grab touch-none select-none active:cursor-grabbing"
      role="img"
      aria-label="Globo com os países chutados coloridos pela distância"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <defs>
        <radialGradient id="calor-ocean" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="var(--globe-ocean)" />
          <stop offset="100%" stopColor="var(--globe-ocean-edge)" />
        </radialGradient>
        <radialGradient id="calor-shade" cx="35%" cy="30%" r="80%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity=".28" />
        </radialGradient>
      </defs>
      <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS + 10} fill="var(--globe-ocean)" opacity={0.12} />
      <path d={path(sphere) ?? ""} fill="url(#calor-ocean)" />
      <path d={path(graticule) ?? ""} fill="none" stroke="#fff" strokeOpacity={0.07} strokeWidth={0.6} />
      <path d={path(otherLand) ?? ""} fill="var(--globe-land)" opacity={0.7} />
      {features.map((f) => {
        const d = path(f);
        if (!d) return null;
        const color = colors.get(f.properties.code);
        return (
          <path
            key={f.properties.code}
            d={d}
            fill={color ?? "var(--globe-land)"}
            stroke={color ? "rgb(0 0 0 / .35)" : "var(--globe-ocean-edge)"}
            strokeWidth={color ? 0.8 : 0.4}
          />
        );
      })}
      <path d={path(sphere) ?? ""} fill="url(#calor-shade)" pointerEvents="none" />
    </svg>
  );
}
