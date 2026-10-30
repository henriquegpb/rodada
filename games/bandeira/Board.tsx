"use client";

import { useCallback } from "react";
import type { BoardProps, PlayView, QuizRules } from "../types";
import { searchCountries } from "../_shared/geo";
import { QuizAnswers, QuizBoard } from "../_shared/geo/QuizBoard";
import type { BandeiraFeedback, BandeiraPuzzle } from "./types";

export function BandeiraBoard({ play, rules, submitGuess }: BoardProps<BandeiraPuzzle, BandeiraFeedback, QuizRules>) {
  const search = useCallback(
    (query: string) => searchCountries(query, 7).map((c) => ({ key: c.code, name: c.name })),
    [],
  );

  return (
    <QuizBoard
      play={play}
      rules={rules}
      submitGuess={submitGuess}
      questions={play.puzzle.questions}
      search={search}
      placeholder="Digite o país"
      typeLabel="Digitar o país"
      modeKey="rodada:bandeira:modo"
      answers={<Answers play={play} />}
      card={(current, i) => (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG local, sem ganho com next/image */}
          <img
            src={current.image}
            alt={`Bandeira ${i + 1}`}
            className="aspect-[4/3] w-full max-w-[260px] rounded-[4px] object-cover shadow-[0_16px_40px_rgba(0,0,0,.4)] ring-1 ring-black/10 sm:max-w-[300px]"
            draggable={false}
          />
          <p className="text-sm text-muted-foreground">
            {i + 1} de {rules.total} · De que país é essa bandeira?
          </p>
        </>
      )}
    />
  );
}

/** Cada bandeira já respondida: o país certo e, se errou, o que a pessoa disse. */
export function Answers({ play, compact = false }: { play: PlayView<BandeiraPuzzle, BandeiraFeedback>; compact?: boolean }) {
  return (
    <QuizAnswers
      play={play}
      compact={compact}
      said={(g) => g.name}
      title={(g) => <span className="font-semibold">{g.answer}</span>}
    />
  );
}
