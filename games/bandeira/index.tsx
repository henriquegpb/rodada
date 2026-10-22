import { Flag } from "lucide-react";
import type { AttemptRules, BoardProps, GameDefinition } from "../types";
import { CountryBoard } from "../_shared/geo/CountryBoard";
import { CountryRecap } from "../_shared/geo/CountryRecap";
import { proximityEmoji } from "../_shared/geo";
import type { CountryFeedback } from "../_shared/geo/types";
import type { BandeiraPuzzle } from "./types";
import { BandeiraCover } from "./Cover";

const COLOR = "#2f7cf6";

function BandeiraBoard(props: BoardProps<BandeiraPuzzle, CountryFeedback, AttemptRules>) {
  return (
    <CountryBoard
      {...props}
      visual={
        // eslint-disable-next-line @next/next/no-img-element -- SVG local, sem ganho com next/image
        <img
          src={props.play.puzzle.image}
          alt="Bandeira do dia"
          className="aspect-[4/3] w-full max-w-[340px] rounded-[4px] object-cover shadow-[0_16px_40px_rgba(0,0,0,.4)] ring-1 ring-black/10"
          draggable={false}
        />
      }
    />
  );
}

export const bandeira: GameDefinition<BandeiraPuzzle, CountryFeedback, AttemptRules> = {
  meta: {
    slug: "bandeira",
    name: "Bandeira",
    tagline: "De quem é essa bandeira?",
    description: "Descubra o país pela bandeira em até 6 tentativas.",
    icon: Flag,
    rules: { type: "attempts", maxAttempts: 6 },
    color: COLOR,
    howToPlay: [
      "Descubra de qual país é a bandeira em até 6 tentativas.",
      "Digite um país e escolha na lista.",
      "A cada erro você vê a distância até o país certo, a direção para onde ele fica e quão perto chegou.",
    ],
    seo: {
      title: "Bandeira do dia: adivinhe o país pela bandeira",
      description:
        "Jogo diário de bandeiras: descubra de que país é a bandeira em até 6 tentativas. Quiz de geografia grátis, em português.",
    },
  },
  Board: BandeiraBoard,
  Cover: BandeiraCover,
  Recap: ({ play }) => <CountryRecap play={play} color={COLOR} />,
  shareGrid: (play) => play.guesses.map((g) => proximityEmoji(g.feedback)).join("\n"),
};
