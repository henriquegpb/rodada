"use client";

import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChartColumn, CircleHelp, Dumbbell } from "lucide-react";
import { getGame, rootGame } from "@/games";
import type { PlayView } from "@/games/types";
import { useToday } from "@/lib/daily/hooks";
import { beginPlay, finishPlay, nextPracticeKey, peekPlay, startPlay, submitGuess } from "@/lib/plays/service";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { HowToPlayDialog } from "./how-to-play";
import { ResultDialog, ResultStrip } from "./result";
import { ModeTabs, modeMove } from "./mode-tabs";
import { StatsDialog } from "./stats-dialog";

/** Espera a última jogada terminar de animar antes de abrir o resultado. */
const RESULT_DELAY_MS = 1700;

export function GameScreen({ slug }: { slug: string }) {
  const game = getGame(slug)!;
  const { meta, Board } = game;
  const today = useToday();
  // Se a engine já foi carregada (ex.: pelo hover no link), a página já monta com o tabuleiro.
  const [play, setPlay] = useState<PlayView | null>(() => (today ? peekPlay(slug, today) : null));
  const [dialog, setDialog] = useState<"help" | "stats" | "result" | null>(null);
  /** Desafio do treino em andamento ("Jogar outra"); null = desafio de hoje. */
  const [practiceKey, setPracticeKey] = useState<string | null>(null);
  const practice = practiceKey !== null;

  useEffect(() => {
    if (!today) return;
    let alive = true;
    startPlay(slug, practiceKey ?? today, practiceKey !== null).then((p) => {
      if (!alive) return;
      setPlay(p);
    });
    return () => {
      alive = false;
    };
  }, [slug, today, practiceKey]);

  function playAnother() {
    setDialog(null);
    setPlay(null);
    setPracticeKey(nextPracticeKey(slug));
  }

  function backToToday() {
    setDialog(null);
    setPlay(null);
    setPracticeKey(null);
  }

  async function submit(input: string) {
    if (!play) return null;
    const result = await submitGuess(slug, play.dateKey, input, practice);
    if ("error" in result) return result.error;
    setPlay(result.play);
    if (result.play.status !== "playing") window.setTimeout(() => setDialog("result"), RESULT_DELAY_MS);
    return null;
  }

  async function begin() {
    if (play) setPlay(await beginPlay(slug, play.dateKey, practice));
  }

  async function finish() {
    if (!play || play.status !== "playing") return;
    const ended = await finishPlay(slug, play.dateKey, practice);
    setPlay(ended);
    if (ended.status !== "playing") setDialog("result");
  }

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Animação de entrada (roda ao montar e quando o Next reexibe a página guardada).
  // Trocando de modo (Palavra → Dupla) título e abas ficam parados e só o jogo desliza, para o
  // lado da aba escolhida. Vindo de qualquer outro lugar, a página inteira entra com fade.
  useLayoutEffect(() => {
    const { from, to } = modeMove(slug);
    const easing = "cubic-bezier(.22,1,.36,1)";
    if (from >= 0 && from !== to) {
      const dx = from < to ? 32 : -32;
      stageRef.current?.animate(
        [
          { opacity: 0, transform: `translateX(${dx}px)` },
          { opacity: 1, transform: "none" },
        ],
        { duration: 380, easing },
      );
    } else {
      rootRef.current?.animate(
        [
          { opacity: 0, transform: "translateY(4px)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 260, easing },
      );
    }
  }, [slug]);

  const finished = play !== null && play.status !== "playing";
  const used = play?.guesses.length ?? 0;
  const { rules } = meta;

  return (
    // Palco estreito por padrão; o jogo com tempo precisa de espaço para mapa e tabela.
    <div ref={rootRef} className={cn("mx-auto", meta.wide || rules.type === "timed" ? "max-w-5xl" : "max-w-[620px]")}>
      <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div>
          <p className="h-5 text-sm text-muted-foreground">
            {practice ? t.practice.label : play && `Nº ${play.number}`}
          </p>
          {/* Nos modos (Dupla, Quadra) o título é o do jogo pai; o modo aparece nas abas. */}
          <h1 className="font-display text-4xl leading-none sm:text-5xl">{rootGame(slug)?.meta.name ?? meta.name}</h1>
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

      <ModeTabs slug={slug} className="mt-6" />

      <div ref={stageRef}>
        {practice && (
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm">
            <Dumbbell size={16} className="shrink-0 text-muted-foreground" />
            <p className="min-w-0 flex-1 text-muted-foreground">
              <strong className="font-semibold text-foreground">{t.practice.label}.</strong> {t.practice.notice}
            </p>
            <button type="button" onClick={backToToday} className="font-semibold text-primary">
              {t.practice.back}
            </button>
          </div>
        )}

        {finished && (
          <div className="mt-6 animate-rise">
            <ResultStrip game={game} play={play} onOpen={() => setDialog("result")} onPlayAnother={playAnother} />
          </div>
        )}

        <div className="mt-8">
          {play ? (
            <Suspense fallback={<Loading />}>
              {/* Cada partida (hoje ou treino) começa com o tabuleiro zerado. */}
              <Board
                key={`${play.practice ? "treino" : "hoje"}:${play.dateKey}`}
                play={play}
                rules={rules}
                submitGuess={submit}
                begin={begin}
                finish={finish}
              />
            </Suspense>
          ) : (
            <Loading />
          )}
        </div>
      </div>

      <HowToPlayDialog
        meta={meta}
        open={dialog === "help"}
        onOpenChange={(open) => setDialog(open ? "help" : null)}
      />
      <StatsDialog
        meta={meta}
        highlight={play?.status === "won" && !practice ? used : undefined}
        open={dialog === "stats"}
        onOpenChange={(open) => setDialog(open ? "stats" : null)}
      />
      {finished && (
        <ResultDialog
          game={game}
          play={play}
          open={dialog === "result"}
          onOpenChange={(open) => setDialog(open ? "result" : null)}
          onPlayAnother={playAnother}
        />
      )}
    </div>
  );
}

/** Espaço reservado do tamanho do tabuleiro, sem texto: um "Carregando…" relâmpago parecia um flash. */
function Loading() {
  return (
    <div className="h-[420px]" aria-busy="true">
      <span className="sr-only">{t.game.loading}</span>
    </div>
  );
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
