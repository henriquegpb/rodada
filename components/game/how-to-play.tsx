"use client";

import { getGame } from "@/games";
import type { GameMeta } from "@/games/types";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { t } from "@/lib/i18n";

export function HowToPlayDialog({
  meta,
  open,
  onOpenChange,
}: {
  meta: GameMeta;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const Cover = getGame(meta.slug)!.Cover;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[420px]">
        <div className="flex items-end justify-between gap-4 px-6 pt-6 text-ink" style={{ background: meta.color }}>
          <div className="pb-6">
            <DialogDescription className="text-sm font-semibold text-ink/70">{t.game.howToPlay}</DialogDescription>
            <DialogTitle className="font-display mt-1 text-4xl leading-none">{meta.name}</DialogTitle>
          </div>
          <Cover className="-mb-3 w-32 shrink-0" />
        </div>
        <div className="p-6">
          <ul className="flex flex-col gap-2.5 text-[15px] leading-relaxed">
            {meta.howToPlay.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="mt-6 h-12 w-full rounded-md bg-primary font-semibold text-primary-foreground transition-[filter,transform] hover:brightness-110 active:scale-[0.99]"
          >
            {t.game.letsPlay}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
