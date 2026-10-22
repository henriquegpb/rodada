import { Link2 } from "lucide-react";
import type { GameDefinition, UnlimitedRules } from "../types";
import { EloBoard } from "./Board";
import { EloCover } from "./Cover";
import { LEVEL_EMOJI } from "./levels";
import { EloRecap } from "./Recap";
import type { EloFeedback, EloPuzzle } from "./types";

export const elo: GameDefinition<EloPuzzle, EloFeedback, UnlimitedRules> = {
  meta: {
    slug: "elo",
    name: "Elo",
    tagline: "16 palavras, 4 grupos",
    description: "Separe as 16 palavras em 4 grupos de 4 que têm algo em comum.",
    icon: Link2,
    rules: { type: "unlimited" },
    color: "#12b5c9",
    hideAnswer: true,
    howToPlay: [
      "Há 16 palavras na grade, e elas formam 4 grupos de 4 com algo em comum.",
      "Toque em 4 palavras: ao marcar a quarta, o chute vai sozinho. Se formarem um grupo, ele sai da grade com o tema revelado.",
      "Cuidado com as iscas: tem palavra que parece servir em mais de um grupo, mas só cabe num.",
      "As cores vão do grupo mais fácil (verde) ao mais difícil (vermelho), que costuma ser um trocadilho.",
      "Quanto menos chutes, melhor; dá para desistir e ver a resposta.",
    ],
    seo: {
      title: "Elo: separe 16 palavras em 4 grupos (tipo Conexo)",
      description:
        "Jogo de palavras diário em português: encontre os 4 grupos de 4 palavras que têm algo em comum. No estilo do Connections e do Conexo.",
    },
  },
  Board: EloBoard,
  Cover: EloCover,
  Recap: EloRecap,
  shareGrid: (play) =>
    play.guesses
      .map(({ feedback }) => (feedback.group ? LEVEL_EMOJI[feedback.group.level] : "⬛").repeat(feedback.words.length))
      .join("\n"),
};
