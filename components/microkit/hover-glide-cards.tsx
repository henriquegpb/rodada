"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Microkit · Hover Glide Cards (https://microkit.co/components/hover-glide-cards), adaptado:
 * em vez de cards fixos, envolve qualquer filho marcado com `data-glide-card`.
 * Um único destaque desliza de card em card sob o ponteiro, visível só dentro dos cards.
 */
export function HoverGlideGroup({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLSpanElement>(null);
  const glideRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const layer = layerRef.current;
    const glide = glideRef.current;
    if (!host || !layer || !glide) return;

    const tiles = () => Array.from(host.querySelectorAll("[data-glide-card]"));
    const controller = new AbortController();
    const { signal } = controller;
    let active = -1;
    let shown = false;

    // The highlight is only seen through the cards' shapes, so crossing a gap it drains out of one card and fills the next.
    const drawMask = () => {
      const bounds = host.getBoundingClientRect();
      const shapes = tiles()
        .map((tile) => {
          const rect = tile.getBoundingClientRect();
          const x = rect.left - bounds.left + host.scrollLeft - host.clientLeft;
          const y = rect.top - bounds.top + host.scrollTop - host.clientTop;
          const radius = parseFloat(getComputedStyle(tile).borderTopLeftRadius) || 0;
          return `<rect x="${x}" y="${y}" width="${rect.width}" height="${rect.height}" rx="${radius}"/>`;
        })
        .join("");
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${host.scrollWidth}" height="${host.scrollHeight}">${shapes}</svg>`;
      const image = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
      layer.style.width = `${host.scrollWidth}px`;
      layer.style.height = `${host.scrollHeight}px`;
      layer.style.setProperty("mask-image", image);
      layer.style.setProperty("-webkit-mask-image", image);
    };

    const place = () => {
      const tile = tiles()[active];
      if (!tile) return;
      const bounds = host.getBoundingClientRect();
      const rect = tile.getBoundingClientRect();
      const x = rect.left - bounds.left + host.scrollLeft - host.clientLeft;
      const y = rect.top - bounds.top + host.scrollTop - host.clientTop;
      // The first placement fades in where it lands; sliding in from wherever it last was would read as a glitch.
      if (!shown) glide.style.transition = "opacity 180ms ease";
      glide.style.transform = `translate(${x}px, ${y}px)`;
      glide.style.width = `${rect.width}px`;
      glide.style.height = `${rect.height}px`;
      if (!shown) {
        void glide.offsetWidth;
        glide.style.transition = "";
        shown = true;
      }
      glide.dataset.visible = "";
    };

    const hide = () => {
      shown = false;
      delete glide.dataset.visible;
    };

    for (const type of ["pointerover", "focusin"]) {
      host.addEventListener(
        type,
        (event) => {
          const tile = event.target instanceof Element ? event.target.closest("[data-glide-card]") : null;
          const index = tile ? tiles().indexOf(tile) : -1;
          if (index < 0) return;
          if (!shown || index !== active) drawMask();
          active = index;
          place();
        },
        { signal },
      );
    }
    host.addEventListener("pointerleave", hide, { signal });
    host.addEventListener(
      "focusout",
      (event) => {
        const inside = event.relatedTarget instanceof Node && host.contains(event.relatedTarget);
        if (!inside && !host.matches(":hover")) hide();
      },
      { signal },
    );

    // Cards reflow under a resting pointer when the grid resizes, so the cut-outs and the highlight are measured again.
    const reflow = new ResizeObserver(() => {
      if (!shown) return;
      drawMask();
      place();
    });
    reflow.observe(host);

    return () => {
      controller.abort();
      reflow.disconnect();
    };
  }, []);

  return (
    <div className={cn("relative", className)} role="group" aria-label={label} ref={hostRef}>
      <span
        className="pointer-events-none absolute left-0 top-0 z-[1] block [mask-repeat:no-repeat] [-webkit-mask-repeat:no-repeat]"
        ref={layerRef}
        aria-hidden="true"
      >
        <span
          className="pointer-events-none absolute left-0 top-0 block h-0 w-0 rounded-xl bg-white/15 mix-blend-soft-light opacity-0 [transition:transform_.3s_cubic-bezier(.32,.72,0,1),width_.3s_cubic-bezier(.32,.72,0,1),height_.3s_cubic-bezier(.32,.72,0,1),opacity_.18s_ease] data-[visible]:opacity-100 [@media(hover:none)]:hidden"
          ref={glideRef}
        />
      </span>
      {children}
    </div>
  );
}
