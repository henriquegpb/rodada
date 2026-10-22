"use client";

import { useEffect, useRef, useState } from "react";
import type { AnimationItem } from "lottie-web";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePlayRecords, useRound } from "@/lib/plays/hooks";
import { formatResult } from "@/lib/plays/result";
import { isDone } from "@/lib/plays/status";
import { gameStats, overallStreak } from "@/lib/stats";
import { cn } from "@/lib/utils";
import fireAnimation from "./fire-streak.json";
import { t } from "@/lib/i18n";

// Animação "Streak Fire" de Dhawal Patel (LottieFiles). O canvas é 1080×1080; a chama ocupa só o miolo.
// O enquadramento centraliza o corpo da chama (y 300–840); a ponta, quando sobe, transborda por cima.
const FLAME_VIEWBOX = "330 230 420 680";

type Rgb = [number, number, number];

const toRgb = (hex: string): Rgb => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
const mix = (a: Rgb, b: Rgb, amount: number): Rgb => a.map((v, i) => v + (b[i] - v) * amount) as Rgb;

const tinted = new Map<string, unknown>();

/**
 * A animação com o degradê da chama de fora trocado pela cor do jogo: clara na ponta, a cor no meio,
 * mais escura na base. A chama de dentro continua branca. Sem cor, fica o laranja original.
 */
function flameData(color?: string): unknown {
  if (!color) return fireAnimation;
  if (!tinted.has(color)) {
    const base = toRgb(color);
    const stops = [
      [0, ...mix(base, [1, 1, 1], 0.6)],
      [0.5, ...mix(base, [1, 1, 1], 0.15)],
      [1, ...mix(base, [0, 0, 0], 0.2)],
    ].flat();
    const data = structuredClone(fireAnimation);
    const outer = data.layers.find((l) => l.nm === "Shape Layer 1")!;
    for (const item of outer.shapes[0].it) if (item.ty === "gf" && item.g) item.g.k.k = stops;
    tinted.set(color, data);
  }
  return tinted.get(color);
}

/** A chama animada do Lottie. Apagada (cinza e parada) quando `lit` é falso. */
export function FlameArt({ lit, color, className }: { lit: boolean; color?: string; className?: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animation: AnimationItem | undefined;
    let cancelled = false;
    // O player só é baixado no navegador, quando a chama aparece.
    import("lottie-web/build/player/lottie_light").then(({ default: lottie }) => {
      if (cancelled || !container.current) return;
      animation = lottie.loadAnimation({
        container: container.current,
        renderer: "svg",
        loop: true,
        autoplay: lit,
        // O lottie altera o objeto que recebe: cada instância ganha uma cópia.
        animationData: structuredClone(flameData(color)),
        rendererSettings: { viewBoxSize: FLAME_VIEWBOX, preserveAspectRatio: "xMidYMid meet" },
      });
      if (!lit) animation.goToAndStop(0, true);
    });
    return () => {
      cancelled = true;
      animation?.destroy();
    };
  }, [lit, color]);

  return (
    <span
      ref={container}
      aria-hidden="true"
      className={cn("inline-block shrink-0 [&_svg]:overflow-visible", !lit && "opacity-35 grayscale", className)}
    />
  );
}

/**
 * Sequência geral: chama animada + número. Mouse em cima (ou toque) mostra a sequência
 * de cada jogo terminado hoje, cada um com a chama na cor do jogo.
 */
export function StreakFlame() {
  const { today, round } = useRound();
  const records = usePlayRecords();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const pointer = useRef<string>("mouse");
  const streak = today ? overallStreak(records, today).current : 0;
  const completed = round
    .filter((r) => isDone(r.status))
    .map((r) => ({
      ...r,
      streak: today ? gameStats(records, r.meta.slug, r.meta.rules, today).streak.current : 0,
    }));

  // Popover em vez de hover card: abre com o mouse em cima e também com toque no celular.
  const hover = (next: boolean) => (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(closeTimer.current);
    if (next) setOpen(true);
    else closeTimer.current = window.setTimeout(() => setOpen(false), 150);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onPointerDown={(e) => (pointer.current = e.pointerType)}
          // Com mouse quem abre e fecha é o hover; o clique só alterna no toque e no teclado.
          onClick={(e) => pointer.current === "mouse" && e.detail > 0 && e.preventDefault()}
          onPointerEnter={hover(true)}
          onPointerLeave={hover(false)}
          className="flex items-end gap-2 rounded-lg px-2 py-1 outline-none transition-colors hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${t.home.streak}: ${streak} ${t.home.streakDays(streak)}`}
        >
          <FlameArt lit={streak > 0} className="h-14 w-9" />
          <span className="font-display text-5xl leading-none tabular-nums">{streak}</span>
          <span className="pb-1 text-sm text-muted-foreground">{t.home.streakDays(streak)}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-72 p-0"
        onPointerEnter={hover(true)}
        onPointerLeave={hover(false)}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="border-b border-border px-4 py-3">
          <p className="font-display text-base">{t.streak.title}</p>
          <p className="text-xs text-muted-foreground">{t.streak.subtitle}</p>
        </div>
        {completed.length === 0 ? (
          <p className="px-4 py-4 text-sm text-muted-foreground">{t.streak.none}</p>
        ) : (
          <ul className="py-1.5">
            {completed.map(({ meta, status, streak: s }) => (
              <li key={meta.slug} className="flex items-center gap-3 px-4 py-2">
                <FlameArt lit={s > 0} color={meta.color} className="h-6 w-4" />
                <span className="text-sm font-medium">{meta.name}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {status.kind !== "new" && formatResult(meta.rules, status.kind, status.count)}
                </span>
                <span
                  className={cn("ml-auto text-sm font-semibold tabular-nums", !s && "text-muted-foreground")}
                  style={s ? { color: meta.color } : undefined}
                >
                  {t.stats.days(s)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
