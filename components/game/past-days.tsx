"use client";

import { Check } from "lucide-react";
import type { GameMeta } from "@/games/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { challengeNumber } from "@/lib/daily/date";
import { isDone, statusLabel, statusOf } from "@/lib/plays/status";
import type { StoredPlay } from "@/lib/plays/store";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

const DAY = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

/** "seg., 23 de nov." de uma data YYYY-MM-DD. */
export const formatDay = (dateKey: string) => DAY.format(new Date(`${dateKey}T12:00:00Z`));

/**
 * A lista dos dias anteriores do jogo, do mais recente ao mais antigo, com o resultado de cada um
 * (jogado no dia ou depois). Escolher um abre a partida daquele dia.
 */
export function PastDaysDialog({
  meta,
  days,
  playOf,
  pending,
  current,
  open,
  onOpenChange,
  onPick,
}: {
  meta: GameMeta;
  days: string[];
  playOf: (dateKey: string) => StoredPlay | undefined;
  pending: number;
  /** O dia aberto agora, para marcar na lista. */
  current: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (dateKey: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {meta.name} · {t.archive.title}
          </DialogTitle>
          <DialogDescription>{t.archive.subtitle(pending)}</DialogDescription>
        </DialogHeader>
        <ul className="-mx-2 min-h-0 overflow-y-auto">
          {days.map((dateKey) => {
            const status = statusOf(playOf(dateKey));
            const done = isDone(status);
            return (
              <li key={dateKey}>
                <button
                  type="button"
                  onClick={() => onPick(dateKey)}
                  aria-current={dateKey === current ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left text-sm transition-colors hover:bg-secondary",
                    dateKey === current && "bg-secondary",
                  )}
                >
                  <span className="w-12 shrink-0 font-semibold tabular-nums">Nº {challengeNumber(dateKey)}</span>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{formatDay(dateKey)}</span>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 tabular-nums",
                      done ? "text-muted-foreground" : "font-semibold text-primary",
                    )}
                  >
                    {done && <Check size={14} />}
                    {statusLabel(status, meta.rules)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
