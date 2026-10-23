"use client";

import { useCallback } from "react";
import { SuggestInput } from "../SuggestInput";
import { searchCountries } from "./index";

/** Campo de país com autocomplete. */
export function CountryInput({
  onGuess,
  exclude,
  placeholder = "Digite um país",
}: {
  onGuess(name: string): Promise<string | null>;
  /** Códigos que não devem aparecer nas sugestões (já chutados, ponto de partida…). */
  exclude: ReadonlySet<string>;
  placeholder?: string;
}) {
  const search = useCallback(
    (query: string) =>
      searchCountries(query, 7)
        .filter((c) => !exclude.has(c.code))
        .map((c) => ({ key: c.code, name: c.name })),
    [exclude],
  );
  return <SuggestInput onGuess={onGuess} search={search} placeholder={placeholder} />;
}
