"use client";

import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Glide } from "./glide";

/**
 * Uma pílula comprida com a seleção deslizando dentro dela de opção em opção. O indicador claro é
 * medido na opção escolhida e vai até lá com easing; o hover ganha o `Glide`. Com mais opções do
 * que cabem, a fileira rola de lado e traz a escolhida para a vista.
 */
export function PillTabs({
  options,
  value,
  onChange,
  label,
  className,
}: {
  /** `color`: bolinha antes do rótulo (a cor do jogo). */
  options: { key: string; label: string; color?: string }[];
  value: string;
  onChange: (key: string) => void;
  label: string;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const placedRef = useRef(false);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const indicator = indicatorRef.current;
    if (!track || !indicator) return;

    const place = (animate: boolean) => {
      const tab = track.querySelector<HTMLElement>(`[data-key="${CSS.escape(value)}"]`);
      if (!tab) return;
      if (!animate) indicator.style.transition = "none";
      indicator.style.transform = `translateX(${tab.offsetLeft}px)`;
      indicator.style.width = `${tab.offsetWidth}px`;
      indicator.dataset.visible = "";
      if (!animate) {
        void indicator.offsetWidth;
        indicator.style.transition = "";
      }
      // A escolhida fica à vista, só na horizontal: nunca rola a página.
      const left = tab.offsetLeft - 24;
      const right = tab.offsetLeft + tab.offsetWidth + 24;
      if (left < track.scrollLeft) track.scrollTo({ left, behavior: animate ? "smooth" : "auto" });
      else if (right > track.scrollLeft + track.clientWidth) {
        track.scrollTo({ left: right - track.clientWidth, behavior: animate ? "smooth" : "auto" });
      }
    };

    // A primeira vez aparece no lugar; as trocas depois deslizam.
    place(placedRef.current);
    placedRef.current = true;

    // Fonte carregando ou a tela mudando de largura mexem nas opções: acompanha sem deslizar. Só
    // numa mudança de tamanho de verdade: o ResizeObserver dispara uma vez ao começar, no mesmo
    // frame do deslize acima, e essa chamada cortava o deslize.
    let lastWidth = track.getBoundingClientRect().width;
    const observer = new ResizeObserver(() => {
      const width = track.getBoundingClientRect().width;
      if (Math.abs(width - lastWidth) < 0.5) return;
      lastWidth = width;
      place(false);
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, [value, options.length]);

  return (
    <div
      ref={trackRef}
      role="tablist"
      aria-label={label}
      className={cn(
        "relative flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-full border border-foreground/[0.06] bg-foreground/[0.035] p-1 [--glide-radius:999px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      <span
        ref={indicatorRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-1 left-0 z-0 w-0 rounded-full bg-foreground opacity-0 transition-[transform,width,opacity] duration-[380ms] ease-[cubic-bezier(.32,.72,0,1)] data-[visible]:opacity-100 motion-reduce:transition-opacity"
      />
      <Glide items="[data-pill-tab]:not([data-selected])" />
      {options.map((option) => {
        const selected = value === option.key;
        return (
          <button
            key={option.key}
            type="button"
            role="tab"
            data-pill-tab=""
            data-key={option.key}
            data-selected={selected || undefined}
            aria-selected={selected}
            onClick={() => onChange(option.key)}
            className="relative z-[1] flex h-[34px] shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-[15px] text-sm font-medium text-foreground/60 transition-colors duration-[280ms] hover:text-foreground focus-visible:outline focus-visible:outline-[1.5px] focus-visible:-outline-offset-[1.5px] focus-visible:outline-foreground/60 data-[selected]:text-background data-[selected]:hover:text-background"
          >
            {option.color && (
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: option.color }} />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
