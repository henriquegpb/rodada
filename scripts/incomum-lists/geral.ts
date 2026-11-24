// Listas à mão do Incomum: profissões, doenças, TV e marcas. Cada item é "Nome na tela|apelido|outro nome",
// separados por ";", da resposta mais comum para a menos comum.

export const PROFISSOES = `
Médico|Médica; Professor|Professora; Advogado|Advogada; Engenheiro|Engenheira; Pedreiro; Enfermeiro|Enfermeira;
Policial|Policial militar|Policial civil|PM; Bombeiro|Bombeira; Motorista; Cozinheiro|Cozinheira; Dentista|Cirurgião-dentista|Odontólogo;
Arquiteto|Arquiteta; Jornalista; Programador|Programadora|Desenvolvedor|Desenvolvedora|Dev|Programador de computador; Garçom|Garçonete;
Eletricista; Encanador|Encanadora|Bombeiro hidráulico; Veterinário|Veterinária|Médico veterinário; Psicólogo|Psicóloga;
Contador|Contadora|Contabilista; Padeiro|Padeira; Açougueiro|Açougueira; Pintor|Pintora|Pintor de parede; Carpinteiro|Carpinteira;
Marceneiro|Marceneira; Costureira|Costureiro; Cabeleireiro|Cabeleireira|Cabelereiro|Cabelereira; Manicure|Manicuro|Pedicure|Pedicuro;
Piloto|Pilota|Piloto de avião|Aviador|Aviadora; Comissário de bordo|Comissária de bordo|Aeromoça|Aeromoço; Juiz|Juíza|Magistrado;
Promotor|Promotora|Promotor de justiça; Delegado|Delegada|Delegado de polícia; Carteiro|Carteira; Gari; Lixeiro|Coletor de lixo;
Faxineiro|Faxineira; Diarista; Babá; Porteiro|Porteira; Zelador|Zeladora; Vigilante|Vigia|Segurança; Mecânico|Mecânica; Frentista;
Caixa|Operador de caixa|Operadora de caixa; Vendedor|Vendedora; Corretor de imóveis|Corretora de imóveis|Corretor imobiliário;
Farmacêutico|Farmacêutica; Fisioterapeuta; Nutricionista; Biólogo|Bióloga; Químico|Química; Físico|Física; Matemático|Matemática;
Economista; Administrador|Administradora; Designer|Designer gráfico; Fotógrafo|Fotógrafa; Ator|Atriz; Cantor|Cantora; Músico|Musicista;
Dançarino|Dançarina; Escritor|Escritora; Youtuber; Influenciador|Influenciadora|Influencer|Influenciador digital; Streamer;
Motoboy|Entregador de moto|Motofretista; Motorista de aplicativo|Uber|Motorista de Uber; Agricultor|Agricultora|Lavrador|Produtor rural;
Pescador|Pescadora; Pecuarista; Astronauta; Detetive|Detetive particular|Investigador; Salva-vidas|Guarda-vidas;
Professor de educação física|Educador físico; Personal trainer|Personal; Psiquiatra; Pediatra; Cirurgião|Cirurgiã; Radiologista;
Secretário|Secretária; Recepcionista; Atendente; Empregada doméstica|Doméstica|Empregado doméstico; Jardineiro|Jardineira;
Caminhoneiro|Caminhoneira|Motorista de caminhão; Taxista; Motorista de ônibus; Cobrador|Cobrador de ônibus; Bancário|Bancária; Gerente;
Empresário|Empresária; Jogador de futebol|Futebolista|Jogador; Técnico de futebol|Treinador|Treinadora; Árbitro|Árbitra|Juiz de futebol;
Atleta|Esportista; Modelo; Apresentador|Apresentadora; Repórter; Locutor|Locutora; Radialista; Publicitário|Publicitária; Estilista;
Maquiador|Maquiadora; Barbeiro; Esteticista; Tatuador|Tatuadora; Confeiteiro|Confeiteira|Doceiro|Doceira; Chef|Chef de cozinha; Pizzaiolo;
Churrasqueiro; Sushiman; Barman|Bartender; Barista; Sommelier; Merendeira|Merendeiro; Feirante; Camelô|Ambulante|Vendedor ambulante;
Pipoqueiro; Sorveteiro; Entregador|Entregadora|Entregador de aplicativo; Militar|Soldado; Marinheiro; Guarda municipal;
Policial federal|Agente da Polícia Federal; Policial rodoviário|Policial rodoviário federal; Agente penitenciário|Policial penal|Carcereiro;
Agente de trânsito|Guarda de trânsito|Marronzinho; Escrivão|Escrivã; Defensor público; Procurador|Procuradora; Tabelião|Notário|Cartorário;
Oficial de justiça; Perito criminal|Perito; Legista|Médico legista; Diplomata|Embaixador; Político|Política; Deputado|Deputada|Deputado federal; Senador|Senadora; Vereador|Vereadora; Prefeito|Prefeita; Governador|Governadora;
Técnico de enfermagem|Técnica de enfermagem; Ginecologista; Obstetra; Cardiologista; Dermatologista; Oftalmologista|Oculista; Ortopedista;
Neurologista; Oncologista; Anestesista|Anestesiologista; Urologista; Endocrinologista; Otorrinolaringologista|Otorrino; Geriatra;
Clínico geral; Cirurgião plástico; Ortodontista; Fonoaudiólogo|Fonoaudióloga|Fono; Terapeuta ocupacional; Biomédico|Biomédica;
Socorrista|Paramédico; Parteira|Obstetriz; Massagista|Massoterapeuta; Terapeuta; Cuidador de idosos|Cuidadora de idosos|Cuidador|Cuidadora;
Agente comunitário de saúde|Agente de saúde; Pedagogo|Pedagoga; Diretor de escola|Diretora de escola; Professor universitário;
Instrutor de autoescola|Instrutor de trânsito; Intérprete de Libras; Tradutor|Tradutora; Intérprete; Bibliotecário|Bibliotecária;
Historiador|Historiadora; Geógrafo|Geógrafa; Sociólogo|Socióloga; Filósofo|Filósofa; Arqueólogo|Arqueóloga; Paleontólogo|Paleontóloga;
Astrônomo|Astrônoma; Geólogo|Geóloga; Meteorologista; Cientista; Pesquisador|Pesquisadora; Estatístico|Estatística; Cientista de dados;
Analista de sistemas; Engenheiro de software; Técnico de informática|Técnico em informática; Web designer;
Desenvolvedor de jogos|Game designer; Pro player|Jogador profissional|Ciberatleta; Blogueiro|Blogueira; Tiktoker; Podcaster; Social media;
Engenheiro civil; Engenheiro mecânico; Engenheiro elétrico|Engenheiro eletricista; Engenheiro químico; Engenheiro agrônomo|Agrônomo;
Desenhista; Paisagista; Designer de interiores|Decorador|Decoradora; Mestre de obras; Servente de pedreiro|Ajudante de pedreiro|Servente;
Azulejista; Gesseiro; Vidraceiro; Serralheiro; Soldador; Torneiro mecânico|Torneiro; Ferreiro; Funileiro|Lanterneiro; Borracheiro; Chaveiro;
Sapateiro; Alfaiate; Relojoeiro; Ourives|Joalheiro; Operário|Operária; Metalúrgico; Piscineiro; Marido de aluguel|Faz-tudo;
Lavador de carros; Manobrista; Flanelinha|Guardador de carros; Office boy|Contínuo; Estagiário|Estagiária;
Auxiliar administrativo|Assistente administrativo; Repositor; Estoquista; Empacotador; Representante comercial;
Operador de telemarketing|Telemarketing|Teleoperador; Telefonista; Ascensorista; Despachante; Corretor de seguros;
Auditor|Auditora|Auditor fiscal; Consultor|Consultora; Banqueiro; Recrutador|Recrutadora|Analista de RH;
Profissional de marketing|Marqueteiro; Redator|Redatora|Copywriter; Revisor|Revisora; Editor|Editora; Roteirista;
Diretor de cinema|Cineasta; Produtor|Produtora; Cinegrafista|Videomaker|Câmera; Editor de vídeo; Dublador|Dubladora; Humorista|Comediante;
Palhaço|Palhaça; Mágico|Ilusionista; Malabarista; Trapezista; Bailarino|Bailarina; Coreógrafo|Coreógrafa; Compositor|Compositora;
Maestro|Maestrina|Regente; DJ; Produtor musical; Poeta|Poetisa; Cartunista|Chargista; Ilustrador|Ilustradora; Animador|Animadora;
Escultor|Escultora; Artista plástico; Artesão|Artesã; Grafiteiro; Técnico de som|Sonoplasta; Coach; Guia turístico|Guia de turismo|Guia;
Agente de viagens; Camareira|Camareiro; Governanta; Mordomo; Chofer|Motorista particular; Guarda-costas; Guarda florestal|Guarda-parque;
Coveiro; Agente funerário; Padre; Pastor|Pastora; Freira; Síndico|Síndica; Caseiro|Caseira; Vaqueiro|Peão|Boiadeiro; Fazendeiro|Fazendeira;
Lenhador; Garimpeiro; Minerador; Boia-fria|Cortador de cana; Florista; Verdureiro|Quitandeiro; Peixeiro;
Baiana de acarajé|Baiana do acarajé; Jóquei; Lutador|Lutadora; Gandula; Controlador de tráfego aéreo|Controlador de voo; Maquinista;
Estivador; Mototaxista; Designer de sobrancelhas|Sobrancelheira; Datilógrafo|Datilógrafa; Telegrafista; Leiteiro;
Amolador|Amolador de facas|Afiador; Engraxate; Lavadeira; Mascate; Caixeiro-viajante; Tropeiro; Lanterninha; Tecelão|Tecelã;
Benzedeira|Benzedeiro; Boticário
`;

export const DOENCAS = `
Dengue; Gripe|Influenza; Covid-19|Covid|Coronavírus; Diabetes|Diabetes mellitus|Diabete|Diabetes tipo 1|Diabetes tipo 2;
Câncer|Cancro|Neoplasia maligna|Tumor maligno; Hipertensão|Pressão alta|Hipertensão arterial; Sarampo; Catapora|Varicela;
Caxumba|Papeira|Parotidite; Resfriado|Resfriado comum; Tuberculose; Malária|Maleita|Impaludismo; Zika|Febre zika|Zika vírus;
Chikungunya|Febre chikungunya|Chicungunha; Asma; Alzheimer|Doença de Alzheimer|Mal de Alzheimer;
Parkinson|Doença de Parkinson|Mal de Parkinson; Aids|HIV|Sida|Síndrome da imunodeficiência adquirida;
Hepatite|Hepatite A|Hepatite B|Hepatite C; Rubéola; Meningite; Gastrite; Rinite|Rinite alérgica; Sinusite; Bronquite; Pneumonia;
Febre amarela; Raiva|Hidrofobia; Tétano; Varíola; Poliomielite|Paralisia infantil|Pólio; Hanseníase|Lepra; Sífilis; Gonorreia|Blenorragia;
Herpes|Herpes labial|Herpes genital; HPV|Papilomavírus humano; Leptospirose; Leishmaniose|Calazar|Úlcera de Bauru;
Doença de Chagas|Chagas|Mal de Chagas; Esquizofrenia; Depressão; Ansiedade|Transtorno de ansiedade|Transtorno de ansiedade generalizada;
Autismo|Transtorno do espectro autista|TEA; TDAH|Transtorno do déficit de atenção com hiperatividade|Déficit de atenção|DDA;
Enxaqueca|Migrânea; Artrite|Artrite reumatoide; Artrose|Osteoartrite|Osteoartrose; Osteoporose; Labirintite; Conjuntivite; Glaucoma;
Catarata; Lúpus|Lúpus eritematoso sistêmico; Esclerose múltipla; ELA|Esclerose lateral amiotrófica; Anemia|Anemia ferropriva; Leucemia;
Infarto|Ataque cardíaco|Infarto do miocárdio|Enfarte; AVC|Derrame|Acidente vascular cerebral|AVE|Acidente vascular encefálico; Apendicite;
Cálculo renal|Pedra no rim|Litíase renal|Nefrolitíase; Úlcera|Úlcera gástrica|Úlcera péptica; Psoríase; Vitiligo; Acne|Espinha|Espinhas;
Obesidade; Bulimia|Bulimia nervosa; Anorexia|Anorexia nervosa; Insônia; Hemorroida|Hemorroidas|Hemorroide; Escorbuto;
Peste bubônica|Peste negra|Peste; Ebola|Febre hemorrágica ebola|Doença por vírus Ébola; Mpox|Varíola dos macacos|Monkeypox|Varíola símia;
Coqueluche|Tosse comprida|Tosse convulsa; Difteria; Escarlatina; Cólera; Toxoplasmose; Giardíase; Verminose|Vermes|Lombriga|Ascaridíase;
Micose; Candidíase; Pé de atleta|Frieira|Tinea pedis; Sapinho|Candidíase oral; Terçol|Hordéolo; Caspa|Dermatite seborreica;
Gota|Artrite gotosa|Ácido úrico alto; Doença celíaca|Celíaca|Celiaquia; Intolerância à lactose; Fibromialgia; Tendinite;
LER|Lesão por esforço repetitivo|LER/DORT|DORT; Hérnia de disco; Escoliose; Bursite; H1N1|Gripe suína|Gripe A;
Colesterol alto|Hipercolesterolemia; Infecção urinária|Cistite; Gastroenterite|Virose; Diarreia; Amigdalite; Otite|Infecção de ouvido;
Faringite; Refluxo|Refluxo gastroesofágico|DRGE; Prisão de ventre|Constipação intestinal|Intestino preso|Constipação;
Cárie|Cáries|Cárie dentária; Gengivite; Afta|Aftas; Mau hálito|Halitose; Bruxismo; Miopia; Astigmatismo; Hipermetropia; Estrabismo;
Daltonismo; Surdez|Perda auditiva; Epilepsia; Síndrome de Down|Trissomia do cromossomo 21|Trissomia 21; Paralisia cerebral;
Transtorno bipolar|Bipolaridade|Transtorno afetivo bipolar; TOC|Transtorno obsessivo-compulsivo; Síndrome do pânico|Transtorno do pânico;
Burnout|Síndrome de burnout|Síndrome do esgotamento profissional; Estresse pós-traumático|Transtorno de estresse pós-traumático|TEPT;
Borderline|Transtorno de personalidade borderline; Compulsão alimentar|Transtorno da compulsão alimentar periódica; Alcoolismo;
Dependência química; Demência; Dislexia; Gagueira|Gaguez; Síndrome de Tourette|Tourette; Síndrome de Asperger|Asperger; Hipotireoidismo;
Hipertireoidismo; Bócio|Papo; Pressão baixa|Hipotensão; Arritmia|Arritmia cardíaca; Aneurisma; Trombose|Trombose venosa profunda|TVP;
Varizes|Variz; Angina|Angina pectoris; Cirrose|Cirrose hepática; Esteatose hepática|Gordura no fígado; Doença de Crohn|Crohn;
Hérnia|Hérnia inguinal|Hérnia umbilical; Pedra na vesícula|Cálculo biliar|Colelitíase; Insuficiência renal|Doença renal crônica;
Endometriose; Ovário policístico|Síndrome dos ovários policísticos|SOP; Mioma|Miomas|Mioma uterino; Câncer de mama; Câncer de próstata;
Câncer de pulmão; Câncer de pele; Linfoma; Câncer de colo do útero|Câncer de colo de útero; Câncer de intestino|Câncer colorretal;
Disfunção erétil|Impotência|Impotência sexual; Fimose; Depressão pós-parto; Icterícia; Alergia; Intoxicação alimentar; Insolação;
Desidratação; Desnutrição; DPOC|Doença pulmonar obstrutiva crônica|Enfisema|Enfisema pulmonar; Apneia do sono|Apneia;
Dermatite|Dermatite atópica|Eczema; Urticária; Herpes-zóster|Cobreiro|Zona; Furúnculo; Verruga|Verrugas; Calvície|Alopecia|Queda de cabelo;
Assadura|Dermatite de fralda; Escabiose|Sarna; Pediculose|Piolho; Bicho-de-pé|Tungíase; Bicho-geográfico|Larva migrans;
Esquistossomose|Barriga d'água|Xistose; Teníase|Solitária; Febre tifoide; Febre maculosa|Febre do carrapato; Mononucleose|Doença do beijo;
Mão-pé-boca|Doença mão-pé-boca|Síndrome mão-pé-boca; Sepse|Septicemia|Infecção generalizada; Anemia falciforme|Doença falciforme; Hemofilia;
Albinismo; Nanismo|Acondroplasia; Microcefalia; Lábio leporino|Fenda labial; Raquitismo; Síndrome do túnel do carpo|Túnel do carpo; Joanete;
Ciática|Dor ciática|Ciatalgia; Bico de papagaio|Osteófito; Torcicolo
`;

export const PROGRAMAS_TV = `
Big Brother Brasil|BBB|Big Brother; Jornal Nacional|JN; Fantástico; Domingão do Faustão|Domingão|Faustão; Chaves|El Chavo del Ocho;
Mais Você; Caldeirão do Huck|Caldeirão; Programa Silvio Santos; A Praça É Nossa; Os Trapalhões; Xou da Xuxa; Castelo Rá-Tim-Bum;
Sítio do Picapau Amarelo|Sítio do Pica-Pau Amarelo; Malhação; Zorra Total|Zorra; Escolinha do Professor Raimundo|Escolinha;
A Grande Família; Programa do Ratinho|Ratinho; Casos de Família; Domingo Legal; A Fazenda; The Voice Brasil|The Voice;
MasterChef Brasil|MasterChef; Pânico na TV|Pânico na Band|Pânico; CQC|Custe o Que Custar; Altas Horas;
Encontro|Encontro com Fátima Bernardes|Encontro com Patrícia Poeta; Globo Repórter; Profissão Repórter; Globo Esporte; Esporte Espetacular;
Vídeo Show|Video Show; Programa do Jô|Jô Soares; Hebe; Chapolin|Chapolin Colorado|El Chapulín Colorado; Show do Milhão; Topa ou Não Topa;
Passa ou Repassa; Roda a Roda|Roda a Roda Jequiti; Qual É a Música?; Hora do Faro; Programa Raul Gil|Raul Gil; Cidade Alerta;
Brasil Urgente; Jornal Hoje; Bom Dia Brasil; SBT Brasil; Domingo Espetacular; Criança Esperança; Teleton; Sai de Baixo; Os Normais;
Tá no Ar|Tá no Ar: a TV na TV; TV Colosso; Cocoricó; Rá-Tim-Bum; Planeta Xuxa; Bom Dia & Cia; TV Globinho; Linha Direta; Roda Viva;
Bem Amigos!; Sabadaço; No Limite; Casa dos Artistas; Dança dos Famosos; Programa Eliana|Eliana; Superpop; Jornal da Globo; Jornal da Band;
Jornal da Record; Balanço Geral; Hoje em Dia; Fala Brasil; Casseta & Planeta|Casseta & Planeta, Urgente!; TV Pirata;
A Turma do Didi|Turma do Didi; Sábado Animado; TV Cruj; Disney Cruj; Bambalalão; Xuxa Park; TV Xuxa; Angel Mix; Bozo; Clube da Criança;
Vila Sésamo; Mundo da Lua; Ilha Rá-Tim-Bum; X-Tudo; Glub-Glub; Balão Mágico; Disney Club; Zapping Zone;
Cassino do Chacrinha|Chacrinha|Discoteca do Chacrinha; Aqui Agora; Programa Livre; Jô Soares Onze e Meia;
The Noite com Danilo Gentili|The Noite; Agora É Tarde; Conversa com Bial; Programa do Porchat; Lady Night; Esquenta!; Amor & Sexo; Estrelas;
Power Couple Brasil|Power Couple; Ilha Record; Bake Off Brasil; O Aprendiz; Ídolos; Fama; Popstar; The Masked Singer Brasil; Super Nanny;
Domingão com Huck; Jogo Aberto; Os Donos da Bola; Mesa Redonda; Cartão Verde; Terceiro Tempo; Auto Esporte|Autoesporte; Globo Rural;
Pequenas Empresas & Grandes Negócios|PEGN; Bem Estar; É de Casa; TV Fama; Fofocalizando; Programa do Gugu; Viva a Noite; Show de Calouros;
Porta da Esperança; Viva o Gordo; Os Caras de Pau; Toma Lá, Dá Cá; A Diarista; Sob Nova Direção; Pé na Cova; Tapas & Beijos; Vai que Cola;
Hermes e Renato; Disk MTV; Piores Clipes do Mundo; Rockgol; Fudêncio e Seus Amigos; Saia Justa; Repórter Esso; TV Mulher;
Telecurso|Telecurso 2000; Sessão da Tarde; Tela Quente; Temperatura Máxima; Supercine; Corujão; Show da Virada; Gente Inocente;
Carrossel Animado; Teste de Fidelidade
`;

export const EMPRESAS_BRASILEIRAS = `
Petrobras|Petróleo Brasileiro; Vale|Vale S.A.|Companhia Vale do Rio Doce|Vale do Rio Doce; Itaú|Itaú Unibanco; Bradesco; Banco do Brasil|BB;
Caixa|Caixa Econômica Federal|Caixa Econômica; Correios|Empresa Brasileira de Correios e Telégrafos; Ambev;
Globo|Grupo Globo|Rede Globo|TV Globo; Magazine Luiza|Magalu; Nubank|Nu; Natura; Embraer; Havaianas; O Boticário|Grupo Boticário;
Casas Bahia; Americanas|Lojas Americanas; iFood; Sadia; Perdigão; Seara; Friboi; JBS; BRF|BRF Brasil Foods; Guaraná Antarctica; Brahma;
Gol|Gol Linhas Aéreas; Azul|Azul Linhas Aéreas; TAM|TAM Linhas Aéreas; Varig; Vivo; Oi; Gerdau; Riachuelo; Renner|Lojas Renner;
Marisa|Lojas Marisa; Hering|Cia. Hering; Havan; Pão de Açúcar|GPA|Grupo Pão de Açúcar; Assaí|Assaí Atacadista; Atacadão; Drogasil;
Raia|Droga Raia; Pague Menos; Localiza; Tramontina; Cacau Show; Kopenhagen; Habib's; Giraffas; Bob's; Madero; Garoto|Chocolates Garoto;
Lacta; Bauducco; Ypê; Bombril; Eletrobras; Sabesp; Cemig; Copel; Inter|Banco Inter; C6 Bank|C6; PicPay; Stone; PagSeguro|PagBank;
XP Investimentos|XP|XP Inc.; BTG Pactual|BTG; Totvs; Cielo; Raízen; Ipiranga; Ultragaz; Porto Seguro; SulAmérica|Sul América; Unimed;
Suzano|Suzano Papel e Celulose; Klabin; Tigre; Positivo|Positivo Tecnologia; Multilaser|Multi; Grendene; Melissa; Alpargatas; Ri Happy;
Arezzo; Brastemp; Consul; Arno; Britânia; Mondial; Intelbras; WEG; Braskem; CSN|Companhia Siderúrgica Nacional; Usiminas;
Votorantim|Grupo Votorantim; Odebrecht|Novonor; Camargo Corrêa; Marcopolo; Taurus|Taurus Armas; Caloi; Estrela|Brinquedos Estrela; Tilibra;
Gradiente; CCE; Semp|Semp Toshiba; Embratel; NET; Record|RecordTV|Rede Record; SBT|Sistema Brasileiro de Televisão;
Band|Rede Bandeirantes|Grupo Bandeirantes; RedeTV!; Folha de S.Paulo|Folha|Grupo Folha; Estadão|O Estado de S. Paulo;
Editora Abril|Abril|Grupo Abril; UOL; Jovem Pan; Safra|Banco Safra; Banrisul; Sicredi; Sicoob; BNDES; Unibanco; B3|Bovespa; Hapvida; Amil;
Ultrafarma; EMS; Granado; Jequiti; Pernambucanas|Casas Pernambucanas; Ponto Frio; Submarino; Netshoes; Centauro; Kalunga; Fast Shop;
Polishop; Tok&Stok|Tok Stok; Saraiva|Livraria Saraiva; Vivara; Chilli Beans; Reserva; Lupo; Malwee; Olympikus; Penalty;
Ipanema|Ipanema Sandálias; Rider; Azaleia; Itaipava|Grupo Petrópolis; Schin|Schincariol; Ypióca; Cachaça 51|51; Pitú; Dolly; Guaraná Jesus;
Matte Leão|Mate Leão; Piracanjuba; Itambé; Italac; Vigor; Aurora|Cooperativa Aurora|Aurora Alimentos; Tio João; Yoki; Pilão;
3 Corações|Três Corações; Piraquê; Arisco; Marfrig; Vibra|Vibra Energia|BR Distribuidora; Movida; Sem Parar; Itapemirim; Vasp;
MRV|MRV Engenharia; Wizard; CCAA; Fisk; Suvinil; Coral|Tintas Coral; Lorenzetti; Walita; Spoleto; China in Box; Coco Bambu; Fogo de Chão;
Casa do Pão de Queijo; Chiquinho Sorvetes|Chiquinho; Zé Delivery; QuintoAndar; 99|99 Táxis; Hotmart; Buscapé; 123 Milhas|123milhas;
CVC|CVC Viagens
`;

export const BANCOS = `
Itaú|Itaú Unibanco|Banco Itaú; Bradesco|Banco Bradesco; Banco do Brasil|BB; Caixa|Caixa Econômica Federal|Caixa Econômica;
Nubank|Nu|Roxinho; Santander|Banco Santander|Santander Brasil; Inter|Banco Inter; C6 Bank|C6; PicPay; Mercado Pago; PagBank|PagSeguro;
Neon|Banco Neon; Next|Banco Next; Banco Original|Original; Banco Pan|Pan|Banco Panamericano|Panamericano; BTG Pactual|BTG;
XP|XP Investimentos; Safra|Banco Safra; Sicredi; Sicoob; Banrisul; BMG|Banco BMG; Agibank|Agiplan; Caixa Tem; BNDES; Banco do Nordeste|BNB;
Banco da Amazônia|Basa; BRB|Banco de Brasília; Banestes; Banpará; Banese; HSBC; Citibank|Citi; Unibanco;
Banco Real|Real|ABN AMRO Real|ABN AMRO; Bamerindus; Banespa; Nossa Caixa; Banco Nacional|Nacional; Banco Econômico;
Banco Votorantim|BV|Banco BV; Daycoval|Banco Daycoval; Mercantil do Brasil|Banco Mercantil; Sofisa|Banco Sofisa|Sofisa Direto; Crefisa;
Banco Carrefour; Digio; Iti|iti Itaú; Ame|Ame Digital; RecargaPay; PayPal; Nomad; Wise; Revolut; Will Bank; Stone|Banco Stone; InfinitePay;
Cresol; Unicred; Modal|Banco Modal|ModalMais
`;

export const LOJAS = `
Magazine Luiza|Magalu; Casas Bahia; Americanas|Lojas Americanas; Mercado Livre; Shopee; Amazon; Shein; Renner|Lojas Renner; Riachuelo; C&A;
Marisa|Lojas Marisa; Carrefour; Pão de Açúcar; Extra; Assaí|Assaí Atacadista; Atacadão; Havan; Drogasil; Droga Raia|Raia; Pague Menos;
Leroy Merlin; Zara; AliExpress; Centauro; Decathlon; Ri Happy; Ponto Frio|Ponto; Fast Shop; Kalunga; Hering;
Pernambucanas|Casas Pernambucanas; Dia|Supermercado Dia; Tok&Stok|Tok Stok; Netshoes; Submarino; Dafiti; Ricardo Eletro; Insinuante;
Lojas Cem; Colombo|Lojas Colombo; Polishop; Camicado; Etna; PBKids|PB Kids; Torra|Lojas Torra; Besni; Le Biscuit; Daiso|Daiso Japan; Miniso;
Imaginarium; Livraria Cultura; Saraiva|Livraria Saraiva; Fnac; Leader|Lojas Leader; Zema|Eletrozema; Koerich|Lojas Koerich; Temu; Walmart;
Big|Hipermercado Big; Sam's Club; Makro; Bompreço; GBarbosa; Zaffari; Guanabara; Hortifruti; Oxxo; Drogaria São Paulo;
Pacheco|Drogarias Pacheco; Panvel; Ultrafarma; O Boticário; Natura; Sephora; Cacau Show; Kopenhagen; C&C|C&C Casa e Construção; Telhanorte;
Casa & Vídeo; MadeiraMadeira; Mobly; Lojas Avenida|Avenida; Forever 21; H&M; Vivara; Pandora; Chilli Beans; Track & Field; Cobasi; Petz;
Petlove; KaBuM!; iPlace; Shoptime; Livraria Leitura|Leitura; Mappin; Mesbla; Arapuã; Sears; Lojas Brasileiras|Lobrás
`;

export const APPS = `
WhatsApp|Zap|Zap Zap; Instagram|Insta; YouTube; TikTok; Facebook|Face; Google; Uber; iFood; Netflix; Spotify; Twitter|X; Telegram; Kwai;
Mercado Livre; Shopee; Shein; Nubank; PicPay; Mercado Pago; 99|99 Táxi|99Pop; Waze; Google Maps; Gmail; Free Fire|Garena Free Fire; Roblox;
Minecraft; Candy Crush|Candy Crush Saga; Subway Surfers; Clash of Clans; Clash Royale; Among Us; Fortnite; Pokémon GO; Stumble Guys;
Brawl Stars; Pou; Angry Birds; Fruit Ninja; Temple Run; Plants vs. Zombies|Plantas vs. Zumbis; Flappy Bird; Disney+|Disney Plus;
Prime Video|Amazon Prime Video; Globoplay; HBO Max|Max; Deezer; ChatGPT; Duolingo; Pinterest; LinkedIn; Snapchat; Discord; Twitch; Tinder;
Bumble; Zoom; Teams|Microsoft Teams; Google Meet; Rappi; Amazon; AliExpress; Temu; OLX; Magalu|Magazine Luiza; Americanas; Caixa Tem;
Gov.br; Carteira Digital de Trânsito|CNH Digital; Wikipédia|Wikipedia; Orkut; MSN Messenger|MSN|Windows Live Messenger; Skype; ICQ; Fotolog;
Habbo|Habbo Hotel; Myspace; Hotmail|Outlook; Yahoo|Yahoo!; Yahoo Respostas; Google Tradutor|Google Translate; Google Drive;
Chrome|Google Chrome; Messenger|Facebook Messenger; Threads; Reddit; Tumblr; Vine; CapCut; Canva; PicsArt; Shazam; Palco MP3; YouTube Music;
Apple Music; Crunchyroll; Paramount+; Star+; inDrive; BlaBlaCar; Airbnb; Booking|Booking.com; Zé Delivery; Uber Eats; Brainly; Gemini;
Genshin Impact; PUBG Mobile|PUBG; Call of Duty Mobile|CoD Mobile; 8 Ball Pool; Ludo King; FarmVille; Colheita Feliz; Cut the Rope;
Hill Climb Racing; My Talking Tom|Talking Tom; Geometry Dash; Dream League Soccer; EA Sports FC Mobile|FIFA Mobile; Coin Master;
Fortune Tiger|Jogo do Tigrinho|Tigrinho; Wordle; Termo; Gartic|Gartic Phone; Agar.io; Club Penguin; Friv; Kazaa; Megaupload; Badoo; Happn;
Grindr; Par Perfeito; Bate-papo UOL; Cifra Club; Reclame Aqui; G1; UOL; Steam
`;

export const MARCAS_TECNOLOGIA = `
Apple; Samsung; Motorola; Xiaomi; LG; Sony; Microsoft; Google; Dell; HP|Hewlett-Packard; Lenovo; Asus; Acer; Positivo|Positivo Tecnologia;
Multilaser|Multi; Philco; Philips; Panasonic; Nokia; Huawei; Realme; OnePlus; Nintendo; PlayStation; Xbox; Intel; AMD; Nvidia; JBL; Bose;
Canon; Nikon; GoPro; Brastemp; Consul; Electrolux; Arno; Britânia; Mondial; Intelbras; Logitech; Razer; Corsair; HyperX; Kingston; SanDisk;
Western Digital|WD; Seagate; IBM; Oracle; Amazon; Meta|Facebook|Meta Platforms; Netflix; Tesla; Garmin; Fitbit; Alexa|Amazon Alexa; Kindle;
iPhone; Galaxy|Samsung Galaxy; iPad; Toshiba; Sharp; Semp|Semp TCL|Semp Toshiba; TCL; AOC; Gradiente; CCE; Itautec; Compaq; Vaio; Alcatel;
BlackBerry; Siemens; Sony Ericsson; MSI; Epson; Xerox; Kodak; Fujifilm; Polaroid; Casio; Pioneer; Sennheiser; Beats|Beats by Dre; Walita;
Oster; Black+Decker|Black & Decker; Bosch; Midea; Whirlpool; Dyson; Atari; Sega; Valve|Steam; Qualcomm; Cisco; TP-Link; Oppo; Honor; Aiwa;
Yamaha; Alienware; OpenAI; Adobe; Yahoo; Alibaba; ByteDance; SpaceX|Starlink; DJI
`;
