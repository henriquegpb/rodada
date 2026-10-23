/** Uma capital como o jogador pode digitar: o nome e as outras grafias aceitas. */
export interface City {
  name: string;
  aliases: string[];
}

export interface CapitalQuestion {
  /** Código do país (ISO 3166-1 alfa-2). */
  code: string;
  country: string;
  /** Path SVG da silhueta, num viewBox 0 0 100 100. */
  path: string;
  /** As 4 alternativas (uma é a certa), já embaralhadas. */
  choices: string[];
}

export interface CapitalPuzzle {
  questions: CapitalQuestion[];
  /** Todas as capitais, em ordem alfabética, para as sugestões. Não diz de que país é cada uma. */
  cities: City[];
}

export interface CapitalFeedback {
  code: string;
  /** O que a pessoa respondeu, como está na lista (vazio quando pulou). */
  city: string;
  /** A capital certa, revelada depois da resposta. */
  answer: string;
  correct: boolean;
}
