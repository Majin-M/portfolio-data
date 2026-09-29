// Lecture des exports du projet Prix des carburants (public/data/carburant/),
// au moment du build. Le navigateur, lui, charge chaque matin la version publiée
// sur GitHub Pages (voir carburant-commun.ts).

import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  CARBURANTS,
  JOURS_PRIX_RECENT,
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
