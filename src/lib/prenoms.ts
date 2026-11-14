// Lecture des exports du projet Prénoms de France (public/data/prenoms/),
// au moment du build. Format décrit dans le catalogue de données du dépôt
// prenoms_france (docs/catalogue_de_donnees.md).

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { sansAccents, type FichierSeries, type LigneDiversite, type LigneEcart, type Metadata } from "@/lib/prenoms-commun";

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

let toutesSeries: FichierSeries | undefined;

/** Toutes les séries nationales, réunies une fois par build. */
function lireToutesSeries(): FichierSeries {
  if (!toutesSeries) {
    toutesSeries = {};
    for (const f of readdirSync(join(DOSSIER, "series")).filter((f) => f.endsWith(".json"))) {
      Object.assign(toutesSeries, lire<FichierSeries>(join("series", f)));
    }
  }
  return toutesSeries;
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
  const series = lireToutesSeries();

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

export type EffetAccents = {
  /** Prénoms dont l'orthographe la plus donnée saute de plus de 30 % en un an, alors que le total de leurs orthographes bouge de moins de 10 %. */
  fauxSauts: number;
  /** Années de ces sauts, de la plus touchée à la moins touchée. */
  anneesFauxSauts: { annee: number; prenoms: number }[];
  /** Par sexe et par année : orthographes publiées et formes sans accent. */
  diversite: Record<"F" | "M", Map<number, { orthographes: number; formes: number }>>;
};

/**
 * Effet des changements de saisie des accents, calculé au build sur les fichiers
 * de séries. Un saut n'est compté que si l'orthographe pesait au moins 200
 * naissances l'année précédente, pour écarter les petits effectifs.
 */
export function lireEffetAccents(): EffetAccents {
  const series = lireToutesSeries();
  const diversite: EffetAccents["diversite"] = { F: new Map(), M: new Map() };
  // Par forme sans accent et par sexe : les orthographes et leurs séries.
  const formes = new Map<string, { prenom: string; points: Map<number, number>; total: number }[]>();
  for (const [prenom, parSexe] of Object.entries(series)) {
    for (const sexe of ["F", "M"] as const) {
      const points = parSexe[sexe];
      if (!points) continue;
      const cle = `${sansAccents(prenom)}|${sexe}`;
      const liste = formes.get(cle) ?? [];
      liste.push({ prenom, points: new Map(points), total: points.reduce((t, [, n]) => t + n, 0) });
      formes.set(cle, liste);
      for (const [annee] of points) {
        const d = diversite[sexe].get(annee) ?? { orthographes: 0, formes: 0 };
        d.orthographes += 1;
        diversite[sexe].set(annee, d);
      }
    }
  }
  for (const cle of formes.keys()) {
    const sexe = cle.split("|")[1] as "F" | "M";
    const annees = new Set([...formes.get(cle)!.flatMap((o) => [...o.points.keys()])]);
    for (const annee of annees) diversite[sexe].get(annee)!.formes += 1;
  }

  const parAnnee = new Map<number, number>();
  const touches = new Set<string>();
  for (const [cle, orthographes] of formes) {
    if (orthographes.length < 2) continue;
    const principale = orthographes.reduce((a, b) => (b.total > a.total ? b : a));
    const totaux = new Map<number, number>();
    for (const o of orthographes) for (const [a, n] of o.points) totaux.set(a, (totaux.get(a) ?? 0) + n);
    const annees = [...totaux.keys()].sort((a, b) => a - b);
    for (let k = 1; k < annees.length; k++) {
      const [avant, apres] = [annees[k - 1], annees[k]];
      const [exAvant, exApres] = [principale.points.get(avant) ?? 0, principale.points.get(apres) ?? 0];
      const [totAvant, totApres] = [totaux.get(avant)!, totaux.get(apres)!];
      if (exAvant >= 200 && Math.abs(exApres - exAvant) > 0.3 * exAvant && Math.abs(totApres - totAvant) < 0.1 * totAvant) {
        touches.add(cle);
        parAnnee.set(apres, (parAnnee.get(apres) ?? 0) + 1);
      }
    }
  }
  return {
    fauxSauts: touches.size,
    anneesFauxSauts: [...parAnnee.entries()].map(([annee, prenoms]) => ({ annee, prenoms })).sort((a, b) => b.prenoms - a.prenoms),
    diversite,
  };
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
