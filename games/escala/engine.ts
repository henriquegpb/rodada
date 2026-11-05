import { createEscalaEngine, type CatalogItem } from "./create-engine";
import animals from "./data/animals.json";
import type { Measure } from "./types";

/**
 * Bichos com o tamanho médio de um adulto. Silhuetas do PhyloPic em domínio público, recortadas
 * rente (public/escala/), então a altura ou o comprimento da imagem é o tamanho de verdade.
 */
export const ANIMALS: CatalogItem[] = animals.map((a) => ({
  name: a.name,
  measure: a.measure as Measure,
  size: a.size,
  shape: { kind: "image", src: `/escala/${a.id}.png`, aspect: a.w / a.h },
}));

export const engine = createEscalaEngine("escala", ANIMALS);
