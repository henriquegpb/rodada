import { Waypoints } from "lucide-react";
import type { GameDefinition, LivesRules } from "../types";
import { TrilhaBoard } from "./Board";
import { TrilhaCover } from "./Cover";
import { TrilhaRecap } from "./Recap";
import { COLOR, RULES, SIZE, shareGrid } from "./rules";
import type { TrilhaFeedback, TrilhaPuzzle } from "./types";

export const trilha: GameDefinition<TrilhaPuzzle, TrilhaFeedback, LivesRules> = {
  meta: {
    slug: "trilha",
    name: "Trilha",
    tagline: "Um caminho só por todas as casas",
    description: "Ligue os números em ordem com um caminho só, que passa uma vez por cada casa do tabuleiro.",
    icon: Waypoints,
    rules: RULES,
    color: COLOR,
    // O tabuleiro termina com o caminho inteiro à mostra; não há uma resposta em texto.
    hideAnswer: true,
    launchedOn: "2026-11-12",
    howToPlay: [
      `Desenhe um caminho só que passa uma vez por cada uma das ${SIZE * SIZE} casas. Ele começa no 1 e termina no último número.`,
      "Passe pelos números em ordem: 1, 2, 3… O caminho anda na horizontal e na vertical, nunca na diagonal, e não atravessa as paredes.",
      "Arraste para desenhar; voltar por cima apaga. Ao chegar no próximo número, solte o dedo: o trecho é conferido. No teclado, use as setas e o Enter.",
      "Cada trecho errado custa uma vida, e o caminho volta para o número de onde saiu. São 3 vidas e 3 dicas.",
      "Todo tabuleiro tem uma solução só, e dá para achar cada trecho sem chute, olhando um pouco à frente.",
    ],
    seo: {
      title: "Trilha: o desafio do dia de ligar os números com um caminho só",
      description:
        "Jogo de lógica diário em português: ligue os números em ordem com um caminho só, que passa por todas as casas do tabuleiro sem cruzar as paredes.",
    },
  },
  Board: TrilhaBoard,
  Cover: TrilhaCover,
  Recap: TrilhaRecap,
  shareGrid,
};
