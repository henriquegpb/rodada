"use client";

import { useCallback } from "react";
import type { BoardProps, PlayView, QuizRules } from "../types";
import { nameKey } from "../_shared/geo";
import { Flag, QuizAnswers, QuizBoard } from "../_shared/geo/QuizBoard";
import type { Suggestion } from "../_shared/SuggestInput";
import type { CapitalFeedback, CapitalPuzzle, City } from "./types";

/** Sugere pelo nome ou pela grafia que a pessoa está digitando ("Beij" mostra "Beijing"). */
function searchCities(cities: City[], query: string): Suggestion[] {
  const q = nameKey(query);
  if (!q) return [];
  const starts: Suggestion[] = [];
  const contains: Suggestion[] = [];
  for (const city of cities) {
    const names = [city.name, ...city.aliases];
    const start = names.find((n) => nameKey(n).startsWith(q));
    if (start) starts.push({ key: city.name, name: start });
    else {
      const inside = names.find((n) => nameKey(n).includes(q));
      if (inside) contains.push({ key: city.name, name: inside });
    }
  }
  return [...starts, ...contains].slice(0, 7);
}

export function CapitalBoard({ play, rules, submitGuess }: BoardProps<CapitalPuzzle, CapitalFeedback, QuizRules>) {
  const { questions, cities } = play.puzzle;
  const search = useCallback((query: string) => searchCities(cities, query), [cities]);

  return (
    <QuizBoard
      play={play}
      rules={rules}
      submitGuess={submitGuess}
      questions={questions}
      search={search}
      placeholder="Digite a capital"
      typeLabel="Digitar a capital"
      modeKey="rodada:capital:modo"
      answers={<Answers play={play} />}
      card={(current, i) => (
        <>
          <div className="flex w-full items-center justify-center gap-6 sm:gap-10">
            <svg
              viewBox="0 0 100 100"
              className="aspect-square w-full max-w-[120px] sm:max-w-[170px]"
              role="img"
              aria-label={`Silhueta de ${current.country}`}
            >
              <path d={current.path} className="fill-foreground" />
            </svg>
            <Flag code={current.code} className="w-full max-w-[120px] sm:max-w-[170px]" alt={`Bandeira de ${current.country}`} />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {i + 1} de {rules.total} · Qual é a capital?
            </p>
            <h2 className="font-display mt-1 text-3xl leading-tight">{current.country}</h2>
          </div>
        </>
      )}
    />
  );
}

/** Cada país já respondido: a capital certa, o país e, se errou, o que a pessoa disse. */
export function Answers({ play, compact = false }: { play: PlayView<CapitalPuzzle, CapitalFeedback>; compact?: boolean }) {
  const { questions } = play.puzzle;
  return (
    <QuizAnswers
      play={play}
      compact={compact}
      said={(g) => g.city}
      title={(g, i) => (
        <>
          <span className="font-semibold">{g.answer}</span>
          <span className="text-muted-foreground"> · {questions[i]?.country}</span>
        </>
      )}
    />
  );
}
