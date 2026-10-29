export interface BandeiraQuestion {
  /** Sem backend a imagem sai de public/flags e o nome do arquivo entrega o país. */
  image: string;
  /** As 4 alternativas (uma é a certa), já embaralhadas. */
  choices: string[];
}

export interface BandeiraPuzzle {
  questions: BandeiraQuestion[];
}

export interface BandeiraFeedback {
  code: string;
  /** O país que a pessoa respondeu (vazio quando pulou). */
  name: string;
  /** O país certo, revelado depois da resposta. */
  answer: string;
  correct: boolean;
}
