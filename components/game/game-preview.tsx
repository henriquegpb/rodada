"use client";

import { useEffect, useRef } from "react";
import type { GameMeta } from "@/games/types";
import { cn } from "@/lib/utils";

/**
 * Vídeo curto de uma partida (public/previews, gravado com desafios de demonstração, sem spoiler
 * do dia). Toca do começo enquanto `playing`; com "reduzir movimento" fica só a primeira imagem.
 */
export function GameVideo({ slug, playing, className }: { slug: string; playing: boolean; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (!playing || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      return;
    }
    video.currentTime = 0;
    video.play().catch(() => {});
  }, [playing, slug]);

  return (
    <video
      ref={ref}
      src={`/previews/${slug}.mp4`}
      poster={`/previews/${slug}.jpg`}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      className={cn("aspect-[16/10] w-full bg-background object-cover", className)}
    />
  );
}

const CARD_HEIGHT = 278;

/**
 * Prévia flutuante ao lado da sidebar: o vídeo do jogo, o nome e a frase. Alinha com o item em
 * que o mouse está (`anchor`) e desliza entre um item e outro. Fechada (`open` falso), some com
 * fade ainda mostrando o último jogo, em vez de esvaziar no meio da transição.
 */
export function SidebarPreview({ meta, anchor, open }: { meta: GameMeta; anchor: DOMRect; open: boolean }) {
  const top = Math.min(Math.max(anchor.top + anchor.height / 2 - CARD_HEIGHT / 2, 12), window.innerHeight - CARD_HEIGHT - 12);
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed left-[260px] z-50 w-[360px] rounded-2xl border border-border bg-popover p-2 shadow-2xl shadow-black/40",
        "transition-[opacity,transform,top] duration-200 ease-out",
        open ? "opacity-100" : "translate-x-[-6px] opacity-0",
      )}
      style={{ top }}
    >
      <GameVideo slug={meta.slug} playing={open} className="rounded-xl ring-1 ring-border" />
      <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-2.5">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span className="size-2 rounded-[3px]" style={{ background: meta.color }} />
          {meta.name}
        </span>
        <span className="truncate text-xs text-muted-foreground">{meta.tagline}</span>
      </div>
    </div>
  );
}
