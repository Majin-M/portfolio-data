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

export type Mixite = {
  /**
   * Par année : enfants qui portent un prénom plus souvent donné à l'autre sexe cette
   * année-là (le sexe le moins fréquent de chaque prénom), et leur part des naissances.
   * Sans seuil : un prénom « mixte ou pas » entre et sort du décompte d'un coup (CAMILLE,
   * 9,6 % de garçons sur 1989-1993, faisait chuter la courbe de 0,75 point en 1991).
   */
  parAnnee: { annee: number; enfants: number; part: number }[];
  /** Les prénoms qui comptent le plus d'enfants du sexe le moins fréquent, une année donnée. */
  contributeurs: (annee: number, combien: number) => { forme: string; sexe: "F" | "M"; enfants: number }[];
  /** Naissances de chaque sexe pour une forme sans accent et une année. */
  annee: (forme: string, annee: number) => { F: number; M: number };
  /** Part de filles par décennie (début de la décennie), pour les prénoms demandés. */
  bascules: Record<string, [number, number][]>;
  /**
   * Part de filles année par année, sur cinq ans glissants (deux ans de part et d'autre),
   * pour les mêmes prénoms. Les années de moins de 50 naissances sur la fenêtre sont omises.
   */
  basculesAnnuelles: Record<string, [number, number][]>;
  /** Années où une forme sans accent a des naissances d'un sexe. */
  anneesPubliees: (forme: string, sexe: "F" | "M") => number[];
  /** Naissances de chaque sexe, toutes années, par forme sans accent. */
  totaux: (forme: string) => { F: number; M: number };
  /** Parmi les 100 formes les plus données à un sexe, combien l'ont été au moins une fois à l'autre. */
  top100GarconsAvecFilles: number;
  top100FillesAvecGarcons: number;
};

/**
 * Prénoms donnés aux deux sexes, calculés au build sur les séries nationales,
 * orthographes regroupées sans accent (les accents ne disent rien du sexe).
 */
export function lireMixite(bascules: string[]): Mixite {
  const series = lireToutesSeries();
  // forme sans accent -> sexe -> année -> naissances
  const formes = new Map<string, Record<"F" | "M", Map<number, number>>>();
  for (const [prenom, parSexe] of Object.entries(series)) {
    const forme = sansAccents(prenom);
    const f = formes.get(forme) ?? { F: new Map(), M: new Map() };
    for (const sexe of ["F", "M"] as const) {
      for (const [a, n] of parSexe[sexe] ?? []) f[sexe].set(a, (f[sexe].get(a) ?? 0) + n);
    }
    formes.set(forme, f);
  }

  const annees = new Map<number, { minoritaires: number; total: number }>();
  const totauxFormes = new Map<string, { F: number; M: number }>();
  for (const [forme, parSexe] of formes) {
    const tot = { F: 0, M: 0 };
    for (const a of new Set([...parSexe.F.keys(), ...parSexe.M.keys()])) {
      const [f, m] = [parSexe.F.get(a) ?? 0, parSexe.M.get(a) ?? 0];
      tot.F += f;
      tot.M += m;
      const y = annees.get(a) ?? { minoritaires: 0, total: 0 };
      y.total += f + m;
      y.minoritaires += Math.min(f, m);
      annees.set(a, y);
    }
    totauxFormes.set(forme, tot);
  }

  const parDecennie = (forme: string): [number, number][] => {
    const s = formes.get(forme);
    if (!s) return [];
    const d = new Map<number, { F: number; M: number }>();
    for (const sexe of ["F", "M"] as const) {
      for (const [a, n] of s[sexe]) {
        const cle = Math.floor(a / 10) * 10;
        const v = d.get(cle) ?? { F: 0, M: 0 };
        v[sexe] += n;
        d.set(cle, v);
      }
    }
    return [...d.entries()]
      .filter(([, v]) => v.F + v.M >= 50)
      .sort((x, y) => x[0] - y[0])
      .map(([cle, v]) => [cle, v.F / (v.F + v.M)]);
  };

  const parAnneeGlissante = (forme: string): [number, number][] => {
    const s = formes.get(forme);
    if (!s) return [];
    const annees = [...new Set([...s.F.keys(), ...s.M.keys()])];
    const [debut, fin] = [Math.min(...annees), Math.max(...annees)];
    const points: [number, number][] = [];
    for (let a = debut; a <= fin; a++) {
      let [f, m] = [0, 0];
      for (let k = a - 2; k <= a + 2; k++) {
        f += s.F.get(k) ?? 0;
        m += s.M.get(k) ?? 0;
      }
      if (f + m >= 50) points.push([a, f / (f + m)]);
    }
    return points;
  };

  const classement = (sexe: "F" | "M") =>
    [...totauxFormes.entries()].sort((a, b) => b[1][sexe] - a[1][sexe]).slice(0, 100);
  const autre = { F: "M", M: "F" } as const;
  const top100Avec = (sexe: "F" | "M") => classement(sexe).filter(([, t]) => t[autre[sexe]] > 0).length;

  return {
    parAnnee: [...annees.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([annee, y]) => ({ annee, enfants: y.minoritaires, part: y.minoritaires / y.total })),
    contributeurs: (annee, combien) =>
      [...formes.entries()]
        .map(([forme, s]) => {
          const [f, m] = [s.F.get(annee) ?? 0, s.M.get(annee) ?? 0];
          return { forme, sexe: (f < m ? "F" : "M") as "F" | "M", enfants: Math.min(f, m) };
        })
        .sort((a, b) => b.enfants - a.enfants)
        .slice(0, combien),
    annee: (forme, annee) => {
      const s = formes.get(sansAccents(forme));
      return { F: s?.F.get(annee) ?? 0, M: s?.M.get(annee) ?? 0 };
    },
    bascules: Object.fromEntries(bascules.map((p) => [p, parDecennie(sansAccents(p))])),
    basculesAnnuelles: Object.fromEntries(bascules.map((p) => [p, parAnneeGlissante(sansAccents(p))])),
    anneesPubliees: (forme, sexe) => [...(formes.get(sansAccents(forme))?.[sexe].keys() ?? [])].sort((a, b) => a - b),
    totaux: (forme) => totauxFormes.get(sansAccents(forme)) ?? { F: 0, M: 0 },
    top100GarconsAvecFilles: top100Avec("M"),
    top100FillesAvecGarcons: top100Avec("F"),
  };
}

export type Usages = {
  /** Années de naissance des adultes de 18 à 75 ans la dernière année publiée. */
  adultes: { debut: number; fin: number; naissances: number };
  /**
   * Deviner le sexe par le sexe majoritaire de l'orthographe (exacte, comme dans un
   * fichier clients) : part des naissances mal classées, chez les adultes (majorité
   * calculée sur leurs années de naissance) et chez les mineurs (nés après les adultes).
   */
  erreurSexe: { adultes: number; mineurs: number; debutMineurs: number };
  /**
   * Âge : pour chaque orthographe, l'écart entre le premier et le troisième quartile
   * des années de naissance de ses adultes. Part des adultes dont le prénom tient
   * dans une fenêtre de 10 années de naissance au plus (q3 - q1 < 10), et exemples.
   */
  fenetreAge: { partDixAns: number; exemples: { prenom: string; q1: number; q3: number }[] };
  /** Pour une année et un sexe : part des naissances couverte par les 100 premiers prénoms, et prénoms nécessaires pour en couvrir 80 %. */
  couverture: (annee: number, sexe: "F" | "M") => { top100: number; pour80: number };
};

/**
 * Usages métier, calculés au build sur les séries nationales (orthographes exactes,
 * naissances publiées) : enrichissement d'un fichier clients (sexe et âge probables
 * à partir du prénom) et couverture d'un stock de produits personnalisés.
 */
export function lireUsages(derniere: number, exemples: string[]): Usages {
  const series = lireToutesSeries();
  const [debut, fin] = [derniere - 75, derniere - 18];
  const debutMineurs = fin + 1;

  let [naissancesAdultes, erreursAdultes, naissancesEnfants, erreursEnfants] = [0, 0, 0, 0];
  const fenetres: { prenom: string; tot: number; q1: number; q3: number }[] = [];
  const parAnnee = new Map<string, number[]>();

  for (const [prenom, parSexe] of Object.entries(series)) {
    const adultes = { F: 0, M: 0 };
    const enfants = { F: 0, M: 0 };
    const naissancesParAnnee = new Map<number, number>();
    for (const sexe of ["F", "M"] as const) {
      for (const [a, n] of parSexe[sexe] ?? []) {
        if (a >= debut && a <= fin) {
          adultes[sexe] += n;
          naissancesParAnnee.set(a, (naissancesParAnnee.get(a) ?? 0) + n);
        }
        if (a >= debutMineurs) enfants[sexe] += n;
        const cle = `${a}|${sexe}`;
        const liste = parAnnee.get(cle) ?? [];
        liste.push(n);
        parAnnee.set(cle, liste);
      }
    }
    // Sexe majoritaire sur la période : les naissances de l'autre sexe sont mal classées.
    naissancesAdultes += adultes.F + adultes.M;
    erreursAdultes += Math.min(adultes.F, adultes.M);
    naissancesEnfants += enfants.F + enfants.M;
    erreursEnfants += Math.min(enfants.F, enfants.M);

    const tot = adultes.F + adultes.M;
    if (tot > 0) {
      let cumul = 0;
      let [q1, q3] = [0, 0];
      for (const a of [...naissancesParAnnee.keys()].sort((x, y) => x - y)) {
        cumul += naissancesParAnnee.get(a)!;
        if (!q1 && cumul >= 0.25 * tot) q1 = a;
        if (!q3 && cumul >= 0.75 * tot) q3 = a;
      }
      fenetres.push({ prenom, tot, q1, q3 });
    }
  }

  const tries = new Map([...parAnnee].map(([cle, liste]) => [cle, liste.sort((a, b) => b - a)]));
  return {
    adultes: { debut, fin, naissances: naissancesAdultes },
    erreurSexe: { adultes: erreursAdultes / naissancesAdultes, mineurs: erreursEnfants / naissancesEnfants, debutMineurs },
    fenetreAge: {
      partDixAns: fenetres.filter((f) => f.q3 - f.q1 < 10).reduce((t, f) => t + f.tot, 0) / naissancesAdultes,
      exemples: exemples.map((p) => {
        const f = fenetres.find((x) => x.prenom === p);
        if (!f) throw new Error(`Prénom d'exemple absent des séries : ${p}`);
        return { prenom: p, q1: f.q1, q3: f.q3 };
      }),
    },
    couverture: (annee, sexe) => {
      const liste = tries.get(`${annee}|${sexe}`) ?? [];
      const total = liste.reduce((t, n) => t + n, 0);
      let [cumul, pour80] = [0, 0];
      for (const n of liste) {
        cumul += n;
        pour80 += 1;
        if (cumul >= 0.8 * total) break;
      }
      return { top100: liste.slice(0, 100).reduce((t, n) => t + n, 0) / total, pour80 };
    },
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
