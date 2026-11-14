// Contenu de la page « Inclusion financière ».
//
// Toutes les valeurs viennent d'une exécution du 14 novembre 2026 sur le
// dépôt local (Documents/inclusion_financiere, commit 028a3bc) : profilage des
// fichiers data/Financial_inclusion_dataset.csv et data/financial_inclusion_clean.csv,
// puis évaluation du modèle par le dépôt lui-même (python -m src.model : Random
// Forest de 200 arbres, random_state 42, jeu de test stratifié de 20 %), publiée
// dans models/metrics.json. La première version du modèle, avec l'identifiant
// parmi les variables, est évaluée sur les mêmes données nettoyées et le même
// jeu de test.
//
// Chaque pays n'a été enquêté qu'une année, et les types d'emploi ne sont pas
// codés de la même façon partout : ils sont donc donnés pays par pays.

export const MESURE_LE = "2026-11-14";
export const DEPOT = "https://github.com/Majin-M/inclusion_financiere";

export const DONNEES = {
  reponses: 23524,
  colonnes: 13,
  manquantsTraites: 267,
  horsPeriodeRetirees: 3,
  /** Après nettoyage : la cible y est toujours connue. */
  lignesNettoyees: 23485,
  doublons: 0,
  /** Lignes sans réponse sur la possession d'un compte, retirées au nettoyage. */
  ciblesInconnues: 36,
  /** Lignes au niveau d'éducation « 6 », sans libellé, traitées comme inconnues. */
  educationSansLibelle: 27,
  /** Contrôles qualité automatiques relancés à chaque exécution (src/quality_checks.py). */
  controles: 8,
  /** Lignes sans pays, rattachées à la Tanzanie par le nettoyage. */
  paysRetrouves: 14,
  tauxCompte: 0.1409,
  ageMoyen: 38.8,
};

/**
 * Part des répondants ayant un compte bancaire, par pays (cible connue, pays connu).
 * Chaque pays n'a été enquêté qu'une année : l'écart entre pays est aussi un écart entre années.
 */
export const PAR_PAYS = [
  { label: "Kenya", annee: 2018, part: 0.251, effectif: 6066 },
  { label: "Rwanda", annee: 2016, part: 0.115, effectif: 8734 },
  { label: "Tanzanie", annee: 2017, part: 0.092, effectif: 6584 },
  { label: "Ouganda", annee: 2018, part: 0.086, effectif: 2101 },
] as const;

/** Part des répondants ayant un compte bancaire, par niveau d'éducation. */
export const PAR_EDUCATION = [
  { label: "Formation professionnelle", part: 0.57 },
  { label: "Enseignement supérieur", part: 0.512 },
  { label: "Enseignement secondaire", part: 0.233 },
  { label: "Enseignement primaire", part: 0.085 },
  { label: "Sans instruction", part: 0.039 },
];

/**
 * Part des répondants ayant un compte bancaire, par type d'emploi, dans chaque pays
 * (même ordre que PAR_PAYS). null : la catégorie n'existe pas dans le fichier de ce pays.
 * Toutes les cases affichées comptent au moins 34 répondants. Écartés : Government Dependent
 * (7 à 91 répondants), Dont Know/Refuse to answer et Unknown.
 */
export const PAR_EMPLOI_PAYS: { label: string; parts: (number | null)[]; effectifs: (number | null)[] }[] = [
  { label: "Salarié du public", parts: [0.831, 0.661, null, null], effectifs: [260, 127, null, null] },
  { label: "Salarié du privé", parts: [0.54, 0.348, 0.641, 0.5], effectifs: [415, 161, 368, 108] },
  { label: "Indépendant", parts: [0.382, 0.302, 0.062, 0.062], effectifs: [954, 603, 3748, 1104] },
  { label: "Autres revenus", parts: [0.409, 0.254, 0.147, 0.081], effectifs: [154, 323, 34, 568] },
  { label: "Agriculture et pêche", parts: [0.193, 0.085, null, null], effectifs: [1609, 3824, null, null] },
  { label: "Emploi informel", parts: [0.131, 0.067, 0.05, null], effectifs: [1419, 2868, 1290, null] },
  { label: "Vit d'envois d'argent", parts: [0.115, 0.105, 0.05, null], effectifs: [1187, 660, 674, null] },
  { label: "Sans revenu", parts: [null, null, 0.021, 0.02], effectifs: [null, null, 377, 247] },
];

/** Indépendants, tous pays additionnés, et part de la Tanzanie parmi eux. */
export const INDEPENDANTS_ADDITIONNES = { part: 0.132, effectif: 6409, partTanzanie: 0.585 };

/** Modèle actuel du dépôt : l'identifiant uniqueid est exclu des variables. */
export const MODELE = {
  arbres: 200,
  lignes: 23482,
  variables: 45,
  test: 4697,
  testOui: 662,
  precision: 0.8665,
  base: 0.8591,
  auc: 0.8152,
  rappel: 0.3973,
  precisionOui: 0.5356,
};

/** Première version du modèle : uniqueid encodé comme variable (8 735 colonnes one-hot). */
export const MODELE_AVEC_ID = {
  variables: 8780,
  precision: 0.8859,
  auc: 0.8499,
  rappel: 0.2961,
  precisionOui: 0.7368,
};

/** Défauts trouvés à l'exploration et corrigés dans le dépôt. */
export const CORRECTIONS = [
  {
    constat: "Valeurs manquantes restées en place",
    detail:
      "l'imputation par fillna(inplace=True) sur une copie de colonne ne s'appliquait plus sous pandas 3 : les 267 valeurs manquantes restaient. Les colonnes sont maintenant réaffectées : 0 manquant",
  },
  {
    constat: "Années hors période d'enquête",
    detail: "2029, 2039 et 2056, une ligne chacune, alors que l'enquête couvre 2016 à 2018 : les 3 lignes sont retirées",
  },
  {
    constat: "Pays manquant",
    detail:
      "14 lignes sans pays, toutes de 2017, l'année de la seule Tanzanie, et dont les identifiants comblent des trous de la numérotation tanzanienne : elles lui sont rattachées",
  },
  {
    constat: "Ville et campagne inversées en Tanzanie",
    detail:
      "le fichier donnait 73 % d'urbains, moins souvent équipés d'un compte, d'un téléphone et d'un diplôme que les « ruraux » ; le rapport FinScope Tanzania 2017 donne 34 % d'urbains et 66 % de ruraux. Les deux libellés sont échangés : 27 % d'urbains, qui ont désormais plus souvent un compte, comme dans les autres pays",
  },
  {
    constat: "Cible inconnue",
    detail: "36 lignes sans réponse sur la possession d'un compte : retirées, elles ne servaient ni à entraîner ni à évaluer le modèle",
  },
  {
    constat: "Niveau d'éducation « 6 »",
    detail: "27 lignes avec une modalité sans libellé ni documentation : traitée comme inconnue, elle n'apparaît plus dans le formulaire",
  },
  {
    constat: "Identifiant parmi les variables",
    detail: "uniqueid encodé en 8 735 colonnes one-hot : exclu du modèle, qui passe de 8 780 à 45 variables",
  },
];

/** Ce que le profilage du fichier nettoyé montre encore. */
export const ANOMALIES = [
  {
    constat: "Un pays, une année",
    detail:
      "Rwanda 2016, Tanzanie 2017, Kenya et Ouganda 2018 : l'effet du pays et celui de l'année ne se séparent pas. L'application déduit désormais l'année du pays au lieu de la demander",
  },
  {
    constat: "Emplois codés différemment selon les pays",
    detail:
      "ni agriculture ni emploi public en Tanzanie et en Ouganda, « sans revenu » seulement chez eux, 27 % d'« autres revenus » en Ouganda : les types d'emploi ne se comparent qu'à l'intérieur d'un pays",
  },
  {
    constat: "Taille du foyer en Tanzanie",
    detail: "83 % des foyers de 0 à 2 personnes, contre 16 à 31 % ailleurs, et les 36 foyers de taille 0 sont tous tanzaniens : la notion de foyer n'est sans doute pas la même",
  },
  {
    constat: "Noms de colonnes d'origine",
    detail: "fautes conservées après le passage en snake_case : level_of_educuation, the_relathip_with_head",
  },
];

/** Part des femmes et des hommes ayant un compte (cible et genre connus). */
export const PAR_GENRE = { femmes: 0.1071, hommes: 0.1895, effectifFemmes: 13837, effectifHommes: 9614 };

/** Femmes et hommes, par niveau d'éducation, tous pays confondus (du moins au plus instruit). */
export const GENRE_PAR_EDUCATION = [
  { label: "Sans instruction", femmes: 0.0316, hommes: 0.0575, effectifFemmes: 3169, effectifHommes: 1322 },
  { label: "Enseignement primaire", femmes: 0.0637, hommes: 0.1156, effectifFemmes: 7405, effectifHommes: 5329 },
  { label: "Enseignement secondaire", femmes: 0.1898, hommes: 0.2812, effectifFemmes: 2229, effectifHommes: 1984 },
  { label: "Formation professionnelle", femmes: 0.4988, hommes: 0.6474, effectifFemmes: 421, effectifHommes: 380 },
  { label: "Enseignement supérieur", femmes: 0.4686, hommes: 0.5592, effectifFemmes: 574, effectifHommes: 574 },
];

/** Femmes et hommes, par pays (même ordre que PAR_PAYS). */
export const GENRE_PAR_PAYS = [
  { label: "Kenya", femmes: 0.2011, hommes: 0.3172 },
  { label: "Rwanda", femmes: 0.0857, hommes: 0.1577 },
  { label: "Tanzanie", femmes: 0.0634, hommes: 0.13 },
  { label: "Ouganda", femmes: 0.07, hommes: 0.1173 },
];

/**
 * Cases pays × niveau d'éducation comptant au moins 30 femmes et 30 hommes, et
 * nombre de cases où les femmes ont moins souvent un compte que les hommes.
 */
export const GENRE_CASES = { seuil: 30, cases: 19, femmesEnDessous: 19 };

/** Accès au téléphone : part des répondants ayant un compte, avec et sans téléphone. */
export const TELEPHONE = {
  avec: 0.1838,
  sans: 0.0172,
  effectifSans: 6053,
  sansAvecCompte: 104,
  /** Part des femmes et des hommes qui ont accès à un téléphone. */
  accesFemmes: 0.7051,
  accesHommes: 0.7959,
  /** Parmi celles et ceux qui ont un téléphone, part ayant un compte. */
  femmesAvecTelephone: 0.1467,
  hommesAvecTelephone: 0.2312,
  /**
   * Cible d'un service bancaire sur mobile : répondants avec téléphone et sans compte
   * (14 225 sur 23 482), et parmi eux la part de femmes et de ruraux. Parts de
   * l'échantillon : le fichier n'a pas les pondérations de l'enquête.
   */
  telephoneSansCompte: 0.6058,
  cibleFemmes: 0.5859,
  cibleRuraux: 0.7513,
};

/** Avec et sans téléphone, par pays (même ordre que PAR_PAYS). */
export const TELEPHONE_PAR_PAYS = [
  { label: "Kenya", sans: 0.0483, avec: 0.3048, effectifSans: 1283 },
  { label: "Rwanda", sans: 0.0128, avec: 0.1358, effectifSans: 1486 },
  { label: "Tanzanie", sans: 0.0049, avec: 0.1502, effectifSans: 2647 },
  { label: "Ouganda", sans: 0.0157, avec: 0.1168, effectifSans: 637 },
];
