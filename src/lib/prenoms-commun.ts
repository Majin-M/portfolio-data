// Types des exports du projet Prénoms de France et fonctions sans dépendance
// serveur : importables depuis les composants client.

export type Sexe = "F" | "M";

export type LigneDiversite = {
  annee: number;
  sexe: Sexe;
  nombre_prenoms: number;
  nombre_naissances: number;
  part_top_10: number;
  nombre_prenoms_moitie_naissances: number;
  nombre_effectif_prenoms: number;
};

export type LigneEcart = {
  annee: number;
  nombre_naissances_france: number;
  nombre_naissances_regions: number;
  part_ecart: number;
};

export type Metadata = {
  genere_le: string;
  source: { producteur: string; sha256: string; charge_le: string };
  annees: { premiere: number; derniere: number };
  lignes: { source: number; series_exportees: number };
  perimetre: string;
  dbt: {
    commande: string;
    version: string;
    execute_le: string;
    duree_totale_s: number;
    modeles: { nom: string; statut: string; duree_s: number }[];
    tests: { total: number; pass?: number; warn?: number; fail?: number; error?: number };
  } | null;
};

/** Un fichier series/<INITIALE>.json : {"STEVEN": {"M": [[1946, 5], ...]}}. */
export type FichierSeries = Record<string, Partial<Record<Sexe, [number, number][]>>>;

/** Même règle que export.py : initiale sans accent, en majuscule (ÉLODIE -> E). */
export function initiale(prenom: string): string {
  return prenom.normalize("NFD")[0].toUpperCase();
}

const DIACRITIQUES = new RegExp("[\\u0300-\\u036f]", "g");

export function sansAccents(texte: string): string {
  return texte.normalize("NFD").replace(DIACRITIQUES, "");
}
