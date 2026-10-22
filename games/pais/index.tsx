import { Earth } from "lucide-react";
import type { AttemptRules, BoardProps, GameDefinition } from "../types";
import { CountryBoard } from "../_shared/geo/CountryBoard";
import { CountryRecap } from "../_shared/geo/CountryRecap";
import { proximityEmoji } from "../_shared/geo";
import type { CountryFeedback } from "../_shared/geo/types";
import type { PaisPuzzle } from "./types";
import { PaisCover } from "./Cover";

const COLOR = "#19b46e";

function PaisBoard(props: BoardProps<PaisPuzzle, CountryFeedback, AttemptRules>) {
  return (
    <CountryBoard
      {...props}
      visual={
        <svg viewBox="0 0 100 100" className="aspect-square w-full max-w-[280px]" role="img" aria-label="Silhueta do país do dia">
          <path d={props.play.puzzle.path} className="fill-foreground" />
        </svg>
      }
    />
  );
}

export const pais: GameDefinition<PaisPuzzle, CountryFeedback, AttemptRules> = {
  meta: {
    slug: "pais",
    name: "País",
    tagline: "Que contorno é esse?",
    description: "Descubra o país pela silhueta em até 6 tentativas.",
    icon: Earth,
    rules: { type: "attempts", maxAttempts: 6 },
    color: COLOR,
    howToPlay: [
      "Descubra qual é o país pela silhueta em até 6 tentativas.",
      "Digite um país e escolha na lista.",
      "A cada erro você vê a distância até o país certo, a direção para onde ele fica e quão perto chegou.",
      "Países muito pequenos podem ser chutados, mas nunca são a resposta.",
    ],
    seo: {
      title: "País do dia: adivinhe o país pelo contorno do mapa",
      description:
        "Descubra o país pela silhueta em até 6 tentativas, com dicas de distância e direção. Jogo diário de geografia em português, no estilo do Worldle.",
    },
  },
  Board: PaisBoard,
  Cover: PaisCover,
  Recap: ({ play }) => <CountryRecap play={play} color={COLOR} />,
  shareGrid: (play) => play.guesses.map((g) => proximityEmoji(g.feedback)).join("\n"),
};
