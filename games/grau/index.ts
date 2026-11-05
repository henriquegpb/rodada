import { Angle } from "lucide-react";
import type { AttemptRules, GameDefinition } from "../types";
import { GrauBoard } from "./Board";
import { COLOR } from "./color";
import { GrauCover } from "./Cover";
import { GrauRecap, grauShareGrid } from "./Recap";
import type { GrauFeedback, GrauPuzzle } from "./types";

export const grau: GameDefinition<GrauPuzzle, GrauFeedback, AttemptRules> = {
  meta: {
    slug: "grau",
    name: "Grau",
    tagline: "Leia e desenhe o ângulo",
    description: "Dois ângulos por dia: diga quanto mede o primeiro e desenhe o segundo, em até 7 tentativas.",
    icon: Angle,
    // 7 tentativas para os dois ângulos. Dois chutes é o mínimo e vale 100; cai devagar até 4 e
    // rápido até 7.
    rules: { type: "attempts", maxAttempts: 7, curve: [[2, 100], [4, 80], [7, 20]] },
    color: COLOR,
    hideAnswer: true,
    launchedOn: "2026-11-05",
    howToPlay: [
      "Dois ângulos por dia e 7 tentativas para os dois.",
      "1 · Leia: diga quantos graus tem a abertura marcada. 2 · Desenhe: arraste o braço até abrir o ângulo pedido.",
      "Vale errar por até 2°. Cada erro diz se o ângulo é maior ou menor e quão perto ficou: Fervendo (até 5°), Quente (10°), Morno (20°), Frio (45°) ou Gelado.",
      "O ângulo vai sempre do braço fixo girando no sentido anti-horário. Quanto menos tentativas, melhor.",
    ],
    seo: {
      title: "Grau: adivinhe e desenhe o ângulo do dia",
      description:
        "Jogo diário de ângulos em português: diga quantos graus tem o ângulo e depois desenhe outro, com dicas de quente ou frio.",
    },
  },
  Board: GrauBoard,
  Cover: GrauCover,
  Recap: GrauRecap,
  shareGrid: grauShareGrid,
};
