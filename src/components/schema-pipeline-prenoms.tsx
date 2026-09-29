// Graphe du pipeline Prénoms de France : de la source INSEE aux fichiers JSON.
// Les durées des modèles viennent du résumé dbt de metadata.json. Les nœuds
// s'allument couche par couche, puis des particules parcourent les liaisons.

import type { CSSProperties } from "react";
import { Declencheur } from "@/components/mouvement";
import { decimal } from "@/lib/format";

type Noeud = { id: string; x: number; y: number; l: number; couche: number; titre: string; detail: string; accent?: boolean };

const H = 52;
const PAS_COUCHE = 380; // ms entre deux couches

export function SchemaPipelinePrenoms({ durees, fichiersSeries }: { durees: Record<string, number>; fichiersSeries: number }) {
  const duree = (modele: string) => (modele in durees ? `${decimal(durees[modele], 2)} s` : "n/d");

  const noeuds: Noeud[] = [
    { id: "source", x: 0, y: 124, l: 160, couche: 0, titre: "INSEE", detail: "prenoms-2025.parquet" },
    { id: "raw", x: 196, y: 124, l: 132, couche: 1, titre: "raw.prenoms", detail: "table · ingest.py" },
    { id: "stg", x: 364, y: 124, l: 176, couche: 2, titre: "stg_insee__prenoms", detail: `vue · ${duree("stg_insee__prenoms")}` },
    {
      id: "serie",
      x: 580,
      y: 36,
      l: 256,
      couche: 3,
      titre: "mart_prenoms_serie_nationale",
      detail: `table · ${duree("mart_prenoms_serie_nationale")}`,
    },
    {
      id: "diversite",
      x: 580,
      y: 124,
      l: 256,
      couche: 3,
      titre: "mart_diversite_prenoms_par_annee",
      detail: `table · ${duree("mart_diversite_prenoms_par_annee")}`,
    },
    {
      id: "ecart",
      x: 580,
      y: 212,
      l: 256,
      couche: 3,
      titre: "mart_ecart_regions_france",
      detail: `table · ${duree("mart_ecart_regions_france")}`,
    },
    {
      id: "export",
      x: 876,
      y: 124,
      l: 144,
      couche: 4,
      titre: "export.py",
      detail: `${fichiersSeries + 3} fichiers JSON`,
      accent: true,
    },
  ];
  const n = Object.fromEntries(noeuds.map((d) => [d.id, d]));

  // Liaison horizontale : du bord droit de a au bord gauche de b.
  const lien = (a: Noeud, b: Noeud) => {
    const x1 = a.x + a.l;
    const y1 = a.y + H / 2;
    const x2 = b.x - 6;
    const y2 = b.y + H / 2;
    const m = (x1 + x2) / 2;
    return { d: `M${x1},${y1} C${m},${y1} ${m},${y2} ${x2},${y2}`, couche: a.couche };
  };

  const liens = [
    lien(n.source, n.raw),
    lien(n.raw, n.stg),
    lien(n.stg, n.serie),
    lien(n.stg, n.ecart),
    lien(n.serie, n.export),
    lien(n.diversite, n.export),
    lien(n.ecart, n.export),
    // mart_diversite est calculé à partir de la série nationale : liaison verticale.
    { d: `M${n.serie.x + 40},${n.serie.y + H} L${n.diversite.x + 40},${n.diversite.y - 6}`, couche: 3 },
  ];

  const couches = [
    { x: 0, label: "Source" },
    { x: 196, label: "Raw" },
    { x: 364, label: "Staging" },
    { x: 580, label: "Marts" },
    { x: 876, label: "Export" },
  ];
  const finAllumage = 5 * PAS_COUCHE + 600;

  return (
    <Declencheur mode="dessin" className="overflow-x-auto">
      <svg
        viewBox="0 0 1020 280"
        className="block h-auto w-full min-w-[760px] font-donnees"
        role="img"
        aria-label="Graphe du pipeline : fichier INSEE, table raw, vue de staging, trois marts, export JSON"
      >
        <defs>
          <marker id="fleche-prenoms" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="var(--encre-3)" />
          </marker>
        </defs>

        {couches.map((c, i) => (
          <text
            key={c.label}
            className="allume"
            style={{ "--delai": `${i * PAS_COUCHE}ms` } as CSSProperties}
            x={c.x}
            y={12}
            fontSize={10.5}
            letterSpacing="0.06em"
            fill="var(--encre-3)"
          >
            {c.label.toUpperCase()}
          </text>
        ))}

        {liens.map((l) => (
          <path
            key={l.d}
            d={l.d}
            pathLength={1}
            className="trace"
            style={{ "--delai": `${(l.couche + 0.6) * PAS_COUCHE}ms`, "--duree-trace": "700ms" } as CSSProperties}
            fill="none"
            stroke="var(--encre-3)"
            strokeWidth={1}
            markerEnd="url(#fleche-prenoms)"
          />
        ))}

        {noeuds.map((d) => (
          <g key={d.id} className="allume" style={{ "--delai": `${d.couche * PAS_COUCHE}ms` } as CSSProperties}>
            <rect
              x={d.x + 0.5}
              y={d.y + 0.5}
              width={d.l - 1}
              height={H - 1}
              rx={2}
              fill="var(--fond-2)"
              stroke={d.accent ? "var(--accent)" : "var(--trait-fort)"}
              strokeWidth={1}
              className={d.accent ? "lueur" : undefined}
            />
            <text x={d.x + 12} y={d.y + 21} fontSize={11.5} fill="var(--encre)">
              {d.titre}
            </text>
            <text x={d.x + 12} y={d.y + 38} fontSize={10.5} fill="var(--encre-3)">
              {d.detail}
            </text>
          </g>
        ))}

        {/* Les données circulent une fois le pipeline allumé */}
        <g className="apres-trace" style={{ "--delai-apres": `${finAllumage}ms` } as CSSProperties}>
          {liens.map((l, i) =>
            [0, 1].map((k) => (
              <circle key={`${i}-${k}`} className="particule lueur" r={2.2} fill="var(--accent)">
                <animateMotion dur="2.4s" repeatCount="indefinite" begin={`${-(k * 1.2 + i * 0.3)}s`} path={l.d} />
              </circle>
            )),
          )}
        </g>
      </svg>
    </Declencheur>
  );
}
