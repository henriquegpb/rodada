import { Puzzle } from "lucide-react";
import type { AttemptRules, GameDefinition } from "../types";
import { proximityEmoji } from "../_shared/geo";
import { CountryRecap } from "../_shared/geo/CountryRecap";
import type { CountryFeedback } from "../_shared/geo/types";
import { MosaicoBoard } from "./Board";
import { MosaicoCover } from "./Cover";
import type { MosaicoPuzzle } from "./types";

const COLOR = "#a879ff";

export const mosaico: GameDefinition<MosaicoPuzzle, CountryFeedback, AttemptRules> = {
  meta: {
    slug: "mosaico",
    name: "Mosaico",
    tagline: "A bandeira aparece aos poucos",
    description: "Descubra o país pela bandeira, que se revela uma peça a cada erro.",
    icon: Puzzle,
    rules: { type: "attempts", maxAttempts: 6 },
    color: COLOR,
    howToPlay: [
      "A bandeira do dia está escondida em 6 peças, e só uma começa à mostra.",
      "Cada chute errado vira mais uma peça.",
      "A cada erro você vê a distância até o país certo, a direção e quão perto chegou.",
      "Acerte em até 6 tentativas.",
    ],
  },
  Board: MosaicoBoard,
  Cover: MosaicoCover,
  Recap: ({ play }) => <CountryRecap play={play} color={COLOR} />,
  shareGrid: (play) => play.guesses.map((g) => proximityEmoji(g.feedback)).join("\n"),
};
