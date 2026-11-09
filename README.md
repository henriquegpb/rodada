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
| **Rainhas**  | O Queens do LinkedIn: uma rainha por linha, coluna e cor, sem nenhuma encostar na outra. Tabuleiros de 8×8 (o da rodada), 9×9 e 10×10, cada um com seu desafio do dia; todos têm solução única e saem por dedução. Rainha errada custa uma das 3 vidas; há 3 dicas. |
| **Sentido**  | Achar a palavra secreta pelo sentido: cada chute ganha uma posição numa lista de proximidade (1 é a resposta), como no Contexto. Tem dicas; sem limite de chutes; dá para desistir. |
| **Grau**     | Dois ângulos por dia, 7 tentativas para os dois: diga quantos graus tem o primeiro e desenhe o segundo arrastando o braço. Vale errar por até 2°; cada erro diz se é maior ou menor e quão perto ficou (Fervendo a Gelado). |
| **Escala**   | 5 rodadas: um bicho aparece no tamanho de verdade, com a altura ou o comprimento, e você arrasta o outro até o tamanho certo ao lado dele. Até 100 pontos por rodada. O modo **Países** faz o mesmo com as silhuetas do mapa, de norte a sul. |
| **Ordem**    | 5 países por dia para pôr em ordem de área, do maior para o menor, em 5 tentativas. Cada tentativa trava os que estão no lugar certo e mostra a área deles; os outros não dizem se sobem ou descem. |

O foco do produto é a camada social: grupos, ranking diário e sequências. As partidas ficam salvas no navegador e, com login, também no servidor, que mantém Contas, Grupos, Rankings e Conquistas. Veja [Backend](#backend) para subir o login e os Rankings.

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
pnpm data:rainhas # regenera os tabuleiros das Rainhas (alguns minutos)
pnpm db:migrate   # aplica as migrações do banco no DATABASE_URL
pnpm db:generate  # gera uma migração depois de mudar server/db/schema.ts
```

O `.env.example` lista as variáveis. Para jogar, nenhuma é obrigatória; o login e os Rankings precisam de um Postgres (veja [Backend](#backend)).

## Como funciona

```
app/                  rotas (Next.js App Router): /, /[jogo], /perfil, /ranking, /grupos
games/                um módulo por jogo + registro (veja CONTRIBUTING.md)
  types.ts            contrato comum a todos os jogos
  index.ts            registro da parte de UI
  engines.ts          registro da parte que conhece a resposta
  palavra/ bandeira/ pais/
  _shared/geo/        base comum dos jogos de país (busca, distância, direção, tabuleiro)
lib/
  daily/              data em America/Sao_Paulo, seed, sorteio do dia
  plays/              partidas salvas no navegador + serviço que fala com a engine
  ranking/            Conta logada, buscas de Rankings e Grupos na API e dados de mentira (?mock)
  stats.ts scoring.ts estatísticas, sequências, pontuação e Nota
  achievements.ts     registro das Conquistas e seus Níveis
  i18n/               todos os textos da plataforma (PT-BR)
components/
  microkit/           microinterações do Microkit, adaptadas
  ui/                 shadcn/ui
server/               backend: banco, login, partidas, Rankings, Grupos e Perfis (veja Backend, abaixo)
app/api/              rotas HTTP do backend
scripts/build-data.ts gera os dados dos jogos a partir das fontes abertas
```

**Desafio do dia.** `pickDaily` percorre uma permutação da lista de respostas, embaralhada com uma seed. Assim não há repetição até a lista acabar. O resultado é determinístico para a mesma data e o mesmo segredo (`NEXT_PUBLIC_DAILY_SEED`). O segredo existe porque o código e as listas são abertos: sem ele, qualquer pessoa calcularia a resposta de amanhã.

**Engine e UI separadas.** Cada jogo tem uma `engine.ts`, que gera o desafio e valida as tentativas, e um `index.ts` com a interface. A UI nunca importa a engine: ela fala com `lib/plays/service.ts`, que chama a engine no próprio navegador. Ao terminar, a partida do dia vai para o servidor, que refaz cada chute com a mesma engine antes de dar a Nota. **A resposta ainda chega ao navegador, então quem abrir o DevTools consegue achá-la.** O próximo passo é gerar o desafio só no servidor.

**Tipos de jogo.** Cada jogo declara suas regras (`meta.rules`): **por tentativas** (Palavra, País, Mosaico, Rota, Grau, Ordem: acertar em até N chutes), **sem limite** (Calor, Elo e Sentido: chutar até acertar, ou desistir), **por tempo** (Mundo: achar o máximo antes do relógio zerar) **quiz** (Capital e Bandeira: 10 perguntas seguidas, uma resposta cada) ou **por pontos** (Colmeia e Escala: cada achado vale pontos, até achar tudo ou encerrar) ou **por vidas** (Rainhas: montar a solução peça por peça; cada peça errada custa uma vida). No jogo por tempo, o relógio começa ao clicar em "Começar" e continua correndo mesmo se a pessoa fechar a página.

**Pontuação**: nos jogos por tentativas, `tentativas máximas + 1 − tentativas usadas` (ou a curva do jogo, como no Grau, em que 2 tentativas é o mínimo e vale 100), e derrota vale 0. No jogo por tempo, um ponto por item achado; no quiz, um por acerto; por pontos, os do próprio jogo; por vidas, um por vida que sobrou. Para os Rankings, esse Score bruto vira a **Nota** (0–100 do máximo possível no desafio), e o **Score diário** é a soma das Notas dos jogos da Rodada.

**Ranking e Grupos.** `/ranking` mostra o Ranking do dia: o geral (Score diário, a soma das Notas de todos os jogos, Modos inclusive) e um por jogo (a Nota daquela partida, Modos inclusive), trocados por abas. Qualquer pessoa vê; para aparecer, entra na Conta (Google ou link por e-mail) e as partidas já guardadas no navegador vão junto, uma vez por Conta. Em `/grupos` dá para criar um Grupo, chamar a turma pelo link de convite (`/grupos/convite?c=…`) e ver o mesmo ranking só entre os membros. Para desenhar essas telas sem banco, abra com `?mock` (só fora de produção).

**Sequências.** A sequência de cada jogo por tentativas ou por vidas conta vitórias seguidas, e perder zera. No jogo por tempo, no quiz e por pontos, conta dias jogados. A sequência geral conta dias seguidos com pelo menos um jogo terminado. As duas continuam vivas até o fim do dia seguinte.

## Backend

Só é preciso para o login, os Grupos e os Rankings; os jogos funcionam sem ele.

1. Crie um Postgres no [Neon](https://neon.tech) (o plano grátis serve). O servidor usa o driver serverless do Neon, que fala por WebSocket, então um Postgres local comum não conecta direto.
2. No `.env.local`, preencha `DATABASE_URL`, `BETTER_AUTH_SECRET` (`openssl rand -base64 32`) e `BETTER_AUTH_URL`.
3. Rode `pnpm db:migrate`.
4. Entre pelo link mágico: sem `RESEND_API_KEY`, o link aparece no terminal do `pnpm dev`. O Google e as fotos de perfil (Vercel Blob) são opcionais.

Para ter as ferramentas de Dev numa Conta, marque `dev = true` na tabela `user`. Os testes do servidor não precisam de nada disso: rodam num Postgres em memória (PGlite).

As rotas ficam em `app/api/` e a lógica em `server/`:

| Rota | O que faz |
| ---- | --------- |
| `POST /api/plays`, `POST /api/plays/start` | Envia a partida do dia (refeita pela engine) e começa o relógio dos jogos com tempo |
| `POST /api/plays/import` | Importa, uma vez por Conta, as partidas guardadas no navegador |
| `GET /api/rankings` | Ranking do dia, dos 30 dias, por jogo ou de um Grupo |
| `GET`/`PATCH /api/me`, `POST /api/me/avatar` | O próprio Perfil: nome, handle, bio e foto |
| `GET /api/profiles/[handle]`, `GET /api/handles/[handle]` | Perfil público e se um handle está livre |
| `/api/groups/…` | Criar, editar, entrar, sair, convidar e remover membros |
| `DELETE /api/accounts/[id]` | Dev exclui a Conta de outra pessoa |

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
| Áreas dos países (Ordem)               | Calculadas da geometria do Natural Earth (`areaKm2` em `games/_shared/geo/countries.json`); os países são os dos níveis 1 e 2 da Bandeira | Domínio público   |
| Distância entre fronteiras (Calor)     | Calculada dos contornos do Natural Earth 1:110m (1:50m para microestados) em `scripts/build-data.ts` | Domínio público   |
| Fronteiras terrestres (Rota)           | Calculadas da geometria do Natural Earth: vizinhos compartilham vértices na divisa (`scripts/build-data.ts`) | Domínio público   |
| Silhuetas dos bichos (Escala)          | [PhyloPic](https://www.phylopic.org), só imagens em domínio público (CC0 ou Public Domain Mark), recortadas em `public/escala/`; autor e link de cada uma em `games/escala/data/animals.json`. Tamanhos: médias de adultos, curadoria própria | CC0 / Domínio público |
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
