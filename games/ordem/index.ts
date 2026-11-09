import { ListOrdered } from "lucide-react";
import type { AttemptRules, GameDefinition } from "../types";
import { OrdemBoard } from "./Board";
import { OrdemCover } from "./Cover";
import { OrdemRecap, ordemShareGrid } from "./Recap";
import { COLOR } from "./rules";
import type { OrdemFeedback, OrdemPuzzle } from "./types";

export const ordem: GameDefinition<OrdemPuzzle, OrdemFeedback, AttemptRules> = {
  meta: {
    slug: "ordem",
    name: "Ordem",
    tagline: "Do maior para o menor",
    description: "Ponha 5 países em ordem de tamanho, do maior para o menor, em até 5 tentativas.",
    icon: ListOrdered,
    // Sem setas, só certo ou errado por posição: às cegas, a lógica sozinha leva umas 3 tentativas;
    // quem conhece o mapa acerta em 1 ou 2.
    rules: { type: "attempts", maxAttempts: 5 },
    color: COLOR,
    launchedOn: "2026-11-09",
    howToPlay: [
      "São 5 países por dia. Ponha em ordem de área, do maior (em cima) para o menor (embaixo).",
      "Toque em dois países para trocar os dois de lugar, ou use as setas. Depois, confirme a ordem.",
      "Cada tentativa marca os países que estão no lugar certo: eles ficam travados e mostram a área. Os outros não dizem se sobem ou descem.",
      "Você tem 5 tentativas. Quanto menos usar, melhor.",
    ],
    seo: {
      title: "Ordem: qual país é maior? Jogo diário de geografia",
      description:
        "Jogo diário de geografia em português: ponha 5 países em ordem de tamanho, do maior para o menor, em até 5 tentativas.",
    },
  },
  Board: OrdemBoard,
  Cover: OrdemCover,
  Recap: OrdemRecap,
  shareGrid: ordemShareGrid,
};
