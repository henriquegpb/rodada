import { createCountryEngine } from "../_shared/geo/engine";
import { countries } from "../_shared/geo";
import shapes from "./data/shapes.json";
import type { PaisPuzzle } from "./types";

const paths: Record<string, string> = shapes;

export const engine = createCountryEngine<PaisPuzzle>({
  slug: "pais",
  // Microestados e ilhas pequenas viram um pontinho irreconhecível: valem como chute, não como resposta.
  pool: countries.filter((c) => c.shapeEligible),
  puzzleFor: (country) => ({ path: paths[country.code] }),
});
