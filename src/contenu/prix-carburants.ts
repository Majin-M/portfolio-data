// Contenu de la page « Prix des carburants ».
//
// Les chiffres du jour (stations, prix, tests) sont lus au build dans
// public/data/carburant/metadata.json. Ceux-ci viennent d'exécutions du
// pipeline du 28 septembre 2026 sur le dépôt Carburant (Desktop/Carburant) :
// requêtes DuckDB sur les couches raw, staging et marts, fichiers 2025 et 2026.

export const MESURE_LE = "2026-09-28";
export const DEPOT = "https://github.com/Majin-M/Carburant";
export const DONNEES_PUBLIEES = "https://majin-m.github.io/Carburant/metadata.json";

export const PIPELINE = {
  /** Relevés de prix des fichiers 2025 et 2026, hors balises vides, une fois les 2 conflits départagés. */
  releves: 9465583,
  changements: 5222646,
  /** Part des relevés qui répètent le prix précédent du même couple station × carburant. */
  partRepetes: 0.448,
  hausses: 2748854,
  baisses: 2436753,
  /** Variation médiane d'un changement, en euros. */
  variationMediane: 0.013,
  stationsFichier2026: 14793,
  stationsAvecPrix2026: 9774,
  conflits: 2,
  testsSinguliers: 18,
  /** Poids des fichiers 2026 (au 27/09). */
  zipMo: 28.5,
  xmlMo: 322,
  parquetMo: 14.2,
  prixActuelsAgeChangeEnUtc: 5642,
};

/**
 * Le lot automatique de 01:17, compté chaque nuit autour des changements
 * d'heure 2025 : relevés entre 01:10 et 01:25 et entre 02:10 et 02:25.
 * Il garde son heure locale toute l'année et ne se décale qu'une nuit.
 */
export const LOT_NUIT = [
  { jour: "2025-03-30", note: "passage à l'heure d'été", h01: 805, h02: 0 },
  { jour: "2025-03-31", note: "lendemain", h01: 0, h02: 805 },
  { jour: "2025-04-01", note: "", h01: 813, h02: 4 },
  { jour: "2025-10-26", note: "passage à l'heure d'hiver", h01: 889, h02: 0 },
  { jour: "2025-10-27", note: "lendemain : lot à 00:17", h01: 0, h02: 0 },
  { jour: "2025-10-28", note: "", h01: 886, h02: 0 },
];

/** E85 : relevés 2025 et 2026 au-dessus de 1,20 €, par tranche de 10 centimes (arrondi au dixième). */
export const E85_HAUT = [
  { tranche: "1,2", releves: 198 },
  { tranche: "1,3", releves: 187 },
  { tranche: "1,4", releves: 25 },
  { tranche: "1,5", releves: 4 },
  { tranche: "1,6", releves: 41 },
  { tranche: "1,7", releves: 161 },
  { tranche: "1,8", releves: 93 },
  { tranche: "1,9", releves: 44 },
  { tranche: "2,0", releves: 87 },
  { tranche: "2,1", releves: 20 },
  { tranche: "2,2", releves: 13 },
  { tranche: "2,3", releves: 4 },
];

export const SEUILS_SUSPECTS = { e85: 1.5, gplc: 1.8 };

export const TESTS_EN_ECHEC = [
  ["assert_maj_toujours_lisible", "un maj illisible (2025-13-45T25:00:00)"],
  ["assert_aucun_releve_dans_le_futur", "un relevé daté après le téléchargement du fichier"],
  ["assert_aucun_releve_pendant_heure_inexistante", "un relevé à 02:30 la nuit du passage à l'heure d'été"],
  ["assert_staging_conserve_les_releves", "un filtre en trop : le SP98 disparaît"],
  ["assert_prix_entre_0_30_et_4_euros", "un prix en millièmes (1638 au lieu de 1.638)"],
  ["assert_un_premier_releve_par_couple", "l'historique partitionné par station, sans le carburant"],
  ["assert_prix_actuel_egal_dernier_changement", "le premier prix pris au lieu du dernier"],
  ["assert_prix_suspects_rares", "tous les prix d'E85 passés à 1,99 €"],
] as const;
