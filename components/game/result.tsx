"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ShareButton } from "@/components/microkit/cursor-follow-share-button";
import { Countdown } from "@/components/countdown";
import { RankingLine } from "@/components/ranking/ranking-line";
import { modesOf } from "@/games";
import type { GameDefinition, PlayView } from "@/games/types";
import { useRound } from "@/lib/plays/hooks";
import { formatResult, playCount } from "@/lib/plays/result";
import { isDone, statusOf } from "@/lib/plays/status";
import { playKey, usePlays } from "@/lib/plays/store";
import { buildShareText, shareText } from "@/lib/share";
import { trackEvent } from "@/lib/analytics";
import { t } from "@/lib/i18n";

function useResult(game: GameDefinition, play: PlayView) {
  const { today, round } = useRound();
  const plays = usePlays();
  const { rules } = game.meta;
  const won = play.status === "won";
  // Quem vence segue para o modo seguinte do mesmo jogo (Palavra → Dupla → Quadra), se ainda não o
  // jogou hoje; senão, para o próximo jogo da rodada que falta.
  const modes = modesOf(game.meta.slug);
  const nextMode = modes[modes.findIndex((g) => g === game) + 1]?.meta;
  const modeOpen = nextMode && today && !isDone(statusOf(plays[playKey(nextMode.slug, today)]));
  const next =
    (won && modeOpen ? nextMode : undefined) ??
    round.find((r) => r.meta.slug !== game.meta.slug && !isDone(r.status))?.meta;
  const scored = rules.type === "timed" || rules.type === "quiz" || rules.type === "points";
  const headline = won
    ? (game.meta.wonHeadline ??
      (rules.type === "timed"
        ? t.game.completed
        : rules.type === "quiz"
          ? t.game.perfect
          : rules.type === "points"
            ? t.game.foundAll
            : rules.type === "lives"
              ? t.game.solved
              : t.game.won))
    : scored
      ? t.game.timeUp
      : t.game.lost;
  return {
    today,
    won,
    next,
    headline,
    score: formatResult(rules, play.status, playCount(rules, play.guesses)),
    /** Jogos por tentativas revelam a resposta; os com tempo não têm uma. */
    answer: game.meta.hideAnswer ? null : play.answerLabel || null,
    async share() {
      const result = await shareText(buildShareText(game, play));
      if (result !== "failed") trackEvent("result_shared", { game: game.meta.slug, method: result });
      if (result === "copied") toast.success(t.game.copied);
      else if (result === "failed") toast.error(t.game.copyFailed);
    },
  };
}

/**
 * O que jogar depois: o dia anterior mais recente que falta ("Jogar dias anteriores") ou, com todos
 * feitos, o treino ("Jogar outra"). Quem decide é a tela do jogo.
 */
export interface Another {
  kind: "past" | "practice";
  onClick: () => void;
}

function AnotherLabel({ another, size }: { another: Another; size: number }) {
  return another.kind === "practice" ? (
    <>
      <RotateCcw size={size} /> {t.practice.playAnother}
    </>
  ) : (
    <>
      <CalendarDays size={size} /> {t.archive.playPast}
    </>
  );
}

function PlayAnotherButton({ another }: { another: Another }) {
  return (
    <button
      type="button"
      onClick={another.onClick}
      className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground transition-colors hover:text-foreground"
    >
      <AnotherLabel another={another} size={14} />
    </button>
  );
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
  another,
}: {
  game: GameDefinition;
  play: PlayView;
  onOpen: () => void;
  another: Another;
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
        <PlayAnotherButton another={another} />
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
  another,
}: {
  game: GameDefinition;
  play: PlayView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  another: Another;
}) {
  const { today, next, headline, score, answer, share } = useResult(game, play);
  /** Dia anterior jogado depois e treino não se compartilham nem entram no ranking. */
  const offline = play.practice || play.archive;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[400px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="px-6 pb-5 pt-7 text-ink" style={{ background: game.meta.color }}>
          <DialogTitle className="text-sm font-semibold text-ink/70">
            {game.meta.name} · {play.practice ? t.practice.label : `Nº ${play.number}`}
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
        <div className="flex min-h-0 flex-col gap-5 p-6">
          {/* Com muitos chutes o resumo rola sozinho, para o modal caber na tela. */}
          <div className="min-h-0 overflow-y-auto">
            <game.Recap play={play} />
          </div>
          {offline ? (
            // Fora do desafio de hoje não se compartilha: o principal é emendar outra.
            <button
              type="button"
              onClick={another.onClick}
              className="flex h-14 items-center justify-center gap-2 rounded-full bg-primary text-[17px] font-semibold text-primary-foreground transition-[filter,transform] hover:brightness-110 active:scale-[0.99]"
            >
              <AnotherLabel another={another} size={18} />
            </button>
          ) : (
            <>
              <ShareButton label={t.game.share} onClick={share} />
              <RankingLine slug={game.meta.slug} dateKey={play.dateKey} />
            </>
          )}
          <div className="flex items-center justify-between gap-4 text-sm">
            {offline ? (
              <span className="text-muted-foreground">{play.practice ? t.practice.notice : t.archive.notice}</span>
            ) : (
              <PlayAnotherButton another={another} />
            )}
            <NextLink next={next} className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-primary" />
          </div>
          {play.dateKey === today && !offline && <Countdown className="justify-center" />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
