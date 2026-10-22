/**
 * Textos da plataforma. Textos específicos de cada jogo ficam no meta do próprio jogo.
 * Para traduzir, crie um arquivo com a mesma forma e troque o import em ./index.ts.
 */
export const ptBR = {
  brand: {
    name: "Rodada",
    tagline: "Jogos diários. Os mesmos para todo mundo.",
  },
  nav: {
    home: "Hoje",
    games: "Rodada de hoje",
    profile: "Perfil",
    you: "Você",
    theme: "Alternar tema",
  },
  home: {
    round: "Rodada",
    streak: "Sequência",
    streakDays: (n: number) => (n === 1 ? "dia seguido" : "dias seguidos"),
    play: "Jogar",
    history: "Últimos 14 dias",
  },
  status: {
    play: "Jogar",
    playing: "Em jogo",
  },
  countdown: {
    short: "vira em",
    long: "Próxima rodada em",
  },
  game: {
    howToPlay: "Como jogar",
    stats: "Estatísticas",
    won: "Acertou",
    lost: "Não foi dessa vez",
    completed: "Mundo completo!",
    timeUp: "Fim de jogo",
    answerWas: "Era",
    points: (n: number) => `+${n} pts`,
    share: "Compartilhar",
    copied: "Copiado. Agora é só colar no grupo.",
    copyFailed: "Não deu para copiar. Tente de novo.",
    letsPlay: "Entendi",
    nextGame: (name: string) => `Próximo: ${name}`,
    backHome: "Ver a rodada",
    seeResult: "Ver resultado",
    loading: "Carregando…",
  },
  stats: {
    played: "Jogos",
    winRate: "% vitórias",
    currentStreak: "Sequência",
    maxStreak: "Recorde",
    best: "Melhor",
    average: "Média",
    daysPlayed: "Dias jogados",
    distribution: "Tentativas até acertar",
    empty: "Nenhuma partida ainda.",
    overallStreakHint: "Dias seguidos jogando pelo menos um jogo",
    byGame: "Estatísticas por jogo",
    overall: "Geral",
  },
  profile: {
    title: "Perfil",
    subtitle: "Suas partidas ficam salvas neste navegador.",
  },
} as const;
