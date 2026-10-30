/**
 * Filtros comuns sobre a extração do Wiktionary (kaikki.org) usada por build-sentido.ts e
 * build-colmeia.ts.
 */

export interface Sense {
  tags?: string[];
  glosses?: string[];
  form_of?: { word: string }[];
}

export interface Entry {
  word: string;
  pos?: string;
  senses?: Sense[];
}

const OFFENSIVE = ["vulgar", "offensive", "derogatory", "slur"];
const ELSEWHERE = ["Portugal", "Africa"];

/**
 * A acepção é do português do Brasil de hoje: não é grafia anterior ao acordo ("projecção",
 * "tecto") nem arcaica, nem uso só de Portugal ou da África ("ecrã"). Vale a definição, não a tag
 * "obsolete": em "mapa" ela marca só o uso no feminino.
 */
export function isCurrentBrazilian(sense: Sense): boolean {
  const tags = sense.tags ?? [];
  if (/^(pre-reform|obsolete|archaic|superseded)/i.test(sense.glosses?.[0] ?? "")) return false;
  return tags.includes("Brazil") || !tags.some((t) => ELSEWHERE.includes(t));
}

/** A acepção é palavrão ou ofensa. */
export const isOffensive = (sense: Sense) => (sense.tags ?? []).some((t) => OFFENSIVE.includes(t));
