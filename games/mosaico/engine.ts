import { createRng, DAILY_SEED, shuffle } from "@/lib/daily/seed";
import { createCountryEngine } from "../_shared/geo/engine";
import { countries } from "../_shared/geo";
import { COLS, ROWS, type MosaicoPuzzle } from "./types";

const TILES = Array.from({ length: COLS * ROWS }, (_, i) => i);

export const engine = createCountryEngine<MosaicoPuzzle>({
  slug: "mosaico",
  pool: countries,
  // Mesma ressalva da Bandeira: sem backend, a imagem inteira chega ao navegador e as peças só a cobrem.
  puzzleFor: (country, dateKey) => ({
    image: `/flags/${country.code}.svg`,
    order: shuffle(TILES, createRng(`${DAILY_SEED}:mosaico-pecas:${dateKey}`)),
  }),
});
