import { lazy } from "react";
import { Globe } from "lucide-react";
import type { GameDefinition, TimedRules } from "../types";
import { countries } from "../_shared/geo";
import { countriesByContinent } from "./continents";
import { MundoCover } from "./Cover";
import { MundoRecap } from "./Recap";
import type { MundoFeedback, MundoPuzzle } from "./types";

const COLOR = "#ffc21a";

// O tabuleiro carrega o mapa-múndi (~110 KB): só baixa quando alguém abre o jogo.
const MundoBoard = lazy(() => import("./Board"));

export const mundo: GameDefinition<MundoPuzzle, MundoFeedback, TimedRules> = {
  meta: {
    slug: "mundo",
    name: "Mundo",
    tagline: "Todos os países em 15 minutos",
    description: "Diga o nome de todos os países do mundo antes que o tempo acabe.",
    icon: Globe,
    rules: { type: "timed", seconds: 15 * 60, total: countries.length },
    color: COLOR,
    howToPlay: [
      `Escreva o nome de todos os ${countries.length} países que conseguir em 15 minutos.`,
      "Não precisa apertar Enter: o país entra quando faltam até 2 letras e não pode ser outro (\"Bras\" já vira Brasil). Nomes longos entram com 8 letras.",
      "Quando um nome é o começo de outro (Níger e Nigéria, Irã e Iraque), continue digitando ou aperte Enter.",
      "Acentos são opcionais. Valem apelidos (EUA, Holanda) e nomes em inglês e espanhol.",
      "Cada acerto pinta o país no mapa. No fim, os que faltaram aparecem em vermelho.",
      "O relógio continua correndo mesmo se você sair da página.",
    ],
  },
  Board: MundoBoard,
  Cover: MundoCover,
  Recap: ({ play }) => <MundoRecap play={play} color={COLOR} />,
  shareGrid(play) {
    const found = new Set(play.guesses.map((g) => g.feedback.code));
    return countriesByContinent
      .map((c) => {
        const n = c.countries.filter((x) => found.has(x.code)).length;
        const filled = Math.round((5 * n) / c.countries.length);
        return `${"🟨".repeat(filled)}${"⬛".repeat(5 - filled)} ${c.name} ${n}/${c.countries.length}`;
      })
      .join("\n");
  },
};
