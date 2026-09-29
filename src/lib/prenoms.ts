// Lecture des exports du projet Prénoms de France (public/data/prenoms/),
// au moment du build. Format décrit dans le catalogue de données du dépôt
// prenoms_france (docs/catalogue_de_donnees.md).

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import type { FichierSeries, LigneDiversite, LigneEcart, Metadata } from "@/lib/prenoms-commun";

export type { FichierSeries, LigneDiversite, LigneEcart, Metadata };

const DOSSIER = join(process.cwd(), "public", "data", "prenoms");

function lire<T>(fichier: string): T {
  return JSON.parse(readFileSync(join(DOSSIER, fichier), "utf-8")) as T;
}

export function lireDiversite(): LigneDiversite[] {
  return lire<LigneDiversite[]>("diversite.json");
}

export function lireEcartRegions(): LigneEcart[] {
  return lire<LigneEcart[]>("ecart_regions.json");
}

export function lireMetadata(): Metadata {
  return lire<Metadata>("metadata.json");
}

export function compterFichiersSeries(): number {
  return readdirSync(join(DOSSIER, "series")).filter((f) => f.endsWith(".json")).length;
}

export type CretePaysage = {
  prenom: string;
  sexe: "F" | "M";
  /** Année et effectif du pic. */
  pic: number;
  maximum: number;
  /** Nombre d'années où le prénom est le plus donné de son sexe. */
  anneesEnTete: number;
  /** Effectifs de premiere à derniere, rapportés au pic (0 à 1). */
  forme: number[];
};

/**
 * Les prénoms arrivés en tête (le plus donné de leur sexe) au moins une année,
 * triés par année de pic : la matière du « paysage » d'ouverture.
 * Calculé au build sur l'ensemble des fichiers de séries.
 */
export function lirePaysage(premiere: number, derniere: number): CretePaysage[] {
  const series: FichierSeries = {};
  for (const f of readdirSync(join(DOSSIER, "series")).filter((f) => f.endsWith(".json"))) {
    Object.assign(series, lire<FichierSeries>(join("series", f)));
  }

  const enTete = new Map<string, number>();
  for (const sexe of ["F", "M"] as const) {
    const parAnnee = new Map<number, { prenom: string; n: number }>();
    for (const [prenom, parSexe] of Object.entries(series)) {
      for (const [annee, n] of parSexe[sexe] ?? []) {
        const actuel = parAnnee.get(annee);
        if (!actuel || n > actuel.n) parAnnee.set(annee, { prenom, n });
      }
    }
    for (const { prenom } of parAnnee.values()) {
      const cle = `${prenom}|${sexe}`;
      enTete.set(cle, (enTete.get(cle) ?? 0) + 1);
    }
  }

  return [...enTete.entries()]
    .map(([cle, anneesEnTete]) => {
      const [prenom, sexe] = cle.split("|") as [string, "F" | "M"];
      const points = new Map(series[prenom][sexe]);
      const [pic, maximum] = [...points.entries()].reduce((m, p) => (p[1] > m[1] ? p : m));
      const forme = Array.from(
        { length: derniere - premiere + 1 },
        (_, k) => Math.round(((points.get(premiere + k) ?? 0) / maximum) * 1000) / 1000,
      );
      return { prenom, sexe, pic, maximum, anneesEnTete, forme };
    })
    .sort((a, b) => a.pic - b.pic || b.maximum - a.maximum);
}

/** Volumes du projet Prénoms sur le chemin du flux, lus dans metadata.json. */
export function volumesPrenoms(): Record<string, string> {
  const m = lireMetadata();
  const fr = new Intl.NumberFormat("fr-FR");
  return {
    Raw: `${fr.format(m.lignes.source)} lignes`,
    ...(m.dbt ? { Model: `${m.dbt.tests.pass ?? 0}/${m.dbt.tests.total} tests` } : {}),
    Analyze: `${fr.format(m.lignes.series_exportees)} → ${compterFichiersSeries()} fichiers`,
  };
}
