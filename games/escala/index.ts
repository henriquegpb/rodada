import { Scaling } from "lucide-react";
import type { GameDefinition, PointsRules } from "../types";
import { EscalaBoard } from "./Board";
import { COLOR } from "./color";
import { EscalaCover } from "./Cover";
import { EscalaRecap, escalaShareGrid } from "./Recap";
import type { EscalaFeedback, EscalaPuzzle } from "./types";

export const escala: GameDefinition<EscalaPuzzle, EscalaFeedback, PointsRules> = {
  meta: {
    slug: "escala",
    name: "Escala",
    modeLabel: "Bichos",
    tagline: "Do tamanho de verdade",
    description: "5 rodadas: deixe cada bicho do tamanho de verdade ao lado de outro. Até 100 pontos por rodada.",
    icon: Scaling,
    // 5 rodadas de até 100: a engine dá o máximo (500).
    rules: { type: "points" },
    color: COLOR,
    wide: true,
    hideAnswer: true,
    launchedOn: "2026-11-05",
    howToPlay: [
      "São 5 rodadas. Em cada uma, um bicho aparece em azul no tamanho de verdade, com a altura ou o comprimento escrito.",
      "Arraste a bolinha (ou a barra embaixo) até o outro bicho ficar do tamanho certo perto dele e confirme.",
      "Acertando em cheio, 100 pontos. A nota cai conforme o erro e chega a zero quando o palpite é 2,5 vezes maior ou menor.",
      "Os tamanhos são a média de um adulto. Na aba Países, o mesmo com o mapa: a medida é de norte a sul.",
    ],
    seo: {
      title: "Escala: acerte o tamanho de verdade dos bichos e dos países",
      description:
        "Jogo diário em português: deixe cada bicho ou país do tamanho de verdade ao lado de outro. 5 rodadas, até 500 pontos.",
    },
  },
  Board: EscalaBoard,
  Cover: EscalaCover,
  Recap: EscalaRecap,
  shareGrid: escalaShareGrid,
};
