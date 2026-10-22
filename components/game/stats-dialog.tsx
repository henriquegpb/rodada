"use client";

import type { GameMeta } from "@/games/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Distribution, StatStrip, statItems } from "@/components/stats/stats";
import { useToday } from "@/lib/daily/hooks";
import { usePlayRecords } from "@/lib/plays/hooks";
import { gameStats } from "@/lib/stats";
import { t } from "@/lib/i18n";

export function StatsDialog({
  meta,
  highlight,
  open,
  onOpenChange,
}: {
  meta: GameMeta;
  highlight?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const today = useToday();
  const records = usePlayRecords();
  const stats = today ? gameStats(records, meta.slug, meta.rules, today) : null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{meta.name}</DialogTitle>
          <DialogDescription>{t.game.stats}</DialogDescription>
        </DialogHeader>
        {stats && (
          <div className="flex flex-col gap-7 pt-2">
            <StatStrip items={statItems(stats, meta.rules)} />
            {meta.rules.type === "attempts" && (
              <Distribution distribution={stats.distribution} highlight={highlight} color={meta.color} />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
