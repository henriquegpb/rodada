import type { PlayView } from "../types";
import { COLOR } from "./color";
import { RANKS, pointsOf, rankIndex } from "./score";
import type { ColmeiaFeedback, ColmeiaPuzzle } from "./types";

/** Resumo da Colmeia: o nível alcançado, a trilha dos níveis e o que foi achado. */
export function ColmeiaRecap({ play }: { play: PlayView<ColmeiaPuzzle, ColmeiaFeedback> }) {
  const { totalWords, pangrams } = play.puzzle;
  const rank = rankIndex(pointsOf(play), play.puzzle.maxPoints);
  const words = play.guesses.filter((g) => !g.feedback.extra).length;
  const extras = play.guesses.length - words;
  const foundPangrams = play.guesses.filter((g) => g.feedback.pangram && !g.feedback.extra).length;
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <strong className="text-lg">{RANKS[rank].name}</strong>
      <div className="flex gap-1.5" aria-hidden="true">
        {RANKS.map((r, i) => (
          <span key={r.name} className="h-2 w-6 rounded-full bg-secondary" style={i <= rank ? { background: COLOR } : undefined} />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {words} de {totalWords} palavras{extras > 0 && ` (+${extras} ${extras === 1 ? "extra" : "extras"})`} · {foundPangrams} de{" "}
        {pangrams} {pangrams === 1 ? "pangrama" : "pangramas"}
      </p>
    </div>
  );
}
