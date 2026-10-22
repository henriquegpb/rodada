import { countries, type Country } from "../_shared/geo";

/** Continentes na ordem da tabela, com o nome em PT-BR (a chave é o valor do Natural Earth). */
export const CONTINENTS = [
  { id: "Africa", name: "África" },
  { id: "Asia", name: "Ásia" },
  { id: "Europe", name: "Europa" },
  { id: "North America", name: "América do Norte" },
  { id: "South America", name: "América do Sul" },
  { id: "Oceania", name: "Oceania" },
] as const;

export const countriesByContinent: { id: string; name: string; countries: Country[] }[] = CONTINENTS.map((c) => ({
  ...c,
  countries: countries.filter((country) => country.continent === c.id),
}));
