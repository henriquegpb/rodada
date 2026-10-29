import { Landmark } from "lucide-react";
import type { GameDefinition, QuizRules } from "../types";
import { quizShareGrid } from "../_shared/geo/quiz";
import { Answers, CapitalBoard } from "./Board";
import { CapitalCover } from "./Cover";
import type { CapitalFeedback, CapitalPuzzle } from "./types";

export const capital: GameDefinition<CapitalPuzzle, CapitalFeedback, QuizRules> = {
  meta: {
    slug: "capital",
    name: "Capital",
    tagline: "10 países, 10 capitais",
    description: "Diga a capital de 10 países seguidos e veja quantas acerta.",
    icon: Landmark,
    rules: { type: "quiz", total: 10 },
    color: "#a3d915",
    hideAnswer: true,
    launchedOn: "2026-10-23",
    howToPlay: [
      "São 10 países seguidos, do mais conhecido ao mais difícil. Diga a capital de cada um.",
      "Digite a capital e escolha na lista, ou toque em \"Ver 4 alternativas\" para escolher entre quatro.",
      "Só vale uma resposta por país: errou ou pulou, a capital certa aparece e o jogo segue.",
      "Acentos são opcionais e valem outras grafias (Beijing, Kyiv). Em países com mais de uma capital, qualquer uma vale.",
      "O resultado é quantas você acertou das 10.",
    ],
    seo: {
      title: "Capital do dia: quantas capitais do mundo você sabe?",
      description:
        "Quiz diário de geografia em português: diga a capital de 10 países seguidos, do mais fácil ao mais difícil, e veja quantas acerta.",
    },
  },
  Board: CapitalBoard,
  Cover: CapitalCover,
  Recap: ({ play }) => <Answers play={play} compact />,
  shareGrid: quizShareGrid,
};
