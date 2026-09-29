// Projection de la carte des prix en 2.5D : le sol (la France, dessinée par les
// stations elles-mêmes) est incliné et légèrement cisaillé, les prix s'élèvent
// à la verticale. Fonctions pures, partagées par le rendu du build et par le
// navigateur (clic sur la carte → lieu de la recherche).

/** Événement envoyé par la carte quand on clique sur un point : la recherche s'y place. */
export const EVENEMENT_LIEU = "carburant:lieu";

const LAT_REF = 46.5;
const COS_LAT = Math.cos((LAT_REF * Math.PI) / 180);
const LON_MIN = -5.0;
const LON_MAX = 9.7;
const LAT_MIN = 41.3;
const LAT_MAX = 51.2;

/** Pixels par degré de latitude, avant inclinaison. */
const K = 88;
/** Écrasement vertical du sol : il est vu de biais. */
const INCLINAISON = 0.58;
/** Décalage horizontal du fond de la carte, pour un angle de vue de trois quarts. */
const CISAILLEMENT = 0.28;
const MARGE = 12;
/** Place au-dessus du sol pour les pics du nord. */
export const MARGE_HAUT = 150;
/** Hauteur d'un pic, en pixels par euro au-dessus du prix repère. */
export const PX_PAR_EURO = 330;

const PROFONDEUR = (LAT_MAX - LAT_MIN) * K * INCLINAISON;

export const CADRE = {
  largeur: Math.ceil((LON_MAX - LON_MIN) * COS_LAT * K + PROFONDEUR * CISAILLEMENT + 2 * MARGE),
  hauteur: Math.ceil(MARGE_HAUT + PROFONDEUR + MARGE),
};

/** Latitude, longitude → point du sol dans le repère du SVG. */
export function projeter(latitude: number, longitude: number): [number, number] {
  const profondeur = (LAT_MAX - latitude) * K * INCLINAISON;
  const x = MARGE + (longitude - LON_MIN) * COS_LAT * K + (PROFONDEUR - profondeur) * CISAILLEMENT;
  return [x, MARGE_HAUT + profondeur];
}

/** Point du sol → latitude, longitude (inverse de projeter). */
export function deprojeter(x: number, y: number): { latitude: number; longitude: number } {
  const profondeur = y - MARGE_HAUT;
  const latitude = LAT_MAX - profondeur / (K * INCLINAISON);
  const longitude = LON_MIN + (x - MARGE - (PROFONDEUR - profondeur) * CISAILLEMENT) / (COS_LAT * K);
  return { latitude, longitude };
}

/** Rayon d'un cercle de rayonKm sur le sol : [horizontal, vertical], en pixels. */
export function rayonAuSol(rayonKm: number): [number, number] {
  const r = (rayonKm / 111.2) * K;
  return [r, r * INCLINAISON];
}

/** Vrai si le point tombe dans l'emprise de la carte (métropole et Corse). */
export function dansLaCarte(latitude: number, longitude: number): boolean {
  return latitude >= LAT_MIN && latitude <= LAT_MAX && longitude >= LON_MIN && longitude <= LON_MAX;
}
