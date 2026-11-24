"use client";

import { type CSSProperties, useEffect, useEffectEvent, useRef, useState } from "react";
import { ArrowDown, Check, Play, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { FocusInput } from "@/components/microkit/focus-input";
import { cn } from "@/lib/utils";
import type { BoardProps, PlayView, PointsRules } from "../types";
import { Creature, Submarine } from "./art";
import {
  Burst,
  Confetti,
  Flash,
  PARTY,
  Rays,
  cheer,
  entrance,
  shakeCard,
  useCountUp,
  usePreloadNotes,
} from "./Celebrate";
import { suggestionIn } from "./match";
import { Ocean, TrenchRuler, useDepth, waterAt } from "./Scene";
import {
  COLOR,
  MILESTONES,
  SECONDS,
  SKIP,
  TIERS,
  TIMEOUT,
  ZONES,
  depthAt,
  milestonesAt,
  pointsOf,
  pointsAtDepth,
  zoneAt,
} from "./tiers";
import type { IncomumFeedback, IncomumPuzzle } from "./types";

type Milestone = (typeof MILESTONES)[number];

/** Duração de `animate-shake` (app/globals.css). */
const SHAKE_MS = 420;
/** Nos últimos segundos o oxigênio fica vermelho e pulsa. */
const HURRY = 5;

/**
 * Altura do jogo: a tela menos o que o site ocupa em cima (barra, cabeçalho do jogo) e embaixo
 * (barra de navegação no celular), com um mínimo para caber tudo. É altura fixa, não mínima: o mar não
 * cresce nem encolhe com o que está dentro dele. No computador, sem passar de 820 px.
 */
const STAGE =
  "h-[max(560px,calc(100dvh-14rem))] sm:h-[max(600px,calc(100dvh-15.5rem))] lg:h-[min(820px,max(600px,calc(100dvh-10.5rem)))]";

/**
 * O relógio de cada categoria fica guardado no navegador: recarregar a página não devolve o ar.
 * Sem armazenamento (aba anônima), o relógio só começa de novo.
 */
const clockKey = (play: PlayView, index: number) =>
  `incomum-relogio:${play.practice ? "treino" : "dia"}:${play.dateKey}:${index}`;

function clockStart(key: string): number {
  try {
    const saved = Number(localStorage.getItem(key));
    if (saved > 0) return saved;
    const now = Date.now();
    localStorage.setItem(key, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

/** O relógio da categoria já começou (a pessoa recarregou a página no meio da partida)? */
function clockStarted(key: string): boolean {
  try {
    return Number(localStorage.getItem(key)) > 0;
  } catch {
    return false;
  }
}

function clearClock(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Sem armazenamento, não há o que limpar.
  }
}

const meters = (depth: number) => `${Math.round(depth).toLocaleString("pt-BR")} m`;

export function IncomumBoard({ play, submitGuess }: BoardProps<IncomumPuzzle, IncomumFeedback, PointsRules>) {
  const { categories } = play.puzzle;
  const playing = play.status === "playing";
  const current = play.guesses.length;
  const points = pointsOf(play);

  const [typed, setTyped] = useState("");
  /** "Você quis dizer…?": o nome da lista parecido com o que foi digitado; Enter confirma. */
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shaking, setShaking] = useState(false);
  /** Resposta sendo mostrada (o mergulho) antes da próxima categoria; o oxigênio fica parado. */
  const [reveal, setReveal] = useState<number | null>(null);
  /** Relógio da categoria `index`: quando começou e a última batida. */
  const [clock, setClock] = useState<{
    index: number;
    start: number;
    now: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  /**
   * Como no Mundo, a partida só começa no "Começar": até lá o oxigênio não corre e a primeira
   * categoria fica borrada. Quem já respondeu ou já tinha começado (e recarregou) não vê de novo.
   */
  const [started, setStarted] = useState(() => play.guesses.length > 0 || clockStarted(clockKey(play, 0)));
  const timedOut = useRef(-1);
  usePreloadNotes();

  const timing = started && playing && reveal === null && current < categories.length;
  const key = clockKey(play, current);

  // Começa (ou retoma) o relógio da categoria da vez e bate a cada 100 ms.
  useEffect(() => {
    if (!timing) return;
    const tick = () =>
      setClock((c) => ({
        index: current,
        start: c?.index === current ? c.start : clockStart(key),
        now: Date.now(),
      }));
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 100);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [timing, current, key]);

  const running = timing && clock?.index === current;
  const remaining = running ? Math.max(0, SECONDS - (clock.now - clock.start) / 1000) : SECONDS;

  const revealed = reveal !== null ? play.guesses[reveal]?.feedback : undefined;
  // Uma descida só: a profundidade é a dos pontos somados, e o submarino nunca sobe.
  const { depth, arrived } = useDepth(depthAt(points));
  const caught = revealed && arrived ? revealed : undefined;
  // Os bichos que a última resposta alcançou (pode ser mais de um, numa resposta rara).
  const crossed = revealed ? MILESTONES.slice(milestonesAt(points - revealed.points), milestonesAt(points)) : [];
  /** Os pontos que a profundidade do momento representa: a régua acende os bichos conforme passa. */
  const pointsHere = pointsAtDepth(depth);

  async function send(input: string) {
    if (!input.trim() || busy) return;
    const index = current;
    setBusy(true);
    const error = await submitGuess(input);
    setBusy(false);
    const suggested = error && suggestionIn(error);
    setSuggestion(suggested || null);
    if (suggested) {
      // Letra errada não é erro: a sugestão aparece embaixo do campo, sem tremer.
      toast.dismiss("incomum-erro");
      inputRef.current?.focus({ preventScroll: true });
      return;
    }
    if (error) {
      toast(error, { id: "incomum-erro" });
      setShaking(true);
      window.setTimeout(() => setShaking(false), SHAKE_MS);
      inputRef.current?.focus({ preventScroll: true });
      return;
    }
    clearClock(clockKey(play, index));
    setTyped("");
    setSuggestion(null);
    setReveal(index);
  }

  // Acabou o oxigênio: a categoria vale 0 (uma vez só por categoria).
  const onTimeUp = useEffectEvent(() => {
    if (timedOut.current === current) return;
    timedOut.current = current;
    void send(TIMEOUT);
  });
  useEffect(() => {
    if (running && remaining <= 0 && !busy) onTimeUp();
  }, [running, remaining, busy]);

  function next() {
    setReveal(null);
  }

  useEffect(() => {
    if (!started) startRef.current?.focus({ preventScroll: true });
  }, [started]);

  // Foco sem rolar a página: no campo quando a categoria começa, no "Próximo" quando o mergulho acaba.
  useEffect(() => {
    if (timing) inputRef.current?.focus({ preventScroll: true });
  }, [timing, current]);
  useEffect(() => {
    if (caught) nextRef.current?.focus({ preventScroll: true });
  }, [caught]);

  // Com o mergulho terminado, Enter vai para a próxima categoria (ou para a coleção, no último).
  const onEnter = useEffectEvent(next);
  useEffect(() => {
    if (!caught) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Enter" || e.repeat) return;
      e.preventDefault();
      onEnter();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [caught]);

  // O último mergulho ainda aparece; a coleção vem quando a pessoa sai dele.
  if (!playing && reveal === null) return <Collection play={play} />;

  const shown = reveal ?? current;
  const category = categories[Math.min(shown, categories.length - 1)];
  const hurry = remaining <= HURRY;

  return (
    // Altura fixa do começo ao fim: cada coisa tem lugar marcado no mar (título em cima, submarino no
    // meio, resposta embaixo) e nada empurra nada entre a pergunta e o mergulho.
    <div className={cn("flex flex-col gap-3", STAGE)}>
      <Ocean
        depth={depth}
        diving={Boolean(revealed) && !arrived}
        // O card brilha na cor da raridade da resposta (vermelho quando o oxigênio acabou).
        glow={
          revealed
            ? revealed.missed
              ? { color: revealed.missed === "time" ? "#ef4444" : "#64748b", strength: 0 }
              : { color: TIERS[revealed.tier].color, strength: revealed.tier }
            : null
        }
        className="min-h-0 flex-1"
      >
        {/*
          Quatro faixas de altura fixa, as mesmas na pergunta e no mergulho: placar, título, o mar
          (submarino e bicho, do tamanho que couber) e a resposta. Nada invade a faixa do outro.
        */}
        <div className="absolute inset-0 z-10 flex flex-col px-4 pt-8 pb-5 sm:px-7 sm:pt-9 sm:pb-7">
          <div className="flex h-7 shrink-0 items-center justify-between gap-3">
            <Progress guesses={play.guesses.map((g) => g.feedback)} total={categories.length} current={current} />
            <span key={points} className="animate-pop font-display text-2xl tabular-nums drop-shadow-sm">
              {points}
              <span className="ml-1 font-sans text-sm font-bold opacity-80">pts</span>
            </span>
          </div>

          <div
            key={`titulo-${shown}`}
            className="mt-4 h-[7.5rem] shrink-0 animate-rise pr-12 [container-type:inline-size] sm:h-[9.5rem] sm:pr-44"
          >
            <p className="font-mono text-xs font-bold tracking-[0.16em] uppercase opacity-80">
              Mergulho {shown + 1} de {categories.length}
            </p>
            <h2
              className={cn(
                "mt-2 font-display text-balance uppercase drop-shadow-[0_3px_0_rgb(0_0_0/0.25)]",
                // Medido pela largura da faixa (cqw), não da tela: no máximo 3 linhas em qualquer tamanho.
                // Título longo ("Filme policial ou de crime com 100 mil+ avaliações no IMDb") usa letra menor.
                category.title.length <= 24
                  ? revealed
                    ? "text-[clamp(18px,6cqw,30px)]"
                    : "text-[clamp(22px,9cqw,44px)]"
                  : category.title.length <= 40
                    ? revealed
                      ? "text-[clamp(16px,4.6cqw,26px)]"
                      : "text-[clamp(18px,6.2cqw,36px)]"
                    : revealed
                      ? "text-[clamp(15px,3.8cqw,22px)]"
                      : "text-[clamp(16px,5.4cqw,30px)]",
                // Depois do tamanho: o cn tira a entrelinha que vem antes de uma classe text-*.
                "leading-[1.1]",
              )}
            >
              {category.title}
            </h2>
            {!revealed && (
              <p className="mt-2 text-sm opacity-85 sm:text-base">
                {category.total.toLocaleString("pt-BR")} respostas valem.{" "}
                <span className="hidden sm:inline">Quanto menos óbvia, mais fundo.</span>
              </p>
            )}
          </div>

          {/* O fundo do mar: o submarino, o farol e o bicho achado, medidos pela altura da faixa. */}
          <div className="relative min-h-0 flex-1 [container-type:size]">
            <div className="absolute top-1/2 left-0 w-[min(clamp(116px,26vw,200px),calc((100cqh-2.75rem)*1.6))] -translate-y-1/2 sm:left-[2%]">
              {/* Só o submarino inclina o nariz para baixo no mergulho; a profundidade fica reta. */}
              <div
                className="relative"
                style={{
                  // Sempre de nariz para baixo; mais inclinado quando desce de verdade.
                  rotate: revealed && !arrived && revealed.points > 0 ? "14deg" : "5deg",
                  transition: "rotate 500ms ease",
                }}
              >
                {/* Farol: um cone de luz que só aparece no escuro. */}
                <span
                  className="pointer-events-none absolute top-[52%] left-[88%] h-[120px] w-[260px] -translate-y-1/2"
                  style={{
                    opacity: Math.min(1, Math.max(0, (depth - 1200) / 2500)) * 0.85,
                    clipPath: "polygon(0 42%, 100% 0, 100% 100%, 0 58%)",
                    background: "linear-gradient(90deg, rgb(254 249 195 / 0.9), rgb(254 249 195 / 0))",
                  }}
                  aria-hidden="true"
                />
                <div className="animate-bob">
                  <Submarine className="w-full drop-shadow-[0_8px_0_rgb(0_0_0/0.2)]" lamp={depth / 3000} />
                </div>
              </div>
              <p className="mt-1 text-center font-mono text-sm leading-tight font-bold tabular-nums sm:text-base">
                {depth < 1 ? "0 m" : `−${meters(depth)}`}
                {/* Chegando, quem fala é o carimbo. */}
                {!caught && (
                  <span className="block text-[11px] font-bold tracking-wider whitespace-nowrap uppercase opacity-75">
                    {ZONES[zoneAt(depth)].name}
                  </span>
                )}
              </p>
            </div>

            {revealed && <Emblem key={`raridade-${reveal}`} feedback={revealed} />}
          </div>

          {/*
            Embaixo: o próximo bicho e quanto falta, enquanto a pessoa pensa; a resposta e o bicho novo,
            depois. Altura reservada desde o começo, para o mar não mudar de tamanho.
          */}
          <div className="flex h-[8.5rem] shrink-0 items-end pr-6 [container-type:inline-size] sm:h-[7rem] sm:pr-40">
            {revealed ? (
              <Answer
                key={`resposta-${reveal}`}
                feedback={revealed}
                found={crossed}
                points={points}
                arrived={arrived}
              />
            ) : (
              <QuestionBar key={`tempo-${current}`} remaining={remaining} hurry={hurry} points={points} />
            )}
          </div>
        </div>

        {/* Rara e raríssima: chuva de confete pelo card todo. */}
        {revealed && !revealed.missed && PARTY[revealed.tier].confetti > 0 && (
          <Confetti
            key={`confete-${reveal}`}
            count={PARTY[revealed.tier].confetti}
            colors={[TIERS[revealed.tier].color, "#ffffff", revealed.tier === 4 ? "#fde68a" : "#f0abfc", "#67e8f9"]}
          />
        )}

        <TrenchRuler points={pointsHere} className="absolute top-44 right-3 bottom-6 z-10 w-6 sm:right-6 sm:w-36" />

        {!started && playing && (
          <div className="absolute inset-0 z-30 grid place-items-center bg-black/35 px-6 text-center backdrop-blur-xl">
            <div>
              <p className="font-display text-3xl">
                {categories.length} categorias · {SECONDS} s cada
              </p>
              <p className="mt-2 text-sm opacity-85">O oxigênio começa a contar quando você clicar.</p>
              <button
                ref={startRef}
                type="button"
                onClick={() => setStarted(true)}
                className="mt-5 inline-flex h-12 items-center gap-2 rounded-md px-6 font-semibold text-white outline-offset-2 transition-[filter,transform] hover:brightness-110 focus-visible:outline-2 active:scale-[0.98]"
                // Contorno de foco na cor do jogo, um pouco mais clara para aparecer no fundo escuro.
                style={{ background: COLOR, outlineColor: `color-mix(in oklab, ${COLOR} 60%, white)` }}
              >
                <Play size={18} className="fill-current" /> Começar
              </button>
            </div>
          </div>
        )}
      </Ocean>

      <div className="flex flex-col gap-1">
        {revealed ? (
          <>
            <button
              ref={nextRef}
              type="button"
              onClick={next}
              disabled={!arrived}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl text-base font-bold text-white transition disabled:opacity-60 active:scale-[0.98]"
              style={{ background: COLOR }}
            >
              {arrived ? (
                <>
                  {playing ? "Continuar descendo" : "Ver minha coleção"} <ArrowDown size={18} />
                </>
              ) : (
                "Descendo…"
              )}
            </button>
            <p className="flex h-10 items-center justify-center text-xs text-muted-foreground">
              {arrived ? "ou aperte Enter" : ""}
            </p>
          </>
        ) : (
          <>
            <form
              className={cn("flex gap-2", shaking && "animate-shake")}
              onSubmit={(e) => {
                e.preventDefault();
                send(suggestion ?? typed);
              }}
            >
              <FocusInput
                ref={inputRef}
                value={typed}
                onChange={(e) => {
                  setTyped(e.target.value);
                  setSuggestion(null);
                }}
                placeholder="A resposta menos óbvia que você souber"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                disabled={!started}
                className="h-14 text-lg"
                style={{ "--focus-color": COLOR } as CSSProperties}
              />
              <button
                type="submit"
                disabled={!typed.trim() || busy || !started}
                className="flex h-14 shrink-0 items-center gap-2 rounded-xl px-4 font-bold text-white transition-opacity disabled:opacity-50 sm:px-6"
                style={{ background: COLOR }}
              >
                {suggestion ? (
                  <>
                    <span>
                      Usar<span className="hidden sm:inline"> sugestão</span>
                    </span>
                    <Check size={20} />
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Mergulhar</span> <ArrowDown size={20} />
                  </>
                )}
              </button>
            </form>
            {/* Altura fixa: a sugestão divide a linha com o "Pular", sem empurrar nada. */}
            <div className={cn("flex h-10 items-center gap-2", suggestion ? "justify-between" : "justify-center")}>
              {suggestion && (
                <p className="min-w-0 animate-rise truncate text-sm font-semibold">
                  Você quis dizer{" "}
                  <button
                    type="button"
                    onClick={() => send(suggestion)}
                    disabled={busy}
                    className="font-bold underline decoration-2 underline-offset-4"
                    // Mais claro que o azul do jogo: o texto fica no fundo da página, que pode ser escuro.
                    style={{ color: `color-mix(in oklab, ${COLOR} 70%, white)` }}
                  >
                    “{suggestion}”
                  </button>
                  ?
                </p>
              )}
              <button
                type="button"
                onClick={() => send(SKIP)}
                disabled={busy || !started}
                className="flex h-10 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
              >
                <SkipForward size={15} /> Pular
                <span className={cn(suggestion && "hidden sm:inline")}>(vale 0)</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Uma bolinha por mergulho: a cor da zona alcançada nas feitas, piscando na da vez. */
function Progress({ guesses, total, current }: { guesses: IncomumFeedback[]; total: number; current: number }) {
  return (
    <ol className="flex gap-1.5" aria-label={`Mergulho ${Math.min(current + 1, total)} de ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const f = guesses[i];
        return (
          <li
            key={i}
            className={cn(
              "h-2.5 w-5 rounded-full border-2 border-white/70 transition-colors sm:w-7",
              !f && "bg-white/15",
              f?.missed && "bg-black/30",
              i === current && !f && "animate-pulse bg-white/60",
            )}
            style={f && !f.missed ? { background: TIERS[f.tier].color } : undefined}
          />
        );
      })}
    </ol>
  );
}

/**
 * A raridade da resposta, no meio do mar, assim que ela vale: a palavra grande na cor dela (Óbvia,
 * Comum, Incomum, Rara, Raríssima), a barrinha de 5 níveis enchendo até ela e os pontos. Cada uma
 * entra do seu jeito, com a sua festa. É o principal da jogada; a resposta e o bicho novo ficam
 * embaixo.
 */
function Emblem({ feedback: f }: { feedback: IncomumFeedback }) {
  const ref = useRef<HTMLDivElement>(null);
  const word = useRef<HTMLSpanElement>(null);
  const meter = useRef<HTMLDivElement>(null);
  const tier = f.missed ? null : TIERS[f.tier];
  const party = f.missed ? null : PARTY[f.tier];
  const shown = useCountUp(f.points, f.tier === 4 ? 1000 : 650);
  useEffect(() => {
    if (ref.current) entrance(ref.current, f.missed ? -1 : f.tier);
    if (!f.missed) cheer(f.tier);
    // Rara e raríssima: o card pulsa (e treme, na raríssima) e a palavra fica batendo como um coração.
    const card = ref.current?.closest<HTMLElement>("[data-ocean]");
    if (card && !f.missed) shakeCard(card, f.tier, TIERS[f.tier].color);
    if (f.tier >= 3 && !f.missed && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      word.current?.animate([{ transform: "scale(1)" }, { transform: `scale(${f.tier === 4 ? 1.1 : 1.06})` }], {
        duration: 520,
        delay: 1000,
        iterations: Infinity,
        direction: "alternate",
        easing: "ease-in-out",
      });
    }
    // Os níveis acendem um por um, até a raridade da resposta.
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      [...(meter.current?.children ?? [])].slice(0, f.missed ? 0 : f.tier + 1).forEach((pip, i) =>
        pip.animate(
          [{ transform: "scale(0.2)", opacity: 0.3 }, { transform: "scale(1.35)" }, { transform: "scale(1)" }],
          {
            duration: 320,
            delay: 180 + i * 110,
            easing: "ease-out",
            fill: "backwards",
          },
        ),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a festa toca uma vez, quando a resposta vale
  }, []);
  return (
    <>
      {party && party.flash > 0 && tier && <Flash color={tier.color} strength={party.flash} />}
      <div className="absolute inset-y-0 right-8 left-[38%] flex flex-col items-center justify-center text-center sm:right-40 sm:left-[34%]">
        <div className="relative">
          {party?.rays && tier && <Rays color={tier.color} />}
          <div ref={ref} className="relative">
            <span
              ref={word}
              className={cn(
                "block font-display whitespace-nowrap uppercase drop-shadow-[0_4px_0_rgb(0_0_0/0.4)]",
                "text-[clamp(20px,min(20cqh,7cqw),56px)]",
                "leading-none",
                f.tier === 4 && !f.missed && "shimmer-text",
                f.missed && "opacity-75",
              )}
              style={tier && f.tier < 4 ? { color: tier.color } : undefined}
            >
              {tier ? tier.name : f.missed === "time" ? "Sem ar" : "Pulou"}
            </span>
          </div>
          {party &&
            tier &&
            Array.from({ length: party.waves }, (_, wave) => (
              <Burst key={wave} count={party.burst} color={tier.color} kind={party.kind} delay={wave * 420} />
            ))}
        </div>
        <div ref={meter} className="mt-[clamp(6px,4cqh,14px)] flex gap-1.5" aria-hidden="true">
          {TIERS.map((t, i) => (
            <span
              key={t.name}
              className="h-[clamp(8px,5cqh,14px)] w-[clamp(16px,9cqh,32px)] rounded-full border-2 border-white/70"
              style={tier && i <= f.tier ? { background: tier.color, borderColor: tier.color } : undefined}
            />
          ))}
        </div>
        <span
          className={cn(
            "mt-[clamp(4px,3cqh,10px)] font-display tabular-nums drop-shadow-[0_4px_0_rgb(0_0_0/0.3)]",
            "text-[clamp(22px,min(20cqh,9cqw),64px)]",
            "leading-none",
            f.missed && "opacity-70",
          )}
        >
          +{shown}
        </span>
      </div>
    </>
  );
}

/**
 * Enquanto a pessoa pensa: o oxigênio (o tempo), grande e numa barra que esvazia, vermelha e pulsando
 * nos últimos segundos; à direita, quantos pontos faltam para o próximo bicho.
 */
function QuestionBar({ remaining, hurry, points }: { remaining: number; hurry: boolean; points: number }) {
  const next = MILESTONES[milestonesAt(points)];
  const seconds = Math.ceil(remaining);
  return (
    <div className="flex w-full animate-rise items-end gap-4">
      <div className="min-w-0 flex-1" role="timer" aria-label={`${seconds} segundos de oxigênio`}>
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "font-display text-[clamp(30px,9cqw,48px)] leading-none tabular-nums drop-shadow-[0_3px_0_rgb(0_0_0/0.3)]",
              hurry && "animate-pulse text-[#ff6b6b]",
            )}
          >
            {seconds}s
          </span>
          <span className="font-mono text-[11px] font-bold tracking-wider uppercase opacity-75">de oxigênio</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/30">
          <div
            className="h-full rounded-full transition-[width] duration-100 ease-linear"
            style={{ width: `${(remaining / SECONDS) * 100}%`, background: hurry ? "#ff4d4d" : "#fff" }}
          />
        </div>
      </div>
      <span className="shrink-0 text-right text-sm leading-tight opacity-90">
        {next ? "faltam" : "no fundo"}
        {next && <strong className="block font-display text-2xl tabular-nums">{next.points - points} pts</strong>}
      </span>
    </div>
  );
}

/** Quanto falta para o próximo bicho, depois da resposta. */
function nextText(points: number) {
  const next = MILESTONES[milestonesAt(points)];
  return next ? `Próximo bicho em ${next.points - points} pts: ${next.name}.` : "";
}

/**
 * Embaixo, depois da resposta: o que a pessoa disse, a mais óbvia e, quando o submarino chega, os
 * bichos novos da coleção (ou quanto falta para o próximo).
 */
function Answer({
  feedback: f,
  found,
  points,
  arrived,
}: {
  feedback: IncomumFeedback;
  found: Milestone[];
  points: number;
  arrived: boolean;
}) {
  const length = f.answer?.length ?? 0;
  return (
    <div className="w-full animate-rise">
      <p
        className={cn(
          "line-clamp-2 font-display break-words",
          length <= 12
            ? "text-[clamp(22px,4.4vw,36px)]"
            : length <= 22
              ? "text-[clamp(19px,3.4vw,30px)]"
              : "text-[clamp(17px,2.8vw,24px)]",
          "leading-[1.05]",
          f.missed && "opacity-80",
        )}
      >
        {f.answer ?? (f.missed === "time" ? "Acabou o oxigênio" : "Pulou a categoria")}
      </p>
      <p className="mt-1 line-clamp-1 text-sm opacity-85">
        {f.rank === 1 ? "Essa é a mais óbvia de todas." : `A mais óbvia era ${f.obvious}.`}
      </p>
      <div className="mt-1.5 h-7">
        {arrived &&
          (found.length ? (
            <p className="flex animate-pop items-center gap-1.5 overflow-hidden text-sm font-bold whitespace-nowrap">
              <span className="sm:hidden">Novo:</span>
              <span className="hidden sm:inline">Novo na coleção:</span>
              {found.map((m) => (
                <span
                  key={m.name}
                  className="inline-flex items-center gap-1 rounded-full bg-white/90 py-0.5 pr-2.5 pl-1 text-xs text-slate-900"
                >
                  <Creature art={m.art} className="h-4 w-5" />
                  {m.name}
                </span>
              ))}
            </p>
          ) : (
            <p className="animate-rise text-sm opacity-85">{nextText(points)}</p>
          ))}
      </div>
    </div>
  );
}

/**
 * No fim: a coleção (os bichos da fossa, os alcançados coloridos e os outros em silhueta, com quanto
 * faltou) e as respostas, categoria por categoria, com a óbvia e as que iam mais fundo.
 */
function Collection({ play }: { play: PlayView<IncomumPuzzle, IncomumFeedback> }) {
  const rares = play.answerLabel?.split("\n") ?? [];
  const points = pointsOf(play);
  const reached = milestonesAt(points);
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="font-display text-2xl">Sua coleção</h2>
        <span className="text-sm text-muted-foreground">
          Chegou a −{meters(depthAt(points))} · {reached} de {MILESTONES.length} bichos
        </span>
      </div>
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {MILESTONES.map((m, i) => {
          const got = i < reached;
          const [top, bottom] = waterAt(m.depth);
          return (
            <li
              key={m.name}
              className="relative flex animate-rise flex-col gap-1 overflow-hidden rounded-2xl p-3 text-white"
              style={{
                animationDelay: `${i * 60}ms`,
                background: got
                  ? `linear-gradient(180deg, ${top}, ${bottom})`
                  : "linear-gradient(180deg, #111827, #030712)",
              }}
            >
              <Creature
                art={m.art}
                className={cn(
                  "mx-auto my-1 h-16 w-full",
                  got ? "drop-shadow-[0_4px_0_rgb(0_0_0/0.25)]" : "opacity-20 brightness-0 invert",
                )}
              />
              <strong className="leading-snug">{got ? m.name : "???"}</strong>
              <span className="font-mono text-xs font-bold opacity-80">−{meters(m.depth)}</span>
              <p className="text-xs leading-relaxed opacity-80">
                {got ? m.fact : `Faltaram ${m.points - points} pts.`}
              </p>
            </li>
          );
        })}
      </ol>

      <div>
        <h3 className="font-display text-xl">Suas respostas</h3>
        <ol className="mt-3 divide-y divide-border rounded-2xl border border-border">
          {play.guesses.map(({ feedback: f }, i) => (
            <li key={i} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-muted-foreground">{play.puzzle.categories[i].title}</span>
                <strong className={cn("block text-lg leading-snug", f.missed && "text-muted-foreground")}>
                  {f.answer ?? (f.missed === "time" ? "Acabou o oxigênio" : "Pulou")}
                </strong>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Mais óbvia: {f.obvious}
                  {rares[i] && ` · Mais fundo: ${rares[i]}`}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="font-display text-2xl leading-none tabular-nums">+{f.points}</span>
                {!f.missed && <TierChip tier={f.tier} />}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** A raridade da resposta, na cor dela. */
export function TierChip({ tier }: { tier: number }) {
  return (
    <span
      // As cores das raridades são claras (cinza, verde, ciano, roxo, amarelo): texto escuro.
      className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold text-slate-950"
      style={{ background: TIERS[tier].color }}
    >
      {TIERS[tier].name}
    </span>
  );
}
