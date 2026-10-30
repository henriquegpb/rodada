import { Crown, Grid3x3, LayoutGrid } from "lucide-react";
import type { GameDefinition, LivesRules } from "../types";
import { RainhasBoard } from "./Board";
import { RainhasCover } from "./Cover";
import { RainhasRecap } from "./Recap";
import { COLOR, RULES, shareGrid } from "./rules";
import type { RainhasFeedback, RainhasPuzzle } from "./types";

const ICONS = { 8: Crown, 9: Grid3x3, 10: LayoutGrid } as const;

/**
 * Definição das Rainhas num tamanho. O 8×8 é o jogo da rodada; 9×9 e 10×10 são modos dele, cada um
 * com desafio e estatísticas próprios, nas abas do jogo.
 */
export function rainhasGame(size: 8 | 9 | 10): GameDefinition<RainhasPuzzle, RainhasFeedback, LivesRules> {
  const label = `${size}×${size}`;
  const main = size === 8;
  return {
    meta: {
      slug: main ? "rainhas" : `rainhas-${size}`,
      name: main ? "Rainhas" : `Rainhas ${label}`,
      modeLabel: label,
      tagline: main ? "Uma rainha por cor, linha e coluna" : `O desafio das Rainhas em ${label}`,
      description: `Coloque ${size} rainhas no tabuleiro ${label}: uma por cor, linha e coluna, sem nenhuma encostar na outra.`,
      icon: ICONS[size],
      parent: main ? undefined : "rainhas",
      rules: RULES,
      color: COLOR,
      launchedOn: "2026-10-29",
      howToPlay: [
        `Coloque ${size} rainhas: uma em cada linha, uma em cada coluna e uma em cada cor.`,
        "Rainhas não se encostam, nem na diagonal.",
        "Um toque marca um X onde não pode ter rainha; tocar num X tira ele. Dois toques seguidos põem a rainha. Arraste para marcar várias casas.",
        "Cada rainha no lugar errado custa uma vida. São 3 vidas e 3 dicas, e o tabuleiro sempre sai só por dedução, sem chute.",
        "Tem tabuleiro de 8×8, 9×9 e 10×10, cada um com o seu desafio do dia.",
      ],
      seo: {
        title: main
          ? "Rainhas: o desafio do dia de rainhas e cores (tipo Queens)"
          : `Rainhas ${label}: o desafio do dia de rainhas e cores (tipo Queens)`,
        description: `Jogo de lógica diário em português: coloque uma rainha por linha, coluna e cor no tabuleiro ${label}, sem nenhuma encostar. No estilo do Queens do LinkedIn.`,
      },
    },
    Board: RainhasBoard,
    Cover: RainhasCover,
    Recap: RainhasRecap,
    shareGrid,
  };
}
