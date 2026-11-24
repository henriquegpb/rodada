/**
 * As categorias do Incomum e de onde vêm as respostas de cada uma. Lido por build-incomum.ts.
 *
 * A maioria é uma consulta ao Wikidata: tudo de um tipo ("raça de cachorro") que tenha artigo na
 * Wikipédia em português. Nas listas enormes (jogadores, ilhas), `minLinks` corta pelo número de
 * Wikipédias com artigo sobre o item, para ficar no que alguém pode lembrar.
 */

export type Source =
  /** Consulta ao Wikidata; devolve ?x e, se quiser, ?pop (popularidade no lugar das visitas). */
  | { kind: "sparql"; query: string; optional?: boolean }
  /** Artigos das categorias da Wikipédia, descendo `depth` níveis (padrão 1). */
  | { kind: "category"; titles: string[]; depth?: number; lang?: string }
  /** Artigos ligados a partir das páginas (listas). */
  | { kind: "links"; titles: string[]; lang?: string }
  /**
   * À mão: [nome na tela, ...apelidos]; o artigo da Wikipédia é o do primeiro nome que tiver um. Nome
   * da lista nunca passa de comum; com `rare`, vale pela fama (para incluir nome pouco conhecido).
   */
  | { kind: "manual"; items: string[][]; rare?: boolean }
  /** Municípios do Censo 2022 (código IBGE do estado, ou "all"). */
  | { kind: "ibge"; uf: number | "all"; minPopulation: number }
  /** Filmes ou séries do IMDb por gênero e mínimo de avaliações; os votos medem o quão comum é. */
  | {
      kind: "imdb";
      type?: "movie" | "series";
      genre?: string;
      minVotes: number;
    };

export interface CategorySpec {
  id: string;
  title: string;
  sources: Source[];
  /** Candidatos de listas e categorias só entram se forem destes tipos no Wikidata. */
  classes?: string[];
  /** Tira candidatos destes tipos (ex.: bebida em "prato"). */
  excludeClasses?: string[];
  /** Tira o que vier destas fontes. */
  exclude?: Source[];
  /** Tira itens deste país de origem (P495) ou país (P17). */
  excludeCountry?: string;
  /** Aceita item com artigo só na Wikipédia em inglês (bandas de K-pop, danças pouco conhecidas). */
  allowEnglishOnly?: boolean;
  /**
   * Respostas famosas que precisam ser aceitas. O build avisa quando falta alguma: sinal de que as
   * fontes têm buraco (no Wikidata, One Direction é só "grupo musical", não "boy band").
   */
  mustHave?: string[];
  /** Táxon de qualquer nível vale (morcego é uma ordem); sem isso, só espécie, gênero e variedade. */
  anyRank?: boolean;
  /**
   * A lista à mão vem da mais comum à menos comum, e a ordem conta junto com a fama na Wikipédia
   * (que erra em coisa do dia a dia: serrote quase não tem artigo pelo mundo).
   */
  ordered?: boolean;
}

// ---------- atalhos para as consultas ----------

const PT_ARTICLE = `?article schema:about ?x; schema:isPartOf <https://pt.wikipedia.org/>.`;
const values = (ids: string[]) => ids.map((id) => `wd:${id}`).join(" ");

/** Consulta ao Wikidata com artigo na Wikipédia em português e, opcionalmente, um mínimo de Wikipédias. */
function wd(body: string, { minLinks = 0, anyArticle = false } = {}): Extract<Source, { kind: "sparql" }> {
  const links = minLinks ? `?x wikibase:sitelinks ?links. FILTER(?links >= ${minLinks})` : "";
  return {
    kind: "sparql",
    query: `SELECT DISTINCT ?x WHERE { ${body} ${anyArticle ? "" : PT_ARTICLE} ${links} }`,
  };
}

/** Instância direta de um dos tipos. */
const isA = (...classes: string[]) => `?x wdt:P31 ?class. VALUES ?class { ${values(classes)} }.`;
/** Instância ou subclasse, a qualquer distância (queijos: "brie" é subclasse de "queijo mole", que é de "queijo"). */
const kindOf = (cls: string) => `?x (wdt:P31|wdt:P279)/wdt:P279* wd:${cls}.`;
/** Pessoa com uma das profissões. */
const person = (...jobs: string[]) => `?x wdt:P31 wd:Q5; wdt:P106 ?job. VALUES ?job { ${values(jobs)} }.`;
/** Espécie (ou outro nível) dentro de um grupo da árvore da vida. */
const within = (clade: string, rank = "Q7432") => `?x wdt:P171+ wd:${clade}; wdt:P105 wd:${rank}.`;
/**
 * Os níveis acima da espécie (ordem, família, gênero...) dentro de um grupo: é onde estão "morcego"
 * (Chiroptera) e "golfinho" (Delphinidae). Consulta separada e opcional: pesa mais que a de espécies.
 */
const groupsWithin = (clade: string): Source => ({
  ...wd(
    `VALUES ?rank { wd:Q36602 wd:Q5867959 wd:Q2889003 wd:Q35409 wd:Q2136103 wd:Q164280 wd:Q34740 wd:Q68947 wd:Q2007442 } ?x wdt:P105 ?rank; wdt:P171+ wd:${clade}.`,
  ),
  optional: true,
});
/** Consulta extra: se o Wikidata não responder, a categoria sai só com as outras fontes. */
const optional = (source: Extract<Source, { kind: "sparql" }>): Source => ({
  ...source,
  optional: true,
});
/** Bicho: lista à mão com os nomes que todo mundo fala, espécies do Wikidata e grupos acima delas. */
function animal(id: string, title: string, common: string[][], ...sources: Source[]): CategorySpec {
  return {
    id,
    title,
    anyRank: true,
    sources: [{ kind: "manual", items: common }, ...sources],
    // O artigo do nome tem que ser de bicho: táxon ou "organismo de nome popular" (baleia, gato).
    // "Peru" é o país e "Neon" o elemento; aí vale o próximo nome ("Meleagris", "Tetra-neon").
    classes: ["Q16521", "Q55983715"],
    mustHave: common.slice(0, 12).map(([name]) => name),
  };
}

const BRAZILIAN = `?x wdt:P27 wd:Q155.`;
const FOREIGN = `FILTER NOT EXISTS { ?x wdt:P27 wd:Q155 }`;
const FROM_BRAZIL = `?x wdt:P495|wdt:P17 wd:Q155.`;
const IN_BRAZIL = `?x wdt:P17 wd:Q155.`;

const Q = {
  brazil: "Q155",
  boyBand: "Q216337",
  girlGroup: "Q641066",
  musicalGroup: "Q215380",
  kpop: "Q213665",
  dance: "Q11639",
  typeOfDance: "Q107357104",
  food: "Q2095",
  dish: "Q746549",
  beverage: "Q40050",
  fruit: "Q1364",
  taxon: "Q16521",
};

const city = (id: string, title: string, uf: number | "all", minPopulation = 50_000): CategorySpec => ({
  id,
  title,
  sources: [{ kind: "ibge", uf, minPopulation }],
});

const movies = (id: string, title: string, genre: string, minVotes: number): CategorySpec => ({
  id,
  title,
  sources: [{ kind: "imdb", genre, minVotes }],
});

const series = (id: string, title: string, genre: string | undefined, minVotes: number): CategorySpec => ({
  id,
  title,
  sources: [{ kind: "imdb", type: "series", genre, minVotes }],
});

const simple = (id: string, title: string, ...sources: Source[]): CategorySpec => ({ id, title, sources });

// ---------- bichos: os nomes do dia a dia ----------
// No Wikidata os bichos são espécies com nome científico; "baleia", "macaco" e "cobra" são grupos, e
// "cachorro" é subespécie. Aqui vão os nomes comuns (o primeiro aparece na tela; os outros, inclusive
// o título do artigo na Wikipédia, também valem).

const n = (list: string) => list.split(";").map((item) => item.split("|").map((name) => name.trim()));

const MAMIFEROS = n(
  "Cachorro|Cão;Gato;Cavalo;Vaca|Boi|Gado bovino;Porco|Suíno;Ovelha|Carneiro;Cabra|Bode;Coelho;Rato;Camundongo;Hamster;" +
    "Porquinho-da-índia;Leão;Tigre;Onça|Onça-pintada;Leopardo;Guepardo|Chita;Lobo;Raposa;Urso;Panda|Panda-gigante;" +
    "Urso-polar;Elefante;Girafa;Zebra;Hipopótamo;Rinoceronte;Camelo;Dromedário;Lhama;Alpaca;Veado|Cervo;Alce;Rena;" +
    "Canguru;Coala;Ornitorrinco;Equidna;Gambá;Macaco;Gorila;Chimpanzé;Orangotango;Bugio;Mico-leão-dourado;Sagui;" +
    "Lêmure;Baleia;Baleia-azul;Orca;Golfinho;Boto|Boto-cor-de-rosa;Foca;Leão-marinho;Morsa;Peixe-boi;Lontra;" +
    "Ariranha;Castor;Esquilo;Porco-espinho;Ouriço-cacheiro|Ouriço;Toupeira;Morcego;Tamanduá|Tamanduá-bandeira;Tatu|Cingulata;" +
    "Preguiça|Bicho-preguiça;Capivara;Anta;Paca;Cutia;Quati;Hiena;Javali;Burro|Jumento|Asno;Mula;Búfalo;Bisão;Gnu;" +
    "Antílope;Gazela;Lince;Puma|Onça-parda|Suçuarana;Jaguatirica;Guaxinim;Texugo;Furão;Doninha;Chinchila;Mangusto;" +
    "Suricata|Suricato;Lobo-guará;Cachorro-do-mato|Graxaim-do-mato;Cachalote;Tamanduá-mirim;Ser humano|Humano|Homem",
);

const AVES = n(
  "Galinha|Galo;Pato;Ganso;Peru|Meleagris|Peru (ave);Pombo;Papagaio;Arara;Arara-azul;Periquito;Calopsita;Tucano;Beija-flor|Colibri;" +
    "Bem-te-vi;Sabiá|Sabiá-laranjeira;João-de-barro;Pardal;Canário;Coruja;Águia;Gavião;Falcão;Urubu;Condor;Abutre;" +
    "Pinguim;Avestruz;Ema;Emu;Flamingo;Pelicano;Gaivota;Cisne;Garça;Cegonha;Pavão;Faisão;Codorna;Pica-pau;Andorinha;" +
    "Corvo;Gralha;Albatroz;Quero-quero;Seriema;Tuiuiú;Carcará;Kiwi|Quiuí (ave);Curió;Tico-tico;Rolinha|Rola;Marreco;Jacu;Mutum;" +
    "Harpia|Gavião-real;Gralha-azul;Martim-pescador;Biguá;Cacatua;Maritaca|Maitaca;Coleiro|Coleirinho;Azulão;Trinca-ferro;" +
    "Uirapuru;Sanhaço|Thraupis;Cardeal;Tiziu;Garibaldi|Chrysomus ruficapillus;Socó;Tesourão;Pomba-rola;Dodô;Galinha-d'angola|Angolinha;Perdiz",
);

const PEIXES = n(
  "Tubarão;Tubarão-branco;Tubarão-baleia;Tubarão-martelo;Raia|Arraia;Salmão;Atum;Tilápia;Piranha;Pirarucu;Tambaqui;" +
    "Pacu;Dourado|Coryphaena hippurus;Lambari|Astyanax;Traíra;Tucunaré;Bagre;Pintado;Surubim;Sardinha;Bacalhau;Merluza;Pescada;Robalo|Dicentrarchus labrax;Garoupa;" +
    "Badejo;Linguado;Anchova|Enchova;Cavala|Scomber scombrus;Corvina;Truta;Carpa;Peixe-dourado|Kinguio;Betta|Peixe-de-briga;" +
    "Guppy|Lebiste;Acará-bandeira;Baiacu;Peixe-palhaço;Cavalo-marinho;Peixe-espada;Marlim;Peixe-voador;Moreia;" +
    "Enguia;Barracuda;Peixe-lua;Tainha;Manjuba;Pirapitinga;Curimbatá;Peixe-leão;Peixe-pedra;Arenque;Peixe-gato;" +
    "Bagre-africano;Piraíba;Matrinxã;Jaraqui;Pirarara;Cação;Pargo;Namorado;" +
    "Neon|Tetra-neon|Paracheirodon innesi;Acará-disco|Disco;Pleco|Cascudo;Celacanto;Esturjão;Peixe-diabo",
);

const REPTEIS = n(
  "Cobra|Serpente|Serpentes;Jiboia;Sucuri;Anaconda;Cascavel;Jararaca;Cobra-coral|Coral-verdadeira;Naja;Píton;" +
    "Mamba-negra;Víbora;Surucucu;Jacaré;Crocodilo;Aligátor;Jacaré-de-papo-amarelo;Tartaruga;Tartaruga-marinha;" +
    "Tartaruga-de-couro;Jabuti;Cágado;Lagarto;Lagartixa|Lagartixa-doméstica-tropical;Iguana;Camaleão;Teiú;Dragão-de-komodo;Geco|Gecko;Calango;" +
    "Monstro-de-gila;Tuatara;Gavial;Cobra-cipó|Chironius;Cobra-d'água;Dragão-barbudo;Basilisco;Anfisbena|Cobra-de-duas-cabeças",
);

const ANFIBIOS = n(
  "Sapo;Rã;Perereca;Salamandra;Tritão;Axolote;Cobra-cega|Cecília|Gymnophiona;Sapo-cururu;Rã-touro;Rã-pimenta;" +
    "Sapo-de-chifre;Sapo-pipa;Salamandra-gigante;Salamandra-de-fogo;Rã-dardo-venenosa|Sapo-ponta-de-flecha;" +
    "Sapo-dourado;Sapo-boi;Perereca-verde;Rã-de-vidro;Olm|Proteu",
);

const INSETOS = n(
  "Formiga;Abelha;Vespa;Marimbondo;Mosquito;Pernilongo;Mosca;Barata|Blatódeos;Borboleta;Mariposa;Besouro;Joaninha;Grilo;" +
    "Gafanhoto;Libélula|Anisópteros;Vaga-lume|Pirilampo;Cupim|Térmita;Louva-a-deus;Pulga;Piolho;Cigarra;Bicho-pau;Traça;" +
    "Percevejo|Heterópteros;Barbeiro|Triatoma infestans;Mutuca;Borrachudo;Mosquito-da-dengue|Aedes aegypti;Escaravelho;Besouro-rinoceronte;" +
    "Bicho-da-seda;Mamangava;Tesourinha;Saúva|Formiga-cortadeira;Formiga-de-fogo|Lava-pés;Bicho-de-pé;Gorgulho|Caruncho;" +
    "Pulgão;Cochonilha;Esperança;Mosca-das-frutas|Drosophila;Mosquito-palha;Tanajura;Cigarrinha;Efêmera;" +
    "Inseto-folha;Abelha-europeia|Abelha-europa;Jataí|Jataí-amarela;Mosca-varejeira;Mosca-tsé-tsé;Besouro-hércules;" +
    "Escaravelho-bosteiro|Rola-bosta;Borboleta-monarca;Barata-d'água;Formiga-bala|Tocandira;Marimbondo-caboclo;" +
    "Lagarta-de-fogo|Taturana;Formiga-leão;Tripes;Mosca-branca",
);

// ---------- listas à mão onde o Wikidata não dá conta ----------
// Consultas pesadas demais (a árvore de "ferramenta" pega quase tudo; a de dinossauros passa pelas
// aves). A lista garante as respostas que todo mundo dá; a consulta, quando responde, traz o resto.

const DINOSSAUROS = n(
  "Tiranossauro|Tyrannosaurus|T-rex|Tiranossauro rex;Velociraptor|Velocirraptor;Triceratops|Tricerátops;" +
    "Estegossauro|Stegosaurus;Braquiossauro|Brachiosaurus;Diplodoco|Diplodocus;Brontossauro|Brontosaurus;" +
    "Apatossauro|Apatosaurus;Espinossauro|Spinosaurus;Alossauro|Allosaurus;Anquilossauro|Ankylosaurus;" +
    "Parassaurolofo|Parasaurolophus;Iguanodonte|Iguanodon;Paquicefalossauro|Pachycephalosaurus;" +
    "Dilofossauro|Dilophosaurus;Carnotauro|Carnotaurus;Giganotossauro|Giganotosaurus;" +
    "Argentinossauro|Argentinosaurus;Compsognato|Compsognathus;Galimimo|Gallimimus;Oviraptor;" +
    "Terizinossauro|Therizinosaurus;Deinonico|Deinonychus;Utahraptor;Microraptor;Arqueópterix|Archaeopteryx;" +
    "Maiassaura|Maiasaura;Protoceratops;Estiracossauro|Styracosaurus;Centrossauro|Centrosaurus;" +
    "Torossauro|Torosaurus;Edmontossauro|Edmontosaurus;Coritossauro|Corythosaurus;Lambeossauro|Lambeosaurus;" +
    "Hadrossauro|Hadrosaurus;Celófise|Coelophysis;Herrerassauro|Herrerasaurus;Eoraptor;" +
    "Estauricossauro|Staurikosaurus;Saturnalia|Saturnalia tupiniquim;Irritator;Angaturama;Oxalaia;" +
    "Santanaraptor;Amazonsaurus;Uberabatitan;Maxakalisaurus;Pycnonemosaurus;Abelissauro|Abelisaurus;" +
    "Megalossauro|Megalosaurus;Ceratossauro|Ceratosaurus;Barionix|Baryonyx;Suchomimus;" +
    "Carcarodontossauro|Carcharodontosaurus;Albertossauro|Albertosaurus;Daspletossauro|Daspletosaurus;" +
    "Tarbossauro|Tarbosaurus;Mapussauro|Mapusaurus;Saltassauro|Saltasaurus;Camarassauro|Camarasaurus;" +
    "Mamenquissauro|Mamenchisaurus;Plateossauro|Plateosaurus;Kentrossauro|Kentrosaurus;Nodossauro|Nodosaurus;" +
    "Euoplocéfalo|Euoplocephalus;Psitacossauro|Psittacosaurus;Troodonte|Troodon;Dracorex;Estegoceras|Stegoceras;" +
    "Ornitomimo|Ornithomimus;Struthiomimus;Mononykus;Sinosauropteryx;Yutyrannus;Dreadnoughtus;Patagotitan;" +
    "Amargassauro|Amargasaurus;Nigerssauro|Nigersaurus;Ouranossauro|Ouranosaurus;Muttaburrasaurus;Minmi",
);

const FERRAMENTAS = n(
  "Martelo;Chave de fenda;Chave Phillips;Chave inglesa;Chave de boca;Chave Allen;Alicate;Serrote;Serra;" +
    "Motosserra|Serra elétrica;Furadeira;Parafusadeira;Lixadeira;Esmerilhadeira|Lixadeira angular;Plaina;Formão;" +
    "Lima|Lima (ferramenta);Grosa;Trena|Fita métrica;Nível|Nível de bolha;Esquadro;Prumo;Torno mecânico|Torno;Morsa|Torno de bancada;Grampo|Sargento;" +
    "Marreta;Picareta;Pá;Enxada;Ancinho|Rastelo;Foice;Machado;Facão;Tesoura;Estilete;Canivete;Chave de grifo;" +
    "Pé de cabra;Talhadeira;Colher de pedreiro;Desempenadeira;Rolo de pintura;Pincel;Espátula;" +
    "Pistola de cola quente;Ferro de solda;Maçarico;Máquina de solda;Compressor de ar|Compressor;" +
    "Macaco hidráulico|Macaco;Carrinho de mão;Escada;Multímetro;Paquímetro;Micrômetro;Torquímetro;Rebitadeira;" +
    "Grampeador;Tupia;Serra tico-tico;Serra circular;Esmeril;Bigorna;Tenaz;Cinzel;Broca;Arco de serra;" +
    "Cortador de grama;Roçadeira;Tesoura de poda;Enxadão;Cavadeira;Alavanca;Cunha;Sovela;Punção;Chave de roda;" +
    "Catraca|Chave catraca;Lixa;Desentupidor;Pinça;Pistola de pintura;Chave de impacto;Serra mármore;" +
    "Betoneira;Martelete|Martelo perfurador;Régua;Compasso;Estação de solda",
);

const TIMES_EUROPEUS = n(
  "Real Madrid;Barcelona|FC Barcelona;Manchester United;Liverpool|Liverpool FC;Chelsea|Chelsea FC;" +
    "Arsenal|Arsenal FC;Manchester City;Tottenham|Tottenham Hotspur;Bayern de Munique|FC Bayern München;" +
    "Borussia Dortmund;Juventus|Juventus FC;Milan|AC Milan;Inter de Milão|Internazionale;Roma|AS Roma;" +
    "Napoli|SSC Napoli;Lazio|SS Lazio;PSG|Paris Saint-Germain;Olympique de Marseille|Marseille;" +
    "Lyon|Olympique Lyonnais;Monaco|AS Monaco;Ajax|AFC Ajax;PSV|PSV Eindhoven;Feyenoord;Benfica|SL Benfica;" +
    "Porto|FC Porto;Sporting|Sporting CP;Celtic|Celtic FC;Rangers|Rangers FC;Atlético de Madrid;" +
    "Sevilla|Sevilla FC;Valencia|Valencia CF;Villarreal|Villarreal CF;Real Betis|Betis;Athletic Bilbao;" +
    "Real Sociedad;Bayer Leverkusen;Schalke 04|Schalke;RB Leipzig;Eintracht Frankfurt;Galatasaray;" +
    "Fenerbahçe;Beşiktaş|Besiktas;Olympiacos;Panathinaikos;Anderlecht|RSC Anderlecht;Club Brugge;" +
    "Shakhtar Donetsk;Dínamo de Kiev|Dynamo Kyiv;Spartak Moscou;Zenit|Zenit São Petersburgo;CSKA Moscou;" +
    "Estrela Vermelha|Crvena Zvezda;Partizan|Partizan Belgrado;Dinamo Zagreb;Steaua Bucareste|FCSB;" +
    "Basel|FC Basel;Young Boys;Red Bull Salzburg|Salzburg;Rapid Viena;Copenhague|FC København;" +
    "Malmö|Malmö FF;Rosenborg;Sparta Praga;Slavia Praga;Ferencváros;Legia Varsóvia;Everton|Everton FC;" +
    "Newcastle|Newcastle United;Aston Villa;West Ham|West Ham United;Leeds|Leeds United;Nottingham Forest;" +
    "Leicester|Leicester City;Wolverhampton|Wolves;Southampton|Southampton FC;Fulham|Fulham FC;" +
    "Brighton|Brighton & Hove Albion;Crystal Palace;Sunderland|Sunderland AFC;Fiorentina|ACF Fiorentina;" +
    "Atalanta;Torino|Torino FC;Genoa|Genoa CFC;Sampdoria;Bologna|Bologna FC;Parma|Parma Calcio;" +
    "Udinese;Werder Bremen;Hamburgo|Hamburger SV;Stuttgart|VfB Stuttgart;Borussia Mönchengladbach;" +
    "Wolfsburg|VfL Wolfsburg;Colônia|FC Köln;Union Berlin;Hertha Berlim|Hertha BSC;Nice|OGC Nice;" +
    "Lille|Lille OSC;Rennes|Stade Rennais;Bordeaux|Girondins de Bordeaux;Saint-Étienne|AS Saint-Étienne;" +
    "Nantes|FC Nantes;Lens|RC Lens;Braga|SC Braga;Vitória de Guimarães;Boavista;Celta de Vigo|Celta;" +
    "Deportivo La Coruña;Espanyol|RCD Espanyol;Málaga|Málaga CF;Getafe;Osasuna;Girona|Girona FC;" +
    "AZ Alkmaar|AZ;Twente|FC Twente;Sheriff Tiraspol;Dínamo Moscou;Lokomotiv Moscou;Trabzonspor;" +
    "AEK Atenas;PAOK;Standard de Liège;Genk|KRC Genk;Hajduk Split;Viktoria Plzeň;" +
    "Slovan Bratislava;Ludogorets;Qarabağ;BATE Borisov;Wrexham;Bournemouth|AFC Bournemouth;" +
    "Brentford;Burnley;Watford;Norwich City;Ipswich Town;Blackburn Rovers;Real Zaragoza;Rayo Vallecano;" +
    "Las Palmas;Mallorca|RCD Mallorca;Cagliari;Hellas Verona|Verona;Sassuolo;Empoli;Lecce;Como|Como 1907;" +
    "Mainz 05;Freiburg|SC Freiburg;Hoffenheim;Augsburg;St. Pauli;Strasbourg|RC Strasbourg;Toulouse|Toulouse FC;" +
    "Montpellier;Auxerre;Paris FC",
);

const SUPER_HEROIS = n(
  "Homem-Aranha|Spider-Man;Batman;Super-Homem|Superman;Mulher-Maravilha|Wonder Woman;Homem de Ferro|Iron Man;" +
    "Capitão América|Captain America;Thor (Marvel Comics)|Thor;Hulk;Viúva Negra|Black Widow;Gavião Arqueiro|Hawkeye;" +
    "Pantera Negra|Black Panther;Doutor Estranho|Doctor Strange;Capitã Marvel|Carol Danvers;Flash;" +
    "Lanterna Verde|Green Lantern;Aquaman;Ciborgue|Cyborg;Arqueiro Verde|Green Arrow;Robin;Batgirl;" +
    "Asa Noturna|Nightwing;Supergirl;Shazam|Capitão Marvel (DC Comics);Wolverine;Chapolin Colorado|Chapolin;Ciclope|Cyclops;" +
    "Tempestade|Storm;Jean Grey|Fênix;Noturno|Nightcrawler;Vampira|Rogue;Colossus|Colosso;Fera|Beast;" +
    "Homem de Gelo|Iceman;Professor X|Professor Xavier|Charles Xavier;Deadpool;Demolidor|Daredevil;" +
    "Justiceiro|Punisher;Luke Cage;Punho de Ferro|Iron Fist;Jessica Jones;Motoqueiro Fantasma|Ghost Rider;" +
    "Senhor Fantástico|Sr. Fantástico|Mister Fantastic;Mulher Invisível|Invisible Woman;Tocha Humana|Human Torch;" +
    "Coisa|The Thing;Surfista Prateado|Silver Surfer;Homem-Formiga|Ant-Man;Vespa (Marvel Comics)|Vespa|Wasp;" +
    "Visão (Marvel Comics)|Visão|Vision;Feiticeira Escarlate|Scarlet Witch;Mercúrio (Marvel Comics)|Mercúrio|Quicksilver;" +
    "Falcão (Marvel Comics)|Falcão|Falcon;Soldado Invernal|Winter Soldier|Bucky Barnes;Máquina de Combate|War Machine;" +
    "Groot;Rocket Raccoon|Rocket;Senhor das Estrelas|Star-Lord;Gamora;Drax|Drax, o Destruidor;Shang-Chi;" +
    "Ms. Marvel|Kamala Khan;Miles Morales;Mulher-Hulk|She-Hulk;Nova (Marvel Comics)|Nova;Cavaleiro da Lua|Moon Knight;" +
    "Blade (Marvel Comics)|Blade;Elektra;Ravena (DC Comics)|Ravena|Raven;Estelar|Starfire;Mutano|Beast Boy;" +
    "Besouro Azul|Blue Beetle;Átomo (DC Comics)|Átomo|The Atom;Caçador de Marte|Martian Manhunter;" +
    "Gavião Negro|Hawkman;Canário Negro|Black Canary;Zatanna;John Constantine|Constantine;" +
    "Monstro do Pântano|Swamp Thing;Spawn;Hellboy;Invencível|Invincible;Capitão Planeta|Captain Planet;He-Man;" +
    "She-Ra;Mulher-Aranha|Spider-Woman;Gwen Stacy|Spider-Gwen;Super Choque|Static;Ben 10|Ben Tennyson;" +
    "Homem-Borracha|Plastic Man;Mera;Kid Flash;Superboy;Sr. Incrível|Mr. Incredible;Jubileu|Jubilee;" +
    "Psylocke;Cable;Gambit|Gambito;Lince Negra|Kitty Pryde;X-23|Laura Kinney;Bishop (Marvel Comics)|Bishop;" +
    "Ultraman;Jaspion;Jiraiya;Spectreman;Super Mouse|Mighty Mouse;Mulher-Gato|Catwoman;" +
    "Venom;Arlequina|Harley Quinn;Lanterna Verde (John Stewart)|John Stewart;Sentinela|Sentry;Homem-Múltiplo|Multiple Man;" +
    "Homem-Animal|Animal Man;Questão|The Question;Sr. Destino|Doctor Fate;Vixen;Fogo (DC Comics)|Fire;Gelo (DC Comics)|Ice",
);

// ---------- listas à mão das categorias que o Wikidata deixa pobres ----------
// "Cor" no Wikidata tem 50 itens; remédio, unidade e grife só passavam os famosos no mundo todo.
// Cada lista vem da mais comum para a menos comum (as categorias usam `ordered`).

const CORES = n(
  "Vermelho;Azul;Amarelo;Verde;Preto;Branco;Rosa|Rosa (cor);Roxo;Laranja|Laranja (cor);Marrom|Castanho;" +
    "Cinza|Cinzento;Bege;Dourado|Ouro (cor);Prateado|Prata (cor);Lilás|Lilás (cor);Violeta|Violeta (cor);" +
    "Azul-marinho;Azul-claro;Azul-celeste|Celeste;Verde-claro;Verde-escuro;Vinho|Vinho (cor);Bordô;Turquesa|Turquesa (cor);" +
    "Ciano;Magenta;Anil|Índigo;Fúcsia|Fúcsia (cor);Pink;Rosa-choque;Salmão|Salmão (cor);Coral|Coral (cor);" +
    "Creme|Creme (cor);Marfim|Marfim (cor);Caramelo|Caramelo (cor);Chocolate|Chocolate (cor);Café|Café (cor);" +
    "Verde-limão;Verde-oliva|Oliva (cor);Verde-musgo;Verde-água;Verde-esmeralda|Esmeralda (cor);Verde-menta|Menta (cor);" +
    "Verde-bandeira;Verde-militar;Verde-floresta;Verde-garrafa;Azul-royal;Azul-petróleo;Azul-bebê;Azul-turquesa;" +
    "Azul-cobalto|Cobalto (cor);Azul-piscina;Rosa-bebê;Rosa-claro;Vermelho-escuro;Grená;Carmim;Escarlate;Púrpura;" +
    "Rubi|Rubi (cor);Cereja|Cereja (cor);Framboesa|Framboesa (cor);Ameixa|Ameixa (cor);Berinjela|Berinjela (cor);" +
    "Uva|Uva (cor);Lavanda|Lavanda (cor);Malva|Malva (cor);Orquídea|Orquídea (cor);Pêssego|Pêssego (cor);" +
    "Damasco|Damasco (cor);Mostarda|Mostarda (cor);Ocre;Terracota|Terracota (cor);Ferrugem|Ferrugem (cor);" +
    "Tijolo|Tijolo (cor);Telha;Cobre|Cobre (cor);Bronze|Bronze (cor);Champanhe|Champanhe (cor);Âmbar|Âmbar (cor);" +
    "Açafrão|Açafrão (cor);Limão|Limão (cor);Amarelo-canário;Amarelo-ouro;Gema;Areia|Areia (cor);Cáqui|Caqui (cor);" +
    "Nude;Off-white;Gelo;Pérola|Pérola (cor);Grafite|Grafite (cor);Chumbo|Chumbo (cor);Fumê;Ardósia|Ardósia (cor);" +
    "Jade|Jade (cor);Água-marinha|Água-marinha (cor);Safira|Safira (cor);Ametista|Ametista (cor);Topázio|Topázio (cor);" +
    "Cerúleo;Azul da Prússia;Azul-ultramar|Ultramarino;Verde-abacate;Pistache|Pistache (cor);Verde-neon;Amarelo-neon;" +
    "Mogno|Mogno (cor);Tabaco|Tabaco (cor);Avelã|Avelã (cor);Sépia|Sépia (cor);Siena|Siena queimado;Vermelhão;" +
    "Sangue de boi;Cappuccino|Cappuccino (cor);Areia-claro;Taupe;Gainsboro;Lima|Lima (cor);Chartreuse|Chartreuse (cor);" +
    "Celadon;Glauco;Heliotrópio|Heliotrópio (cor);Cinza-chumbo;Cinza-claro;Preto-azulado;Branco-gelo;Arco-íris",
);

const UNIDADES = n(
  "Metro;Quilômetro|Quilómetro;Centímetro;Milímetro;Quilograma|Quilo;Grama;Litro;Mililitro;Segundo;Minuto;Hora;" +
    "Dia;Semana;Mês;Ano;Década;Século;Milênio;Tonelada;Miligrama;Polegada;Pé|Pé (unidade);Jarda;Milha;Légua;Palmo;" +
    "Braça;Hectare;Alqueire;Acre;Metro quadrado;Metro cúbico;Grau Celsius|Celsius;Grau Fahrenheit|Fahrenheit;Kelvin;" +
    "Watt;Quilowatt;Volt;Ampere|Ampère;Ohm;Joule;Caloria;Quilocaloria;Newton;Pascal;Hertz;Byte;Bit;Kilobyte|Quilobyte;" +
    "Megabyte;Gigabyte;Terabyte;Decibel;Nó|Nó (unidade);Libra|Libra (massa);Onça|Onça (massa);Arroba|Arroba (unidade);" +
    "Galão|Galão (unidade);Barril|Barril (unidade);Quilate;Cavalo-vapor;Mol;Candela;Lúmen;Lux;Ano-luz;Parsec;" +
    "Unidade astronômica;Angstrom|Ångström;Micrômetro|Mícron;Nanômetro;Bar|Bar (unidade);Atmosfera|Atmosfera (unidade);" +
    "Coulomb;Tesla|Tesla (unidade);Weber|Weber (unidade);Henry|Henry (unidade);Farad;Siemens|Siemens (unidade);" +
    "Becquerel;Gray|Gray (unidade);Sievert;Radiano;Esferorradiano;Pixel;Rotação por minuto;Quilômetro por hora;Mach",
);

const GRIFES = n(
  "Gucci;Louis Vuitton;Chanel;Prada;Dior|Christian Dior;Versace;Armani|Giorgio Armani;Dolce & Gabbana;Nike|Nike, Inc.;" +
    "Adidas;Zara;Calvin Klein;Ralph Lauren|Polo Ralph Lauren;Tommy Hilfiger;Lacoste;Hermès;Balenciaga;Givenchy;Burberry;" +
    "Fendi;Valentino|Valentino (empresa);Yves Saint Laurent|Saint Laurent;Hugo Boss;Puma|Puma (empresa);Levi's|Levi Strauss & Co.;" +
    "H&M;Michael Kors;Coach|Coach, Inc.;Marc Jacobs;Moschino;Kenzo;Lanvin;Balmain;Celine|Céline;Loewe;Bottega Veneta;" +
    "Miu Miu;Off-White;Supreme|Supreme (marca);Reebok;Diesel|Diesel (empresa);Guess|Guess (empresa);Gap|Gap Inc.;" +
    "Victoria's Secret;Tiffany & Co.;Cartier;Bulgari|Bvlgari;Ray-Ban;Oakley;Vans;Converse;Timberland;The North Face;" +
    "Patagonia|Patagonia (empresa);Stone Island;Moncler;Alexander McQueen;Vivienne Westwood;Stella McCartney;" +
    "Jean Paul Gaultier;Mugler|Thierry Mugler;Paco Rabanne;Carolina Herrera;Oscar de la Renta;Vera Wang;Tom Ford;" +
    "Max Mara;Missoni;Emilio Pucci;Salvatore Ferragamo;Jimmy Choo;Christian Louboutin;Manolo Blahnik;Dsquared2;" +
    "Philipp Plein;A Bathing Ape|Bape;Fila|Fila (empresa);Champion|Champion (marca);Ellesse;Kappa|Kappa (empresa);" +
    "Uniqlo;Forever 21;Mango|Mango (empresa);Benetton|United Colors of Benetton;Desigual;Abercrombie & Fitch;" +
    "Hollister|Hollister Co.;American Eagle|American Eagle Outfitters;Osklen;Farm|Farm Rio;Animale;Reserva|Reserva (marca);" +
    "Colcci;Ellus;Forum|Forum (marca);Iódice;Alexandre Herchcovitch;Havaianas;Melissa|Melissa (marca);Arezzo;Schutz;" +
    "Hering|Cia. Hering;Lilly Sarti;Cris Barros;Lenny Niemeyer;Ronaldo Fraga;Dudalina;Richards;Rolex;Swarovski;" +
    "Pandora|Pandora (joalheria);Montblanc;Longchamp;Goyard;Rimowa;Brioni;Ermenegildo Zegna|Zegna;Kiton;Loro Piana;" +
    "Bally|Bally (empresa);Tod's;Furla;Etro;Roberto Cavalli;Blumarine;Trussardi;Hackett|Hackett London;Ted Baker;" +
    "Paul Smith|Paul Smith (estilista);Dr. Martens;Birkenstock;Crocs;New Balance;Asics;Mizuno;Under Armour;Lululemon",
);

const BIBLICOS = n(
  "Jesus|Jesus de Nazaré;Moisés;Adão;Eva;Noé;Abraão;Maria|Maria, mãe de Jesus;José|José de Nazaré;Davi (rei|Davi);" +
    "Salomão;Golias;Sansão;Dalila;Pedro (apóstolo)|Pedro|São Pedro;Paulo|Paulo de Tarso;Judas|Judas Iscariotes;" +
    "João Batista;Caim;Abel;Jonas (profeta)|Jonas;Daniel (profeta)|Daniel;Maria Madalena;Lázaro|Lázaro de Betânia;" +
    "Isaque;Jacó (patriarca)|Jacó;José (filho de Jacó)|José do Egito;Sara (mulher de Abraão)|Sara;Arão;Elias (profeta)|Elias;" +
    "Eliseu;Isaías;Jeremias;Ezequiel;Rute (personagem bíblica)|Rute;Ester (personagem bíblica)|Ester;Jó (personagem bíblica)|Jó;" +
    "Saul (rei)|Saul;Samuel (profeta)|Samuel;Josué;Gideão;Débora (profetisa)|Débora;Raquel (personagem bíblica)|Raquel;" +
    "Lia (personagem bíblica)|Lia;Rebeca;Esaú;Benjamim (filho de Jacó)|Benjamim;Rúben;Judá (filho de Jacó)|Judá;Levi;" +
    "Matusalém;Enoque;Sete (personagem bíblico)|Sete;Cam (filho de Noé)|Cam;Sem (filho de Noé)|Sem;Jafé;Ninrode;Agar;" +
    "Ismael;Melquisedeque;Miriã;Zípora;Jetro;Calebe;Raabe;Boaz;Noemi;Ana (mãe de Samuel)|Ana;Eli (sacerdote)|Eli;" +
    "Natã (profeta)|Natã;Bate-Seba;Urias, o hitita;Absalão;Jônatas;Mical;Roboão;Jeroboão;Acabe;Jezabel;Nabucodonosor II;" +
    "Belsazar;Ciro, o Grande;Neemias;Esdras;Zacarias (profeta)|Zacarias;Isabel (mãe de João Batista)|Isabel;Nicodemos;" +
    "Zaqueu;Barrabás;Caifás;Pôncio Pilatos;Herodes, o Grande;Herodes Antipas;Estêvão|Santo Estêvão;Barnabé;Timóteo;" +
    "Tito (bíblico)|Tito;Silas;Lídia|Lídia de Tiatira;Priscila e Áquila;Apolo (bíblico)|Apolo;Matias (apóstolo)|Matias;" +
    "André (apóstolo)|André;Tiago|Tiago, filho de Zebedeu;Tiago Menor;João|João, o Apóstolo;Mateus (apóstolo)|Mateus;" +
    "Marcos|Marcos, o Evangelista;Lucas|Lucas, o Evangelista;Tomé (apóstolo)|Tomé;Filipe (apóstolo)|Filipe;" +
    "Bartolomeu (apóstolo)|Bartolomeu;Judas Tadeu;Simão, o Zelote;José de Arimateia;Salomé;Herodias;Marta de Betânia;" +
    "Maria de Betânia;Lúcifer|Satanás;Gabriel (arcanjo)|Gabriel;Miguel (arcanjo)|Miguel;Rafael (arcanjo)|Rafael;Balaão;" +
    "Jael;Sísera;Joabe;Abner;Amnom;Tamar;Diná;Labão;Potifar;Nabote;Ló;Mulher de Ló;Oseias;Amós;Miqueias;Habacuque;" +
    "Sofonias;Ageu;Malaquias;Obadias;Joel (profeta)|Joel;Naum;Baruque;Tobias;Judite (personagem bíblica)|Judite;Susana;" +
    "Holofernes;Lameque;Tubalcaim;Jubal;Jairo;Bartimeu;Cornélio (centurião)|Cornélio;Ananias e Safira;Simão Mago;Eutico",
);

const REMEDIOS = n(
  "Paracetamol;Dipirona|Metamizol;Ibuprofeno;Ácido acetilsalicílico|Aspirina|AAS;Amoxicilina;Omeprazol;Losartana;" +
    "Metformina;Insulina;Sinvastatina;Diclofenaco;Nimesulida;Azitromicina;Dexametasona;Prednisona;Loratadina;" +
    "Fluoxetina;Sertralina;Clonazepam|Rivotril;Diazepam|Valium;Alprazolam;Escitalopram;Paroxetina;Amitriptilina;" +
    "Sildenafila|Sildenafil|Viagra;Tadalafila|Tadalafil;Semaglutida|Ozempic;Ivermectina;Cloroquina;Hidroxicloroquina;" +
    "Atorvastatina;Captopril;Enalapril;Anlodipino;Hidroclorotiazida;Furosemida;Propranolol;Atenolol;Carvedilol;" +
    "Levotiroxina;Varfarina;Heparina;Clopidogrel;Ranitidina;Pantoprazol;Buscopan|Butilescopolamina|Escopolamina;" +
    "Dimenidrinato|Dramin;Ondansetrona;Metoclopramida;Domperidona;Loperamida;Simeticona;Cetoprofeno;Naproxeno;" +
    "Morfina;Codeína;Tramadol;Fentanil;Oxicodona;Metadona;Cetirizina;Desloratadina;Dexclorfeniramina;Prometazina;" +
    "Zolpidem;Lorazepam;Bupropiona;Venlafaxina;Duloxetina;Quetiapina;Risperidona;Olanzapina;Haloperidol;" +
    "Carbonato de lítio|Lítio;Metilfenidato|Ritalina;Lisdexanfetamina|Venvanse;Cafeína;Melatonina;" +
    "Carbamazepina;Ácido valproico;Fenobarbital;Gabapentina;Pregabalina;Topiramato;Levetiracetam;Fenitoína;" +
    "Glibenclamida;Sitagliptina;Dapagliflozina;Liraglutida;Espironolactona;Digoxina;Nitroglicerina;Salbutamol;" +
    "Budesonida;Montelucaste;Ciprofloxacino;Levofloxacino;Cefalexina;Ceftriaxona;Penicilina;Benzilpenicilina benzatina|Benzetacil;" +
    "Doxiciclina;Tetraciclina;Clindamicina;Vancomicina;Metronidazol;Sulfametoxazol;Fluconazol;Cetoconazol;Nistatina;" +
    "Aciclovir;Oseltamivir|Tamiflu;Albendazol;Mebendazol;Praziquantel;Finasterida;Minoxidil;Isotretinoína|Roacutan;" +
    "Tretinoína;Adrenalina|Epinefrina;Atropina;Lidocaína;Cetamina;Propofol;Toxina botulínica|Botox;Metotrexato;" +
    "Tamoxifeno;Ciclofosfamida;Cisplatina;Anticoncepcional|Pílula anticoncepcional;Levonorgestrel;Progesterona;" +
    "Testosterona;Estradiol;Ocitocina;Naloxona;Clorexidina;Nitazoxanida|Annita;Colchicina;Alopurinol;Hidrocortisona",
);

const VERDURAS = n(
  "Alface;Tomate;Cenoura;Batata;Cebola;Alho;Couve;Repolho;Brócolis|Brócolos;Couve-flor;Espinafre;Rúcula;Agrião;" +
    "Beterraba;Abóbora;Abobrinha;Berinjela;Pimentão;Pepino;Chuchu;Quiabo;Jiló;Maxixe;Vagem;Ervilha;Milho;" +
    "Mandioca|Aipim|Macaxeira;Inhame;Cará;Batata-doce;Mandioquinha|Batata-baroa;Rabanete;Nabo;Acelga;Chicória;" +
    "Almeirão;Aspargo;Alcachofra;Alho-poró;Salsão|Aipo;Erva-doce|Funcho;Palmito;Couve-de-bruxelas;Endívia;Radicchio;" +
    "Taioba;Ora-pro-nóbis;Bertalha;Gengibre;Feijão;Lentilha;Grão-de-bico;Soja;Fava;Tremoço;Cebolinha;Salsa;Coentro;" +
    "Cogumelo;Couve-chinesa|Acelga chinesa;Pak choi;Mostarda (planta)|Mostarda;Broto de bambu;Broto de feijão;" +
    "Pimenta;Jerimum;Moranga;Abóbora-menina;Mandioca-brava;Batata-yacon|Yacon;Tupinambo|Topinambur;Cherovia;Pastinaca",
);

/** Folclore brasileiro menos conhecido: entra pela lista, mas vale pela fama (pode ser raríssimo). */
const CRIATURAS_RARAS = n(
  "Mapinguari;Corpo-seco;Pisadeira;Papa-figo;Mãe do Ouro;Matinta Perera;Capelobo;Labatut (folclore)|Labatut;Bradador;" +
    "Cabeça de cuia;Romãozinho;Boiúna;Cobra Norato;Mão de cabelo;Quibungo;Caboclo-d'água;Lobisomem (folclore brasileiro)",
);

const CRIATURAS = n(
  "Saci|Saci-pererê;Iara|Uiara|Mãe-d'água;Curupira;Boitatá;Mula sem cabeça;Boto|Boto (lenda)|Boto-cor-de-rosa (lenda);" +
    "Lobisomem;Cuca|Cuca (folclore);Caipora;Bicho-papão;" +
    "Negrinho do Pastoreio;" +
    "Dragão;Unicórnio;Fênix;Sereia;Centauro;Minotauro;Medusa|Medusa (mitologia);Pégaso;Grifo;Hidra de Lerna|Hidra;" +
    "Ciclope;Quimera|Quimera (mitologia);Esfinge;Kraken;Vampiro;Zumbi|Zumbi (mitologia);Fada;Elfo;Duende;Gnomo;Troll;" +
    "Ogro;Gigante|Gigante (mitologia);Yeti|Abominável homem das neves;Pé-grande;Chupa-cabra;Monstro do Lago Ness|Nessie;" +
    "Leviatã;Basilisco;Cérbero;Harpia|Harpia (mitologia);Sátiro;Fauno;Golem;Banshee;Gárgula;Wendigo;Kitsune;Tengu;" +
    "Djinn|Gênio;Mothman|Homem-Mariposa;Kappa (folclore)|Kappa;Valquíria;Ninfa;Náiade;Dríade;Sílfide;Salamandra (mitologia);" +
    "Hipogrifo;Mantícora;Behemoth;Tarasca;Bunyip;Chimera;Cockatrice;Lâmia;Súcubo;Íncubo;Ghoul|Gul;Múmia;Fantasma;" +
    "Bruxa;Anjo;Demônio;Querubim;Serafim;Tritão (mitologia)|Tritão;Cila|Cila (mitologia);Caríbdis;Equidna (mitologia)",
);

// ---------- listas à mão ----------

/** As 55 especialidades reconhecidas pelo CFM, com os nomes curtos que as pessoas usam. */
const CFM_SPECIALTIES: string[][] = [
  ["Acupuntura"],
  ["Alergia e Imunologia", "Alergologia", "Imunologia", "Alergia"],
  ["Anestesiologia", "Anestesia"],
  ["Angiologia"],
  ["Cardiologia"],
  ["Cirurgia Cardiovascular", "Cirurgia cardíaca"],
  ["Cirurgia da Mão"],
  ["Cirurgia de Cabeça e Pescoço"],
  ["Cirurgia do Aparelho Digestivo", "Cirurgia digestiva"],
  ["Cirurgia Geral"],
  ["Cirurgia Oncológica"],
  ["Cirurgia Pediátrica"],
  ["Cirurgia Plástica", "Plástica"],
  ["Cirurgia Torácica"],
  ["Cirurgia Vascular"],
  ["Clínica Médica", "Clínico geral", "Clínica geral", "Medicina interna"],
  ["Coloproctologia", "Proctologia"],
  ["Dermatologia"],
  ["Endocrinologia e Metabologia", "Endocrinologia"],
  ["Endoscopia"],
  ["Gastroenterologia"],
  ["Genética Médica", "Genética"],
  ["Geriatria"],
  ["Ginecologia e Obstetrícia", "Ginecologia", "Obstetrícia"],
  ["Hematologia e Hemoterapia", "Hematologia", "Hemoterapia"],
  ["Homeopatia"],
  ["Infectologia"],
  ["Mastologia"],
  ["Medicina de Emergência", "Emergência"],
  ["Medicina de Família e Comunidade", "Medicina de família"],
  ["Medicina do Trabalho"],
  ["Medicina de Tráfego"],
  ["Medicina Esportiva", "Medicina do esporte"],
  ["Medicina Física e Reabilitação", "Fisiatria"],
  ["Medicina Intensiva", "Terapia intensiva", "UTI"],
  ["Medicina Legal e Perícia Médica", "Medicina legal"],
  ["Medicina Nuclear"],
  ["Medicina Preventiva e Social", "Medicina preventiva"],
  ["Nefrologia"],
  ["Neurocirurgia"],
  ["Neurologia"],
  ["Nutrologia"],
  ["Oftalmologia"],
  ["Oncologia Clínica", "Oncologia"],
  ["Ortopedia e Traumatologia", "Ortopedia", "Traumatologia"],
  ["Otorrinolaringologia", "Otorrino"],
  ["Patologia"],
  ["Patologia Clínica", "Medicina laboratorial"],
  ["Pediatria"],
  ["Pneumologia"],
  ["Psiquiatria"],
  ["Radiologia e Diagnóstico por Imagem", "Radiologia"],
  ["Radioterapia"],
  ["Reumatologia"],
  ["Urologia"],
];

/** Pratos do Nordeste que as categorias da Wikipédia não pegam (ou pegam com outro nome). */
const NORDESTE_DISHES: string[][] = [
  ["Acarajé"],
  ["Abará"],
  ["Vatapá"],
  ["Caruru"],
  ["Moqueca baiana", "Moqueca"],
  ["Bobó de camarão", "Bobó"],
  ["Xinxim de galinha", "Xinxim"],
  ["Efó"],
  ["Baião de dois", "Baião de 2"],
  ["Buchada de bode", "Buchada"],
  ["Sarapatel"],
  ["Carne de sol"],
  ["Carne de sol com macaxeira"],
  ["Paçoca de carne de sol", "Paçoca"],
  ["Arrumadinho"],
  ["Galinha à cabidela", "Galinha de cabidela", "Cabidela"],
  ["Sururu"],
  ["Mungunzá", "Munguzá"],
  ["Bolo de rolo"],
  ["Bolo Souza Leão"],
  ["Cartola"],
  ["Queijo coalho"],
  ["Manteiga de garrafa"],
  ["Rapadura"],
  ["Maria Isabel", "Arroz maria isabel"],
  ["Arroz de cuxá", "Cuxá"],
  ["Panelada"],
  ["Mão de vaca"],
  ["Peixada cearense", "Peixada"],
  ["Caranguejada", "Caranguejo"],
  ["Feijão verde"],
  ["Cocada"],
  ["Tapioca"],
  ["Cuscuz nordestino", "Cuscuz"],
  ["Beiju"],
  ["Pamonha"],
  ["Canjica"],
  ["Rubacão"],
  ["Pirão"],
  ["Sarrabulho"],
  ["Galinha caipira"],
  ["Bode guisado", "Bode assado"],
  ["Carneiro guisado"],
  ["Escondidinho de carne de sol", "Escondidinho"],
  ["Feijoada de frutos do mar"],
  ["Moqueca de arraia"],
  ["Casquinha de siri"],
  ["Acarajé com vatapá"],
  ["Cuscuz de tapioca"],
  ["Bolinho de estudante"],
  ["Queijada"],
  ["Doce de leite de cabra"],
  ["Arroz de leite"],
  ["Maxixada"],
  ["Feijão tropeiro nordestino"],
  ["Chambaril"],
  ["Picado"],
  ["Dobradinha"],
  ["Tripa assada"],
  ["Patinho"],
  ["Lagosta grelhada"],
  ["Camarão na moranga"],
  ["Ginga com tapioca"],
  ["Tapioca de coco"],
  ["Mugunzá salgado"],
  ["Bolo de macaxeira", "Bolo de mandioca"],
  ["Pé de moleque"],
  ["Cocada de forno"],
  ["Maniçoba"],
  ["Rabada"],
  ["Mocotó"],
  ["Fava"],
  ["Bredo"],
  ["Torta de caranguejo"],
  ["Peixe frito com tapioca"],
];

// ---------- as categorias ----------

export const CATEGORIES: CategorySpec[] = [
  // --- Brasil: cidades ---
  city("cidade-sp", "Cidade do estado de São Paulo com 50 mil+ habitantes", 35),
  city("cidade-mg", "Cidade de Minas Gerais com 50 mil+ habitantes", 31),
  city("cidade-rj", "Cidade do estado do Rio com 50 mil+ habitantes", 33),
  city("cidade-ba", "Cidade da Bahia com 50 mil+ habitantes", 29),
  city("cidade-rs", "Cidade do Rio Grande do Sul com 50 mil+ habitantes", 43),
  city("cidade-pr", "Cidade do Paraná com 50 mil+ habitantes", 41),
  city("cidade-sc", "Cidade de Santa Catarina com 50 mil+ habitantes", 42),
  city("cidade-pe", "Cidade de Pernambuco com 50 mil+ habitantes", 26),
  city("cidade-ce", "Cidade do Ceará com 50 mil+ habitantes", 23),
  city("cidade-go", "Cidade de Goiás com 30 mil+ habitantes", 52, 30_000),
  city("cidade-pa", "Cidade do Pará com 50 mil+ habitantes", 15),
  city("cidade-brasil-300mil", "Cidade brasileira com 300 mil+ habitantes", "all", 300_000),

  // --- Brasil: cultura e gente ---
  // Novela no Wikidata é série de TV do gênero telenovela, quase nunca "instância de telenovela".
  simple(
    "novela-brasileira",
    "Novela brasileira",
    wd(`{ ${isA("Q23745")} } UNION { ?x wdt:P136 wd:Q23745. } ${FROM_BRAZIL}`),
  ),
  simple(
    "programa-tv-brasileiro",
    "Programa de TV brasileiro",
    wd(`${isA("Q5398426", "Q15416", "Q182415")} ${FROM_BRAZIL}`),
  ),
  simple("filme-brasileiro", "Filme brasileiro", wd(`${isA("Q11424")} ${FROM_BRAZIL}`)),
  simple("cantor-brasileiro", "Cantor ou cantora brasileira", wd(`${person("Q177220", "Q488205")} ${BRAZILIAN}`)),
  simple("banda-brasileira", "Banda ou grupo musical brasileiro", wd(`${isA("Q215380", "Q5741069")} ${FROM_BRAZIL}`)),
  simple(
    "ator-brasileiro",
    "Ator ou atriz brasileira",
    wd(`${person("Q33999", "Q10798782", "Q10800557")} ${BRAZILIAN}`),
  ),
  simple("humorista-brasileiro", "Humorista brasileiro", wd(`${person("Q245068")} ${BRAZILIAN}`)),
  simple("youtuber-brasileiro", "Youtuber ou influenciador brasileiro", wd(`${person("Q17125263")} ${BRAZILIAN}`)),
  simple(
    "apresentador-brasileiro",
    "Apresentador ou apresentadora de TV brasileira",
    wd(`${person("Q947873")} ${BRAZILIAN}`),
  ),
  simple(
    "escritor-brasileiro",
    "Escritor ou poeta brasileiro",
    wd(`${person("Q36180", "Q49757", "Q6625963")} ${BRAZILIAN}`),
  ),
  simple("sertanejo", "Cantor ou dupla de sertanejo", wd(`?x wdt:P136 wd:Q1958273.`)),
  simple("funk", "Artista de funk", wd(`?x wdt:P136 wd:Q1931130.`)),
  simple("mpb", "Artista de MPB", wd(`?x wdt:P136 wd:Q1046768.`)),
  simple("forro-axe", "Artista de forró ou axé", wd(`?x wdt:P136 ?g. VALUES ?g { wd:Q586110 wd:Q1435485 }.`)),
  simple("escola-de-samba", "Escola de samba", wd(isA("Q2641403"))),
  simple("jogador-selecao", "Jogador que já jogou pela Seleção Brasileira", wd(`?x wdt:P54 wd:Q83459.`)),
  simple("time-brasileiro", "Time de futebol brasileiro", wd(`${isA("Q476028")} ${IN_BRAZIL}`)),
  simple(
    "empresa-brasileira",
    "Empresa ou marca brasileira",
    wd(`${isA("Q4830453", "Q6881511", "Q891723", "Q431289")} ${IN_BRAZIL}`, {
      minLinks: 4,
    }),
  ),
  simple("praia-brasileira", "Praia brasileira", wd(`${isA("Q40080")} ${IN_BRAZIL}`)),
  simple("rio-brasileiro", "Rio brasileiro", wd(`${isA("Q4022")} ${IN_BRAZIL}`, { minLinks: 5 })),
  {
    id: "bairro-rio",
    title: "Bairro da cidade do Rio de Janeiro",
    sources: [
      { kind: "links", titles: ["Lista de bairros da cidade do Rio de Janeiro"] },
      optional(wd(`?x wdt:P31/wdt:P279* wd:Q123705; wdt:P131+ wd:Q8678.`)),
    ],
    // A lista também liga para zonas, regiões e estádios: só fica o que é bairro.
    classes: ["Q123705"],
  },
  simple("universidade-brasileira", "Universidade brasileira", wd(`?x wdt:P31/wdt:P279* wd:Q3918; wdt:P17 wd:Q155.`)),
  simple("comida-brasileira", "Comida típica brasileira", wd(`?x wdt:P495 wd:Q155. ${kindOf(Q.food)}`)),
  {
    id: "prato-nordeste",
    title: "Prato típico do Nordeste",
    sources: [
      { kind: "manual", items: NORDESTE_DISHES },
      {
        kind: "category",
        titles: [
          "Categoria:Culinária da Bahia",
          "Categoria:Culinária de Pernambuco",
          "Categoria:Culinária do Ceará",
          "Categoria:Culinária do Maranhão",
          "Categoria:Culinária da Paraíba",
          "Categoria:Culinária do Rio Grande do Norte",
          "Categoria:Culinária de Alagoas",
          "Categoria:Culinária do Piauí",
        ],
      },
    ],
    classes: [Q.dish],
    excludeClasses: [Q.beverage],
  },

  // --- Mundo ---
  simple("pais", "País (qualquer um)", wd(isA("Q3624078"))),
  simple("pais-europa", "País da Europa", wd(`${isA("Q3624078")} ?x wdt:P30 wd:Q46.`)),
  simple("pais-africa", "País da África", wd(`${isA("Q3624078")} ?x wdt:P30 wd:Q15.`)),
  simple("pais-asia", "País da Ásia", wd(`${isA("Q3624078")} ?x wdt:P30 wd:Q48.`)),
  simple("capital-mundo", "Capital de país", wd(`?country wdt:P31 wd:Q3624078; wdt:P36 ?x.`)),
  simple(
    "cidade-1-milhao",
    "Cidade do mundo com 1 milhão+ de habitantes",
    wd(`?x wdt:P31/wdt:P279* wd:Q515; wdt:P1082 ?people. FILTER(?people >= 1000000)`),
  ),
  simple("rio-mundo", "Rio com mais de 1.000 km", wd(`${isA("Q4022")} ?x wdt:P2043 ?length. FILTER(?length >= 1000)`)),
  simple("montanha", "Montanha ou pico", wd(isA("Q8502"), { minLinks: 10 })),
  simple("vulcao", "Vulcão", wd(isA("Q8072"), { minLinks: 5 })),
  simple("ilha", "Ilha", wd(isA("Q23442"), { minLinks: 15 })),
  simple("deserto", "Deserto", wd(isA("Q8514"))),
  simple("cachoeira", "Cachoeira ou catarata", wd(isA("Q34038"), { minLinks: 3 })),
  simple("lago", "Lago", wd(isA("Q23397"), { minLinks: 15 })),
  simple("idioma", "Idioma (língua)", wd(isA("Q34770", "Q1288568", "Q33742"), { minLinks: 15 })),
  simple("moeda", "Moeda de algum país", wd(isA("Q8142"))),
  simple("estado-eua", "Estado dos EUA", wd(isA("Q35657"))),
  simple("patrimonio-unesco", "Patrimônio Mundial da UNESCO", wd(`?x wdt:P1435 wd:Q9259.`)),
  simple("museu", "Museu", wd(isA("Q33506", "Q207694", "Q17431399"), { minLinks: 10 })),
  simple("castelo", "Castelo ou palácio", wd(isA("Q23413", "Q16560"), { minLinks: 8 })),
  simple("companhia-aerea", "Companhia aérea", wd(isA("Q46970"), { minLinks: 3 })),

  // --- Natureza ---
  simple("raca-cachorro", "Raça de cachorro", wd(isA("Q39367"))),
  simple("raca-gato", "Raça de gato", wd(isA("Q43577"))),
  simple("raca-cavalo", "Raça de cavalo", wd(isA("Q1160573"))),
  animal("mamifero", "Mamífero", MAMIFEROS, wd(within("Q7377")), groupsWithin("Q7377")),
  animal("ave", "Ave", AVES, wd(within("Q5113"), { minLinks: 10 }), groupsWithin("Q5113")),
  animal(
    "peixe",
    "Peixe",
    PEIXES,
    wd(`{ ${within("Q127282")} } UNION { ${within("Q25371")} }`, {
      minLinks: 8,
    }),
  ),
  {
    ...animal("reptil", "Réptil (cobra, lagarto, tartaruga...)", REPTEIS, wd(within("Q10811"), { minLinks: 5 })),
    // No Wikidata as aves descendem dos répteis: sem isso, "pardal" vira réptil.
    exclude: [wd(within("Q5113"), { minLinks: 5 })],
  },
  animal("anfibio", "Anfíbio (sapo, rã, salamandra...)", ANFIBIOS, wd(within("Q10908"), { minLinks: 5 })),
  // Insetos são mais de um milhão de espécies no Wikidata: qualquer consulta pela árvore estoura o
  // tempo. Fica a lista à mão.
  { ...animal("inseto", "Inseto", INSETOS), ordered: true },
  {
    ...simple(
      "dinossauro",
      "Dinossauro",
      { kind: "manual", items: DINOSSAUROS },
      optional(wd(`${within("Q430", "Q34740")} FILTER NOT EXISTS { ?x wdt:P171+ wd:Q5113 }`)),
    ),
    ordered: true,
  },
  {
    id: "arvore-frutifera",
    title: "Árvore frutífera que existe no Brasil",
    sources: [
      { kind: "links", titles: ["Lista de frutas"] },
      { kind: "category", titles: ["Categoria:Frutos do Brasil"] },
    ],
    classes: [Q.fruit, Q.taxon, Q.food],
    // Planta que não é árvore, ou não é fruta.
    exclude: [
      {
        kind: "manual",
        items: [
          ["Chá"],
          ["Tomate"],
          ["Morango"],
          ["Melancia"],
          ["Melão"],
          ["Abacaxi"],
          ["Uva"],
          ["Maracujá"],
          ["Kiwi"],
          ["Framboesa"],
          ["Mirtilo"],
          ["Amora-preta"],
          ["Pimenta"],
          ["Pepino"],
          ["Abóbora"],
          ["Berinjela"],
          ["Café"],
        ],
      },
    ],
  },
  {
    id: "verdura-legume",
    title: "Verdura ou legume",
    // Só a lista: o Wikidata traz variedade regional ("Batata de Trás-os-Montes") e conserva japonesa.
    sources: [{ kind: "manual", items: VERDURAS }],
    // Planta ou comida: "Mostarda" pode ser o molho; "Feijão" é a planta.
    classes: ["Q11004", "Q2095", "Q16521", "Q756", "Q11396303"],
    anyRank: true,
    ordered: true,
  },
  simple("tempero-erva", "Tempero ou erva", wd(`{ ${kindOf("Q42527")} } UNION { ${kindOf("Q207123")} }`)),
  simple(
    "pedra-preciosa",
    "Pedra preciosa ou mineral",
    wd(`{ ${kindOf("Q83437")} } UNION { ${isA("Q12089225")} ?x wikibase:sitelinks ?l. FILTER(?l >= 15) }`),
  ),
  simple("constelacao", "Constelação", wd(isA("Q8928"))),
  simple("lua", "Lua de algum planeta", wd(isA("Q2537"))),

  // --- Filmes e séries (IMDb) ---
  movies("filme-ficcao-cientifica", "Filme de ficção científica com 100 mil+ avaliações no IMDb", "Sci-Fi", 100_000),
  movies("filme-terror", "Filme de terror com 50 mil+ avaliações no IMDb", "Horror", 50_000),
  movies("filme-comedia", "Filme de comédia com 100 mil+ avaliações no IMDb", "Comedy", 100_000),
  movies("filme-animacao", "Filme de animação com 30 mil+ avaliações no IMDb", "Animation", 30_000),
  movies("filme-acao", "Filme de ação com 150 mil+ avaliações no IMDb", "Action", 150_000),
  movies("filme-romance", "Filme de romance com 50 mil+ avaliações no IMDb", "Romance", 50_000),
  movies("filme-guerra", "Filme de guerra com 30 mil+ avaliações no IMDb", "War", 30_000),
  movies("filme-faroeste", "Filme de faroeste com 20 mil+ avaliações no IMDb", "Western", 20_000),
  movies("filme-musical", "Filme musical com 20 mil+ avaliações no IMDb", "Musical", 20_000),
  movies("filme-policial", "Filme policial ou de crime com 100 mil+ avaliações no IMDb", "Crime", 100_000),
  movies("filme-fantasia", "Filme de fantasia com 75 mil+ avaliações no IMDb", "Fantasy", 75_000),
  series("serie-100mil", "Série com 100 mil+ avaliações no IMDb", undefined, 100_000),
  series("serie-comedia", "Série de comédia com 30 mil+ avaliações no IMDb", "Comedy", 30_000),
  series("serie-animada", "Desenho ou série animada com 15 mil+ avaliações no IMDb", "Animation", 15_000),
  series("serie-policial", "Série policial com 30 mil+ avaliações no IMDb", "Crime", 30_000),

  // --- Música, arte e entretenimento ---
  {
    id: "boy-band-girl-group",
    title: "Boy band ou girl group",
    sources: [
      {
        kind: "sparql",
        query: `SELECT DISTINCT ?x WHERE {
          { ?x wdt:P31 ?t. VALUES ?t { wd:${Q.boyBand} wd:${Q.girlGroup} } }
          UNION { ?x wdt:P31 wd:${Q.musicalGroup}; wdt:P136 ?g. VALUES ?g { wd:${Q.boyBand} wd:${Q.girlGroup} wd:${Q.kpop} } }
          }`,
      },
      // O Wikidata deixa de fora boy bands famosas (One Direction, Backstreet Boys): as categorias da
      // Wikipédia cobrem, e a conferência de tipo tira o que não é grupo.
      {
        kind: "category",
        lang: "en",
        titles: ["Category:Boy bands", "Category:Girl groups"],
        depth: 2,
      },
      {
        kind: "category",
        titles: ["Categoria:Boy bands", "Categoria:Girl groups"],
        depth: 2,
      },
    ],
    classes: [Q.musicalGroup, Q.boyBand, Q.girlGroup],
    allowEnglishOnly: true,
    mustHave: [
      "One Direction",
      "Backstreet Boys",
      "Westlife",
      "NSYNC",
      "Spice Girls",
      "Little Mix",
      "Fifth Harmony",
      "Menudo",
      "New Kids on the Block",
      "BTS",
      "Blackpink",
      "Rouge",
      "Twice",
    ],
  },
  simple("banda-rock", "Banda de rock", wd(isA("Q5741069"), { minLinks: 8 })),
  simple(
    "cantora-pop",
    "Cantora pop internacional",
    wd(`${person("Q177220")} ?x wdt:P21 wd:Q6581072; wdt:P136 wd:Q37073. ${FOREIGN}`, { minLinks: 10 }),
  ),
  simple("rapper", "Rapper (de qualquer país)", wd(person("Q2252262"), { minLinks: 10 })),
  simple("dj", "DJ", wd(person("Q130857"), { minLinks: 8 })),
  simple("genero-musical", "Gênero musical", wd(isA("Q188451"), { minLinks: 10 })),
  simple("instrumento-musical", "Instrumento musical", wd(kindOf("Q34379"))),
  simple("pintor", "Pintor ou pintora", wd(person("Q1028181"), { minLinks: 20 })),
  simple("arquiteto", "Arquiteto ou arquiteta", wd(person("Q42973"), { minLinks: 15 })),
  simple(
    "compositor-classico",
    "Compositor de música clássica",
    wd(`${person("Q36834")} ?x wdt:P569 ?born. FILTER(YEAR(?born) < 1900)`, {
      minLinks: 15,
    }),
  ),
  simple("diretor-cinema", "Diretor ou diretora de cinema", wd(person("Q2526255"), { minLinks: 20 })),
  simple("livro", "Livro (romance ou clássico)", wd(isA("Q7725634", "Q8261", "Q47461344"), { minLinks: 20 })),
  simple("videogame", "Videogame", wd(isA("Q7889"), { minLinks: 15 })),
  // Console é "modelo de console" (PlayStation 2) ou modelo de produto que é subclasse de console.
  simple(
    "console",
    "Console de videogame",
    wd(`{ ?x wdt:P31 wd:Q56682555. } UNION { ?x wdt:P31 wd:Q10929058; wdt:P279+ wd:Q8076. }`),
  ),
  simple("pokemon", "Pokémon", {
    kind: "sparql",
    // Cada Pokémon é instância do seu tipo ("Pokémon elétrico"), que é subclasse de espécie Pokémon.
    query: `SELECT DISTINCT ?x ?pop WHERE { ?x wdt:P31/wdt:P279 wd:Q3966183; wikibase:sitelinks ?pop. }`,
  }),
  // No Wikidata, herói é só "personagem de quadrinhos", junto com os vilões: vai à mão.
  {
    id: "super-heroi",
    title: "Super-herói ou super-heroína",
    sources: [{ kind: "manual", items: SUPER_HEROIS }],
    // Personagem (de quadrinhos, desenho, filme, TV): "Thor" é o deus, "Thor (Marvel Comics)" é o herói.
    classes: ["Q95074", "Q1114461", "Q15711870", "Q15773347", "Q15773317"],
    ordered: true,
  },
  simple("personagem-desenho", "Personagem de desenho animado", wd(isA("Q15711870"))),
  simple("personagem-videogame", "Personagem de videogame", wd(isA("Q1569167"))),
  simple("personagem-quadrinhos", "Personagem de quadrinhos", wd(isA("Q1114461"))),
  simple("anime", "Anime ou mangá", wd(isA("Q63952888", "Q21198342", "Q1107"))),
  simple(
    "deus-mitologia",
    "Deus ou deusa de alguma mitologia",
    wd(isA("Q22989102", "Q11688446", "Q16513881", "Q146083", "Q178885")),
  ),
  {
    id: "criatura-mitologica",
    title: "Criatura mitológica ou lendária",
    // O folclore brasileiro (saci, iara, curupira) quase não aparece como "criatura lendária" no Wikidata.
    // Só as conhecidas: nome da lista nunca passa de comum, e o folclore raro vem do Wikidata com a raridade dele.
    sources: [
      { kind: "manual", items: CRIATURAS },
      { kind: "manual", items: CRIATURAS_RARAS, rare: true },
      wd(kindOf("Q2239243")),
    ],
    // "Medusa" e "Hidra" também são bicho do mar: vale o artigo de criatura ou personagem.
    classes: ["Q2239243", "Q4271324", "Q95074", "Q24334685", "Q17442446"],
  },
  {
    id: "personagem-biblico",
    title: "Personagem da Bíblia",
    // A consulta extra só com gente e personagem: "aparece na Bíblia" também pega lugar e profecia.
    sources: [
      { kind: "manual", items: BIBLICOS },
      optional(wd(`?x wdt:P1441 wd:Q1845; wdt:P31 ?k. VALUES ?k { wd:Q5 wd:Q20643955 wd:Q95074 }`)),
    ],
    // "José" e "Maria" são nomes comuns: vale o artigo que for de gente, personagem ou anjo.
    classes: ["Q5", "Q95074", "Q20643955", "Q235113", "Q4271324"],
    ordered: true,
  },
  simple("santo", "Santo ou santa", wd(`?x wdt:P411 wd:Q43115.`, { minLinks: 10 })),
  simple("papa", "Papa", wd(`?x wdt:P39 wd:Q19546.`)),
  simple("imperador-romano", "Imperador romano", wd(`?x wdt:P39 wd:Q842606.`)),
  simple("presidente-eua", "Presidente dos EUA", wd(`?x wdt:P39 wd:Q11696.`)),
  simple("farao", "Faraó do Egito", wd(`?x wdt:P39 wd:Q37110.`)),
  simple("filosofo", "Filósofo ou filósofa", wd(person("Q4964182"), { minLinks: 20 })),
  simple("cientista", "Cientista famoso", wd(person("Q169470", "Q593644", "Q170790", "Q864503"), { minLinks: 25 })),
  simple("astronauta", "Astronauta", wd(person("Q11631"), { minLinks: 10 })),
  simple("inventor", "Inventor ou inventora", wd(person("Q205375"), { minLinks: 15 })),
  simple("explorador", "Explorador ou navegador", wd(person("Q11900058"), { minLinks: 15 })),
  simple("religiao", "Religião", wd(isA("Q9174"), { minLinks: 5 })),
  {
    id: "danca-do-mundo",
    title: "Dança do mundo (sem brasileiras)",
    sources: [
      {
        kind: "sparql",
        query: `SELECT DISTINCT ?x WHERE { ?x wdt:P31 wd:${Q.typeOfDance}. }`,
      },
      { kind: "links", titles: ["Lista de danças"] },
      { kind: "category", titles: ["Categoria:Danças por país"], depth: 2 },
    ],
    classes: [Q.dance, Q.typeOfDance],
    exclude: [{ kind: "category", titles: ["Categoria:Danças do Brasil"], depth: 3 }],
    excludeCountry: Q.brazil,
    allowEnglishOnly: true,
  },

  // --- Esporte ---
  simple("esporte", "Esporte", wd(`?x wdt:P31|wdt:P279 ?class. VALUES ?class { wd:Q349 wd:Q31629 }.`)),
  simple("arte-marcial", "Arte marcial ou luta", wd(kindOf("Q11417"))),
  simple(
    "jogador-estrangeiro",
    "Jogador de futebol estrangeiro",
    wd(`${person("Q937857")} ${FOREIGN}`, { minLinks: 30 }),
  ),
  simple("basquete", "Jogador ou jogadora de basquete", wd(person("Q3665646"), { minLinks: 15 })),
  simple("tenista", "Tenista", wd(person("Q10833314"), { minLinks: 15 })),
  simple("piloto-f1", "Piloto de Fórmula 1", wd(person("Q10841764"))),
  simple("lutador-mma", "Lutador ou lutadora de MMA", wd(person("Q11607585"), { minLinks: 8 })),
  {
    id: "time-europeu",
    title: "Time de futebol europeu",
    ordered: true,
    sources: [
      { kind: "manual", items: TIMES_EUROPEUS },
      optional(
        wd(`${isA("Q476028")} ?x wdt:P17 ?country. ?country wdt:P30 wd:Q46.`, {
          minLinks: 15,
        }),
      ),
    ],
    // Clube de futebol: "Roma" é a cidade, "AS Roma" é o time.
    classes: ["Q476028"],
  },
  simple("estadio", "Estádio", wd(isA("Q1154710", "Q483110"), { minLinks: 10 })),
  simple("jogo-tabuleiro", "Jogo de tabuleiro ou de cartas", wd(isA("Q131436", "Q142714"))),

  // --- Dia a dia e conhecimento ---
  {
    id: "especialidade-medica",
    title: 'Especialidade médica (como "dermatologia")',
    sources: [{ kind: "manual", items: CFM_SPECIALTIES }],
  },
  simple("profissao", "Profissão", wd(isA("Q28640", "Q12737077"), { minLinks: 10 })),
  simple("doenca", "Doença", wd(isA("Q12136", "Q18123741", "Q929833"), { minLinks: 10 })),
  simple("fobia", "Fobia", wd(kindOf("Q175854"))),
  simple("osso", "Osso do corpo humano", wd(kindOf("Q265868"))),
  simple("musculo", "Músculo do corpo humano", wd(kindOf("Q7365"))),
  simple("orgao", "Órgão do corpo humano", wd(kindOf("Q712378"))),
  simple("elemento-quimico", "Elemento químico", wd(isA("Q11344"))),
  {
    id: "remedio",
    title: "Remédio (nome do princípio ativo)",
    // Só a lista: o Wikidata mistura classes de remédio ("Antibiótico", "Procinético").
    sources: [{ kind: "manual", items: REMEDIOS }],
    classes: ["Q12140", "Q11173", "Q8386", "Q28885102", "Q79529"],
    ordered: true,
  },
  simple("marca-carro", "Marca de carro", wd(isA("Q786820"), { minLinks: 5 })),
  simple("modelo-carro", "Modelo de carro", wd(isA("Q3231690"), { minLinks: 5 })),
  simple("fast-food", "Rede de fast-food", wd(isA("Q18509232"))),
  simple("coquetel", "Drinque ou coquetel", wd(kindOf("Q134768"))),
  simple("queijo", "Queijo", wd(kindOf("Q10943"))),
  simple("pao", "Tipo de pão", wd(kindOf("Q7802"))),
  simple("sobremesa", "Sobremesa ou doce", wd(kindOf("Q182940"), { minLinks: 3 })),
  simple("bebida-alcoolica", "Bebida alcoólica", wd(kindOf("Q154"), { minLinks: 5 })),
  simple("rede-social", "Rede social ou aplicativo", wd(isA("Q3220391", "Q620615"), { minLinks: 10 })),
  simple("linguagem-programacao", "Linguagem de programação", wd(isA("Q9143"), { minLinks: 10 })),
  simple("roupa", "Peça de roupa", wd(kindOf("Q11460"))),
  simple("movel", "Móvel (de casa)", wd(kindOf("Q14745"))),
  simple("utensilio-cozinha", "Utensílio de cozinha", wd(kindOf("Q1521410"))),
  // A árvore de "ferramenta" no Wikidata pega roupa, arma e instrumento musical: só a lista.
  {
    id: "ferramenta",
    title: "Ferramenta",
    sources: [{ kind: "manual", items: FERRAMENTAS }],
    // "Lima" é a capital do Peru e "Morsa" é o bicho: vale o artigo que for de ferramenta.
    classes: ["Q39546"],
    ordered: true,
  },
  {
    id: "cor",
    title: "Cor",
    sources: [{ kind: "manual", items: CORES }, optional(wd(isA("Q1075")))],
    // "Laranja" é a fruta e "Rosa" a flor: vale o artigo que for de cor.
    classes: ["Q1075"],
    ordered: true,
  },
  {
    id: "unidade-medida",
    title: "Unidade de medida",
    // Só a lista: no Wikidata, moeda também é "unidade de medida" (Euro, Franco de Liechtenstein).
    sources: [{ kind: "manual", items: UNIDADES }],
    classes: ["Q47574"],
    ordered: true,
  },
  {
    id: "grife",
    title: "Grife ou marca de moda",
    sources: [{ kind: "manual", items: GRIFES }, optional(wd(isA("Q1941779", "Q3661311"), { minLinks: 5 }))],
    // "Puma" é o bicho e "Mango" a fruta: vale o artigo que for de empresa ou marca.
    classes: ["Q4830453", "Q431289", "Q1941779", "Q783794"],
    ordered: true,
  },
];
