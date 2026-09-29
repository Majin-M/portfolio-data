// Calculs de la fiche de compétences, à partir de la seule liste des usages
// (src/contenu/competences.ts). Fonctions pures, utilisables côté client.

import { APPRENTISSAGE, ETAPES_METIER, USAGES, type Statut, type Usage } from "@/contenu/competences";
import { PROJETS } from "@/lib/projets";

/** Ce que la fiche montre d'un projet. */
export type ProjetFiche = { id: string; numero: string; titre: string; href?: string; guide: boolean };

/** Les langages ont leur propre onglet ; l'onglet Outils montre le reste. */
const LANGAGES_USAGES = new Set(["SQL", "Python"]);

/** Projets qui ont au moins un usage, dans l'ordre du registre. */
export function projetsFiche(): ProjetFiche[] {
  const ids = new Set(USAGES.map((u) => u.projet));
  return PROJETS.filter((p) => ids.has(p.id)).map((p) => ({
    id: p.id,
    numero: p.numero,
    titre: p.titre,
    href: p.href,
    guide: Boolean(p.guide),
  }));
}

export type AxeRadar = { id: string; nom: string; valeur: number; projets: string[] };

/** Radar : pour chaque étape du métier, le nombre de projets qui la couvrent vraiment. */
export function radar(): { axes: AxeRadar[]; max: number } {
  const projets = projetsFiche();
  const axes = ETAPES_METIER.map((e) => {
    const ids = new Set(USAGES.filter((u) => u.etapes.includes(e.id)).map((u) => u.projet));
    return { id: e.id, nom: e.nom, valeur: ids.size, projets: projets.filter((p) => ids.has(p.id)).map((p) => p.titre) };
  });
  return { axes, max: projets.length };
}

export type Segment = Usage & { titreProjet: string; numero: string };
export type BarreOutil = { outil: string; segments: Segment[]; statut: Statut };

function segmentsDe(usages: Usage[]): Segment[] {
  const projets = projetsFiche();
  return usages
    .map((u) => {
      const p = projets.find((q) => q.id === u.projet)!;
      return { ...u, titreProjet: p.titre, numero: p.numero };
    })
    .sort((a, b) => a.numero.localeCompare(b.numero));
}

/** Un outil = une barre, un segment par projet. Les plus utilisés d'abord. */
export function barresOutils(): BarreOutil[] {
  const parOutil = new Map<string, Usage[]>();
  for (const u of USAGES) {
    if (LANGAGES_USAGES.has(u.outil)) continue;
    parOutil.set(u.outil, [...(parOutil.get(u.outil) ?? []), u]);
  }
  const barres: BarreOutil[] = [...parOutil.entries()].map(([outil, usages]) => ({
    outil,
    segments: segmentsDe(usages),
    statut: usages.some((u) => u.statut === "production") ? "production" : "projet",
  }));
  barres.sort((a, b) => b.segments.length - a.segments.length || a.outil.localeCompare(b.outil, "fr"));
  return [...barres, ...APPRENTISSAGE.map((outil) => ({ outil, segments: [], statut: "apprentissage" as const }))];
}

/** Matrice technologies × projets : les lignes les plus partagées en premier. */
export function matrice(): { lignes: { outil: string; cellules: (Segment | null)[] }[]; projets: ProjetFiche[] } {
  const projets = projetsFiche();
  const outils = [...new Set(USAGES.map((u) => u.outil))];
  const lignes = outils.map((outil) => {
    const segments = segmentsDe(USAGES.filter((u) => u.outil === outil));
    return { outil, cellules: projets.map((p) => segments.find((s) => s.projet === p.id) ?? null) };
  });
  const compte = (l: (typeof lignes)[number]) => l.cellules.filter(Boolean).length;
  lignes.sort((a, b) => compte(b) - compte(a) || a.outil.localeCompare(b.outil, "fr"));
  return { lignes, projets };
}

/** Projets dont au moins un outil tourne dans un pipeline planifié. */
export function projetsEnProduction(): string[] {
  return [...new Set(USAGES.filter((u) => u.statut === "production").map((u) => u.projet))];
}
