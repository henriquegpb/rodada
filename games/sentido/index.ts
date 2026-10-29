import { Radar } from "lucide-react";
import type { GameDefinition, UnlimitedRules } from "../types";
import { SentidoBoard } from "./Board";
import { SentidoCover } from "./Cover";
import { shareGrid } from "./rank";
import { SentidoRecap } from "./Recap";
import type { SentidoFeedback, SentidoPuzzle } from "./types";

export const sentido: GameDefinition<SentidoPuzzle, SentidoFeedback, UnlimitedRules> = {
  meta: {
    slug: "sentido",
    name: "Sentido",
    tagline: "Quente ou frio, com palavras",
    description: "Ache a palavra secreta: cada chute mostra quão perto ela está no sentido.",
    icon: Radar,
    rules: { type: "unlimited" },
    color: "#e8b77a",
    launchedOn: "2026-10-29",
    howToPlay: [
      "Todo dia há uma palavra secreta. Chute quantas palavras quiser até achar.",
      "Cada chute ganha uma posição: quanto menor o número, mais perto do sentido da palavra secreta. A 1 é ela.",
      "A ordem vem de uma inteligência artificial que leu milhões de textos e sabe quais palavras aparecem em contextos parecidos.",
      "Acento só importa para separar palavras (coco e cocô). Plural e verbo conjugado viram a forma básica: \"carros\" vale como carro.",
      "Travou? Peça uma dica: ela mostra uma palavra mais perto que o seu melhor chute. Dá também para desistir e ver a resposta.",
    ],
    seo: {
      title: "Sentido: adivinhe a palavra secreta pela proximidade (tipo Contexto)",
      description:
        "Jogo de palavras diário em português: chute palavras e veja quão perto estão do sentido da palavra secreta até achar. No estilo do Contexto e do Semantle.",
    },
  },
  Board: SentidoBoard,
  Cover: SentidoCover,
  Recap: SentidoRecap,
  shareGrid,
};
