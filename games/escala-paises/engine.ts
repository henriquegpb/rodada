import { countries } from "../_shared/geo";
import shapes from "../pais/data/shapes.json";
import { createEscalaEngine, type CatalogItem } from "../escala/create-engine";

/**
 * Territórios longe do continente esticam o contorno (Canárias, Açores, Alasca, Guiana Francesa…)
 * e a Rússia passa da linha de data: a extensão norte a sul deixaria de ser a do país que se vê.
 */
const STRETCHED = new Set(["es", "pt", "fr", "us", "nl", "no", "ru", "dk", "fj", "ki", "ec", "gq", "ye", "cv", "st", "mu", "sc"]);
/** Países pequenos demais para todo mundo reconhecer pela silhueta ficam de fora. */
const MIN_AREA_KM2 = 50_000;

/** Caixa e escala da silhueta do País. A projeção preserva área, então a área real dá a escala. */
function measure(d: string, areaKm2: number) {
  let area = 0;
  let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const ring of d.split("Z").filter(Boolean)) {
    const pts = ring
      .replace(/^M/, "")
      .split(/[ML]/)
      .map((p) => p.split(",").map(Number));
    let a = 0;
    pts.forEach(([x1, y1], i) => {
      const [x2, y2] = pts[(i + 1) % pts.length];
      a += x1 * y2 - x2 * y1;
      minX = Math.min(minX, x1);
      maxX = Math.max(maxX, x1);
      minY = Math.min(minY, y1);
      maxY = Math.max(maxY, y1);
    });
    area += Math.abs(a) / 2;
  }
  const box: [number, number, number, number] = [minX, minY, maxX - minX, maxY - minY];
  const metersPerUnit = Math.sqrt(areaKm2 / area) * 1000;
  return { box, size: Math.round((box[3] * metersPerUnit) / 1000) * 1000 };
}

export const COUNTRIES: CatalogItem[] = countries
  .filter((c) => c.shapeEligible && c.areaKm2 >= MIN_AREA_KM2 && !STRETCHED.has(c.code))
  .map((c) => {
    const d = (shapes as Record<string, string>)[c.code];
    const { box, size } = measure(d, c.areaKm2);
    return { name: c.name, measure: "norte a sul", size, shape: { kind: "path", d, box } };
  });

export const engine = createEscalaEngine("escala-paises", COUNTRIES);
