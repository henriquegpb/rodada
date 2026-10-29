import { Flag } from "lucide-react";
import type { GameDefinition, QuizRules } from "../types";
import { quizShareGrid } from "../_shared/geo/quiz";
import { Answers, BandeiraBoard } from "./Board";
import { BandeiraCover } from "./Cover";
import type { BandeiraFeedback, BandeiraPuzzle } from "./types";

export const bandeira: GameDefinition<BandeiraPuzzle, BandeiraFeedback, QuizRules> = {
  meta: {
    slug: "bandeira",
    name: "Bandeira",
    tagline: "10 bandeiras, 10 países",
    description: "Diga de que país são 10 bandeiras seguidas e veja quantas acerta.",
    icon: Flag,
    rules: { type: "quiz", total: 10 },
    color: "#2f7cf6",
    hideAnswer: true,
    howToPlay: [
      "São 10 bandeiras seguidas, da mais conhecida à mais difícil. Diga de que país é cada uma.",
      "Digite o país e escolha na lista, ou toque em \"Ver 4 alternativas\" para escolher entre quatro.",
      "Só vale uma resposta por bandeira: errou ou pulou, o país certo aparece e o jogo segue.",
      "O resultado é quantas você acertou das 10.",
    ],
    seo: {
      title: "Bandeira do dia: quantas bandeiras do mundo você conhece?",
      description:
        "Quiz diário de bandeiras em português: diga de que país são 10 bandeiras seguidas, da mais fácil à mais difícil, e veja quantas acerta.",
    },
  },
  Board: BandeiraBoard,
  Cover: BandeiraCover,
  Recap: ({ play }) => <Answers play={play} compact />,
  shareGrid: quizShareGrid,
};
