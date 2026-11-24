import { Anchor } from "lucide-react";
import type { GameDefinition, PointsRules } from "../types";
import { IncomumBoard } from "./Board";
import { IncomumCover } from "./Cover";
import { IncomumRecap } from "./Recap";
import { COLOR, MAX_DEPTH, MAX_POINTS, MILESTONES, ROUND, SECONDS, TIERS } from "./tiers";
import type { IncomumFeedback, IncomumPuzzle } from "./types";

export const incomum: GameDefinition<IncomumPuzzle, IncomumFeedback, PointsRules> = {
  meta: {
    slug: "incomum",
    name: "Incomum",
    tagline: "Quanto menos óbvio, mais fundo",
    description: `${ROUND} categorias por dia. A resposta menos óbvia vale mais, e os pontos levam o submarino ao fundo da Fossa das Marianas.`,
    icon: Anchor,
    rules: { type: "points" },
    color: COLOR,
    // O tabuleiro mostra no fim, categoria por categoria, a óbvia e as raríssimas.
    hideAnswer: true,
    // Terminar as 7 categorias não é "achar todas": é só o fim da rodada.
    wonHeadline: "Rodada completa!",
    // O cartão da categoria ocupa a tela; o título da página fica numa linha só.
    compactHeader: true,
    // A última descida (até ~3 s), o bicho chega e os pontos sobem antes do resultado abrir.
    resultDelayMs: 5200,
    wide: true,
    launchedOn: "2026-11-24",
    howToPlay: [
      `São ${ROUND} categorias por dia: "cidade do Paraná com 50 mil+ habitantes", "raça de cachorro", "filme de terror"…`,
      `Escreva uma resposta que vale. Quanto menos óbvia, mais pontos: ${TIERS.map((t) => `${t.name} +${t.points}`).join(", ")}. Curitiba é óbvia; Cianorte é raríssima.`,
      `Os pontos levam o submarino para o fundo da Fossa das Marianas, e ele nunca sobe: ${MAX_POINTS} pontos é o fundo, a ${MAX_DEPTH.toLocaleString("pt-BR")} m. No caminho moram ${MILESTONES.length - 1} bichos; cada um que você alcança entra na sua coleção.`,
      `O oxigênio dura ${SECONDS} segundos por categoria. Resposta que não está na lista não gasta nada: é só tentar outra. Acento e maiúscula não importam; com letra errada, o jogo pergunta "Você quis dizer…?" e Enter confirma.`,
      "Travou? Pule a categoria. Pular ou ficar sem oxigênio vale 0. No fim, veja sua coleção e as respostas que iam mais fundo.",
    ],
    seo: {
      title: "Incomum: o jogo diário de mergulhar fugindo da resposta óbvia",
      description:
        "Jogo diário em português: 7 categorias, e para cada uma você ganha mais pontos quanto menos óbvia for a sua resposta. Cidades, filmes, bichos, bandas e mais.",
    },
  },
  Board: IncomumBoard,
  Cover: IncomumCover,
  Recap: IncomumRecap,
  // A raridade de cada resposta (⚫ quando pulou ou o tempo acabou); o placar ("430 pts") já vai no cabeçalho.
  shareGrid: (play) => play.guesses.map((g) => (g.feedback.missed ? "⚫" : TIERS[g.feedback.tier].emoji)).join(""),
};
