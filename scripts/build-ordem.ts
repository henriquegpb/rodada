/**
 * Gera os números dos países para o Ordem.
 *
 *   pnpm data:ordem
 *
 * Fonte: Banco Mundial, World Development Indicators (CC BY 4.0), o valor mais recente de cada país:
 *  - SP.POP.TOTL      população
 *  - NY.GDP.MKTP.CD   PIB em dólares correntes
 *  - NY.GDP.PCAP.CD   PIB por pessoa em dólares correntes
 *  - SP.DYN.LE00.IN   expectativa de vida ao nascer, em anos
 *
 * A área continua a do Natural Earth (countries.json), a mesma dos outros jogos de geografia.
 *
 * Saída: games/ordem/data/stats.json, { [código]: { population, gdp, gdpPerCapita, lifeExpectancy } }
 * só com os países do countries.json que têm todos os números.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import countries from "../games/_shared/geo/countries.json";

const ROOT = join(import.meta.dirname, "..");

const INDICATORS = {
  population: "SP.POP.TOTL",
  gdp: "NY.GDP.MKTP.CD",
  gdpPerCapita: "NY.GDP.PCAP.CD",
  lifeExpectancy: "SP.DYN.LE00.IN",
} as const;

type Field = keyof typeof INDICATORS;

interface WorldBankRow {
  country: { id: string };
  date: string;
  value: number | null;
}

async function fetchIndicator(id: string): Promise<Map<string, number>> {
  const url = `https://api.worldbank.org/v2/country/all/indicator/${id}?format=json&mrnev=1&per_page=1000`;
  console.log(`baixando ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`falha ao baixar ${url}: ${res.status}`);
  const [, rows] = (await res.json()) as [unknown, WorldBankRow[]];
  return new Map(rows.filter((r) => r.value != null).map((r) => [r.country.id.toLowerCase(), r.value!]));
}

async function main() {
  const values = Object.fromEntries(
    await Promise.all(Object.entries(INDICATORS).map(async ([field, id]) => [field, await fetchIndicator(id)] as const)),
  ) as Record<Field, Map<string, number>>;

  const stats: Record<string, Record<Field, number>> = {};
  const missing: string[] = [];
  for (const { code } of countries) {
    const row = Object.fromEntries((Object.keys(INDICATORS) as Field[]).map((f) => [f, values[f].get(code)]));
    if (Object.values(row).some((v) => v == null)) {
      missing.push(code);
      continue;
    }
    stats[code] = {
      population: Math.round(row.population!),
      gdp: Math.round(row.gdp!),
      gdpPerCapita: Math.round(row.gdpPerCapita!),
      lifeExpectancy: Math.round(row.lifeExpectancy! * 10) / 10,
    };
  }

  writeFileSync(join(ROOT, "games/ordem/data/stats.json"), JSON.stringify(stats) + "\n");
  console.log(`✓ games/ordem/data/stats.json (${Object.keys(stats).length} países; sem dado: ${missing.join(", ")})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
