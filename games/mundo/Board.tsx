"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Flag, Play, Volume2, VolumeX } from "lucide-react";
import { playSound, preloadSound } from "@/components/sounds/react-bits-sound";
import tink from "@/components/sounds/tink";
import { FocusInput } from "@/components/microkit/focus-input";
import { normalize } from "@/lib/normalize";
import { trackEvent } from "@/lib/analytics";
import { setMuted, useMuted } from "@/lib/sound";
import { cn } from "@/lib/utils";
import type { BoardProps, TimedRules } from "../types";
import { countries, findCountry, nameKey, readPrefix, type Country } from "../_shared/geo";
import { MapControls } from "../_shared/geo/MapControls";
import { usePanZoom } from "../_shared/geo/usePanZoom";
import { countriesByContinent } from "./continents";
import map from "../_shared/geo/world-map.json";
import type { MundoFeedback, MundoPuzzle } from "./types";

const COLOR = "#ffc21a";
const paths: Record<string, string> = map.paths;
const dots: Record<string, number[]> = map.dots;
const WORLD = { width: map.width, height: map.height };
const WHOLE_MAP = { x: 0, y: 0, w: map.width, h: map.height };

/** Segundos restantes, atualizado 4× por segundo enquanto o relógio corre. */
function useRemaining(startedAt: string | undefined, seconds: number, running: boolean): number {
  return useSyncExternalStore(
    (onChange) => {
      if (!running) return () => {};
      const timer = window.setInterval(onChange, 250);
      return () => window.clearInterval(timer);
    },
    () => (startedAt ? Math.max(0, Math.ceil(seconds - (Date.now() - Date.parse(startedAt)) / 1000)) : seconds),
    () => seconds,
  );
}

const formatClock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function MundoBoard({
  play,
  rules,
  submitGuess,
  begin,
  finish,
}: BoardProps<MundoPuzzle, MundoFeedback, TimedRules>) {
  const [query, setQuery] = useState("");
  const [autocompleteEnabled, setAutocompleteEnabled] = useState(true);
  const [hint, setHint] = useState<string | null>(null);
  const [lastFound, setLastFound] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** País aceito pelo começo do nome: o resto que a pessoa continuar digitando é engolido. */
  const tail = useRef<{ names: string[]; typed: string } | null>(null);
  const started = Boolean(play.startedAt);
  const running = started && play.status === "playing";
  const finished = play.status !== "playing";
  const remaining = useRemaining(play.startedAt, rules.seconds, running);

  const muted = useMuted();
  const found = useMemo(() => new Set(play.guesses.map((g) => g.feedback.code)), [play.guesses]);
  const left = useMemo(() => countries.filter((c) => !found.has(c.code)), [found]);

  // O relógio zerou: encerra a partida.
  useEffect(() => {
    if (running && remaining === 0) finish();
  }, [running, remaining, finish]);

  useEffect(() => {
    if (running) inputRef.current?.focus();
  }, [running]);

  // O "tink" é sintetizado na primeira vez: prepara antes do primeiro acerto para não atrasar.
  useEffect(() => {
    preloadSound(tink);
  }, []);

  async function accept(country: Country, typed: string) {
    const error = await submitGuess(country.name);
    if (error) {
      setHint(error);
      return;
    }
    tail.current = autocompleteEnabled
      ? { names: [country.name, ...country.aliases].map(nameKey), typed }
      : null;
    playSound(tink).catch(() => {});
    setQuery("");
    setHint(null);
    setLastFound(country.code);
  }

  function onType(value: string) {
    // "bra" já virou Brasil: o "sil" que vem em seguida é o resto do nome, não um chute novo.
    if (autocompleteEnabled && tail.current) {
      // Guarda o texto cru: o espaço de "Nova Zelândia" não pode se perder entre uma tecla e outra.
      const typed = tail.current.typed + value;
      if (value && tail.current.names.some((n) => n.startsWith(nameKey(typed)))) {
        tail.current.typed = typed;
        setQuery("");
        return;
      }
      tail.current = null;
    }
    setQuery(value);
    setHint(null);
    // Aceita assim que o texto só pode ser um país que ainda falta, sem precisar de Enter.
    const { match, exact, open } = readPrefix(value, left);
    const country = findCountry(value, { byCode: false });
    // Sem autocompletar, só aceita o nome ou apelido inteiro, nunca apenas um prefixo.
    if (match && (autocompleteEnabled || match.code === country?.code)) {
      accept(match, value);
      return;
    }
    if (exact) {
      setHint(`Enter para ${exact.name}, ou continue digitando`);
      return;
    }
    if (country && found.has(country.code)) {
      setHint(`${country.name} já está na lista`);
      // Repetido e não é começo de nenhum outro: limpa para o próximo nome não grudar.
      if (!open) setQuery("");
    }
  }

  function onEnter() {
    const { match, exact } = autocompleteEnabled
      ? readPrefix(query, left)
      : { match: findCountry(query, { byCode: false }), exact: undefined };
    const country = match ?? exact;
    if (country) accept(country, query);
    else if (normalize(query)) setHint("Esse não está na lista");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Depois do fim, a faixa de resultado da plataforma já mostra o placar. */}
      {!finished && (
        <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center gap-3 bg-background/95 px-1 py-3 backdrop-blur">
          <div className="flex min-w-0 flex-1 basis-80 items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={autocompleteEnabled}
              aria-label="Autocompletar países"
              title={autocompleteEnabled ? "Desligar autocompletar: enviar apenas nomes completos" : "Ligar autocompletar"}
              onClick={() => {
                setAutocompleteEnabled((enabled) => !enabled);
                tail.current = null;
                setHint(null);
                if (running) inputRef.current?.focus();
              }}
              className="flex h-14 shrink-0 flex-col items-center justify-center gap-1 rounded-md px-1 text-[10px] font-medium text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span>Autocompletar</span>
              <span
                aria-hidden="true"
                className={cn(
                  "relative h-7 w-14 rounded-full border transition-colors",
                  autocompleteEnabled ? "border-transparent text-ink" : "border-input bg-secondary text-muted-foreground",
                )}
                style={autocompleteEnabled ? { background: COLOR } : undefined}
              >
                <span className={cn("absolute top-1/2 -translate-y-1/2 text-[10px] font-bold", autocompleteEnabled ? "left-1.5" : "right-1.5")}>
                  {autocompleteEnabled ? "ON" : "OFF"}
                </span>
                <span className={cn("absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none", autocompleteEnabled && "translate-x-7")} />
              </span>
            </button>
            <div className="relative min-w-0 flex-1">
              <FocusInput
                ref={inputRef}
                value={query}
                disabled={!running}
                placeholder={running ? (autocompleteEnabled ? "Digite um país" : "Nome completo do país") : "Clique em começar"}
                aria-label="Nome do país"
                autoComplete="off"
                spellCheck={false}
                className="h-14 rounded-md text-[17px]"
                onChange={(e) => onType(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onEnter()}
              />
              {hint && <p className="absolute left-1 top-full mt-1 text-xs text-muted-foreground">{hint}</p>}
            </div>
          </div>
          <div className="flex items-center gap-5">
            <Readout label="Países" value={`${found.size}/${rules.total}`} />
            <Readout
              label="Tempo"
              value={formatClock(remaining)}
              className={cn(running && remaining <= 60 && "text-destructive")}
            />
            <button
              type="button"
              onClick={() => {
                setMuted(!muted);
                trackEvent("sound_toggled", { muted: !muted });
              }}
              aria-label={muted ? "Ligar som" : "Silenciar"}
              aria-pressed={muted}
              title={muted ? "Ligar som" : "Silenciar"}
              className="grid size-10 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            {running && (
              <button
                type="button"
                onClick={() => finish()}
                className="flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Flag size={15} /> Desistir
              </button>
            )}
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-lg bg-card p-3 sm:p-5">
        <WorldMap found={found} finished={finished} lastFound={lastFound} />
        {!started && !finished && (
          <div className="absolute inset-0 grid place-items-center bg-card/70 backdrop-blur-[2px]">
            <div className="text-center">
              <p className="font-display text-3xl">
                {rules.total} países · {rules.seconds / 60} min
              </p>
              <p className="mt-2 text-sm text-muted-foreground">O relógio começa quando você clicar.</p>
              <button
                type="button"
                onClick={() => begin()}
                className="mt-5 inline-flex h-12 items-center gap-2 rounded-md px-6 font-semibold text-ink transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"
                style={{ background: COLOR }}
              >
                <Play size={18} className="fill-current" /> Começar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {countriesByContinent.map((continent) => {
          const count = continent.countries.filter((c) => found.has(c.code)).length;
          return (
            <section key={continent.id}>
              <header className="mb-2 flex items-baseline justify-between border-b border-border pb-2">
                <h3 className="font-display text-base">{continent.name}</h3>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {count}/{continent.countries.length}
                </span>
              </header>
              <ol className="grid grid-cols-2 gap-x-3 text-[13px] leading-6">
                {continent.countries.map((c) => {
                  const ok = found.has(c.code);
                  return (
                    <li
                      key={c.code}
                      className={cn(
                        "truncate",
                        ok && "font-medium text-foreground",
                        !ok && finished && "text-destructive/80",
                        c.code === lastFound && "animate-rise",
                      )}
                    >
                      {ok || finished ? c.name : <span className="inline-block h-1.5 w-16 rounded-full bg-secondary align-middle" />}
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Readout({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="text-right">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("font-mono text-2xl font-semibold tabular-nums leading-tight", className)}>{value}</p>
    </div>
  );
}

function WorldMap({ found, finished, lastFound }: { found: Set<string>; finished: boolean; lastFound: string | null }) {
  const { svgRef, viewBox, zoom, canPan, handlers, zoomIn, zoomOut, reset } = usePanZoom(WHOLE_MAP, WORLD);
  const fill = (code: string) =>
    found.has(code) ? COLOR : finished ? "color-mix(in oklab, var(--destructive) 45%, var(--secondary))" : "var(--secondary)";
  return (
    <>
      <svg
        ref={svgRef}
        viewBox={viewBox}
        className={cn("w-full touch-none select-none", canPan && "cursor-grab active:cursor-grabbing")}
        style={{ aspectRatio: `${map.width} / ${map.height}` }}
        role="img"
        aria-label="Mapa-múndi"
        {...handlers}
      >
        <path d={map.background} fill="var(--secondary)" opacity={0.5} />
        {Object.entries(paths).map(([code, d]) => (
          <path
            key={code}
            d={d}
            fill={fill(code)}
            stroke="var(--card)"
            strokeWidth={0.6}
            vectorEffect="non-scaling-stroke"
            className={cn("transition-[fill] duration-500", code === lastFound && "animate-pop [transform-box:fill-box] [transform-origin:center]")}
          />
        ))}
        {/* Os países minúsculos continuam do mesmo tamanho na tela com qualquer zoom. */}
        {Object.entries(dots).map(([code, [x, y]]) => (
          <circle
            key={code}
            cx={x}
            cy={y}
            r={3.2 / zoom}
            fill={found.has(code) || finished ? fill(code) : "var(--input)"}
            stroke="var(--card)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <MapControls zoomIn={zoomIn} zoomOut={zoomOut} reset={reset} />
    </>
  );
}
