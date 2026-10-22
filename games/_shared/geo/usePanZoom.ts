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

/**
 * Mover e dar zoom num SVG mexendo no viewBox: arrastar move, roda do mouse e pinça dão zoom no
 * ponto do cursor/dos dedos, e há zoomIn/zoomOut/reset animados para os botões.
 * `limits` é o tamanho do mundo (o mapa não sai da tela nem dá zoom além dele).
 */
export function usePanZoom(initial: View, limits: { width: number; height: number }) {
  const [view, setView] = useState(initial);
  const current = useRef(view);
  const svgRef = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const tween = useRef<number | null>(null);
  const aspect = initial.w / initial.h;
  const maxW = limits.width * 1.1;

  const clamp = useCallback(
    (v: View): View => {
      const w = Math.min(maxW, Math.max(MIN_W, v.w));
      const h = w / aspect;
      // O centro da vista não sai do mundo.
      const x = Math.min(limits.width - w / 2, Math.max(-w / 2, v.x));
      const y = Math.min(limits.height - h / 2, Math.max(-h / 2, v.y));
      return { x, y, w, h };
    },
    [aspect, maxW, limits.width, limits.height],
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

  // Roda do mouse: precisa ser um listener não passivo para impedir a página de rolar.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (tween.current) cancelAnimationFrame(tween.current);
      zoomAt(Math.exp(e.deltaY * 0.0015), e.clientX, e.clientY);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

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
        const rect = e.currentTarget.getBoundingClientRect();
        const { x, y, w, h } = current.current;
        apply({ x: x - ((e.clientX - prev.x) / rect.width) * w, y: y - ((e.clientY - prev.y) / rect.height) * h, w, h });
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
    handlers,
    zoomIn: () => zoomBy(1 / 1.6),
    zoomOut: () => zoomBy(1.6),
    reset: () => animateTo(initial),
  };
}
