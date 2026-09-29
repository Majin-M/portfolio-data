// Contenu de la page « Inclusion financière ».
//
// Toutes les valeurs viennent d'une exécution du 28 septembre 2026 sur le
// dépôt local (Documents/GitHub/inclusion_financiere) : profilage des fichiers
// data/Financial_inclusion_dataset.csv et data/financial_inclusion_clean.csv,
// puis évaluation du modèle du dépôt (src/model.py, Random Forest de 200
// arbres, random_state 42) sur un jeu de test stratifié de 20 %, que le dépôt
// ne prévoit pas : il entraîne le modèle sur toutes les données.

export const MESURE_LE = "2026-09-28";
export const DEPOT = "https://github.com/Majin-M/inclusion_financiere";

export const DONNEES = {
  reponses: 23524,
  colonnes: 13,
  manquantsTraites: 267,
  doublons: 0,
  ciblesInconnues: 36,
  lignesModele: 23485,
  tauxCompte: 0.1409,
  ageMoyen: 38.8,
};

/** Part des répondants ayant un compte bancaire, par pays (cible connue). */
export const PAR_PAYS = [
  { label: "Kenya", part: 0.251, effectif: 6068 },
  { label: "Rwanda", part: 0.115, effectif: 8735 },
  { label: "Tanzanie", part: 0.091, effectif: 6606 },
  { label: "Ouganda", part: 0.086, effectif: 2101 },
];

/** Part des répondants ayant un compte bancaire, par niveau d'éducation. */
export const PAR_EDUCATION = [
  { label: "Formation professionnelle", part: 0.57 },
  { label: "Enseignement supérieur", part: 0.512 },
  { label: "Enseignement secondaire", part: 0.233 },
  { label: "Enseignement primaire", part: 0.085 },
  { label: "Sans instruction", part: 0.039 },
];

/** Part des répondants ayant un compte bancaire, par type d'emploi (extraits). */
export const PAR_EMPLOI = [
  { label: "Salarié du public", part: 0.775 },
  { label: "Salarié du privé", part: 0.542 },
  { label: "Indépendant", part: 0.132 },
  { label: "Agriculture et pêche", part: 0.117 },
  { label: "Emploi informel", part: 0.079 },
  { label: "Sans revenu", part: 0.021 },
];

export const MODELE = {
  arbres: 200,
  variables: 8782,
  test: 4697,
  testOui: 662,
  // Modèle du dépôt (identifiant uniqueid encodé comme variable)
  precision: 0.8893,
  base: 0.8591,
  auc: 0.8527,
  rappel: 0.3248,
  precisionOui: 0.7465,
};

/** Même modèle, sans l'identifiant parmi les variables. */
export const MODELE_SANS_ID = {
  variables: 47,
  precision: 0.8654,
  auc: 0.8235,
  rappel: 0.4184,
  precisionOui: 0.5286,
};

export const ANOMALIES = [
  {
    constat: "Années hors période d'enquête",
    detail: "2029, 2039 et 2056, une ligne chacune, alors que l'enquête couvre 2016 à 2018",
  },
  {
    constat: "Cible inconnue",
    detail: "36 lignes « Unknown » pour la possession d'un compte, écartées au moment de l'entraînement",
  },
  { constat: "Niveau d'éducation « 6 »", detail: "une modalité sans libellé, à côté des niveaux nommés" },
  {
    constat: "Noms de colonnes d'origine",
    detail: "fautes conservées après le passage en snake_case : level_of_educuation, the_relathip_with_head",
  },
];
