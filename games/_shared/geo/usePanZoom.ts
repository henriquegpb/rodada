"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

export interface View {
  x: number;
  y: number;
  w: number;
  h: number;
}

const MIN_W = 24;
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** Zoom por pixel de roda do mouse: um "clique" da roda (~100 px) amplia uns 8%. */
const WHEEL_ZOOM = 0.0008;
/** A pinça do trackpad chega como roda com Ctrl e deltas bem menores: precisa de mais ganho. */
const PINCH_ZOOM = 0.01;
/** Teto por evento, para um giro rápido da roda não dar um salto. */
const MAX_WHEEL_PX = 120;

/** Deltas em linhas ou páginas (Firefox com mouse) viram pixels. */
const wheelPx = (e: WheelEvent, delta: number) => delta * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 800 : 1);

/**
 * A rolagem veio de dois dedos no trackpad, e não da roda de um mouse? Não há API para isso, então
 * vai a heurística de sempre: o trackpad também rola na horizontal, e no Chrome/Safari reporta o
 * `wheelDeltaY` legado como exatamente −3× o `deltaY`; no Firefox, o mouse rola em linhas inteiras.
 */
function fromTrackpad(e: WheelEvent): boolean {
  if (e.deltaX !== 0) return true;
  const legacy = (e as WheelEvent & { wheelDeltaY?: number }).wheelDeltaY;
  if (legacy) return legacy === -3 * e.deltaY;
  return e.deltaMode === 0 && !Number.isInteger(e.deltaY);
}

/** Pinça no trackpad do Safari: vem como GestureEvent, não como roda com Ctrl. */
type GestureEvent = UIEvent & { scale: number; clientX: number; clientY: number };

/**
 * Mover e dar zoom num SVG mexendo no viewBox. Arrastar (ou rolar com dois dedos no trackpad) move;
 * roda do mouse e pinça (na tela ou no trackpad) dão zoom no ponto do cursor/dos dedos; e há
 * zoomIn/zoomOut/reset animados para os botões.
 *
 * A vista nunca sai da área do mapa: o mundo (`limits`) mais o enquadramento inicial, se ele passar
 * da borda. Por isso também não afasta além do que cabe nessa área: com o mapa inteiro à vista,
 * não há o que arrastar.
 */
export function usePanZoom(initial: View, limits: { width: number; height: number }) {
  const [view, setView] = useState(initial);
  const current = useRef(view);
  const svgRef = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const tween = useRef<number | null>(null);
  const aspect = initial.w / initial.h;
  const x0 = Math.min(0, initial.x);
  const y0 = Math.min(0, initial.y);
  const x1 = Math.max(limits.width, initial.x + initial.w);
  const y1 = Math.max(limits.height, initial.y + initial.h);
  const maxW = Math.min(x1 - x0, (y1 - y0) * aspect);

  const clamp = useCallback(
    (v: View): View => {
      const w = Math.min(maxW, Math.max(MIN_W, v.w));
      const h = w / aspect;
      const x = Math.min(x1 - w, Math.max(x0, v.x));
      const y = Math.min(y1 - h, Math.max(y0, v.y));
      return { x, y, w, h };
    },
    [aspect, maxW, x0, y0, x1, y1],
  );

  const apply = useCallback(
    (v: View) => {
      current.current = clamp(v);
      setView(current.current);
    },
    [clamp],
  );

  /** Zoom mantendo o ponto (clientX, clientY) parado sob o cursor. */
  const zoomAt = useCallback(
    (factor: number, clientX: number, clientY: number) => {
      const rect = svgRef.current!.getBoundingClientRect();
      const { x, y, w: w0, h: h0 } = current.current;
      // Ponto da tela → coordenada do mapa.
      const mx = x + ((clientX - rect.left) / rect.width) * w0;
      const my = y + ((clientY - rect.top) / rect.height) * h0;
      const w = Math.min(maxW, Math.max(MIN_W, current.current.w * factor));
      const h = w / aspect;
      const fx = (clientX - rect.left) / rect.width;
      const fy = (clientY - rect.top) / rect.height;
      apply({ x: mx - fx * w, y: my - fy * h, w, h });
    },
    [apply, aspect, maxW],
  );

  const animateTo = useCallback(
    (target: View) => {
      if (tween.current) cancelAnimationFrame(tween.current);
      const from = current.current;
      const to = clamp(target);
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / 320);
        const k = easeOut(t);
        apply({
          x: from.x + (to.x - from.x) * k,
          y: from.y + (to.y - from.y) * k,
          w: from.w + (to.w - from.w) * k,
          h: from.h + (to.h - from.h) * k,
        });
        if (t < 1) tween.current = requestAnimationFrame(step);
      };
      tween.current = requestAnimationFrame(step);
    },
    [apply, clamp],
  );

  const zoomBy = (factor: number) => {
    const { x, y, w, h } = current.current;
    const cx = x + w / 2;
    const cy = y + h / 2;
    animateTo({ x: cx - (w * factor) / 2, y: cy - (h * factor) / 2, w: w * factor, h: h * factor });
  };

  /** Move a vista em pixels de tela. */
  const panBy = useCallback(
    (dx: number, dy: number) => {
      const rect = svgRef.current!.getBoundingClientRect();
      const { x, y, w, h } = current.current;
      apply({ x: x + (dx / rect.width) * w, y: y + (dy / rect.height) * h, w, h });
    },
    [apply],
  );

  // Listeners não passivos: impedem a página de rolar (roda) e o Safari de ampliar a página (gesto).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (tween.current) cancelAnimationFrame(tween.current);
      if (e.ctrlKey) {
        // Pinça no trackpad (Chrome, Edge, Firefox).
        zoomAt(Math.exp(wheelPx(e, e.deltaY) * PINCH_ZOOM), e.clientX, e.clientY);
      } else if (fromTrackpad(e)) {
        // Dois dedos no trackpad: move, como arrastar.
        panBy(wheelPx(e, e.deltaX), wheelPx(e, e.deltaY));
      } else {
        const px = Math.max(-MAX_WHEEL_PX, Math.min(MAX_WHEEL_PX, wheelPx(e, e.deltaY)));
        zoomAt(Math.exp(px * WHEEL_ZOOM), e.clientX, e.clientY);
      }
    };
    let lastScale = 1;
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      lastScale = 1;
    };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      const g = e as GestureEvent;
      zoomAt(lastScale / g.scale, g.clientX, g.clientY);
      lastScale = g.scale;
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    svg.addEventListener("gesturestart", onGestureStart);
    svg.addEventListener("gesturechange", onGestureChange);
    return () => {
      svg.removeEventListener("wheel", onWheel);
      svg.removeEventListener("gesturestart", onGestureStart);
      svg.removeEventListener("gesturechange", onGestureChange);
    };
  }, [zoomAt, panBy]);

  const handlers = {
    onPointerDown(e: ReactPointerEvent<SVGSVGElement>) {
      // Arrastar o mapa não tira o foco do campo de digitação (no celular, o teclado continua aberto).
      e.preventDefault();
      if (tween.current) cancelAnimationFrame(tween.current);
      e.currentTarget.setPointerCapture(e.pointerId);
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    },
    onPointerMove(e: ReactPointerEvent<SVGSVGElement>) {
      const prev = pointers.current.get(e.pointerId);
      if (!prev) return;
      const all = [...pointers.current.values()];
      if (all.length >= 2) {
        // Pinça: a distância entre os dedos muda o zoom, em torno do ponto entre eles.
        const other = all.find((p) => p !== prev)!;
        const before = Math.hypot(prev.x - other.x, prev.y - other.y);
        const after = Math.hypot(e.clientX - other.x, e.clientY - other.y);
        if (before > 0 && after > 0) zoomAt(before / after, (e.clientX + other.x) / 2, (e.clientY + other.y) / 2);
      } else {
        panBy(prev.x - e.clientX, prev.y - e.clientY);
      }
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    },
    onPointerUp(e: ReactPointerEvent<SVGSVGElement>) {
      pointers.current.delete(e.pointerId);
    },
    onPointerCancel(e: ReactPointerEvent<SVGSVGElement>) {
      pointers.current.delete(e.pointerId);
    },
  };

  return {
    svgRef,
    viewBox: `${view.x} ${view.y} ${view.w} ${view.h}`,
    /** Quanto a vista está ampliada em relação à inicial (1 = enquadramento inicial). */
    zoom: initial.w / view.w,
    /** Há o que arrastar: a vista não mostra a área inteira do mapa. */
    canPan: view.w < maxW - 0.5,
    handlers,
    zoomIn: () => zoomBy(1 / 1.6),
    zoomOut: () => zoomBy(1.6),
    reset: () => animateTo(initial),
  };
}
