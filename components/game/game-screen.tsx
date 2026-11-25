"use client";

import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CalendarDays, ChartColumn, CircleHelp, Dumbbell } from "lucide-react";
import { getGame, rootGame } from "@/games";
import type { PlayMode, PlayView } from "@/games/types";
import { daysBetween } from "@/lib/daily/date";
import { useToday } from "@/lib/daily/hooks";
import {
  beginPlay,
  finishPlay,
  modeForPastDay,
  nextPracticeKey,
  pastDays,
  pastPlay,
  peekPlay,
  pendingDays,
  startPlay,
  submitGuess,
} from "@/lib/plays/service";
import { archiveStore, dailyStore } from "@/lib/plays/store";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { HowToPlayDialog } from "./how-to-play";
import { ResultDialog, ResultStrip } from "./result";
import { ModeTabs, modeMove } from "./mode-tabs";
import { PastDaysDialog, formatDay } from "./past-days";
import { StatsDialog } from "./stats-dialog";

/** Espera a última jogada terminar de animar antes de abrir o resultado. */
const RESULT_DELAY_MS = 1700;

export function GameScreen({ slug }: { slug: string }) {
  const game = getGame(slug)!;
  const { meta, Board } = game;
  const today = useToday();
  // Se a engine já foi carregada (ex.: pelo hover no link), a página já monta com o tabuleiro.
  const [play, setPlay] = useState<PlayView | null>(() => (today ? peekPlay(slug, today) : null));
  const [dialog, setDialog] = useState<"help" | "stats" | "result" | "past" | null>(null);
  /** O desafio aberto fora o de hoje: um dia anterior ou o treino ("Jogar outra"). null = hoje. */
  const [other, setOther] = useState<{ dateKey: string; mode: PlayMode } | null>(null);
  const mode: PlayMode = other?.mode ?? "daily";
  const dateKey = other?.dateKey ?? today;
  /** Fora do desafio de hoje: não conta para sequência, estatísticas nem ranking. */
  const practice = other !== null;

  // Os dias anteriores e quais faltam terminar: o "Jogar outra" só libera o treino sem nenhum.
  const daily = dailyStore.usePlays();
  const archived = archiveStore.usePlays();
  const past = today ? pastDays(slug, today) : [];
  const pending = today ? pendingDays(daily, archived, slug, today) : [];

  useEffect(() => {
    if (!dateKey) return;
    let alive = true;
    startPlay(slug, dateKey, mode).then((p) => {
      if (!alive) return;
      setPlay(p);
    });
    return () => {
      alive = false;
    };
  }, [slug, dateKey, mode]);

  function switchTo(next: { dateKey: string; mode: PlayMode } | null) {
    setDialog(null);
    setPlay(null);
    setOther(next);
  }

  function openPastDay(day: string) {
    if (today) trackEvent("past_day_opened", { game: slug, days_ago: daysBetween(day, today) });
    switchTo({ dateKey: day, mode: modeForPastDay(slug, day) });
  }

  /** Depois de uma partida: o dia anterior mais recente que falta; sem nenhum, o treino. */
  function playAnother() {
    if (pending.length) return openPastDay(pending[0]);
    trackEvent("play_another", { game: slug });
    switchTo({ dateKey: nextPracticeKey(slug), mode: "practice" });
  }
  const another = { kind: pending.length ? "past" : "practice", onClick: playAnother } as const;

  const backToToday = () => switchTo(null);

  /** Eventos de fim de partida (o resultado já vem salvo do serviço). */
  function trackFinished(ended: PlayView) {
    trackEvent("game_finished", {
      game: slug,
      practice,
      result: ended.status,
      attempts: ended.guesses.length,
    });
  }

  async function submit(input: string) {
    if (!play) return null;
    // Jogos com tempo contam o início no "Começar"; os outros, na primeira tentativa aceita.
    const firstGuess = play.guesses.length === 0 && rules.type !== "timed";
    const result = await submitGuess(slug, play.dateKey, input, mode);
    if ("error" in result) return result.error;
    setPlay(result.play);
    if (firstGuess) trackEvent("game_started", { game: slug, practice });
    if (result.play.status !== "playing") {
      trackFinished(result.play);
      window.setTimeout(() => setDialog("result"), meta.resultDelayMs ?? RESULT_DELAY_MS);
    }
    return null;
  }

  async function begin() {
    if (!play) return;
    setPlay(await beginPlay(slug, play.dateKey, mode));
    trackEvent("game_started", { game: slug, practice });
  }

  async function finish() {
    if (!play || play.status !== "playing") return;
    const ended = await finishPlay(slug, play.dateKey, mode);
    setPlay(ended);
    if (ended.status === "playing") return;
    // Sem tempo e sem pontos, encerrar antes da hora é desistir.
    if (rules.type !== "timed" && rules.type !== "points") trackEvent("game_given_up", { game: slug, practice, attempts: ended.guesses.length });
    trackFinished(ended);
    setDialog("result");
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
      <header className={cn("flex flex-wrap justify-between gap-x-4 gap-y-3", meta.compactHeader ? "items-center" : "items-end")}>
        {/* Compacto: título e número na mesma linha, menores, para o tabuleiro ganhar a tela. */}
        <div className={cn(meta.compactHeader && "flex flex-row-reverse items-baseline justify-end gap-2.5")}>
          <p className={cn("text-sm text-muted-foreground", !meta.compactHeader && "h-5")}>
            {mode === "practice" ? t.practice.label : play && `Nº ${play.number}`}
          </p>
          {/* Nos modos (Dupla, Quadra) o título é o do jogo pai; o modo aparece nas abas. */}
          <h1 className={cn("font-display leading-none", meta.compactHeader ? "text-2xl sm:text-3xl" : "text-4xl sm:text-5xl")}>
            {rootGame(slug)?.meta.name ?? meta.name}
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-1 pb-1">
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
            {past.length > 0 && (
              <button
                type="button"
                onClick={() => setDialog("past")}
                className="mr-1 inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <CalendarDays size={18} /> {t.archive.playPast}
              </button>
            )}
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
        {other && (
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm">
            {other.mode === "practice" ? (
              <Dumbbell size={16} className="shrink-0 text-muted-foreground" />
            ) : (
              <CalendarDays size={16} className="shrink-0 text-muted-foreground" />
            )}
            <p className="min-w-0 flex-1 text-muted-foreground">
              {other.mode === "practice" ? (
                <>
                  <strong className="font-semibold text-foreground">{t.practice.label}.</strong> {t.practice.notice}
                </>
              ) : (
                <>
                  <strong className="font-semibold text-foreground">
                    {t.archive.label} · {formatDay(other.dateKey)}
                  </strong>{" "}
                  {other.mode === "daily" ? t.archive.playedThen : t.archive.notice}
                </>
              )}
            </p>
            <button type="button" onClick={backToToday} className="font-semibold text-primary">
              {t.practice.back}
            </button>
          </div>
        )}

        {finished && (
          <div className="mt-6 animate-rise">
            <ResultStrip
              game={game}
              play={play}
              onOpen={() => setDialog("result")}
              another={another}
            />
          </div>
        )}

        <div className={meta.compactHeader ? "mt-4" : "mt-8"}>
          {play ? (
            <Suspense fallback={<Loading />}>
              {/* Cada partida (hoje, dia anterior ou treino) começa com o tabuleiro zerado. */}
              <Board
                key={`${mode}:${play.dateKey}`}
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
          another={another}
        />
      )}
      {past.length > 0 && (
        <PastDaysDialog
          meta={meta}
          days={past}
          playOf={(day) => pastPlay(daily, archived, slug, day)}
          pending={pending.length}
          current={other && other.mode !== "practice" ? other.dateKey : null}
          open={dialog === "past"}
          onOpenChange={(open) => setDialog(open ? "past" : null)}
          onPick={openPastDay}
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
