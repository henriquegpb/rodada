"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { roundGames as games } from "@/games";
import { EPOCH_DATE, addDays } from "@/lib/daily/date";
import { formatResult } from "@/lib/plays/result";
import type { PlayRecord } from "@/lib/stats";
import { cn } from "@/lib/utils";

const shortDate = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" });

/**
 * Uma linha por jogo, uma coluna por dia: cor do jogo = ganhou (com o nº de tentativas), × = perdeu.
 * Dias antes de o jogo existir ficam pontilhados, e o dia da estreia ganha uma marquinha (e a data,
 * embaixo do nome) enquanto aparece na grade.
 */
export function HistoryGrid({ records, today, days }: { records: PlayRecord[]; today: string; days: number }) {
  const byKey = new Map(records.map((r) => [`${r.slug}:${r.dateKey}`, r]));
  const dates = Array.from({ length: days }, (_, i) => addDays(today, i - days + 1));
  const columns = { gridTemplateColumns: `7rem repeat(${days}, minmax(1.75rem, 2.75rem))` };

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[520px] gap-1" style={columns}>
        <span />
        {dates.map((d, i) => (
          <span key={d} className="whitespace-nowrap pb-1 text-center text-[11px] text-muted-foreground">
            {i === 0 || i === dates.length - 1 ? shortDate(d) : ""}
          </span>
        ))}

        {games.map(({ meta }) => {
          const launch = meta.launchedOn ?? EPOCH_DATE;
          return (
            <div key={meta.slug} className="contents">
              <Link href={`/${meta.slug}`} className="flex flex-col justify-center leading-tight hover:underline">
                <span className="text-sm font-medium">{meta.name}</span>
                {launch >= dates[0] && (
                  <span className="text-[11px] text-muted-foreground">estreou {shortDate(launch)}</span>
                )}
              </Link>
              {dates.map((d) => {
                if (d < launch) {
                  return (
                    <DayTip key={d} title={`${meta.name} · ${shortDate(d)}`} detail="Ainda não existia">
                      <span className="aspect-square rounded-[5px] border border-dashed border-border" />
                    </DayTip>
                  );
                }
                const r = byKey.get(`${meta.slug}:${d}`);
                const finished = r && r.status !== "playing";
                const good = r?.status === "won" || r?.status === "done";
                const lost = r?.status === "lost";
                let result = d === today ? "Ainda não jogou" : "Não jogou";
                if (r) result = finished ? formatResult(meta.rules, r.status, r.count) : "Em andamento";
                return (
                  <DayTip
                    key={d}
                    title={`${meta.name} · ${shortDate(d)}`}
                    detail={d === launch ? `${result} · estreia do jogo` : result}
                  >
                    <span
                      className={cn(
                        "relative grid aspect-square place-items-center rounded-[5px] text-xs font-bold tabular-nums",
                        good && "text-ink",
                        lost && "bg-secondary text-muted-foreground",
                        !r && "bg-secondary/40",
                        r?.status === "playing" && "bg-secondary/40 ring-1 ring-inset ring-border",
                        d === today && "outline-2 outline-offset-1 outline-foreground/25",
                      )}
                      style={good ? { background: meta.color } : undefined}
                    >
                      {good ? r.count : lost ? "×" : ""}
                      {d === launch && (
                        // Estreia: um pontinho no canto, na cor do jogo (escuro quando o dia já está pintado).
                        <span
                          aria-hidden="true"
                          className="absolute right-1 top-1 size-1.5 rounded-full"
                          style={{ background: good ? "var(--ink)" : meta.color }}
                        />
                      )}
                    </span>
                  </DayTip>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Dica de um dia da grade: abre na hora (o `title` do sistema demora e não tem estilo). */
function DayTip({ title, detail, children }: { title: string; detail: string; children: ReactElement }) {
  return (
    <Tooltip delayDuration={80}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className="flex-col items-start gap-0.5">
        <span className="font-semibold">{title}</span>
        <span className="opacity-70">{detail}</span>
      </TooltipContent>
    </Tooltip>
  );
}
