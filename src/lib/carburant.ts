// Lecture des exports du projet Prix des carburants (public/data/carburant/),
// au moment du build. Le navigateur, lui, charge chaque matin la version publiée
// sur GitHub Pages (voir carburant-commun.ts).

import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  CARBURANTS,
  JOURS_PRIX_RECENT,
  distanceKm,
  lireStations,
  type FichierPrix,
  type Metadata,
  type Station,
} from "@/lib/carburant-commun";

const DOSSIER = join(process.cwd(), "public", "data", "carburant");

function lire<T>(fichier: string): T {
  return JSON.parse(readFileSync(join(DOSSIER, fichier), "utf-8")) as T;
}

export function lireMetadataCarburant(): Metadata {
  return lire<Metadata>("metadata.json");
}

export function lireStationsCarburant(): Station[] {
  return lireStations(lire<FichierPrix>("prix_actuels.json"));
}

/** Tests dbt de la dernière exécution : « 53/53 ». */
export function testsCarburant(m: Metadata): string {
  const t = m.derniere_execution_dbt?.tests;
  if (!t) return "n/d";
  return `${t.pass ?? 0}/${Object.values(t).reduce((a, b) => a + b, 0)}`;
}

type FichierMedianes = {
  reference_at: string;
  jours_prix_en_vigueur: number;
  colonnes: string[];
  /** Par identifiant de carburant : [jour, prix médian, nombre de stations], un par jour. */
  carburants: Record<string, [string, number, number][]>;
};

export type SerieMediane = { carburantId: number; nom: string; points: { jour: string; prix: number; stations: number }[] };

/**
 * Prix médian de chaque carburant, jour par jour, sur les prix en vigueur
 * (dernier relevé de chaque station, de 7 jours ou moins, prix suspects écartés).
 */
export function lireMedianesQuotidiennes(): SerieMediane[] {
  const fichier = lire<FichierMedianes>("prix_medians.json");
  const i = Object.fromEntries(fichier.colonnes.map((c, k) => [c, k]));
  return Object.entries(fichier.carburants).map(([id, jours]) => ({
    carburantId: Number(id),
    nom: CARBURANTS[Number(id)],
    points: jours.map((j) => ({ jour: j[i.jour] as string, prix: j[i.prix_median] as number, stations: j[i.stations] as number })),
  }));
}

type FichierSurcout = {
  reference_at: string;
  colonnes: string[];
  carburants: Record<
    string,
    {
      ecart_median: number;
      ecart_median_part: number;
      part_cas_autoroute_plus_chere: number;
      cas: number;
      departements: number;
      par_annee: Record<string, number>;
    }
  >;
  /** Par identifiant de carburant : [jour, écart médian, nombre de départements comparés], un par jour. */
  series: Record<string, [string, number, number][]>;
};

export type SurcoutCarburant = {
  carburantId: number;
  nom: string;
  /** Écart médian autoroute - route, même jour et même département, en euros par litre. */
  ecart: number;
  /** Même écart, en part du prix sur route. */
  part: number;
  partCasPlusChere: number;
  departements: number;
  parAnnee: Record<string, number>;
  /** Écart médian de chaque jour ; « stations » compte ici les départements comparés. */
  points: { jour: string; prix: number; stations: number }[];
};

/**
 * Surcoût des stations d'autoroute par rapport aux stations de route, à la même
 * date et dans le même département (mart_ecarts_autoroute).
 */
export function lireSurcoutAutoroute(): SurcoutCarburant[] {
  const fichier = lire<FichierSurcout>("surcout_autoroute.json");
  const i = Object.fromEntries(fichier.colonnes.map((c, k) => [c, k]));
  return Object.entries(fichier.carburants).map(([id, r]) => ({
    carburantId: Number(id),
    nom: CARBURANTS[Number(id)],
    ecart: r.ecart_median,
    part: r.ecart_median_part,
    partCasPlusChere: r.part_cas_autoroute_plus_chere,
    departements: r.departements,
    parAnnee: r.par_annee,
    points: (fichier.series[id] ?? []).map((j) => ({
      jour: j[i.jour] as string,
      prix: j[i.ecart_median] as number,
      stations: j[i.departements] as number,
    })),
  }));
}

export type EconomieProximite = {
  carburantId: number;
  nom: string;
  rayonKm: number;
  /** Stations hors autoroute qui ont au moins une autre station dans le rayon. */
  stations: number;
  /** Écart entre le prix d'une station et le moins cher du rayon, en euros par litre. */
  ecartMedian: number;
  ecartQ3: number;
  /** Part des stations à au moins `seuil` euros du moins cher du rayon. */
  seuil: number;
  partAuDessusSeuil: number;
};

function quantile(tri: number[], q: number): number {
  const pos = (tri.length - 1) * q;
  const [bas, haut] = [Math.floor(pos), Math.ceil(pos)];
  return tri[bas] + (tri[haut] - tri[bas]) * (pos - bas);
}

/**
 * Ce que coûte de ne pas chercher : pour chaque station hors autoroute, l'écart
 * entre son prix et le moins cher des stations à moins de `rayonKm` (elle
 * comprise), sur les prix de 7 jours ou moins et non suspects.
 */
export function economiesProximite(stations: Station[], carburantId: number, rayonKm = 10, seuil = 0.1): EconomieProximite {
  const points = stations
    .filter((s) => !s.autoroute && Number.isFinite(s.latitude) && Number.isFinite(s.longitude))
    .flatMap((s) => {
      const p = s.prix.find((x) => x.carburantId === carburantId && !x.suspect && x.ageJours <= JOURS_PRIX_RECENT);
      return p ? [{ lat: s.latitude, lon: s.longitude, prix: p.prix }] : [];
    })
    .sort((a, b) => a.lat - b.lat);
  // Un degré de latitude fait environ 111 km : on ne compare que la bande utile.
  const bande = rayonKm / 110;
  const ecarts: number[] = [];
  let debut = 0;
  for (const p of points) {
    while (points[debut].lat < p.lat - bande) debut++;
    let [moinsCher, voisines] = [p.prix, 0];
    for (let k = debut; k < points.length && points[k].lat <= p.lat + bande; k++) {
      const q = points[k];
      if (q === p || distanceKm(p.lat, p.lon, q.lat, q.lon) > rayonKm) continue;
      voisines++;
      moinsCher = Math.min(moinsCher, q.prix);
    }
    if (voisines > 0) ecarts.push(p.prix - moinsCher);
  }
  const tri = ecarts.sort((a, b) => a - b);
  return {
    carburantId,
    nom: CARBURANTS[carburantId],
    rayonKm,
    stations: tri.length,
    ecartMedian: quantile(tri, 0.5),
    ecartQ3: quantile(tri, 0.75),
    seuil,
    // Petite tolérance : les prix au millième ne tombent pas pile sur le seuil en flottants.
    partAuDessusSeuil: tri.filter((e) => e >= seuil - 1e-9).length / tri.length,
  };
}

export type MedianeCarburant = { carburantId: number; nom: string; mediane: number; stations: number };

/**
 * Prix médian au litre par carburant, sur les prix de 7 jours ou moins et non
 * suspects : les prix que la recherche classe.
 */
export function medianesParCarburant(stations: Station[]): MedianeCarburant[] {
  const parCarburant = new Map<number, number[]>();
  for (const s of stations) {
    for (const p of s.prix) {
      if (p.suspect || p.ageJours > JOURS_PRIX_RECENT) continue;
      parCarburant.set(p.carburantId, [...(parCarburant.get(p.carburantId) ?? []), p.prix]);
    }
  }
  return [...parCarburant.entries()]
    .map(([carburantId, valeurs]) => {
      const tri = [...valeurs].sort((a, b) => a - b);
      const m = Math.floor(tri.length / 2);
      const mediane = tri.length % 2 ? tri[m] : (tri[m - 1] + tri[m]) / 2;
      return { carburantId, nom: CARBURANTS[carburantId], mediane, stations: valeurs.length };
    })
    .sort((a, b) => b.mediane - a.mediane);
}

/** Volumes du projet Carburant sur le chemin du flux de l'accueil, lus dans metadata.json. */
export function volumesCarburant(): Record<string, string> {
  const m = lireMetadataCarburant();
  const fr = new Intl.NumberFormat("fr-FR");
  return {
    Model: `${fr.format(m.volumes.changements_de_prix)} changements`,
    Analyze: `${fr.format(m.volumes.stations)} stations`,
  };
}
