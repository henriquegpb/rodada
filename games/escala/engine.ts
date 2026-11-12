import { createEscalaEngine, type CatalogItem } from "./create-engine";
import animals from "./data/animals.json";
import type { Measure } from "./types";

/**
 * Bichos (e dinossauros) com o tamanho médio de um adulto. Silhuetas do PhyloPic em domínio público,
 * recortadas rente (public/escala/), então a altura ou a largura da imagem é o tamanho de verdade.
 * O catálogo sai de scripts/escala-list.ts por `pnpm data:escala`.
 */
export const ANIMALS: CatalogItem[] = animals.map((a) => ({
  name: a.name,
  measure: a.measure as Measure,
  size: a.size,
  shape: { kind: "image", src: `/escala/${a.id}.png`, aspect: a.w / a.h },
}));

export const engine = createEscalaEngine("escala", ANIMALS);
