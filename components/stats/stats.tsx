import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { GameRules } from "@/games/types";
import type { GameStats } from "@/lib/stats";

/** Quatro números lado a lado, separados por fios. */
export function StatStrip({ items, className }: { items: { label: string; value: number }[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-4 divide-x divide-border", className)}>
      {items.map((item) => (
        <div key={item.label} className="px-4 first:pl-0">
          <dd className="font-display text-3xl tabular-nums">{item.value}</dd>
          <dt className="mt-1 text-xs text-muted-foreground">{item.label}</dt>
        </div>
      ))}
    </dl>
  );
}

/** Os números que importam em cada tipo de jogo. */
export function statItems(stats: GameStats, rules: GameRules) {
  if (rules.type === "unlimited") {
    return [
      { label: t.stats.played, value: stats.played },
      { label: t.stats.fewestGuesses, value: stats.best },
      { label: t.stats.averageGuesses, value: stats.average },
      { label: t.stats.currentStreak, value: stats.streak.current },
    ];
  }
  return rules.type === "timed"
    ? [
        { label: t.stats.played, value: stats.played },
        { label: t.stats.best, value: stats.best },
        { label: t.stats.average, value: stats.average },
        { label: t.stats.currentStreak, value: stats.streak.current },
      ]
    : [
        { label: t.stats.played, value: stats.played },
        { label: t.stats.winRate, value: stats.winRate },
        { label: t.stats.currentStreak, value: stats.streak.current },
        { label: t.stats.maxStreak, value: stats.streak.max },
      ];
}

/** Barras de vitórias por número de tentativas; destaca a partida de hoje. */
export function Distribution({
  distribution,
  highlight,
  color,
}: {
  distribution: number[];
  highlight?: number;
  color: string;
}) {
  const max = Math.max(1, ...distribution);
  return (
    <div>
      <p className="mb-3 text-xs text-muted-foreground">{t.stats.distribution}</p>
      <ol className="flex flex-col gap-1">
        {distribution.map((count, i) => {
          const today = highlight === i + 1;
          return (
            <li key={i} className="grid grid-cols-[1.25rem_1fr] items-center gap-2 text-sm">
              <span className="font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
              <span className="flex h-7 items-center gap-2">
                <span
                  className={cn("h-full rounded-[4px] transition-[width] duration-700 ease-out", !count && "bg-secondary")}
                  style={{
                    width: count ? `${(count / max) * 100}%` : "4px",
                    background: count
                      ? today || highlight === undefined
                        ? color
                        : `color-mix(in oklab, ${color} 35%, var(--secondary))`
                      : undefined,
                  }}
                />
                <span className={cn("text-xs font-semibold tabular-nums", !count && "text-muted-foreground")}>
                  {count}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
