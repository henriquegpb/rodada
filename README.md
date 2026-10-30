# Rodada

Jogos diários curtos num lugar só. Todo dia sai um desafio novo de cada jogo, igual para todo mundo, e ele vira à meia-noite de Brasília.

| Jogo         | O desafio                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------- |
| **Palavra**  | Adivinhar uma palavra de 5 letras em 6 tentativas, com feedback por letra.                   |
| **Palavra · Dupla e Quadra** | Modos dentro do Palavra: 2 palavras em 7 tentativas ou 4 em 9, com o teclado colorido por tabuleiro. Cada modo tem desafio e estatísticas próprios. |
| **Bandeira** | Quiz de 10 bandeiras seguidas, da mais conhecida à mais difícil: diga de que país é cada uma (digitando ou escolhendo entre 4). O resultado é quantas acertou. |
| **País**     | Descobrir o país pela silhueta em 6 tentativas. Cada erro mostra a distância e a direção até o país certo. |
| **Capital**  | Quiz de 10 países seguidos, do mais conhecido ao mais difícil: diga a capital de cada um (digitando ou escolhendo entre 4). O resultado é quantas acertou. |
| **Mosaico**  | A bandeira escondida em 6 peças: começa com uma à mostra e cada erro revela mais uma. Mesmo feedback de distância e direção. |
| **Rota**     | Dois países e um caminho por terra entre eles: diga os países do meio até ligar um ao outro. Verde/amarelo/vermelho mostram quão perto do caminho mais curto cada chute ficou; há 3 dicas. |
| **Calor**    | Ache o país secreto: cada chute aparece num globo que gira, colorido pela distância entre as fronteiras (mais quente = mais perto). Sem limite de chutes; dá para desistir. |
| **Mundo**    | Nomear os 197 países em 15 minutos. O mapa pinta cada acerto e a tabela mostra o progresso por continente. |
| **Elo**      | Separar 16 palavras em 4 grupos de 4 com algo em comum, do grupo mais óbvio ao trocadilho. Sem limite de chutes; dá para desistir. |
| **Colmeia**  | Spelling Bee em português: formar palavras com as 7 letras da colmeia, sempre com a do meio. Cada palavra vale pontos, que levam de Iniciante a Gênio; há dicas por letra e tamanho. Sem erro nem relógio: encerra quando quiser. |
| **Sentido**  | Achar a palavra secreta pelo sentido: cada chute ganha uma posição numa lista de proximidade (1 é a resposta), como no Contexto. Tem dicas; sem limite de chutes; dá para desistir. |

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
pnpm data:sentido # regenera vocabulário e vetores do Sentido (baixa ~240 MB para data-raw/)
pnpm data:colmeia # regenera as colmeias do dia
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

**Tipos de jogo.** Cada jogo declara suas regras (`meta.rules`): **por tentativas** (Palavra, País, Mosaico, Rota: acertar em até N chutes), **sem limite** (Calor, Elo e Sentido: chutar até acertar, ou desistir), **por tempo** (Mundo: achar o máximo antes do relógio zerar) **quiz** (Capital e Bandeira: 10 perguntas seguidas, uma resposta cada) ou **por pontos** (Colmeia: cada achado vale pontos, até achar tudo ou encerrar). No jogo por tempo, o relógio começa ao clicar em "Começar" e continua correndo mesmo se a pessoa fechar a página.

**Pontuação** (para o ranking dos grupos, que ainda não existe): nos jogos por tentativas, `tentativas máximas + 1 − tentativas usadas`, e derrota vale 0. No jogo por tempo, um ponto por item achado; no quiz, um por acerto; por pontos, os do próprio jogo. A interface ainda não mostra pontos.

**Sequências.** A sequência de cada jogo por tentativas conta vitórias seguidas, e perder zera. No jogo por tempo, no quiz e por pontos, conta dias jogados. A sequência geral conta dias seguidos com pelo menos um jogo terminado. As duas continuam vivas até o fim do dia seguinte.

## Fontes dos dados e licenças

| Dado                                   | Fonte                                                                                             | Licença           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------- |
| Palavras válidas (léxico, conjugações, frequência) | [fserb/pt-br](https://github.com/fserb/pt-br)                                          | MIT               |
| Respostas do Palavra                   | Curadoria própria sobre a lista acima (`games/palavra/data/answers.json`)                          | MIT               |
| Grupos do Elo                          | Curadoria própria (`games/elo/data/puzzles.json`)                                                  | MIT               |
| Capitais e grafias aceitas (Capital)   | Curadoria própria (`games/capital/data/capitals.json`)                                             | MIT               |
| Grupos do Elo traduzidos               | [Only Connect Wall](https://github.com/TaatiTeam/OCW) (Alavi et al., NeurIPS 2023): grupos traduzidos e adaptados ao português, recombinados em desafios novos. Os ids originais ficam no campo `source` | MIT               |
| Vetores de palavras (Sentido)          | Word2vec skip-gram 300d do [repositório de word embeddings do NILC/USP](http://nilc.icmc.usp.br/nilc/index.php/repositorio-de-word-embeddings-do-nilc) (Hartmann et al., 2017), via a cópia [pt-mteb](https://huggingface.co/pt-mteb/average_pt_nilc_word2vec_skip_s300). Reduzidos e reordenados em `scripts/build-sentido.ts` | Não declarada; o NILC pede citação |
| Vocabulário e formas flexionadas (Sentido e Colmeia) | [Wiktionary](https://en.wiktionary.org/), seção de português, extraído pelo [kaikki.org](https://kaikki.org/) | CC BY-SA 4.0      |
| Colmeias do dia                        | Geradas em `scripts/build-colmeia.ts` das palavras acima, filtradas pela frequência do [fserb/pt-br](https://github.com/fserb/pt-br) (`games/colmeia/data/puzzles.json`) | CC BY-SA 4.0      |
| Palavras secretas do Sentido           | Curadoria própria (`games/sentido/data/answers.json`)                                              | MIT               |
| Geometria e centroides dos países      | [Natural Earth](https://www.naturalearthdata.com/) 1:50m Admin 0                                  | Domínio público   |
| Distância entre fronteiras (Calor)     | Calculada dos contornos do Natural Earth 1:110m (1:50m para microestados) em `scripts/build-data.ts` | Domínio público   |
| Fronteiras terrestres (Rota)           | Calculadas da geometria do Natural Earth: vizinhos compartilham vértices na divisa (`scripts/build-data.ts`) | Domínio público   |
| Bandeiras                              | [flag-icons](https://github.com/lipis/flag-icons)                                                 | MIT               |
| Nomes dos países em PT-BR              | Unicode CLDR, via `Intl.DisplayNames`, com ajustes em `scripts/country-list.ts`                    | Unicode License   |
| Microinterações                        | [Microkit](https://microkit.co)                                                                   | MIT               |
| Fonte das imagens de prévia de link    | [Archivo](https://fonts.google.com/specimen/Archivo), de Omnibus-Type (`assets/fonts/`)            | SIL Open Font License |
| Animação da chama da sequência        | "Streak Fire", de Dhawal Patel, na [LottieFiles](https://lottiefiles.com) (`components/streak/fire-streak.json`) | Lottie Simple License |

Os países são os 193 membros da ONU mais Kosovo, Palestina, Taiwan e Vaticano. No País, os que têm menos de 10.000 km² podem ser chutados, mas nunca são a resposta, porque a silhueta deles vira um pontinho.

## Contribuindo

Veja o [CONTRIBUTING.md](CONTRIBUTING.md). Adicionar um jogo é criar uma pasta e registrar duas linhas.

## Licença

MIT
