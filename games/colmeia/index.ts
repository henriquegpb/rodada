import { Hexagon } from "lucide-react";
import type { GameDefinition, PointsRules } from "../types";
import { ColmeiaBoard } from "./Board";
import { COLOR } from "./color";
import { ColmeiaCover } from "./Cover";
import { ColmeiaRecap } from "./Recap";
import { RANKS, pointsOf, rankIndex } from "./score";
import type { ColmeiaFeedback, ColmeiaPuzzle } from "./types";

export const colmeia: GameDefinition<ColmeiaPuzzle, ColmeiaFeedback, PointsRules> = {
  meta: {
    slug: "colmeia",
    name: "Colmeia",
    tagline: "7 letras, quantas palavras?",
    description: "Forme palavras com as 7 letras da colmeia, sempre usando a do meio, e suba de nível.",
    icon: Hexagon,
    rules: { type: "points" },
    color: COLOR,
    hideAnswer: true,
    launchedOn: "2026-10-29",
    howToPlay: [
      "Forme palavras de 4 letras ou mais usando só as letras da colmeia. A letra do meio entra em todas.",
      "Pode repetir letra. Acento e cedilha não contam: \"cidada\" vale cidadã. Feminino e verbo conjugado também valem; plural quase não aparece, porque a colmeia nunca tem S.",
      "Palavra de 4 letras vale 1 ponto; maior que isso, 1 por letra. Quem usa as 7 letras faz um pangrama e ganha mais 7.",
      "Os pontos levam de Iniciante a Gênio. Travou? As dicas contam quantas palavras faltam por letra e tamanho.",
      "A lista do dia tem as palavras comuns. Palavra válida menos comum (\"ciano\") também vale pontos, como extra, mas não entra no total.",
      "Não tem erro nem relógio: encerre quando quiser, com os pontos que tiver.",
    ],
    seo: {
      title: "Colmeia: forme palavras com 7 letras (Spelling Bee em português)",
      description:
        "Jogo de palavras diário em português: forme palavras com as 7 letras da colmeia, sempre com a do meio, e chegue a Gênio. No estilo do Spelling Bee.",
    },
  },
  Board: ColmeiaBoard,
  Cover: ColmeiaCover,
  Recap: ColmeiaRecap,
  // O nível e a trilha; o placar ("84 pts") já vai no cabeçalho.
  shareGrid: (play) => {
    const rank = rankIndex(pointsOf(play), play.puzzle.maxPoints);
    const pangrams = play.guesses.filter((g) => g.feedback.pangram).length;
    const trail = RANKS.map((_, i) => (i <= rank ? "🟩" : "⬜")).join("");
    const words = `${play.guesses.length} ${play.guesses.length === 1 ? "palavra" : "palavras"}`;
    return [`🐝 ${RANKS[rank].name}`, trail, pangrams ? `${words} · ⭐ ${pangrams} ${pangrams === 1 ? "pangrama" : "pangramas"}` : words].join("\n");
  },
};
