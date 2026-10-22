/**
 * Países do Rodada: os 193 membros da ONU, mais Kosovo, Palestina, Taiwan e Vaticano.
 * Códigos ISO 3166-1 alfa-2 (Kosovo usa o código provisório XK).
 */
export const COUNTRY_CODES = (
  "AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF " +
  "TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH " +
  "GR GD GT GN GW GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KP KR KW KG LA LV LB LS LR LY " +
  "LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK NO OM PK " +
  "PW PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA SS ES LK SD " +
  "SR SE CH SY TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VE VN YE ZM ZW XK PS TW VA"
).split(" ");

/** Onde o nome do CLDR não é o que um brasileiro digitaria. */
export const COUNTRY_NAME_OVERRIDES: Record<string, string> = {
  CD: "República Democrática do Congo",
  MM: "Mianmar",
  PS: "Palestina",
  VA: "Vaticano",
  CZ: "Tchéquia",
};

/** Nomes alternativos aceitos no autocomplete. */
export const COUNTRY_ALIASES: Record<string, string[]> = {
  US: ["EUA", "Estados Unidos da América", "América"],
  GB: ["Inglaterra", "Grã-Bretanha", "UK"],
  NL: ["Holanda"],
  CZ: ["República Tcheca", "Chéquia"],
  CD: ["RDC", "Congo-Kinshasa", "Zaire"],
  CG: ["Congo", "Congo-Brazzaville"],
  MM: ["Birmânia", "Myanmar"],
  SZ: ["Suazilândia", "Eswatini"],
  MK: ["Macedônia"],
  CI: ["Côte d'Ivoire"],
  TL: ["Timor Leste"],
  KR: ["Coreia"],
  AE: ["Emirados Árabes", "EAU"],
  BY: ["Belarus"],
  BH: ["Bahrein", "Bahrain"],
  BF: ["Burkina Faso"],
  BW: ["Botswana"],
  KE: ["Quênia", "Kenya"],
  LS: ["Lesotho"],
  MW: ["Malawi"],
  SG: ["Cingapura"],
  TJ: ["Tajiquistão"],
  VN: ["Vietname"],
  PS: ["Territórios Palestinos"],
  VA: ["Cidade do Vaticano", "Santa Sé"],
  KN: ["São Cristóvão e Nevis"],
  MU: ["Ilhas Maurício"],
  CV: ["Cabo-Verde"],
  GW: ["Guiné Bissau"],
  PG: ["Papua Nova Guiné"],
  ZA: ["Africa do Sul"],
  KZ: ["Casaquistão"],
  KG: ["Quirguízia"],
  TW: ["Formosa"],
  IR: ["Irão"],
  YE: ["Iémen"],
};
