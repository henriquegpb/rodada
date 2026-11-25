// Listas à mão do Incomum: natureza, bichos, plantas e comida da horta. Cada item é "Nome na tela|apelido|outro nome",
// separados por ";", da resposta mais comum para a menos comum.

export const VULCOES = `
Vesúvio|Monte Vesúvio|Vesuvio|Vesuvius|Mount Vesuvius; Etna|Monte Etna|Mount Etna; Monte Fuji|Fuji|Fujiyama|Fuji-san|Mount Fuji;
Krakatoa|Krakatau|Cracatoa; Kilauea|Kīlauea|Vulcão Kilauea; Mauna Loa;
Monte Santa Helena|Santa Helena|Mount St. Helens|Mount Saint Helens|Saint Helens|St. Helens;
Eyjafjallajökull|Eyjafjallajokull|Eyjafjalla; Yellowstone|Supervulcão de Yellowstone|Caldeira de Yellowstone;
Kilimanjaro|Monte Kilimanjaro|Quilimanjaro|Kibo; Popocatépetl|Popocatepetl|Popo; Stromboli; Pinatubo|Monte Pinatubo|Mount Pinatubo;
Cotopaxi|Vulcão Cotopaxi; Mauna Kea; Teide|Pico do Teide|Pico del Teide|Monte Teide; Monte Pelée|Pelée|Mont Pelée|Montanha Pelada;
Tambora|Monte Tambora; Hekla; Villarrica|Vulcão Villarrica|Rucapillán; Osorno|Vulcão Osorno; Chimborazo|Chimboraço|Vulcão Chimborazo;
Nevado del Ruiz|Vulcão Nevado del Ruiz; Cumbre Vieja|Vulcão de La Palma|Tajogaite; Hunga Tonga|Hunga Tonga-Hunga Ha'apai|Vulcão de Tonga;
Sakurajima; Merapi|Monte Merapi; Mayon|Vulcão Mayon|Monte Mayon; Taal|Vulcão Taal; Olympus Mons;
Campos Flégreos|Campi Flegrei|Flegrei; Santorini|Thera|Tera; Monte Érebo|Érebo|Erebus|Monte Erebus|Mount Erebus;
Laki|Lakagígar; Katla; Grímsvötn|Grimsvotn; Fagradalsfjall; Bárðarbunga|Bardarbunga; Askja; Krafla; Surtsey; Eldfell;
Snæfellsjökull|Snaefellsjokull|Sneffels; Öræfajökull|Oraefajokull; Hengill; Herðubreið|Herdubreid;
Monte Ararate|Ararate|Ararat|Monte Ararat; Monte Elbrus|Elbrus; Damavand|Monte Damavand|Damavande|Monte Damavande; Kazbek|Monte Kazbek;
Monte Erciyes|Erciyes|Monte Argeu; Arenal|Vulcão Arenal; Poás|Vulcão Poás|Poas; Irazú|Vulcão Irazú|Irazu; Turrialba|Vulcão Turrialba;
Rincón de la Vieja; Masaya|Vulcão Masaya; Momotombo; Concepción|Vulcão Concepción; Cerro Negro;
Vulcão de Fogo|Volcán de Fuego|Fuego; Pacaya; Acatenango; Santa María|Vulcão Santa María|Santiaguito; Tajumulco; Izalco;
Ilamatepec|Vulcão de Santa Ana|Santa Ana; Paricutín|Paricutin; Iztaccíhuatl|Iztaccihuatl; Pico de Orizaba|Orizaba|Citlaltépetl;
Vulcão de Colima|Colima|Volcán de Colima; El Chichón|Chichonal; Nevado de Toluca|Xinantécatl; Tungurahua; Sangay;
Pichincha|Guagua Pichincha|Rucu Pichincha; Reventador|El Reventador; Cayambe; Antisana; Galeras; Nevado del Huila; Puracé;
Misti|El Misti; Ubinas; Sabancaya; Huaynaputina; Coropuna|Nevado Coropuna; Ojos del Salado; Llullaillaco; Láscar|Lascar; Licancabur;
Parinacota|Vulcão Parinacota; Sajama|Nevado Sajama; Calbuco; Llaima; Chaitén|Chaiten; Puyehue|Cordón Caulle|Puyehue-Cordón Caulle;
Lanín|Lanin; Copahue; Tupungato; Monte Hudson|Cerro Hudson; Haleakalā|Haleakala; Hualālai|Hualalai;
Monte Rainier|Rainier|Mount Rainier|Tahoma; Monte Hood|Mount Hood; Monte Shasta|Shasta|Mount Shasta; Pico Lassen|Lassen|Lassen Peak;
Monte Baker|Mount Baker; Monte Adams|Mount Adams; Monte Mazama|Mazama; Novarupta; Katmai|Monte Katmai; Monte Redoubt|Redoubt;
Monte Spurr|Spurr; Augustine|Monte Augustine; Pavlof; Shishaldin; Okmok; Soufrière Hills; La Soufrière; Kick 'em Jenny;
Nyiragongo|Niragongo|Niaragongo|Monte Niaragongo; Nyamuragira|Nyamulagira; Ol Doinyo Lengai|Lengai; Monte Camarões|Mount Cameroon|Fako;
Erta Ale; Karthala|Monte Karthala; Piton de la Fournaise; Pico do Fogo|Vulcão do Fogo; Monte Quênia|Monte Kenya|Mount Kenya|Monte Quénia;
Monte Meru; Monte Elgon|Elgon; Ruapehu|Monte Ruapehu; Tongariro|Monte Tongariro; Ngauruhoe|Monte Ngauruhoe;
Taranaki|Monte Taranaki|Monte Egmont; Whakaari|White Island; Taupō|Taupo|Vulcão Taupo; Tarawera|Monte Tarawera; Rangitoto;
Yasur|Monte Yasur; Ambrym; Manam; Rabaul|Tavurvur; Ulawun; Kanlaon|Canlaon; Bromo|Monte Bromo; Agung|Monte Agung;
Rinjani|Monte Rinjani; Semeru|Monte Semeru; Sinabung|Monte Sinabung; Kelud|Kelut|Monte Kelud; Ijen|Kawah Ijen;
Anak Krakatau|Anak Krakatoa; Toba|Supervulcão de Toba|Caldeira de Toba; Unzen|Monte Unzen; Monte Aso|Aso; Monte Ontake|Ontake;
Monte Asama|Asama; Monte Paektu|Paektu|Baekdu|Montanha Baekdu|Changbai; Hallasan|Monte Halla;
Klyuchevskaya Sopka|Kliutchevskaia Sopka|Klyuchevskoy; Avachinsky|Avatchinski; Bezymianny|Bezymyanny; Shiveluch; Tolbachik;
Ilha Deception|Ilha Decepção|Deception Island; Montanha do Pico|Monte Pico|Mount Pico; Vulcão dos Capelinhos|Capelinhos;
Sete Cidades|Caldeira das Sete Cidades; Vulcano; Nisyros|Nísiros; Timanfaya|Montañas del Fuego;
Arsia Mons; Pavonis Mons; Ascraeus Mons; Maat Mons; Loki Patera; Tamu Massif|Maciço Tamu;
Pico do Cabugi|Cabugi|Pico do Cabuji; Vulcão de Nova Iguaçu; Long Valley|Caldeira de Long Valley
`;

export const CACHOEIRAS = `
Cataratas do Iguaçu|Cataratas de Iguaçu|Iguaçu|Foz do Iguaçu|Cataratas del Iguazú|Iguazú|Iguazu Falls;
Cataratas do Niágara|Niágara|Niagara|Cataratas de Niágara|Niagara Falls; Salto Ángel|Salto Angel|Salto do Anjo|Angel Falls|Kerepakupai Merú;
Cataratas Vitória|Cataratas de Vitória|Cataratas Victoria|Victoria Falls|Mosi-oa-Tunya; Cachoeira da Fumaça|Fumaça;
Cachoeira Véu de Noiva|Véu de Noiva|Véu da Noiva|Cachoeira Véu da Noiva; Cascata do Caracol|Cachoeira do Caracol|Caracol;
Cachoeira do Tabuleiro|Tabuleiro; Cachoeira Casca d'Anta|Casca d'Anta|Casca Danta; Cachoeira de Paulo Afonso|Paulo Afonso;
Cachoeira Santa Bárbara|Santa Bárbara; Cachoeira do Buracão|Buracão; Salto do Itiquira|Cachoeira do Itiquira|Itiquira;
Cachoeira da Velha; Cachoeira do Formiga|Cachoeira da Formiga; Cachoeira Boca da Onça|Boca da Onça; Cachoeira do Mosquito;
Cachoeira dos Cristais; Saltos do Rio Preto|Salto do Rio Preto; Cachoeira do Abade; Cachoeira do Tororó|Tororó; Cachoeira do Sossego;
Cachoeira da Primavera; Cachoeira dos Pretos; Garganta do Diabo|Garganta del Diablo;
Salto de Sete Quedas|Sete Quedas|Salto das Sete Quedas|Salto de Guaíra; Salto do Yucumã|Yucumã|Saltos do Moconá|Moconá;
Plitvice|Cachoeiras de Plitvice|Lagos de Plitvice|Parque Nacional dos Lagos de Plitvice; Gullfoss; Cataratas de Gocta|Gocta;
Cataratas de Kaieteur|Kaieteur; Cataratas do Reno|Rheinfall|Queda do Reno; Cataratas de Yosemite|Yosemite Falls|Yosemite;
Skógafoss|Skogafoss; Seljalandsfoss; Cachoeira do Segredo; Cachoeira Almécegas|Almécegas; Cachoeira São Bento;
Cachoeira Loquinhas|Loquinhas; Cataratas dos Couros|Cachoeira dos Couros; Cachoeira das Cariocas; Cachoeira dos Macaquinhos;
Cachoeira Raizama|Raizama; Cachoeira da Capivara|Cachoeira Capivara; Cachoeira da Fumacinha|Fumacinha; Cachoeira Encantada;
Cachoeira do Riachinho; Poço do Diabo|Cachoeira do Diabo; Cachoeirão|Cachoeirão do Pati; Cachoeira do Ferro Doido|Ferro Doido;
Cachoeira da Pancada Grande|Pancada Grande; Cachoeira do Tijuípe|Tijuípe; Cachoeira dos Dragões; Cachoeira do Rosário;
Salto do Corumbá|Salto Corumbá; Cachoeira do Soninho; Cachoeira do Escorrega Macaco|Escorrega Macaco; Cachoeira da Roncadeira;
Cachoeira do Fundão; Cachoeira dos Rolinhos; Cachoeira do Capão Forro|Capão Forro; Cachoeira da Farofa; Cachoeira Grande;
Janela do Céu|Cachoeira Janela do Céu; Cachoeira da Eubiose; Cachoeira da Zilda; Cachoeira da Toca; Cachoeira Cassorova|Cassorova;
Cachoeira Ceita Corê|Ceita Corê; Cachoeira da Martinha; Cachoeira dos Namorados; Cachoeira do Escorrega; Cachoeira do Tobogã;
Cachoeira da Feiticeira; Cascatinha Taunay|Cascatinha da Tijuca; Cachoeira da Água Branca; Cachoeira do Prumirim;
Cachoeira do Avencal; Cascata do Chuvisqueiro|Chuvisqueiro; Salto Ventoso; Salto São Francisco; Salto São João; Salto Morato;
Cachoeira de Matilde|Cachoeira Matilde; Cachoeira de Santo Antônio; Cachoeira Iracema; Cachoeira de São Romão|São Romão;
Cachoeira da Prata; Cachoeira de Missão Velha; Cachoeira do Urubu;
Cataratas do Nilo Azul|Nilo Azul|Tis Abay; Cataratas Tugela|Tugela; Cataratas de Sutherland|Sutherland Falls; Dettifoss;
Godafoss|Goðafoss; Svartifoss; Kirkjufellsfoss; Glymur; Háifoss; Cataratas de Krimml|Krimml; Staubbach|Cataratas de Staubbach;
Trümmelbach|Cataratas de Trümmelbach; Cataratas de Reichenbach|Reichenbach; Cascata delle Marmore|Cascata das Mármores;
Cascata de Gavarnie|Gavarnie; Krka|Cachoeiras de Krka|Skradinski buk; Vøringsfossen|Voringsfossen;
Sete Irmãs|Cachoeira das Sete Irmãs|De syv søstrene|Seven Sisters; Mardalsfossen; Vettisfossen; Kjosfossen; Låtefossen|Latefossen;
Fisgas de Ermelo|Fisgas do Ermelo; Cascata do Arado; Frecha da Mizarela|Cascata da Frecha da Mizarela;
Pulo do Lobo|Cascata do Pulo do Lobo; Cascata das 25 Fontes|25 Fontes|Vinte e Cinco Fontes; Cataratas de Ouzoud|Ouzoud;
Cataratas Murchison|Murchison Falls; Quedas de Calandula|Quedas de Kalandula|Kalandula|Calandula; Quedas do Ruacaná|Ruacaná;
Quedas de Epupa|Epupa; Cataratas de Boyoma|Boyoma|Cataratas de Stanley; Cataratas de Inga; Maletsunyane;
Cataratas de Augrabies|Augrabies; Cataratas de Khone Phapheng|Khone Phapheng; Cataratas de Ban Gioc|Ban Gioc|Detian|Cataratas de Detian;
Cachoeiras de Kuang Si|Kuang Si; Cataratas de Erawan|Erawan; Cataratas de Huangguoshu|Huangguoshu; Cataratas de Hukou|Hukou;
Cataratas de Kegon|Kegon; Cataratas de Nachi|Nachi; Cataratas de Shiraito|Shiraito; Cataratas de Dudhsagar|Dudhsagar|Dudsagar;
Cataratas de Jog|Jog Falls; Cataratas de Athirappilly|Athirappilly; Cataratas de Nohkalikai|Nohkalikai; Cataratas de Kawasan|Kawasan;
Tumpak Sewu; Sekumpul; Huka Falls|Cataratas de Huka; Akaka Falls|Cataratas de Akaka; Wallaman Falls; Jim Jim Falls;
Cataratas Multnomah|Multnomah; Havasu Falls|Cataratas de Havasu; Cataratas de Shoshone|Shoshone Falls;
Cataratas do Yellowstone|Lower Falls; Bridalveil Fall|Bridalveil; Horseshoe Falls|Cataratas Canadenses|Cataratas da Ferradura;
Cataratas Americanas|American Falls; Cataratas de Montmorency|Montmorency; Takakkaw Falls|Takakkaw; Helmcken Falls|Helmcken;
Cataratas Athabasca|Athabasca Falls; Cascada de Basaseachi|Basaseachi|Basaseachic; Pailón del Diablo; Salto del Laja;
Saltos del Petrohué|Petrohué; Salto del Tequendama|Tequendama; Salto Kukenán|Kukenán|Kuquenán; Salto del Monday;
Catarata Yumbilla|Yumbilla; Cataratas Las Tres Hermanas|Tres Hermanas
`;

export const ILHAS = `
Fernando de Noronha|Noronha|Arquipélago de Fernando de Noronha|Ilha de Fernando de Noronha; Ilha Grande;
Ilhabela|Ilha Bela|Ilha de São Sebastião; Florianópolis|Ilha de Santa Catarina|Floripa|Ilha da Magia; Ilha do Mel;
Ilha de Marajó|Marajó; Havaí|Hawaii|Havai|Ilhas Havaianas|Ilhas do Havaí|Arquipélago do Havaí; Madagascar|Madagáscar;
Cuba|Ilha de Cuba; Ilha de Páscoa|Rapa Nui|Easter Island; Galápagos|Ilhas Galápagos|Arquipélago de Galápagos;
Maldivas|Ilhas Maldivas|Maldives; Islândia|Iceland; Groenlândia|Gronelândia|Greenland; Jamaica; Bali|Ilha de Bali;
Sicília|Sicily; Creta|Crete; Santorini|Thira; Morro de São Paulo|Ilha de Tinharé|Tinharé; Ilha de Itaparica|Itaparica;
Boipeba|Ilha de Boipeba; Ilha de Paquetá|Paquetá; Ilha de São Luís|Ilha do Maranhão|Upaon-Açu; Bora Bora|Bora-Bora; Taiti|Tahiti;
Fiji|Ilhas Fiji|Fidji; Açores|Arquipélago dos Açores|Ilhas dos Açores|Azores; Ilha da Madeira|Madeira;
Ilhas Canárias|Canárias|Canary Islands; Tenerife; Ibiza|Eivissa; Maiorca|Mallorca|Majorca; Sardenha|Sardegna|Sardinia;
Córsega|Corsica|Corse; Malta|Ilha de Malta; Chipre|Ilha de Chipre|Cyprus; Capri|Ilha de Capri; Manhattan|Ilha de Manhattan|Manhatan;
Porto Rico|Puerto Rico; Aruba; Curaçao|Curaçau; Bahamas|Ilhas Bahamas; Seychelles|Seicheles;
Ilha Maurício|Maurício|Mauritius|Ilhas Maurício; Zanzibar|Unguja; Sri Lanka|Ceilão|Ceylon; Taiwan|Formosa|Ilha Formosa|Taiwã;
Tasmânia|Tasmania; Bornéu|Borneo; Java|Ilha de Java; Sumatra|Samatra; Nova Guiné|New Guinea; Irlanda|Ilha da Irlanda|Ireland;
Grã-Bretanha|Great Britain|Ilha da Grã-Bretanha; Abrolhos|Arquipélago de Abrolhos|Ilhas de Abrolhos;
Ilha da Trindade|Trindade e Martim Vaz; Ilha do Bananal|Bananal; Ilha Comprida; Ilha do Cardoso; Ilha Anchieta;
Ilha da Queimada Grande|Queimada Grande|Ilha das Cobras; Ilha de Itamaracá|Itamaracá; Ilha do Governador; Ilha Fiscal;
Ilhas Cagarras|Cagarras; Ilha de Comandatuba|Comandatuba; Ilha dos Frades; Ilha de Maré; Ilha do Campeche; Ilha do Arvoredo;
Ilha de São Francisco do Sul; Ilha do Superagui|Superagui; Ilha das Peças; Ilha de São Vicente; Ilha de Santo Amaro;
Ilha das Couves; Ilha da Gipoia|Gipoia; Ilha do Japonês; Ilha do Cabo Frio|Ilha do Farol; Ilha de Algodoal|Algodoal|Maiandeua;
Ilha do Mosqueiro|Mosqueiro; Ilha de Cotijuba|Cotijuba; Ilha do Combu|Combu; Ilha do Amor; Ilha Tupinambarana|Tupinambarana;
Ilha de Santana; Ilha Caviana|Caviana; Ilha Mexiana|Mexiana; Ilha de Maracá; Atol das Rocas;
Arquipélago de São Pedro e São Paulo|São Pedro e São Paulo|Penedos de São Pedro e São Paulo; Ilha do Caju; Ilha de Porto Belo;
Ilha do Fundão; Ilha Rasa; Ilha da Gigoia|Gigoia; Ilha de Itacuruçá|Itacuruçá; Ilha da Marambaia|Marambaia; Ilha dos Lobos;
Ilha de Vitória; Ilha do Frade; Ilha de Santo Aleixo;
Mykonos|Míconos|Miconos; Rodes|Rhodes; Corfu|Kerkyra; Zakynthos|Zacinto|Zante; Lesbos; Naxos; Paros; Ítaca|Ithaca;
Cefalônia|Kefalonia|Cefalónia; Menorca|Minorca; Formentera;
Gran Canária|Gran Canaria|Grã-Canária; Lanzarote; Fuerteventura; La Palma|Ilha de La Palma; Porto Santo|Ilha de Porto Santo;
Ilha de São Miguel|São Miguel; Ilha Terceira|Terceira; Ilha do Pico; Ilha do Faial|Faial; Elba|Ilha de Elba; Ischia; Lampedusa;
Murano; Burano; Monte Saint-Michel|Mont-Saint-Michel; Ilha de Man|Isle of Man; Ilha de Wight|Isle of Wight; Ilha de Skye|Skye;
Jersey; Guernsey; Shetland|Ilhas Shetland; Órcades|Orkney|Ilhas Órcades; Hébridas|Hebrides|Ilhas Hébridas;
Ilhas Faroé|Faroé|Feroé|Ilhas Feroe; Svalbard; Lofoten|Ilhas Lofoten; Gotland|Gotlândia; Gozo;
Cabo Verde|Arquipélago de Cabo Verde; Ilha do Sal; Ilha de São Tomé|São Tomé; Bioko|Bioco|Fernando Pó; Ilha de Moçambique;
Ilha Robben|Robben Island; Ilha de Gorée|Goreia|Gorée; Djerba; Santa Helena|Ilha de Santa Helena; Ilha de Ascensão|Ascensão;
Tristão da Cunha|Tristan da Cunha; Reunião|Ilha da Reunião|Réunion; Comores|Ilhas Comores; Socotra|Socotorá;
Phuket; Koh Samui|Ko Samui; Ko Phi Phi|Koh Phi Phi|Phi Phi|Ilhas Phi Phi; Langkawi; Ilhas Gili|Gili; Lombok|Lomboque;
Komodo|Ilha de Komodo; Celebes|Sulawesi; Timor|Ilha de Timor; Singapura|Ilha de Singapura|Singapore; Ilha de Hong Kong|Hong Kong;
Hainan; Jeju|Ilha de Jeju|Cheju; Okinawa|Ilha de Okinawa; Hokkaido|Hocaido; Honshu|Honxu|Hondo; Kyushu|Quiuxu; Shikoku;
Iwo Jima|Iwo To; Miyajima|Itsukushima; Yakushima; Sacalina|Sakhalin; Boracay; Palawan; Cebu; Luzon|Lução; Mindanao|Mindanau;
Ilhas Andamão|Andamão|Andaman; Ilha Sentinela do Norte|Sentinela do Norte|North Sentinel; Moorea|Mo'orea; Samoa; Tonga;
Nova Caledônia|Nova Caledónia; Vanuatu; Guam; Atol de Bikini|Bikini|Atol de Biquíni|Biquíni; Ilhas Pitcairn|Pitcairn;
Ilha Sul|Ilha do Sul|South Island; Ilha Norte|Ilha do Norte|North Island; Ilha Fraser|Fraser Island|K'gari;
Ilha Christmas|Ilha do Natal|Christmas Island; Ilha Lord Howe|Lord Howe; Ilhas Whitsunday|Whitsunday; Long Island; Staten Island;
Ilha Ellis|Ellis Island; Alcatraz|Ilha de Alcatraz; Ilha da Liberdade|Liberty Island; Key West; Martha's Vineyard; Nantucket;
Ilha de Vancouver|Vancouver Island; Terra Nova|Newfoundland|Ilha de Terra Nova; Ilha do Príncipe Eduardo|Prince Edward Island;
Ilha de Montreal; Ilha de Baffin|Baffin; Ilha Ellesmere|Ellesmere; Ilha Kodiak|Kodiak; Bermudas|Bermuda;
Ilhas Cayman|Ilhas Caimã|Cayman; Ilhas Virgens|Virgin Islands; Turks e Caicos|Ilhas Turks e Caicos; Bonaire; Barbados;
Trinidad|Ilha de Trinidad; Tobago; Santa Lúcia|Saint Lucia; Granada|Grenada; Dominica; Martinica|Martinique; Guadalupe|Guadeloupe;
Antígua|Antigua; São Cristóvão|Saint Kitts; São Martinho|Saint Martin|Sint Maarten|St. Martin;
São Bartolomeu|Saint-Barthélemy|Saint Barth|St. Barth; Hispaniola|Ilha de São Domingos|Ilha Hispaniola;
Ilha de Margarita|Isla Margarita; San Andrés|Ilha de San Andrés; Isla Mujeres|Ilha das Mulheres; Cozumel; Holbox; Roatán;
Ilha da Juventude|Isla de la Juventud|Ilha de Pinos; Chiloé|Ilha de Chiloé|Isla Grande de Chiloé;
Ilha Robinson Crusoé|Robinson Crusoé|Isla Robinson Crusoe; Terra do Fogo|Tierra del Fuego|Ilha Grande da Terra do Fogo;
Ilhas Malvinas|Malvinas|Ilhas Falkland|Falklands; Geórgia do Sul|Ilha Geórgia do Sul|South Georgia; Ilha do Sol|Isla del Sol;
Ilha do Coco|Ilha de Cocos|Isla del Coco; Ilha Rei George|King George Island|Ilha do Rei Jorge
`;

export const LAGOS = `
Lagoa Rodrigo de Freitas|Rodrigo de Freitas; Mar Morto|Dead Sea; Lago Titicaca|Titicaca; Lago Paranoá|Paranoá;
Lagoa da Pampulha|Pampulha|Lago da Pampulha; Mar Cáspio|Cáspio|Caspian Sea; Lago Ness|Loch Ness; Lagoa da Conceição;
Lago Baikal|Baikal|Lago Baical|Baical; Lago Vitória|Lago Victoria; Represa Billings|Billings;
Represa de Guarapiranga|Guarapiranga|Represa Guarapiranga; Lago de Itaipu|Reservatório de Itaipu; Lagoa dos Patos;
Lago de Como|Lago di Como; Lago de Genebra|Lago Léman|Léman|Lac Léman|Lake Geneva; Lago Tahoe|Tahoe; Lago Superior; Lago Michigan;
Lago Ontário|Lago Ontario; Lago Huron; Lago Erie; Grande Lago Salgado|Great Salt Lake; Lago de Furnas|Represa de Furnas;
Lago de Sobradinho|Represa de Sobradinho; Lago de Tucuruí|Represa de Tucuruí; Lagoa Mirim; Lago Guaíba|Guaíba;
Lagoa de Araruama|Araruama; Lagoa do Abaeté|Abaeté; Lagoa Mundaú|Lagoa do Mundaú|Mundaú; Lago Negro; Lagoa do Peixe;
Lagoa Azul|Lagoa Azul (Lençóis Maranhenses); Lagoa Bonita; Lagoa do Paraíso; Lago do Ibirapuera; Lagoa do Taquaral|Taquaral;
Lago Igapó|Igapó; Lago do Amor; Lagoa Santa;
Mar da Galileia|Lago de Tiberíades|Mar de Tiberíades|Lago de Genesaré|Mar de Genesaré|Kinneret; Mar de Aral|Aral|Lago de Aral;
Lago Tanganica|Tanganica|Tanganyika; Lago Malawi|Lago Niassa|Niassa; Lago Chade|Lago Tchad; Lago Maggiore|Lago Maior;
Lago de Garda|Lago di Garda|Garda; Lago de Constança|Lago Constança|Bodensee; Lago de Lucerna|Lago dos Quatro Cantões|Lucerna;
Lago de Zurique; Lago de Lugano; Lago de Hallstatt|Hallstätter See|Hallstatt; Lago Bled|Bled; Lago Balaton|Balaton;
Lago Louise|Lake Louise; Lago Moraine|Moraine Lake; Lago Atitlán|Atitlán; Lago Nahuel Huapi|Nahuel Huapi; Lago Argentino;
Lago General Carrera|Lago Buenos Aires; Lago Llanquihue|Llanquihue; Lago Turkana|Turkana; Lago Inle|Inle; Lago Toba|Toba;
Lago Natron|Natron; Lago Rosa|Lago Retba|Lac Rose; Lago Hillier; Lago Nasser; Lago Kariba; Lago Volta; Lago Kivu|Kivu; Lago Nyos;
Lago Nakuru; Lago Naivasha; Lago Tana; Lago Assal; Lago Mead; Lago Powell; Lago Crater|Crater Lake|Lago da Cratera;
Lago Yellowstone; Mono Lake|Lago Mono; Mar de Salton|Salton Sea; Lago Okeechobee; Lago Champlain; Lago Pontchartrain;
Lago Winnipeg; Grande Lago do Urso|Great Bear Lake; Grande Lago do Escravo|Great Slave Lake; Lago Athabasca; Lago Peyto;
Lago de Balbina|Represa de Balbina; Lago de Serra da Mesa|Serra da Mesa; Represa de Três Marias|Lago de Três Marias; Lago de Xingó;
Lagoa Feia; Lagoa Misteriosa; Lagoa Encantada; Lagoa do Bonfim; Lagoa de Extremoz; Lagoa da Jansen; Lagoa do Peri;
Lagoa de Saquarema; Lagoa de Marapendi; Lagoa da Tijuca; Lagoa de Jacarepaguá; Lagoa Manguaba; Lagoa do Portinho;
Lagoa da Confusão; Represa do Lobo|Represa do Broa|Broa;
Lago Nicarágua|Cocibolca; Lago de Chapala|Chapala; Lago de Texcoco|Texcoco; Lago de Maracaibo|Maracaibo; Lago Poopó|Poopó;
Laguna Colorada; Laguna 69|Lagoa 69; Lago Ypacaraí|Ypacaraí; Lago Pehoé; Lago Ladoga|Ladoga; Lago Onega|Onega; Lago Peipus|Peipus;
Lago Saimaa|Saimaa; Lago Vänern|Vänern; Lago Vättern|Vättern; Lago Mälaren|Mälaren; Lago Ohrid|Lago de Ocrida|Ohrid; Lago Prespa;
Loch Lomond|Lago Lomond; Lough Neagh|Lago Neagh; Lago Windermere|Windermere; Lago do Rei|Königssee; Lago Bohinj;
Lago Neusiedl|Neusiedler See; Lago di Braies|Lago de Braies|Braies; Lago de Annecy|Annecy; Lago Trasimeno;
Albufera de Valência|Albufera; Lagoa das Sete Cidades; Lagoa do Fogo; Lagoa de Óbidos; Lago Alqueva|Barragem do Alqueva;
Jökulsárlón|Jokulsarlon; Mývatn|Myvatn; Blue Lagoon|Lagoa Azul (Islândia); Lago Van; Lago Úrmia|Urmia; Lago Sevan|Lago Sevã;
Issyk-Kul|Lago Issyk-Kul; Lago Balkhash|Lago Balcache; Lago Qinghai|Lago Chingai; Lago do Oeste|West Lake|Xihu;
Pangong Tso|Lago Pangong; Lago Dal; Tonle Sap; Lago Biwa; Lago Kawaguchi; Lago Taupo|Taupo; Lago Tekapo; Lago Pukaki;
Lago Wakatipu; Lago Eyre; Lago Vostok
`;

export const MONTANHAS = `
Monte Everest|Everest|Monte Evereste|Evereste|Mount Everest|Chomolungma; Pão de Açúcar|Morro do Pão de Açúcar|Sugarloaf;
Corcovado|Morro do Corcovado; Pico da Neblina|Neblina; Pico da Bandeira; K2|Monte K2|Godwin-Austen;
Aconcágua|Aconcagua|Monte Aconcágua|Cerro Aconcagua; Kilimanjaro|Monte Kilimanjaro|Quilimanjaro; Monte Fuji|Fuji|Fujiyama|Mount Fuji;
Mont Blanc|Monte Branco; Monte Olimpo|Olimpo|Olympus; Matterhorn|Monte Cervino|Cervino|Cervin; Monte Sinai|Sinai;
Monte Roraima|Roraima; Pedra da Gávea; Dedo de Deus; Pico das Agulhas Negras|Agulhas Negras; Etna|Monte Etna;
Vesúvio|Monte Vesúvio; Monte Ararate|Ararate|Ararat|Monte Ararat; Monte Rushmore|Rushmore; Denali|Monte McKinley|McKinley|Monte Denali;
Monte Elbrus|Elbrus; Pedra do Baú; Pedra Azul; Morro Dois Irmãos|Dois Irmãos; Pico do Jaraguá|Jaraguá;
Serra da Mantiqueira|Mantiqueira; Morro do Pai Inácio|Pai Inácio; Pico Paraná; Torres del Paine; Pico Cristal;
Pico do Itacolomi|Itacolomi; Annapurna; Kanchenjunga|Kangchenjunga; Lhotse; Makalu; Cho Oyu; Nanga Parbat; Dhaulagiri; Manaslu;
Monte Kailash|Kailash; Ama Dablam; Monte Kosciuszko|Kosciuszko; Maciço Vinson|Monte Vinson|Vinson;
Pirâmide Carstensz|Puncak Jaya|Carstensz; Monte Quênia|Monte Kenya|Monte Quénia; Montanha da Mesa|Table Mountain;
Toubkal|Jbel Toubkal; Aoraki|Monte Cook|Monte Cook/Aoraki; Uluru|Ayers Rock; Fitz Roy|Monte Fitz Roy|Cerro Chaltén; Cerro Torre;
Chimborazo|Chimboraço; Cotopaxi; Huascarán; Ojos del Salado;
Vinicunca|Montanha Arco-Íris|Montanha das Sete Cores|Montanha Colorida|Rainbow Mountain; Huayna Picchu|Wayna Picchu; Illimani;
Huayna Potosí; Pico Bolívar; Cerro Rico|Cerro de Potosí; Mauna Kea; Mauna Loa; Monte Santa Helena|Santa Helena|Mount St. Helens;
Monte Rainier|Rainier; Monte Whitney|Whitney; Half Dome; El Capitan; Monte Hood; Monte Shasta; Pikes Peak; Monte Washington;
Maciço Logan|Monte Logan; Grand Teton; Torre do Diabo|Devils Tower; Pico de Orizaba|Orizaba|Citlaltépetl; Popocatépetl;
Iztaccíhuatl; Eiger; Jungfrau; Mönch; Monte Rosa|Pico Dufour; Monte Titlis|Titlis; Aiguille du Midi; Zugspitze; Grossglockner;
Tre Cime di Lavaredo|Três Picos de Lavaredo; Marmolada; Monte Ventoux; Monte Sainte-Victoire; Pilatus|Monte Pilatus;
Monte Athos|Athos; Monte Parnaso|Parnaso; Ben Nevis; Snowdon|Yr Wyddfa; Triglav; Aneto; Mulhacén; Teide|Pico do Teide;
Montserrat|Montanha de Montserrat; Montanha do Pico|Pico (Açores); Kazbek; Monte Damavand|Damavand; Monte das Oliveiras;
Monte Tabor; Monte Carmelo; Monte Sião; Monte Hermom|Hermom|Monte Hermon; Monte Nebo; Monte Kinabalu|Kinabalu; Monte Tai|Taishan;
Huangshan|Montanhas Amarelas|Montanha Amarela; Monte Hua|Huashan; Monte Emei; Pico de Adão|Sri Pada; Monte Agung|Agung;
Monte Bromo|Bromo; Monte Rinjani; Machapuchare; Pumori; Nuptse; Nanda Devi; Gangkhar Puensum; Khan Tengri; Pico Lenin;
Pico Ismail Samani|Pico do Comunismo; Monte Paektu|Paektu|Baekdu; Monte Ruapehu|Ruapehu; Monte Ngauruhoe|Ngauruhoe;
Monte Taranaki|Taranaki; Monte Camarões; Monte Meru; Monte Stanley; Ras Dashen; Monte Érebo|Érebo|Erebus; Broad Peak;
Gasherbrum; Shishapangma;
Pedra Bonita; Pico 31 de Março; Pedra da Mina; Pico dos Marins|Marins; Pico do Itaguaré|Itaguaré; Pedra do Sino;
Três Picos|Pico Maior de Friburgo; Pico da Tijuca; Pedra Branca|Pico da Pedra Branca; Pedra Grande; Pico do Papagaio;
Morro da Urca; Pedra do Telégrafo; Morro da Babilônia; Pico do Itambé; Pico do Barbado; Pico das Almas; Morro do Camelo;
Pico do Jabre; Monte Pascoal; Pedra da Boca; Pico do Selado; Pico Agudo; Pico do Calçado; Morro da Igreja;
Pedra do Frade e da Freira|Frade e a Freira; Pico do Marumbi|Marumbi; Pico do Caratuva|Caratuva; Morro do Anhangava|Anhangava;
Morro do Cuscuzeiro|Cuscuzeiro; Monte Caburaí|Caburaí; Pico da Ibituruna|Ibituruna; Pico do Itabirito; Pico do Cabugi;
Serra dos Órgãos; Serra do Curral; Serra da Canastra
`;

export const DESERTOS = `
Deserto do Saara|Saara|Sahara|Deserto do Sahara; Deserto do Atacama|Atacama|Deserto de Atacama; Deserto de Gobi|Gobi;
Antártida|Antártica|Deserto Antártico|Deserto da Antártida|Deserto polar antártico;
Lençóis Maranhenses|Deserto dos Lençóis Maranhenses|Parque Nacional dos Lençóis Maranhenses;
Deserto do Kalahari|Kalahari|Calaári|Deserto de Calaári; Jalapão|Deserto do Jalapão|Parque Estadual do Jalapão;
Deserto da Arábia|Deserto Arábico|Deserto Árabe; Vale da Morte|Death Valley; Deserto de Sonora|Sonora;
Deserto de Mojave|Mojave|Deserto do Mojave; Deserto do Namibe|Namibe|Namib|Deserto da Namíbia;
Deserto da Patagônia|Deserto Patagônico; Deserto Australiano|Deserto da Austrália|Grande Deserto Australiano;
Deserto do Sinai|Sinai|Península do Sinai; Neguev|Deserto do Neguev|Negev; Deserto da Judeia|Deserto de Judá|Deserto da Judéia;
Rub al-Khali|Rubalcali|Quarto Vazio|Empty Quarter; Deserto Sírio; Deserto da Líbia|Deserto Líbio; Deserto Branco|White Desert;
Deserto Oriental|Deserto Oriental Africano; Deserto da Núbia; Ténéré; Deserto de Danakil|Danakil|Depressão de Danakil;
Karoo|Deserto do Karoo; Deserto do Thar|Thar|Grande Deserto Indiano; Taklamakan|Deserto de Taklamakan|Taclamacã;
Deserto de Karakum|Karakum|Caracum; Kyzylkum|Quizilcum|Deserto de Kyzylkum; Dasht-e Kavir|Grande Deserto Salgado|Kavir;
Dasht-e Lut|Deserto de Lut; Deserto do Ártico|Deserto Ártico|Deserto polar ártico; Wadi Rum; Deserto de Registan|Registan;
Deserto de Cholistão|Cholistan; Deserto de Badain Jaran|Badain Jaran; Deserto de Tengger|Tengger; Deserto de Lop; Aralkum;
Deserto de Chihuahua|Chihuahua; Deserto da Grande Bacia|Grande Bacia; Deserto do Colorado; Deserto Pintado|Painted Desert;
White Sands|Deserto de White Sands; Deserto de Black Rock|Black Rock; Deserto da Baixa Califórnia;
Deserto de Sechura|Sechura|Deserto de Nazca; Deserto de Tatacoa|Tatacoa; Deserto de La Guajira|Deserto da Guajira;
Médanos de Coro; Deserto de Siloli|Siloli; Deserto de Salvador Dalí|Deserto de Dalí; Deserto de Monte;
Grande Deserto de Vitória; Grande Deserto Arenoso; Deserto de Gibson; Deserto de Simpson; Deserto de Tanami;
Deserto de Tabernas|Tabernas; Bardenas Reales|Deserto de Bardenas Reales|Bardenas; Deserto de Accona|Deserto di Accona;
Deserto de Błędów|Błędów|Bledow; Deserto de Carcross; Deserto de Chalbi; Deserto de Parã
`;

export const PEDRAS_PRECIOSAS = `
Diamante; Esmeralda|Esmeralda colombiana; Rubi; Safira; Ouro; Prata; Pérola; Ametista;
Quartzo|Cristal|Cristal de quartzo|Cristal de rocha|Quartzo hialino; Topázio; Turmalina; Água-marinha|Aquamarine; Opala;
Turquesa; Jade; Ônix|Onix; Citrino; Ágata; Granada; Quartzo rosa; Âmbar; Obsidiana; Olho de tigre|Olho-de-tigre;
Lápis-lazúli|Lazurita; Malaquita; Pirita|Ouro de tolo; Hematita; Pedra da lua|Pedra-da-lua|Adulária; Alexandrita; Tanzanita;
Peridoto|Olivina|Crisólita; Jaspe|Jaspe vermelho; Coral; Turmalina Paraíba; Topázio imperial; Zircão|Zirconita;
Espinélio|Espinela; Grafita|Grafite; Mica|Malacacheta; Talco; Gipsita|Gesso; Calcita; Fluorita; Feldspato; Halita|Sal-gema;
Enxofre; Cobre|Cobre nativo; Platina; Magnetita; Galena; Cinábrio; Cassiterita; Selenita; Labradorita; Aventurina; Ametrino;
Crisoprásio; Diamante negro|Carbonado; Rubelita; Heliotrópio|Pedra-de-sangue|Jaspe sanguíneo; Kunzita;
Quartzo fumê|Quartzo fumado; Quartzo rutilado; Prasiolita|Ametista verde; Calcedônia; Cornalina; Olho de gato|Olho-de-gato;
Olho de falcão; Pedra do sol|Pedra-do-sol; Amazonita; Sodalita; Rodocrosita; Rodonita; Azurita; Crisocola; Larimar; Charoíta;
Sugilita; Moldavita; Howlita; Morganita; Heliodoro; Berilo; Crisoberilo; Iolita|Cordierita; Zoisita; Tsavorita; Almandina;
Piropo; Turmalina negra|Schorl; Hiddenita; Espodumênio|Espodumena; Lepidolita; Apatita; Cianita; Andaluzita; Estaurolita;
Prehnita; Epídoto; Serpentina; Madrepérola; Azeviche; Moissanita; Painita; Benitoíta; Bixbita|Berilo vermelho; Brazilianita;
Esfalerita|Blenda; Calcopirita; Bornita; Cuprita; Siderita; Aragonita; Dolomita; Barita; Anidrita; Caulinita|Caulim;
Amianto|Asbesto; Vermiculita; Cromita; Ilmenita; Rutilo; Monazita; Scheelita; Uraninita; Pirolusita; Magnesita;
Celestita|Celestina; Augita; Ortoclásio
`;

export const ARVORES_FRUTIFERAS = `
Mangueira|Manga; Laranjeira|Laranja; Bananeira|Banana|Pé de banana; Goiabeira|Goiaba; Limoeiro|Limão;
Jabuticabeira|Jabuticaba|Jaboticabeira|Jaboticaba; Cajueiro|Caju; Coqueiro|Coco; Abacateiro|Abacate; Jaqueira|Jaca;
Mamoeiro|Mamão|Papaia; Macieira|Maçã; Pitangueira|Pitanga; Aceroleira|Acerola;
Tangerineira|Tangerina|Mexeriqueira|Mexerica|Bergamoteira|Bergamota|Pocã|Ponkan; Amoreira|Amora; Pereira|Pera;
Pessegueiro|Pêssego; Açaizeiro|Açaí; Cupuaçuzeiro|Cupuaçu; Pequizeiro|Pequi; Pinheira|Fruta-do-conde|Pinha|Ata|Ateira;
Gravioleira|Graviola; Caramboleira|Carambola; Videira|Uva|Parreira; Ameixeira|Ameixa; Figueira|Figo; Romãzeira|Romã|Romanzeira;
Caquizeiro|Caqui; Jambeiro|Jambo; Cerejeira|Cereja; Araucária|Pinheiro-do-paraná|Pinhão|Pinheiro-brasileiro; Oliveira|Azeitona;
Cacaueiro|Cacau; Castanheira-do-pará|Castanha-do-pará|Castanheira-do-brasil|Castanha-do-brasil;
Nespereira|Nêspera|Ameixa-amarela|Ameixa-japonesa; Araçazeiro|Araçá; Serigueleira|Seriguela|Ciriguela;
Cajazeira|Cajá|Taperebá; Umbuzeiro|Umbu|Imbuzeiro|Imbu; Tamarineiro|Tamarindo|Tamarindeiro; Mangabeira|Mangaba;
Limeira|Lima|Lima-da-pérsia; Jenipapeiro|Jenipapo; Sapotizeiro|Sapoti; Buritizeiro|Buriti|Miriti; Pupunheira|Pupunha;
Bacurizeiro|Bacuri; Ingazeiro|Ingá|Ingazeira; Jatobá|Jatobazeiro; Jamelão|Jambolão|Azeitona-roxa;
Cajaraneira|Cajá-manga|Cajarana; Abieiro|Abiu; Lichieira|Lichia; Marmeleiro|Marmelo; Toranjeira|Toranja|Pomelo|Grapefruit;
Nogueira|Noz; Nogueira-pecã|Noz-pecã|Pecã; Macadâmia|Nogueira-macadâmia; Amendoeira|Amêndoa;
Amendoeira-da-praia|Castanhola|Chapéu-de-sol|Sete-copas; Cambucizeiro|Cambuci; Grumixameira|Grumixama; Uvaieira|Uvaia;
Cerejeira-do-rio-grande|Cereja-do-rio-grande; Guabirobeira|Guabiroba|Gabiroba; Butiazeiro|Butiá; Baruzeiro|Baru;
Muricizeiro|Murici; Cagaiteira|Cagaita; Araticunzeiro|Araticum|Marolo; Atemoieira|Atemoia; Pitombeira|Pitomba;
Rambuteira|Rambutã; Mangostanzeiro|Mangostão|Mangostim; Árvore-do-pão|Fruta-pão|Fruteira-pão; Damasqueiro|Damasco;
Nectarineira|Nectarina; Kinkan|Laranjinha-kinkan|Kumquat; Goiabeira-serrana|Feijoa|Goiaba-serrana; Tamareira|Tâmara;
Dendezeiro|Dendê; Babaçu|Babaçuzeiro; Palmeira-juçara|Juçara|Içara; Tucumanzeiro|Tucumã; Bacabeira|Bacaba;
Macaubeira|Macaúba; Licurizeiro|Licuri; Sapucaieira|Sapucaia; Biribazeiro|Biribá; Abricoteiro|Abricó|Abricó-do-pará;
Condessa|Coração-de-boi; Baobá; Jerivá|Coquinho-jerivá; Lobeira|Fruta-de-lobo; Bacupari; Uxizeiro|Uxi; Patauá; Noni;
Cabeludinha; Jaracatiá; Camu-camu
`;

export const INSETOS = `
Formiga; Barata; Mosquito|Pernilongo|Muriçoca|Carapanã; Abelha; Mosca; Borboleta; Besouro|Cascudo|Coleóptero; Joaninha;
Gafanhoto; Grilo; Cigarra; Libélula|Lavadeira|Lava-bunda|Jacinta; Vaga-lume|Pirilampo; Louva-a-deus|Põe-mesa;
Vespa|Marimbondo|Caba; Cupim|Térmita|Aleluia|Siriri; Pulga; Piolho; Mariposa; Lagarta; Traça; Bicho-pau|Mané-magro;
Bicho-da-seda; Percevejo; Barbeiro|Bicho-barbeiro; Mosquito-da-dengue|Aedes aegypti|Aedes; Zangão;
Saúva|Formiga-cortadeira|Tanajura|Içá; Lagarta-de-fogo|Taturana|Tatarana; Mutuca; Borrachudo; Bicho-de-pé;
Esperança; Tesourinha|Lacrainha; Maria-fedida|Fede-fede|Percevejo-do-mato; Mamangava|Mamangaba|Abelha-carpinteira;
Formiga-de-fogo|Lava-pés; Pulgão; Cochonilha; Mosca-varejeira; Mosca-doméstica; Mosca-das-frutas|Drosófila;
Mosca-tsé-tsé|Tsé-tsé; Mosquito-palha|Birigui; Mosquito-prego|Anopheles|Anofeles; Maruim|Mosquito-pólvora;
Percevejo-de-cama; Chato|Piolho-do-púbis; Formiga-bala|Tocandira; Formiga-de-correição; Paquinha|Grilo-toupeira;
Bicho-folha|Inseto-folha; Rola-bosta|Escaravelho-bosteiro; Escaravelho; Besouro-rinoceronte; Besouro-hércules;
Besouro-golias; Besouro-titã; Besouro-bombardeiro; Gorgulho|Caruncho; Bicudo|Bicudo-do-algodoeiro; Serra-pau;
Vaquinha|Brasileirinho; Potó; Coró|Bicho-bolo; Tenébrio|Bicho-da-farinha; Formiga-leão; Cigarrinha;
Donzelinha|Libelinha; Efêmera; Bruxa|Mariposa-bruxa; Mariposa-atlas; Mandarová; Lagarta-do-cartucho;
Borboleta-monarca; Morfo-azul|Borboleta-azul|Morpho; Borboleta-coruja; Borboleta-88|Borboleta 88;
Borboleta-asa-de-vidro|Borboleta-de-vidro; Barata-d'água; Barata-alemã|Francesinha; Mosca-branca; Lacerdinha|Tripes;
Bicho-lixeiro; Bicho-mineiro; Berne|Mosca-do-berne; Abelha-europeia|Abelha-africanizada|Abelha-de-mel|Apis mellifera;
Jataí; Mandaçaia; Uruçu; Irapuá|Arapuá|Abelha-cachorro; Marimbondo-caboclo; Vespa-mandarina|Vespa-gigante-asiática;
Jequitiranaboia|Jiquitiranaboia|Cobra-voadora
`;

export const DINOSSAUROS = `
Tiranossauro rex|Tiranossauro|T-rex|Tyrannosaurus|Tyrannosaurus rex; Velociraptor|Velocirraptor|Raptor; Triceratops|Tricerátopo;
Estegossauro|Stegosaurus; Braquiossauro|Brachiosaurus; Pterodáctilo|Pterodactylus|Pterodátilo; Diplodoco|Diplodocus;
Espinossauro|Spinosaurus; Brontossauro|Brontosaurus; Anquilossauro|Ankylosaurus; Pteranodonte|Pteranodon;
Iguanodonte|Iguanodon; Parassaurolofo|Parasaurolophus; Mosassauro|Mosasaurus|Mossassauro; Alossauro|Allosaurus;
Dilofossauro|Dilophosaurus; Carnotauro|Carnotaurus; Giganotossauro|Giganotosaurus; Apatossauro|Apatosaurus;
Paquicefalossauro|Pachycephalosaurus; Plesiossauro|Plesiosaurus; Arqueópterix|Archaeopteryx; Argentinossauro|Argentinosaurus;
Ictiossauro|Ichthyosaurus; Compsognato|Compsognathus; Galimimo|Gallimimus; Oviraptor; Deinonico|Deinonychus;
Terizinossauro|Therizinosaurus; Quetzalcoatlo|Quetzalcoatlus; Carcarodontossauro|Carcharodontosaurus; Utahraptor;
Barionix|Baryonyx; Majungassauro|Majungasaurus; Ceratossauro|Ceratosaurus; Estiracossauro|Styracosaurus;
Edmontossauro|Edmontosaurus; Maiassaura|Maiasaura; Protoceratops; Megalossauro|Megalosaurus; Albertossauro|Albertosaurus;
Microraptor; Eoraptor; Saturnalia; Estauricossauro|Staurikosaurus; Irritator|Angaturama; Oxalaia; Liopleurodonte|Liopleurodon;
Elasmossauro|Elasmosaurus; Kronosaurus|Cronossauro; Dimetrodonte|Dimetrodon; Ranforrinco|Rhamphorhynchus;
Dimorfodonte|Dimorphodon; Tupandactylus; Tapejara; Anhanguera|Anhanguera (pterossauro); Thalassodromeus; Tropeognathus;
Caiuajara; Hatzegopteryx; Sarcosuchus; Deinosuchus; Purussaurus; Titanoboa; Prestosuchus; Notossauro|Nothosaurus; Archelon;
Megalania; Centrossauro|Centrosaurus; Torossauro|Torosaurus; Plateossauro|Plateosaurus; Tarbossauro|Tarbosaurus;
Coritossauro|Corythosaurus; Lambeossauro|Lambeosaurus; Euoplocéfalo|Euoplocephalus; Hadrossauro|Hadrosaurus;
Herrerassauro|Herrerasaurus; Kentrossauro|Kentrosaurus; Troodonte|Troodon; Psitacossauro|Psittacosaurus;
Mamenquissauro|Mamenchisaurus; Santanaraptor; Amazonsaurus; Camarassauro|Camarasaurus; Uberabatitan; Ornitomimo|Ornithomimus;
Maxakalisaurus; Pycnonemosaurus; Daspletossauro|Daspletosaurus; Estrutiomimo|Struthiomimus; Suchomimo|Suchomimus;
Ouranossauro|Ouranosaurus; Mapussauro|Mapusaurus; Saltassauro|Saltasaurus; Yutyrannus; Sinosauropteryx; Minmi;
Mononico|Mononykus; Nodossauro|Nodosaurus; Estegoceras|Stegoceras; Nigerssauro|Nigersaurus; Muttaburrasaurus;
Amargassauro|Amargasaurus; Dreadnoughtus; Patagotitan; Acrocantossauro|Acrocanthosaurus; Gigantoraptor;
Paquirrinossauro|Pachyrhinosaurus; Chasmossauro|Chasmosaurus; Stygimoloch; Heterodontossauro|Heterodontosaurus;
Hipsilofodonte|Hypsilophodon; Tenontossauro|Tenontosaurus; Shantungossauro|Shantungosaurus; Supersaurus;
Sauroposeidon; Titanossauro|Titanosaurus; Alamossauro|Alamosaurus; Criolofossauro|Cryolophosaurus; Gorgossauro|Gorgosaurus;
Nanotyrannus; Torvossauro|Torvosaurus; Concavenator; Deinocheirus; Caudipteryx; Dromeossauro|Dromaeosaurus;
Sacisaurus; Unaysaurus; Guaibasaurus; Pampadromaeus; Buriolestes; Gnathovorax; Austroposeidon; Tapuiasaurus; Gondwanatitan;
Baurutitan; Adamantisaurus; Vespersaurus; Ubirajara|Ubirajara jubatus; Berthasaura; Macrocollum; Bagualosaurus;
Thanos|Thanos simonattoi; Aratasaurus; Spectrovenator; Mirischia
`;

export const RACAS_GATO = `
Vira-lata|SRD|Sem raça definida|Gato vira-lata|Gato SRD; Siamês|Gato siamês|Siamese; Persa|Gato persa|Persian;
Angorá|Angorá turco|Gato angorá|Turkish Angora; Maine Coon; Sphynx|Gato sem pelo|Esfinge; Ragdoll;
Bengal|Gato-de-bengala|Gato bengal|Bengala; British Shorthair|Gato de pelo curto inglês|Britânico de pelo curto;
Azul russo|Russian Blue; Himalaio|Himalaia|Himalayan; Exótico|Exotic Shorthair|Persa exótico|Exótico de pelo curto;
Scottish Fold; Sagrado da Birmânia|Birman|Birmanês sagrado; Norueguês da Floresta|Norwegian Forest Cat; Siberiano|Siberian;
Munchkin; Savannah|Gato Savannah; Abissínio|Gato abissínio|Abyssinian; Devon Rex; Cornish Rex; Chartreux; Bombaim|Bombay;
Birmanês|Burmês|Burmese; Mau egípcio|Egyptian Mau; Ocicat; Somali; Oriental|Oriental de pelo curto|Oriental Shorthair;
Balinês|Balinese; Tonquinês|Tonkinese; Turco Van|Van turco|Turkish Van; Bobtail japonês|Japanese Bobtail;
Bobtail americano|American Bobtail; Manx|Gato manês; American Shorthair|Pelo curto americano; American Curl; Selkirk Rex;
LaPerm; Ragamuffin; Korat; Singapura; Snowshoe; Toyger; Pixie-bob; Kurilian Bobtail|Bobtail das Curilas; Nebelung;
Havana Brown|Havana; Peterbald; Donskoy|Don Sphynx; Lykoi|Gato lobisomem; Chausie; Serengeti;
Pelo curto brasileiro|Gato de pelo curto brasileiro|Brazilian Shorthair; Pelo curto europeu|Gato de pelo curto europeu|European Shorthair;
Mist australiano|Australian Mist; Thai|Siamês tradicional; Neva Masquerade; Burmilla; Khao Manee; Sokoke; Cymric;
Minuet|Napoleon; Mau árabe|Arabian Mau; Gato egeu|Aegean; Tiffanie
`;

export const RACAS_CAVALO = `
Árabe|Cavalo árabe|Puro-sangue árabe|PSA|Arabian; Quarto de milha|Quarter horse|QM; Mangalarga Marchador|Marchador|Manga-larga marchador;
Puro-sangue inglês|PSI|Thoroughbred|Puro sangue inglês; Crioulo|Cavalo crioulo|Criollo; Mustang|Mustangue; Campolina|Cavalo campolina;
Appaloosa; Lusitano|Puro-sangue lusitano|Cavalo lusitano; Frísio|Frisão|Friesian; Andaluz|Puro-sangue espanhol|Cavalo andaluz|PRE;
Pônei Shetland|Shetland; Clydesdale; Percheron; Pantaneiro|Cavalo pantaneiro; Paint Horse|American Paint Horse;
Mangalarga|Mangalarga Paulista|Manga-larga; Marajoara|Cavalo marajoara; Lipizzaner|Lipizzan|Lipizzano;
Bretão|Cavalo bretão; Brasileiro de Hipismo|BH; Falabella; Pampa|Cavalo pampa; Pônei brasileiro|Pônei-brasileiro;
Mini-horse|Cavalo miniatura|Miniatura americano; Puro-sangue árabe-egípcio|Árabe egípcio; Anglo-árabe; Akhal-Teke; Haflinger;
Hanoveriano|Hannoveriano|Hanoverian; Trakehner; Holsteiner; Oldemburgo|Oldenburg; Westfaliano|Westfalen;
Sela francês|Selle Français; Warmblood holandês|KWPN; Shire; Belga|Cavalo belga|Brabante; Islandês|Cavalo islandês;
Fjord norueguês|Fjord; Morgan; Tennessee Walker|Tennessee Walking Horse; Trotador americano|Standardbred;
Saddlebred|American Saddlebred; Paso fino; Peruano de passo|Paso peruano|Cavalo peruano de passo; Mongol|Cavalo mongol;
Camargue|Cavalo de Camargue; Marwari; Berbere|Barb; Orlov|Trotador Orlov; Alter Real; Sorraia; Garrano; Noriker; Kladruber;
Knabstrupper; Suffolk Punch; Boulonnais; Ardenês|Ardennes; Cleveland Bay; Irish Draught; Cob irlandês|Gypsy Vanner|Tinker;
Connemara; Pônei galês|Welsh; Exmoor; Hackney; Lavradeiro|Cavalo lavradeiro; Nordestino|Cavalo nordestino; Piquira;
Baixadeiro|Cavalo baixadeiro; Puruca; Campeiro|Cavalo campeiro
`;

export const RACAS_CACHORRO = `
Vira-lata|Caramelo|SRD|Vira-lata caramelo|Sem raça definida; Pastor-alemão|Pastor alemão|German Shepherd;
Labrador|Labrador retriever; Golden retriever|Golden; Poodle|Caniche; Shih-tzu|Shih Tzu|Shitzu;
Pinscher|Pinscher miniatura|Pincher|Pinscher zero|Pinscher anão; Pitbull|Pit bull|American pit bull terrier|Pit;
Rottweiler|Rotweiler|Rottweiller; Yorkshire|Yorkshire terrier|Yorkie; Dachshund|Salsicha|Linguicinha|Teckel|Cofap;
Chihuahua; Buldogue francês|Bulldog francês|Frenchie; Buldogue inglês|Bulldog inglês|Buldogue|Bulldog; Beagle;
Husky siberiano|Husky; Pug; Border collie; Spitz alemão anão|Lulu da Pomerânia|Spitz alemão|Pomerânia|Lulu; Maltês;
Lhasa apso; Dálmata; Dobermann|Doberman; Boxer; Chow-chow|Chow chow; Shar-pei; Akita|Akita inu; Shiba inu|Shiba;
São-bernardo|São Bernardo; Dogue alemão|Dog alemão|Great Dane; Fila brasileiro|Fila;
Terrier brasileiro|Fox paulistinha|Fox|Foxinho; Cocker spaniel inglês|Cocker spaniel|Cocker; Basset hound|Basset|Bassê;
Schnauzer|Schnauzer miniatura|Schnauzer mini; Pastor-belga|Pastor belga malinois|Malinois|Pastor-belga-malinois;
Pastor-australiano|Australian shepherd; Boiadeiro australiano|Blue heeler|Red heeler|Heeler; Boiadeiro de Berna|Bernese;
Cane corso; Mastim napolitano; Mastim inglês|Mastiff; Mastim tibetano; Bullmastiff|Bulmastife; Dogue de Bordeaux|Dogue-de-bordéus;
Dogo argentino; Bull terrier; American bully|Bully; American staffordshire terrier|Amstaff; Staffordshire bull terrier;
Jack russell terrier; Fox terrier; West highland white terrier|Westie; Scottish terrier|Terrier escocês;
Cavalier King Charles spaniel|Cavalier; Bichon frisé; Pequinês; Samoieda|Samoyeda; Malamute-do-alasca|Malamute;
Galgo inglês|Galgo|Greyhound; Whippet; Galgo afegão|Afghan hound; Borzoi; Saluki; Weimaraner; Setter irlandês;
Pointer inglês|Pointer; Braco alemão de pelo curto|Braco alemão; Vizsla|Braco húngaro; Rough collie|Collie|Lassie;
Pastor de Shetland|Sheltie; Old English sheepdog|Bobtail; Bloodhound|Cão-de-santo-humberto; Rhodesian ridgeback; Basenji;
Terra-nova; Leonberger; Pastor-branco-suíço|Pastor alemão branco; Pastor-do-cáucaso|Pastor caucasiano; Kangal;
Pastor-da-anatólia; Akita americano; Spitz japonês; Welsh corgi pembroke|Corgi|Welsh corgi; Welsh corgi cardigan; Papillon;
Pinscher alemão; Affenpinscher; Griffon de Bruxelas; Boston terrier; Pelado mexicano|Xoloitzcuintle|Xolo;
Cão de crista chinês; Pelado peruano; Terrier tibetano; Bichon havanês|Havanês; Coton de Tulear; Bichon bolonhês;
Lagotto romagnolo; Cão de água português; Cão de água espanhol; Spaniel bretão; Springer spaniel inglês; Foxhound;
Cocker spaniel americano; Schnauzer standard|Schnauzer médio; Schnauzer gigante; Dogue canário|Presa canário; Boerboel;
Rafeiro do Alentejo; Cão da Serra da Estrela; Podengo português; Pastor-holandês; Pastor-de-beauce|Beauceron; Briard;
Bearded collie; Pastor-bergamasco; Puli; Komondor; Kuvasz; Cão-lobo-checoslovaco; Cão-lobo-de-saarloos; Alaskan Klee Kai;
Buldogue campeiro|Bulldog campeiro; Dogue brasileiro; Ovelheiro gaúcho; Rastreador brasileiro;
Buldogue americano|Bulldog americano; Mastim espanhol; Mastim dos Pirenéus; Cão de montanha dos Pirenéus;
Grande boiadeiro suíço; Schipperke; Keeshond; Eurasier; Jindo; Tosa; Flat-coated retriever; Duck tolling retriever;
Chesapeake bay retriever; King Charles spaniel; Spaniel japonês; Galgo italiano|Pequeno lebrel italiano; Pharaoh hound;
Podengo ibicenco; Deerhound; Wolfhound irlandês|Lébrel irlandês; Airedale terrier; Bedlington terrier; Border terrier;
Cairn terrier; Silky terrier; Terrier preto da Rússia|Black russian terrier; Pastor maremano; Pastor-da-ásia-central|Alabai;
Pastor Belga Groenendael|Groenendael
`;

export const VERDURAS_LEGUMES = `
Alface|Alface americana|Alface crespa|Alface lisa; Tomate; Cenoura; Batata|Batata-inglesa; Cebola; Beterraba; Abobrinha;
Chuchu; Abóbora|Jerimum; Pepino|Pepino japonês; Brócolis|Brócolos|Brócolis ninja; Couve|Couve-manteiga; Repolho; Couve-flor;
Berinjela; Pimentão; Mandioca|Aipim|Macaxeira; Quiabo; Vagem|Feijão-vagem; Rúcula; Agrião; Espinafre; Milho|Milho-verde; Jiló;
Ervilha; Alho; Batata-doce; Inhame; Cará; Mandioquinha|Batata-baroa|Batata-salsa; Rabanete; Maxixe; Acelga; Escarola;
Almeirão; Chicória; Repolho roxo; Couve-de-bruxelas; Aspargo|Aspargos|Espargo; Alho-poró|Alho-porro|Alho-francês;
Salsão|Aipo; Abóbora-cabotiá|Cabotiá|Abóbora japonesa|Cabotchá; Moranga|Abóbora-moranga; Abóbora-menina; Nabo; Palmito;
Erva-doce|Funcho; Alcachofra; Taioba; Ora-pro-nóbis; Bertalha; Broto de feijão|Moyashi; Acelga chinesa|Couve-chinesa|Repolho-chinês;
Pak choi|Bok choy; Couve-crespa|Kale; Endívia; Radicchio; Cebolinha; Salsinha|Salsa; Coentro; Tomate-cereja; Feijão;
Lentilha; Grão-de-bico; Soja|Edamame|Soja verde; Fava|Feijão-fava; Feijão-de-corda|Feijão-fradinho|Feijão-macassar;
Gengibre; Mostarda|Folha de mostarda; Couve-rábano|Kohlrabi; Couve-lombarda|Repolho crespo|Repolho de Milão;
Abóbora-espaguete; Mizuna; Tatsoi; Broto de alfafa|Alfafa; Maniva|Folha de mandioca; Capuchinha; Dente-de-leão;
Daikon|Nabo japonês; Ervilha-torta|Ervilha-de-vagem; Minimilho|Milho baby; Abóbora-de-pescoço|Abóbora-seca;
Romanesco|Brócolis romanesco|Couve-flor romanesca; Broto de bambu; Jambu|Agrião-do-pará; Vinagreira|Cuxá|Caruru-azedo;
Caruru; Serralha; Beldroega; Azedinha; Batata-yacon|Yacon; Mangarito; Araruta; Gobo|Bardana; Raiz de lótus|Renkon|Lótus;
Tupinambo|Topinambo|Alcachofra-de-jerusalém; Pastinaca|Cherovia|Pastinaga; Aipo-rábano|Salsão-rábano; Echalota|Chalota;
Cambuquira; Peixinho-da-horta
`;

export const TEMPEROS = `
Sal|Sal de cozinha|Sal refinado; Pimenta-do-reino|Pimenta preta|Pimenta do reino; Alho|Alho em pó; Cebola|Cebola em pó; Orégano;
Cheiro-verde|Tempero verde; Salsinha|Salsa; Cebolinha; Coentro|Coentro em grão; Manjericão; Alecrim; Louro|Folha de louro;
Colorau|Colorífico; Cominho; Páprica|Páprica doce|Páprica picante; Canela|Canela em pau|Canela em pó; Cravo|Cravo-da-índia;
Açafrão|Açafrão verdadeiro|Saffron; Cúrcuma|Açafrão-da-terra|Açafrão-da-índia; Noz-moscada; Gengibre; Curry|Caril;
Pimenta calabresa|Calabresa em flocos|Pimenta em flocos; Pimenta|Pimenta vermelha|Pimenta chili; Hortelã; Tomilho; Sálvia;
Urucum|Urucu|Achiote; Pimenta-malagueta|Malagueta; Pimenta dedo-de-moça|Dedo-de-moça; Pimenta-de-cheiro; Pimenta-biquinho;
Manjerona; Erva-doce|Anis|Funcho; Gergelim; Mostarda|Semente de mostarda|Mostarda em grão; Chimichurri;
Lemon pepper|Pimenta-limão|Pimenta com limão; Ervas finas|Fines herbes; Sal grosso; Sal rosa|Sal do Himalaia|Sal rosa do Himalaia;
Páprica defumada; Pimenta-rosa|Aroeira; Anis-estrelado|Anis estrelado; Cardamomo; Shoyu|Molho de soja|Molho shoyu; Wasabi;
Raiz-forte; Capim-limão|Capim-santo|Capim-cidreira|Lemongrass; Endro|Dill|Aneto; Estragão; Tempero baiano;
Glutamato monossódico|Glutamato|MSG; Pimenta-caiena|Pimenta-de-caiena|Caiena; Pimenta-da-jamaica|Allspice; Pimenta-branca;
Pimenta síria|Tempero sírio; Missô|Miso; Menta|Hortelã-pimenta; Garam masala; Zaatar|Za'atar; Sumagre|Sumac;
Ervas de Provence|Ervas de Provença; Alcaparra; Zimbro; Baunilha; Erva-cidreira|Melissa; Alfavaca; Cebolinha-francesa|Ciboulette;
Chicória-do-pará|Coentro-do-pará|Coentrão|Culantro; Segurelha; Cerefólio; Levístico; Erva-de-santa-maria|Mastruz|Epazote;
Lavanda; Feno-grego|Fenacho; Alcaravia|Kümmel; Nigela|Cominho-preto; Assa-fétida; Macis; Pimenta-de-sichuan; Pimenta-longa;
Pimenta-cumari|Cumari; Pimenta murupi; Pimenta-de-bode; Pimenta habanero|Habanero; Pimenta jalapenho|Jalapeño;
Pimenta-fantasma|Bhut jolokia|Ghost pepper; Carolina Reaper; Chipotle; Pimenta baniwa; Jiquitaia; Cumaru; Galanga;
Flor de sal; Sal marinho; Sal de alho; Sal de ervas; Cinco especiarias chinesas|Cinco especiarias; Ras el hanout; Baharat;
Berbere; Harissa; Dukkah; Tempero cajun|Cajun; Bouquet garni; Shichimi|Togarashi; Furikake; Gomásio; Papoula|Semente de papoula
`;
