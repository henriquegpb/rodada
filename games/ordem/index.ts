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
    tagline: "Área, população, PIB…",
    description: "Ponha 5 países em ordem de área, população, PIB e mais. A categoria muda todo dia.",
    icon: ListOrdered,
    // Sem setas, só certo ou errado por posição: às cegas, a lógica sozinha leva umas 3 tentativas;
    // quem conhece o mapa acerta em 1 ou 2.
    rules: { type: "attempts", maxAttempts: 5 },
    color: COLOR,
    launchedOn: "2026-11-12",
    howToPlay: [
      "São 5 países por dia e uma categoria: área, população, PIB, PIB por pessoa, densidade ou expectativa de vida. Ela aparece no topo do tabuleiro.",
      "Ponha os países em ordem, do maior (em cima) para o menor (embaixo) na categoria do dia.",
      "Toque em dois países para trocar os dois de lugar, ou use as setas. Depois, confirme a ordem.",
      "Cada tentativa marca os países que estão no lugar certo: eles ficam travados e mostram o número. Os outros não dizem se sobem ou descem.",
      "Você tem 5 tentativas. Quanto menos usar, melhor.",
    ],
    seo: {
      title: "Ordem: qual país é maior, mais populoso ou mais rico? Jogo diário de geografia",
      description:
        "Jogo diário de geografia em português: ponha 5 países em ordem de área, população, PIB ou expectativa de vida, em até 5 tentativas.",
    },
  },
  Board: OrdemBoard,
  Cover: OrdemCover,
  Recap: OrdemRecap,
  shareGrid: ordemShareGrid,
};
