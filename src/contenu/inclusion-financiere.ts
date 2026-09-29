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

/** Part des répondants ayant un compte bancaire, par pays (cible connue, pays connu). */
export const PAR_PAYS = [
  { label: "Kenya", part: 0.251, effectif: 6066 },
  { label: "Rwanda", part: 0.115, effectif: 8734 },
  { label: "Tanzanie", part: 0.092, effectif: 6570 },
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
    detail: "14 lignes dont le pays manquait, remplacé par « Unknown » comme les autres catégories",
  },
  { constat: "Niveau d'éducation « 6 »", detail: "une modalité sans libellé, à côté des niveaux nommés" },
  {
    constat: "Noms de colonnes d'origine",
    detail: "fautes conservées après le passage en snake_case : level_of_educuation, the_relathip_with_head",
  },
];
