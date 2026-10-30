"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { modesOf } from "@/games";
import { preloadEngine } from "@/games/engines";
import { previousPath } from "@/lib/nav-history";
import { cn } from "@/lib/utils";

/**
 * Da aba de onde a pessoa veio até a atual: índices na lista de modos, ou -1 se ela não veio de
 * outro modo do mesmo jogo (veio da home, de outro jogo, ou abriu a página direto).
 */
export function modeMove(slug: string): { from: number; to: number } {
  const modes = modesOf(slug).map((m) => m.meta.slug);
  const prev = previousPath()?.slice(1) ?? "";
  return { from: modes.indexOf(prev), to: modes.indexOf(slug) };
}

/** Posição da linha sob a aba `i` (cada aba ocupa 1/n da largura, com 8px de folga). */
const at = (i: number) => `translateX(calc(${i * 100}% + ${i * 8}px))`;

/**
 * Abas dos modos de um jogo (Palavra · Dupla · Quadra), no estilo do Sliding Underline Tabs do
 * Microkit. Cada modo é uma página; a linha desliza da aba de onde a pessoa veio até a atual.
 */
export function ModeTabs({ slug, className }: { slug: string; className?: string }) {
  const modes = modesOf(slug);
  const index = modes.findIndex((m) => m.meta.slug === slug);
  const barRef = useRef<HTMLSpanElement>(null);
  const n = modes.length;

  // Roda ao montar e também quando o Next reexibe a página guardada.
  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const { from } = modeMove(slug);
    if (from >= 0 && from !== index) {
      // Começa na aba anterior sem transição e desliza até a atual.
      bar.style.transition = "none";
      bar.style.transform = at(from);
      void bar.getBoundingClientRect();
      bar.style.transition = "";
    }
    bar.style.transform = at(index);
  }, [slug, index]);

  if (n < 2) return null;

  return (
    <nav
      aria-label="Modos"
      className={cn("relative grid border-b border-border", className)}
      style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
    >
      {modes.map(({ meta }, i) => (
        <Link
          key={meta.slug}
          href={`/${meta.slug}`}
          onPointerEnter={() => preloadEngine(meta.slug)}
          aria-current={i === index ? "page" : undefined}
          className={cn(
            "flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors duration-300",
            i === index ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <meta.icon size={16} strokeWidth={2} style={i === index ? { color: meta.color } : undefined} />
          {meta.modeLabel ?? meta.name}
        </Link>
      ))}
      <span
        ref={barRef}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-2px] left-1 h-[3px] rounded-full transition-transform duration-[450ms] ease-[cubic-bezier(.22,1,.36,1)]"
        style={{ width: `calc(${100 / n}% - 8px)`, transform: at(index), background: modes[index]?.meta.color }}
      />
    </nav>
  );
}
