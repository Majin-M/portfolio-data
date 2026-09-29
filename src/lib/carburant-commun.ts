// Types des exports du projet Prix des carburants et fonctions sans dépendance
// serveur : importables depuis les composants client. Format décrit dans le
// catalogue de données du dépôt Carburant (docs/catalogue_de_donnees.md).

/** Fichiers publiés chaque matin par le workflow du dépôt Carburant. */
export const URL_DONNEES_EN_LIGNE = "https://majin-m.github.io/Carburant/prix_actuels.json";
/** Copie faite au build (npm run donnees:carburant), utilisée si GitHub Pages ne répond pas. */
export const URL_DONNEES_LOCALES = "/data/carburant/prix_actuels.json";

/** Règle de lecture transmise par metadata.json : au-delà, un prix est affiché grisé. */
export const JOURS_PRIX_RECENT = 7;

export type Metadata = {
  genere_le: string;
  reference_at: string;
  fichiers_source: { annee: number; fichier: string; sha256: string; charge_le: string }[];
  volumes: {
    stations: number;
    prix_actuels: number;
    prix_actuels_recents: number;
    prix_suspects: number;
    changements_de_prix: number;
  };
  carburants: Record<string, string>;
  regles_de_lecture: string[];
  derniere_execution_dbt: {
    commande: string;
    genere_le: string;
    duree_s: number;
    modeles: Record<string, number>;
    tests: Record<string, number>;
  } | null;
};

/** prix_actuels.json : stations et prix en tableaux, l'ordre des valeurs donné une fois. */
export type FichierPrix = {
  reference_at: string;
  colonnes_station: string[];
  colonnes_prix: string[];
  stations: unknown[][];
};

export type Prix = { carburantId: number; prix: number; maj: string; ageJours: number; suspect: boolean };

export type Station = {
  id: number;
  latitude: number;
  longitude: number;
  adresse: string;
  ville: string;
  codePostal: string;
  autoroute: boolean;
  prix: Prix[];
};

export const CARBURANTS: Record<number, string> = { 1: "Gazole", 2: "SP95", 3: "E85", 4: "GPLc", 5: "E10", 6: "SP98" };

/** Lit le format compact en s'appuyant sur les noms de colonnes, pas sur leur position supposée. */
export function lireStations(fichier: FichierPrix): Station[] {
  const s = Object.fromEntries(fichier.colonnes_station.map((c, i) => [c, i]));
  const p = Object.fromEntries(fichier.colonnes_prix.map((c, i) => [c, i]));
  return fichier.stations.map((ligne) => ({
    id: ligne[s.id] as number,
    latitude: ligne[s.latitude] as number,
    longitude: ligne[s.longitude] as number,
    adresse: ligne[s.adresse] as string,
    ville: ligne[s.ville] as string,
    codePostal: ligne[s.code_postal] as string,
    autoroute: ligne[s.autoroute] as boolean,
    prix: (ligne[s.prix] as unknown[][]).map((x) => ({
      carburantId: x[p.carburant_id] as number,
      prix: x[p.prix] as number,
      maj: x[p.maj] as string,
      ageJours: x[p.age_jours] as number,
      suspect: x[p.suspect] as boolean,
    })),
  }));
}

/** Majuscules, sans accents, tirets et apostrophes remplacés par des espaces : « Saint-Étienne » = « SAINT ETIENNE ». */
export function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[-'’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const PETITS_MOTS = new Set(["de", "du", "des", "la", "le", "les", "lès", "lez", "sur", "sous", "en", "et", "aux", "au", "d", "l"]);

/**
 * Casse d'affichage des villes, souvent en majuscules dans la source, parfois
 * avec les accents restés en minuscules (« SAINT-DENIS-LèS-BOURG ») :
 * « Saint-Denis-lès-Bourg ».
 */
export function joliNom(texte: string): string {
  return texte
    .toLocaleLowerCase("fr-FR")
    .split(/(\s+|-|')/)
    .map((mot, i) => (i > 0 && PETITS_MOTS.has(mot) ? mot : mot.charAt(0).toLocaleUpperCase("fr-FR") + mot.slice(1)))
    .join("");
}

/** Distance à vol d'oiseau, en kilomètres (formule de haversine). */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

export type Lieu = { latitude: number; longitude: number; libelle: string };

/**
 * Trouve un lieu dans les stations elles-mêmes, sans service de géocodage :
 * un code postal (5 chiffres), un département (2 ou 3 chiffres) ou un nom de
 * ville. Le centre est la moyenne des stations trouvées.
 */
export function trouverLieu(stations: Station[], saisie: string): Lieu | null {
  const texte = normaliser(saisie);
  if (!texte) return null;
  let trouvees: Station[];
  let libelle: string;
  if (/^\d{5}$/.test(texte)) {
    trouvees = stations.filter((s) => s.codePostal === texte);
    libelle = texte;
  } else if (/^(\d{2}|2A|2B|97\d)$/.test(texte)) {
    trouvees = stations.filter((s) => s.codePostal.startsWith(texte));
    libelle = `département ${texte}`;
  } else {
    // La source écrit « LYON », « Lyon » ou « LYON 7 ». Nom exact d'abord, puis le
    // nom suivi d'un mot (« LYON 7 », sans « LYONS LA FORET »), puis un simple début
    // de nom, pour une saisie incomplète.
    const noms = stations.map((s) => normaliser(s.ville));
    trouvees = stations.filter((_, i) => noms[i] === texte);
    if (!trouvees.length) trouvees = stations.filter((_, i) => noms[i].startsWith(`${texte} `));
    if (!trouvees.length) trouvees = stations.filter((_, i) => noms[i].startsWith(texte));
    libelle = trouvees.length ? joliNom(trouvees[0].ville) : texte;
  }
  if (!trouvees.length) return null;
  const moyenne = (f: (s: Station) => number) => trouvees.reduce((t, s) => t + f(s), 0) / trouvees.length;
  return { latitude: moyenne((s) => s.latitude), longitude: moyenne((s) => s.longitude), libelle };
}

export type Resultat = {
  station: Station;
  prix: Prix;
  distance: number;
  recent: boolean;
};

export type Classement = {
  /** Prix récents, du moins cher au plus cher, puis prix anciens si demandés. */
  resultats: Resultat[];
  anciens: number;
  suspects: number;
};

/**
 * Stations du rayon qui vendent le carburant, classées par prix. Les prix
 * suspects ne sont jamais classés ; les prix de plus de 7 jours ne le sont
 * que si on le demande, et toujours après les prix récents.
 */
export function classer(
  stations: Station[],
  lieu: Lieu,
  carburantId: number,
  rayonKm: number,
  inclureAnciens: boolean,
): Classement {
  const dansLeRayon: Resultat[] = [];
  for (const station of stations) {
    const prix = station.prix.find((p) => p.carburantId === carburantId);
    if (!prix) continue;
    const distance = distanceKm(lieu.latitude, lieu.longitude, station.latitude, station.longitude);
    if (distance > rayonKm) continue;
    dansLeRayon.push({ station, prix, distance, recent: prix.ageJours <= JOURS_PRIX_RECENT });
  }
  const suspects = dansLeRayon.filter((r) => r.prix.suspect).length;
  const valables = dansLeRayon.filter((r) => !r.prix.suspect);
  const parPrix = (a: Resultat, b: Resultat) => a.prix.prix - b.prix.prix || a.distance - b.distance;
  const recents = valables.filter((r) => r.recent).sort(parPrix);
  const anciens = valables.filter((r) => !r.recent).sort(parPrix);
  return { resultats: inclureAnciens ? [...recents, ...anciens] : recents, anciens: anciens.length, suspects };
}

/** Prix au litre : « 2,389 € ». */
export function euros(prix: number, decimales = 3): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(prix);
}

/**
 * Date et heure d'un relevé, à l'heure de Paris : les stations sont en France,
 * et le fuseau fixe évite un écart entre le rendu du build et celui du navigateur.
 */
export function dateReleve(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function jourDonnees(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", dateStyle: "long" }).format(new Date(iso));
}
