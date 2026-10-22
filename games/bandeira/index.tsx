import { Flag } from "lucide-react";
import type { AttemptRules, BoardProps, GameDefinition } from "../types";
import { CountryBoard } from "../_shared/geo/CountryBoard";
import { proximityEmoji } from "../_shared/geo";
import type { CountryFeedback } from "../_shared/geo/types";
import type { BandeiraPuzzle } from "./types";
import { BandeiraCover } from "./Cover";

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
    color: "#2f7cf6",
    howToPlay: [
      "Descubra de qual país é a bandeira em até 6 tentativas.",
      "Digite um país e escolha na lista.",
      "A cada erro você vê a distância até o país certo, a direção para onde ele fica e quão perto chegou.",
    ],
  },
  Board: BandeiraBoard,
  Cover: BandeiraCover,
  shareGrid: (play) => play.guesses.map((g) => proximityEmoji(g.feedback)).join("\n"),
};
