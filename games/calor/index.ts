import { lazy } from "react";
import { Thermometer } from "lucide-react";
import type { GameDefinition, UnlimitedRules } from "../types";
import { CalorCover } from "./Cover";
import { CalorRecap } from "./Recap";
import { heatEmoji } from "./heat";
import type { CalorFeedback, CalorPuzzle } from "./types";

// O tabuleiro carrega o globo (geometria + d3-geo): só baixa quando alguém abre o jogo.
const CalorBoard = lazy(() => import("./Board"));

export const calor: GameDefinition<CalorPuzzle, CalorFeedback, UnlimitedRules> = {
  meta: {
    slug: "calor",
    name: "Calor",
    tagline: "Quente ou frio, até achar",
    description: "Ache o país secreto: cada chute aparece no globo, mais quente quanto mais perto.",
    icon: Thermometer,
    rules: { type: "unlimited" },
    color: "#ef4444",
    howToPlay: [
      "Todo dia há um país secreto. Chute quantos países quiser até achar.",
      "Cada chute aparece no globo com uma cor: quanto mais quente, mais perto da fronteira do país secreto.",
      "Vermelho-escuro (0 km) quer dizer que o chute faz fronteira com ele.",
      "Arraste o globo para girar. Quanto menos chutes, melhor; dá para desistir e ver a resposta.",
    ],
  },
  Board: CalorBoard,
  Cover: CalorCover,
  Recap: CalorRecap,
  shareGrid: (play) =>
    play.guesses.map((g, i) => (play.status === "won" && i === play.guesses.length - 1 ? "🎯" : heatEmoji(g.feedback.km))).join(""),
};
