import { lazy } from "react";
import { Route } from "lucide-react";
import type { AttemptRules, GameDefinition } from "../types";
import { RotaCover } from "./Cover";
import { RotaRecap } from "./Recap";
import { START_COLOR } from "./colors";
import type { RotaFeedback, RotaPuzzle } from "./types";

// O tabuleiro carrega o mapa-múndi: só baixa quando alguém abre o jogo.
const RotaBoard = lazy(() => import("./Board"));

const EMOJI = { route: "🟩", near: "🟨", far: "🟥" } as const;

export const rota: GameDefinition<RotaPuzzle, RotaFeedback, AttemptRules> = {
  meta: {
    slug: "rota",
    name: "Rota",
    tagline: "De um país a outro, por terra",
    description: "Ligue dois países dizendo os países no caminho, só por fronteiras terrestres.",
    icon: Route,
    rules: { type: "attempts", maxAttempts: 9 },
    color: START_COLOR,
    howToPlay: [
      "Todo dia há um país de partida e um de destino.",
      "Diga países que fazem fronteira por terra até formar um caminho ligando os dois.",
      "Verde: está num caminho mais curto. Amarelo: desvia um pouco. Vermelho: está longe.",
      "Ganha quando os países que você disse ligam a partida ao destino, em até 9 chutes.",
      "Travou? Há 3 dicas: o próximo país, todos os contornos e as iniciais do caminho.",
    ],
    seo: {
      title: "Rota: ligue dois países por terra",
      description:
        "Desafio diário de geografia em português: ligue dois países dizendo os países no caminho, só por fronteiras terrestres. No estilo do Travle.",
    },
  },
  Board: RotaBoard,
  Cover: RotaCover,
  Recap: RotaRecap,
  shareGrid: (play) => play.guesses.map((g) => EMOJI[g.feedback.verdict]).join(""),
};
