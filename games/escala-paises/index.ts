import { Map as MapIcon } from "lucide-react";
import type { GameDefinition, PointsRules } from "../types";
import { EscalaBoard } from "../escala/Board";
import { COLOR } from "../escala/color";
import { EscalaCover } from "../escala/Cover";
import { EscalaRecap, escalaShareGrid } from "../escala/Recap";
import type { EscalaFeedback, EscalaPuzzle } from "../escala/types";

export const escalaPaises: GameDefinition<EscalaPuzzle, EscalaFeedback, PointsRules> = {
  meta: {
    slug: "escala-paises",
    name: "Escala · Países",
    modeLabel: "Países",
    parent: "escala",
    tagline: "O tamanho de verdade dos países",
    description: "5 rodadas: deixe cada país do tamanho de verdade ao lado de outro, de norte a sul.",
    icon: MapIcon,
    rules: { type: "points" },
    // Modo do Escala: mesma cor dele.
    color: COLOR,
    wide: true,
    hideAnswer: true,
    launchedOn: "2026-11-05",
    howToPlay: [
      "São 5 rodadas. Em cada uma, um país aparece em azul no tamanho de verdade, com a extensão de norte a sul escrita.",
      "Arraste a bolinha (ou a barra embaixo) até o outro país ficar do tamanho certo e confirme.",
      "Acertando em cheio, 100 pontos. A nota cai conforme o erro e chega a zero quando o palpite é 2,5 vezes maior ou menor.",
    ],
    seo: {
      title: "Escala · Países: acerte o tamanho de verdade dos países",
      description: "Jogo diário de geografia em português: deixe cada país do tamanho de verdade ao lado de outro. 5 rodadas, até 500 pontos.",
    },
  },
  Board: EscalaBoard,
  Cover: EscalaCover,
  Recap: EscalaRecap,
  shareGrid: escalaShareGrid,
};
