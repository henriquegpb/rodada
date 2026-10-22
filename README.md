# Rodada

Jogos diários curtos num lugar só. Todo dia sai um desafio novo de cada jogo, igual para todo mundo, e ele vira à meia-noite de Brasília.

| Jogo         | O desafio                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------- |
| **Palavra**  | Adivinhar uma palavra de 5 letras em 6 tentativas, com feedback por letra.                   |
| **Bandeira** | Descobrir o país pela bandeira. Cada erro mostra a distância e a direção até o país certo.  |
| **País**     | A mesma mecânica, mas o jogador vê a silhueta do país.                                       |
| **Mundo**    | Nomear os 197 países em 15 minutos. O mapa pinta cada acerto e a tabela mostra o progresso por continente. |

O foco do produto é a camada social: grupos, ranking diário e sequências. Esta primeira fase é **só o frontend**: as partidas ficam salvas no navegador. Backend, login e grupos são as próximas fases (veja o [roadmap](#roadmap)).

## Rodando localmente

Requer Node 20+ e pnpm 10.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Outros comandos:

```bash
pnpm test         # testes (Vitest)
pnpm lint         # ESLint
pnpm typecheck    # tipos das rotas + tsc
pnpm data:build   # regenera palavras, países, silhuetas e bandeiras a partir das fontes
```

O `.env.example` lista as variáveis. Nenhuma é obrigatória para desenvolver.

## Como funciona

```
app/                  rotas (Next.js App Router): /, /[jogo], /perfil
games/                um módulo por jogo + registro (veja CONTRIBUTING.md)
  types.ts            contrato comum a todos os jogos
  index.ts            registro da parte de UI
  engines.ts          registro da parte que conhece a resposta
  palavra/ bandeira/ pais/
  _shared/geo/        base comum dos jogos de país (busca, distância, direção, tabuleiro)
lib/
  daily/              data em America/Sao_Paulo, seed, sorteio do dia
  plays/              partidas salvas no navegador + serviço que fala com a engine
  stats.ts scoring.ts estatísticas, sequências e pontuação
  i18n/               todos os textos da plataforma (PT-BR)
components/
  microkit/           microinterações do Microkit, adaptadas
  ui/                 shadcn/ui
scripts/build-data.ts gera os dados dos jogos a partir das fontes abertas
```

**Desafio do dia.** `pickDaily` percorre uma permutação da lista de respostas, embaralhada com uma seed. Assim não há repetição até a lista acabar. O resultado é determinístico para a mesma data e o mesmo segredo (`NEXT_PUBLIC_DAILY_SEED`). O segredo existe porque o código e as listas são abertos: sem ele, qualquer pessoa calcularia a resposta de amanhã.

**Engine e UI separadas.** Cada jogo tem uma `engine.ts`, que gera o desafio e valida as tentativas, e um `index.ts` com a interface. A UI nunca importa a engine: ela fala com `lib/plays/service.ts`. Hoje esse serviço chama a engine no próprio navegador. Na fase de backend ele vira chamadas a route handlers, e a resposta deixa de chegar ao cliente antes do fim do jogo. **Até lá, quem abrir o DevTools consegue achar a resposta.** Isso é aceitável enquanto não há ranking.

**Dois tipos de jogo.** Cada jogo declara suas regras (`meta.rules`): **por tentativas** (Palavra, Bandeira, País: acertar em até N chutes) ou **por tempo** (Mundo: achar o máximo antes do relógio zerar). No jogo por tempo, o relógio começa ao clicar em "Começar" e continua correndo mesmo se a pessoa fechar a página.

**Pontuação** (para o ranking dos grupos, que ainda não existe): nos jogos por tentativas, `tentativas máximas + 1 − tentativas usadas`, e derrota vale 0. No jogo por tempo, um ponto por item achado. A interface ainda não mostra pontos.

**Sequências.** A sequência de cada jogo por tentativas conta vitórias seguidas, e perder zera. No jogo por tempo, conta dias jogados. A sequência geral conta dias seguidos com pelo menos um jogo terminado. As duas continuam vivas até o fim do dia seguinte.

## Fontes dos dados e licenças

| Dado                                   | Fonte                                                                                             | Licença           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------- |
| Palavras válidas (léxico, conjugações, frequência) | [fserb/pt-br](https://github.com/fserb/pt-br)                                          | MIT               |
| Respostas do Palavra                   | Curadoria própria sobre a lista acima (`games/palavra/data/answers.json`)                          | MIT               |
| Geometria e centroides dos países      | [Natural Earth](https://www.naturalearthdata.com/) 1:50m Admin 0                                  | Domínio público   |
| Bandeiras                              | [flag-icons](https://github.com/lipis/flag-icons)                                                 | MIT               |
| Nomes dos países em PT-BR              | Unicode CLDR, via `Intl.DisplayNames`, com ajustes em `scripts/country-list.ts`                    | Unicode License   |
| Microinterações                        | [Microkit](https://microkit.co)                                                                   | MIT               |

Os países são os 193 membros da ONU mais Kosovo, Palestina, Taiwan e Vaticano. No País, os que têm menos de 10.000 km² podem ser chutados, mas nunca são a resposta, porque a silhueta deles vira um pontinho.

## Roadmap

1. ~~Plataforma e os três jogos (frontend)~~
2. Supabase: auth (Google e magic link), tabelas com RLS e validação das tentativas no servidor
3. Importar as partidas do navegador ao logar
4. Grupos, convite por link e ranking diário do grupo
5. Perfil sincronizado entre dispositivos

## Contribuindo

Veja o [CONTRIBUTING.md](CONTRIBUTING.md). Adicionar um jogo é criar uma pasta e registrar duas linhas.

## Licença

MIT
