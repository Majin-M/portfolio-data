// Contenu de la page « Inclusion financière ».
//
// Toutes les valeurs viennent d'une exécution du 30 septembre 2026 sur le
// dépôt local (Documents/inclusion_financiere, commit c5a21e3) : profilage des
// fichiers data/Financial_inclusion_dataset.csv et data/financial_inclusion_clean.csv,
// puis évaluation du modèle du dépôt (src/model.py, Random Forest de 200 arbres,
// random_state 42) sur un jeu de test stratifié de 20 %, que le dépôt ne prévoit
// pas : il entraîne le modèle sur toutes les données. La première version du
// modèle, avec l'identifiant parmi les variables, est évaluée sur les mêmes
// données nettoyées et le même jeu de test.
//
// Les taux par pays et par emploi (PAR_EMPLOI_PAYS) ont été recalculés le
// 14 novembre 2026 sur le même commit : chaque pays n'a été enquêté qu'une
// année, et les types d'emploi ne sont pas codés de la même façon partout.

export const MESURE_LE = "2026-09-30";
export const DEPOT = "https://github.com/Majin-M/inclusion_financiere";

export const DONNEES = {
  reponses: 23524,
  colonnes: 13,
  manquantsTraites: 267,
  horsPeriodeRetirees: 3,
  lignesNettoyees: 23521,
  doublons: 0,
  ciblesInconnues: 36,
  /** Réponses dont la possession d'un compte est connue, après nettoyage. */
  lignesCibleConnue: 23485,
  paysInconnu: 14,
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
  { label: "Tanzanie", annee: 2017, part: 0.092, effectif: 6570 },
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
  { label: "Indépendant", parts: [0.382, 0.302, 0.062, 0.062], effectifs: [954, 603, 3740, 1104] },
  { label: "Autres revenus", parts: [0.409, 0.254, 0.147, 0.081], effectifs: [154, 323, 34, 568] },
  { label: "Agriculture et pêche", parts: [0.193, 0.085, null, null], effectifs: [1609, 3824, null, null] },
  { label: "Emploi informel", parts: [0.131, 0.067, 0.05, null], effectifs: [1419, 2868, 1289, null] },
  { label: "Vit d'envois d'argent", parts: [0.115, 0.105, 0.051, null], effectifs: [1187, 660, 671, null] },
  { label: "Sans revenu", parts: [null, null, 0.021, 0.02], effectifs: [null, null, 375, 247] },
];

/** Indépendants, tous pays additionnés, et part de la Tanzanie parmi eux. */
export const INDEPENDANTS_ADDITIONNES = { part: 0.132, effectif: 6401, partTanzanie: 0.584 };

/** Modèle actuel du dépôt : l'identifiant uniqueid est exclu des variables. */
export const MODELE = {
  arbres: 200,
  lignes: 23482,
  variables: 47,
  test: 4697,
  testOui: 662,
  precision: 0.8663,
  base: 0.8591,
  auc: 0.8145,
  rappel: 0.3943,
  precisionOui: 0.5348,
};

/** Première version du modèle : uniqueid encodé comme variable (8 735 colonnes one-hot). */
export const MODELE_AVEC_ID = {
  variables: 8782,
  precision: 0.8842,
  auc: 0.8502,
  rappel: 0.2915,
  precisionOui: 0.7201,
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
    constat: "Identifiant parmi les variables",
    detail: "uniqueid encodé en 8 735 colonnes one-hot : exclu du modèle, qui passe de 8 782 à 47 variables",
  },
];

/** Ce que le profilage du fichier nettoyé montre encore. */
export const ANOMALIES = [
  {
    constat: "Cible inconnue",
    detail: "36 lignes « Unknown » pour la possession d'un compte, écartées au moment de l'entraînement",
  },
  {
    constat: "Pays inconnu",
    detail:
      "14 lignes dont le pays manquait, remplacé par « Unknown ». Toutes datent de 2017, la seule année de la Tanzanie, et leurs identifiants tombent dans sa plage : elles sont récupérables",
  },
  {
    constat: "Un pays, une année",
    detail:
      "Rwanda 2016, Tanzanie 2017, Kenya et Ouganda 2018 : l'effet du pays et celui de l'année ne se séparent pas, et le formulaire de l'application accepte des couples qui n'existent pas",
  },
  {
    constat: "Emplois codés différemment selon les pays",
    detail:
      "ni agriculture ni emploi public en Tanzanie et en Ouganda, « sans revenu » seulement chez eux, 27 % d'« autres revenus » en Ouganda : les types d'emploi ne se comparent qu'à l'intérieur d'un pays",
  },
  {
    constat: "Ville et campagne en Tanzanie",
    detail:
      "73 % de « ville », contre 14 à 42 % ailleurs, et ces « urbains » ont moins de comptes, de téléphones et d'instruction que les « ruraux » : les libellés semblent inversés",
  },
  { constat: "Niveau d'éducation « 6 »", detail: "une modalité sans libellé, à côté des niveaux nommés" },
  {
    constat: "Noms de colonnes d'origine",
    detail: "fautes conservées après le passage en snake_case : level_of_educuation, the_relathip_with_head",
  },
];
