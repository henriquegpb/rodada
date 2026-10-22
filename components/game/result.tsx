"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ShareButton } from "@/components/microkit/cursor-follow-share-button";
import { Countdown } from "@/components/countdown";
import type { GameDefinition, PlayView } from "@/games/types";
import { useRound } from "@/lib/plays/hooks";
import { formatResult } from "@/lib/plays/result";
import { isDone } from "@/lib/plays/status";
import { buildShareText, shareText } from "@/lib/share";
import { t } from "@/lib/i18n";

function useResult(game: GameDefinition, play: PlayView) {
  const { round } = useRound();
  const { rules } = game.meta;
  const won = play.status === "won";
  const next = round.find((r) => r.meta.slug !== game.meta.slug && !isDone(r.status))?.meta;
  const headline = won
    ? rules.type === "timed"
      ? t.game.completed
      : t.game.won
    : rules.type === "timed"
      ? t.game.timeUp
      : t.game.lost;
  return {
    won,
    next,
    headline,
    score: formatResult(rules, play.status, play.guesses.length),
    /** Jogos por tentativas revelam a resposta; os com tempo não têm uma. */
    answer: play.answerLabel || null,
    async share() {
      const result = await shareText(buildShareText(game, play));
      if (result === "copied") toast.success(t.game.copied);
      else if (result === "failed") toast.error(t.game.copyFailed);
    },
  };
}

function NextLink({ next, className }: { next?: { slug: string; name: string }; className?: string }) {
  return (
    <Link href={next ? `/${next.slug}` : "/"} className={className}>
      {next ? t.game.nextGame(next.name) : t.game.backHome}
      <ArrowRight size={16} />
    </Link>
  );
}

/** Faixa fixa acima do tabuleiro depois que a partida acaba. */
export function ResultStrip({
  game,
  play,
  onOpen,
}: {
  game: GameDefinition;
  play: PlayView;
  onOpen: () => void;
}) {
  const { won, next, headline, score, answer } = useResult(game, play);
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg bg-card px-4 py-3">
      <span className="font-display text-2xl tabular-nums" style={won ? { color: game.meta.color } : undefined}>
        {score}
      </span>
      <span className="text-sm">
        {headline}
        {answer && (
          <span className="text-muted-foreground">
            {" · "}
            {t.game.answerWas} <strong className="font-semibold text-foreground">{answer}</strong>
          </span>
        )}
      </span>
      <div className="ml-auto flex items-center gap-4 text-sm font-semibold">
        <button type="button" onClick={onOpen} className="text-muted-foreground transition-colors hover:text-foreground">
          {t.game.seeResult}
        </button>
        <NextLink next={next} className="inline-flex items-center gap-1.5 text-primary" />
      </div>
    </div>
  );
}

/** Modal de fim de partida: placar, prévia do que vai ser compartilhado e próximo jogo. */
export function ResultDialog({
  game,
  play,
  open,
  onOpenChange,
}: {
  game: GameDefinition;
  play: PlayView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { next, headline, score, answer, share } = useResult(game, play);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-[400px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="px-6 pb-5 pt-7 text-ink" style={{ background: game.meta.color }}>
          <DialogTitle className="text-sm font-semibold text-ink/70">
            {game.meta.name} Nº {play.number}
          </DialogTitle>
          <p className="font-display mt-2 text-6xl leading-none tabular-nums">{score}</p>
          <DialogDescription className="mt-3 text-[15px] font-medium text-ink">
            {headline}
            {answer && (
              <>
                {" · "}
                {t.game.answerWas} <strong>{answer}</strong>
              </>
            )}
          </DialogDescription>
        </div>
        <div className="flex flex-col gap-5 p-6">
          <div className="rounded-md bg-secondary/60 px-4 py-3">
            <pre className="mx-auto w-fit whitespace-pre-wrap font-sans text-lg leading-snug">{game.shareGrid(play)}</pre>
          </div>
          <ShareButton label={t.game.share} onClick={share} />
          <div className="flex items-center justify-between text-sm">
            <Countdown />
            <NextLink next={next} className="inline-flex items-center gap-1.5 font-semibold text-primary" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
