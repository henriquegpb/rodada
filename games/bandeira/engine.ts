import { createCountryEngine } from "../_shared/geo/engine";
import { countries } from "../_shared/geo";
import type { BandeiraPuzzle } from "./types";

export const engine = createCountryEngine<BandeiraPuzzle>({
  slug: "bandeira",
  pool: countries,
  // Sem backend a imagem sai de public/flags e o nome do arquivo entrega o país.
  // Com o backend, vira uma rota que serve a bandeira do dia sem identificar o código.
  puzzleFor: (country) => ({ image: `/flags/${country.code}.svg` }),
});
