"use client";

import { Suspense, useEffect, useState } from "react";
import { ChartColumn, CircleHelp } from "lucide-react";
import { getGame } from "@/games";
import type { PlayView } from "@/games/types";
import { useToday } from "@/lib/daily/hooks";
import { beginPlay, finishPlay, startPlay, submitGuess } from "@/lib/plays/service";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { HowToPlayDialog } from "./how-to-play";
import { ResultDialog, ResultStrip } from "./result";
import { StatsDialog } from "./stats-dialog";

/** Espera a última jogada terminar de animar antes de abrir o resultado. */
const RESULT_DELAY_MS = 1700;

export function GameScreen({ slug }: { slug: string }) {
  const game = getGame(slug)!;
  const { meta, Board } = game;
  const today = useToday();
  const [play, setPlay] = useState<PlayView | null>(null);
  const [dialog, setDialog] = useState<"help" | "stats" | "result" | null>(null);

  useEffect(() => {
    if (!today) return;
    let alive = true;
    startPlay(slug, today).then((p) => {
      if (!alive) return;
      setPlay(p);
    });
    return () => {
      alive = false;
    };
  }, [slug, today]);

  async function submit(input: string) {
    if (!play) return null;
    const result = await submitGuess(slug, play.dateKey, input);
    if ("error" in result) return result.error;
    setPlay(result.play);
    if (result.play.status !== "playing") window.setTimeout(() => setDialog("result"), RESULT_DELAY_MS);
    return null;
  }

  async function begin() {
    if (play) setPlay(await beginPlay(slug, play.dateKey));
  }

  async function finish() {
    if (!play || play.status !== "playing") return;
    const ended = await finishPlay(slug, play.dateKey);
    setPlay(ended);
    if (ended.status !== "playing") setDialog("result");
  }

  const finished = play !== null && play.status !== "playing";
  const used = play?.guesses.length ?? 0;
  const { rules } = meta;

  return (
    // Jogos por tentativas são um palco estreito; o de tempo precisa de espaço para mapa e tabela.
    <div className={cn("mx-auto", rules.type === "attempts" ? "max-w-[620px]" : "max-w-5xl")}>
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="h-5 text-sm text-muted-foreground">{play && `Nº ${play.number}`}</p>
          <h1 className="font-display text-5xl leading-none">{meta.name}</h1>
        </div>
        <div className="flex items-center gap-5 pb-1">
          {rules.type === "attempts" && (
            <span className="flex gap-1" aria-label={`${used} de ${rules.maxAttempts} tentativas`}>
              {Array.from({ length: rules.maxAttempts }, (_, i) => (
                <span
                  key={i}
                  className={cn("h-2 w-4 rounded-full transition-colors", i < used ? "bg-foreground" : "bg-secondary")}
                  style={play?.status === "won" && i === used - 1 ? { background: meta.color } : undefined}
                />
              ))}
            </span>
          )}
          <div className="flex">
            <IconButton label={t.game.howToPlay} onClick={() => setDialog("help")}>
              <CircleHelp size={20} />
            </IconButton>
            <IconButton label={t.game.stats} onClick={() => setDialog("stats")}>
              <ChartColumn size={20} />
            </IconButton>
          </div>
        </div>
      </header>

      {finished && (
        <div className="mt-6 animate-rise">
          <ResultStrip game={game} play={play} onOpen={() => setDialog("result")} />
        </div>
      )}

      <div className="mt-8">
        {play ? (
          <Suspense fallback={<Loading />}>
            <Board play={play} rules={rules} submitGuess={submit} begin={begin} finish={finish} />
          </Suspense>
        ) : (
          <Loading />
        )}
      </div>

      <HowToPlayDialog
        meta={meta}
        open={dialog === "help"}
        onOpenChange={(open) => setDialog(open ? "help" : null)}
      />
      <StatsDialog
        meta={meta}
        highlight={play?.status === "won" ? used : undefined}
        open={dialog === "stats"}
        onOpenChange={(open) => setDialog(open ? "stats" : null)}
      />
      {finished && (
        <ResultDialog
          game={game}
          play={play}
          open={dialog === "result"}
          onOpenChange={(open) => setDialog(open ? "result" : null)}
        />
      )}
    </div>
  );
}

function Loading() {
  return <div className="grid h-[420px] place-items-center text-sm text-muted-foreground">{t.game.loading}</div>;
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-10 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {children}
    </button>
  );
}
