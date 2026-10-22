"use client";

import Link from "next/link";
import { roundGames as games } from "@/games";
import { addDays } from "@/lib/daily/date";
import { formatResult } from "@/lib/plays/result";
import type { PlayRecord } from "@/lib/stats";
import { cn } from "@/lib/utils";

const shortDate = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" });

/** Uma linha por jogo, uma coluna por dia: cor do jogo = ganhou (com o nº de tentativas), × = perdeu. */
export function HistoryGrid({ records, today, days }: { records: PlayRecord[]; today: string; days: number }) {
  const byKey = new Map(records.map((r) => [`${r.slug}:${r.dateKey}`, r]));
  const dates = Array.from({ length: days }, (_, i) => addDays(today, i - days + 1));
  const columns = { gridTemplateColumns: `6.5rem repeat(${days}, minmax(1.75rem, 2.75rem))` };

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[520px] gap-1" style={columns}>
        <span />
        {dates.map((d, i) => (
          <span key={d} className="whitespace-nowrap pb-1 text-center text-[11px] text-muted-foreground">
            {i === 0 || i === dates.length - 1 ? shortDate(d) : ""}
          </span>
        ))}

        {games.map(({ meta }) => (
          <div key={meta.slug} className="contents">
            <Link href={`/${meta.slug}`} className="flex items-center text-sm font-medium hover:underline">
              {meta.name}
            </Link>
            {dates.map((d) => {
              const r = byKey.get(`${meta.slug}:${d}`);
              const finished = r && r.status !== "playing";
              const good = r?.status === "won" || r?.status === "done";
              const lost = r?.status === "lost";
              return (
                <span
                  key={d}
                  title={`${meta.name}, ${shortDate(d)}: ${finished ? formatResult(meta.rules, r.status, r.count) : "—"}`}
                  className={cn(
                    "grid aspect-square place-items-center rounded-[5px] text-xs font-bold tabular-nums",
                    good && "text-ink",
                    lost && "bg-secondary text-muted-foreground",
                    !r && "bg-secondary/40",
                    r?.status === "playing" && "bg-secondary/40 ring-1 ring-inset ring-border",
                    d === today && "outline-2 outline-offset-1 outline-foreground/25",
                  )}
                  style={good ? { background: meta.color } : undefined}
                >
                  {good ? r.count : lost ? "×" : ""}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
