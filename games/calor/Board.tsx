"use client";

import { useMemo } from "react";
import { Flag } from "lucide-react";
import type { BoardProps, UnlimitedRules } from "../types";
import { formatDistance } from "../_shared/geo";
import { CountryInput } from "../_shared/geo/CountryInput";
import { Globe } from "./Globe";
import { ANSWER_COLOR, heatColor } from "./heat";
import type { CalorFeedback, CalorPuzzle } from "./types";

export default function CalorBoard({ play, submitGuess, finish }: BoardProps<CalorPuzzle, CalorFeedback, UnlimitedRules>) {
  const playing = play.status === "playing";
  const won = play.status === "won";
  const guesses = play.guesses.map((g) => g.feedback);
  const last = guesses.at(-1);

  const colors = useMemo(() => {
    const map = new Map(guesses.map((g) => [g.code, heatColor(g.km)]));
    if (won && last) map.set(last.code, ANSWER_COLOR);
    return map;
  }, [guesses, won, last]);
  const exclude = useMemo(() => new Set(guesses.map((g) => g.code)), [guesses]);
  const sorted = [...guesses].sort((a, b) => a.km - b.km);
  const closest = sorted[0];

  /** "Mais quente" se o último chute chegou mais perto que todos os anteriores. */
  const trend = useMemo(() => {
    if (!last || guesses.length < 2 || won) return null;
    const before = Math.min(...guesses.slice(0, -1).map((g) => g.km));
    return last.km < before ? "warmer" : last.km > before ? "colder" : "same";
  }, [guesses, last, won]);

  return (
    <div className="flex flex-col gap-5">
      {playing && <CountryInput onGuess={submitGuess} exclude={exclude} />}

      <p className="min-h-6 text-center text-[15px]" aria-live="polite">
        {!last ? (
          <span className="text-muted-foreground">Chute um país. Quanto mais quente a cor, mais perto você está.</span>
        ) : won ? (
          <strong style={{ color: ANSWER_COLOR }}>Achou: {last.name}!</strong>
        ) : (
          <>
            <strong style={{ color: heatColor(last.km) }}>{last.name}</strong>
            <span className="text-muted-foreground">
              {last.km === 0
                ? " faz fronteira com o país secreto"
                : trend === "warmer"
                  ? " está mais quente"
                  : trend === "colder"
                    ? " está mais frio"
                    : ` está a ${formatDistance(last.km)}`}
            </span>
          </>
        )}
      </p>

      <div className="mx-auto w-full max-w-[520px]">
        <Globe colors={colors} focus={last?.code ?? null} />
      </div>

      {guesses.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h3 className="text-sm font-medium text-muted-foreground">Mais perto · {guesses.length} chutes</h3>
            {closest && !won && (
              <span className="text-sm text-muted-foreground">
                Fronteira mais próxima:{" "}
                <strong className="font-semibold tabular-nums text-foreground">{formatDistance(closest.km)}</strong>
              </span>
            )}
          </div>
          <ul className="flex flex-wrap gap-2">
            {sorted.map((g) => (
              <li
                key={g.code}
                className="flex items-center gap-2 rounded-full bg-secondary py-1.5 pl-2.5 pr-3.5 text-sm font-medium"
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: won && g.code === last?.code ? ANSWER_COLOR : heatColor(g.km) }}
                />
                {g.name}
                <span className="text-xs tabular-nums text-muted-foreground">{formatDistance(g.km)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {playing && guesses.length > 0 && (
        <button
          type="button"
          onClick={() => finish()}
          className="mx-auto flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Flag size={15} /> Desistir e ver a resposta
        </button>
      )}
    </div>
  );
}
