"use client";

// Lignage de l'entrepôt SQL : chaque fichier source traverse bronze et
// silver, puis alimente les vues gold et de reporting. Survoler un objet
// allume tout ce dont il dépend et tout ce qu'il alimente.

import { useState, type CSSProperties } from "react";
import { nombre } from "@/lib/format";

export type ObjetLignage = { id: string; nom: string; lignes?: number };
/** couleur : variable CSS de la couche (métal de la médaille). */
export type ColonneLignage = { titre: string; detail: string; couleur?: string; objets: ObjetLignage[] };

const LARGEUR = 1120;
const COLONNE = 196;
const PAS_LIGNE = 36;
const HAUT = 78;
const PAS_COLONNE = 360; // ms entre deux colonnes qui s'allument

export function LignageSql({ colonnes, liens }: { colonnes: ColonneLignage[]; liens: [string, string][] }) {
  const [actif, setActif] = useState<string | null>(null);

  const ecartColonnes = (LARGEUR - COLONNE) / (colonnes.length - 1);
  const maxLignes = Math.max(...colonnes.map((c) => c.objets.length));
  const hauteur = HAUT + maxLignes * PAS_LIGNE + 10;

  // Position de chaque objet : colonnes centrées verticalement sur les six lignes sources.
  const positions = new Map<string, { x: number; y: number; colonne: number }>();
  colonnes.forEach((c, i) => {
    const decalage = ((maxLignes - c.objets.length) * PAS_LIGNE) / 2;
    c.objets.forEach((o, k) => positions.set(o.id, { x: i * ecartColonnes, y: HAUT + decalage + k * PAS_LIGNE, colonne: i }));
  });

  // Objets reliés à l'objet actif, en amont comme en aval.
  const relies = new Set<string>();
  if (actif) {
    const parcourir = (depart: string, sens: 0 | 1) => {
      for (const lien of liens) {
        if (lien[sens] === depart && !relies.has(lien[1 - sens])) {
          relies.add(lien[1 - sens]);
          parcourir(lien[1 - sens], sens);
        }
      }
    };
    relies.add(actif);
    parcourir(actif, 0);
    parcourir(actif, 1);
  }
  const eclaire = (id: string) => !actif || relies.has(id);
  const couleurDe = (id: string) => colonnes[positions.get(id)!.colonne].couleur ?? "var(--accent)";

  const chemin = (de: string, vers: string) => {
    const a = positions.get(de)!;
    const b = positions.get(vers)!;
    const x1 = a.x + COLONNE - 6;
    const x2 = b.x - 8;
    const m = (x1 + x2) / 2;
    return `M${x1},${a.y} C${m},${a.y} ${m},${b.y} ${x2},${b.y}`;
  };

  return (
    <div className="overflow-x-auto" data-dessin="" data-visible="">
      <svg
        viewBox={`0 0 ${LARGEUR} ${hauteur}`}
        className="block h-auto w-full min-w-[900px] font-donnees"
        role="img"
        aria-label="Lignage des données : six fichiers CSV chargés en bronze, nettoyés en silver, assemblés en deux dimensions et une table de faits en gold, puis en deux vues de reporting"
        onPointerLeave={() => setActif(null)}
      >
        {colonnes.map((c, i) => (
          <g key={c.titre} className="allume" style={{ "--delai": `${i * PAS_COLONNE}ms` } as CSSProperties}>
            <text x={i * ecartColonnes} y={18} fontSize={12} letterSpacing="0.08em" fill="var(--encre)">
              <tspan fill={c.couleur ?? "var(--encre)"}>{c.titre.toUpperCase()}</tspan>
            </text>
            <text x={i * ecartColonnes} y={36} fontSize={10.5} fill="var(--encre-3)">
              {c.detail}
            </text>
            <line
              x1={i * ecartColonnes}
              x2={i * ecartColonnes + COLONNE - 12}
              y1={48}
              y2={48}
              stroke="var(--trait-fort)"
              shapeRendering="crispEdges"
            />
          </g>
        ))}

        {liens.map(([de, vers]) => {
          const colonne = positions.get(de)!.colonne;
          const allume = actif !== null && relies.has(de) && relies.has(vers);
          return (
            <path
              key={`${de}-${vers}`}
              d={chemin(de, vers)}
              pathLength={1}
              className="trace"
              fill="none"
              stroke={allume ? couleurDe(vers) : "var(--trait-fort)"}
              strokeOpacity={actif && !allume ? 0.35 : 1}
              strokeWidth={allume ? 1.5 : 1}
              style={
                {
                  "--delai": `${(colonne + 0.7) * PAS_COLONNE}ms`,
                  "--duree-trace": "800ms",
                  transition: "stroke 250ms, stroke-opacity 250ms",
                  filter: allume ? `drop-shadow(0 0 5px ${couleurDe(vers)})` : undefined,
                } as CSSProperties
              }
            />
          );
        })}

        {/* Les lignes circulent une fois le lignage allumé */}
        <g className="apres-trace" style={{ "--delai-apres": `${colonnes.length * PAS_COLONNE + 700}ms` } as CSSProperties}>
          {liens.map(([de, vers], i) => {
            const allume = actif !== null && relies.has(de) && relies.has(vers);
            return (
              <circle
                key={`${de}-${vers}`}
                className="particule"
                r={allume ? 2.6 : 2}
                fill={couleurDe(vers)}
                opacity={actif && !allume ? 0 : allume ? 1 : 0.6}
                style={{ transition: "opacity 250ms" }}
              >
                <animateMotion dur="2.6s" repeatCount="indefinite" begin={`${-((i * 0.37) % 2.6)}s`} path={chemin(de, vers)} />
              </circle>
            );
          })}
        </g>

        {colonnes.map((c) =>
          c.objets.map((o) => {
            const p = positions.get(o.id)!;
            const lumiere = eclaire(o.id);
            return (
              <g
                key={o.id}
                className="allume cursor-pointer"
                style={{ "--delai": `${p.colonne * PAS_COLONNE + 150}ms` } as CSSProperties}
                onPointerEnter={() => setActif(o.id)}
              >
                <rect x={p.x - 6} y={p.y - 15} width={COLONNE} height={30} fill="transparent" />
                <circle cx={p.x} cy={p.y} r={3} fill={lumiere ? couleurDe(o.id) : "var(--trait-fort)"} />
                <text
                  x={p.x + 10}
                  y={p.y}
                  dy="0.35em"
                  fontSize={11.5}
                  fill={lumiere ? "var(--encre)" : "var(--encre-3)"}
                  opacity={lumiere ? 1 : 0.5}
                  style={{ transition: "opacity 250ms" }}
                >
                  {o.nom}
                </text>
                {o.lignes !== undefined && (
                  <text
                    x={p.x + COLONNE - 14}
                    y={p.y}
                    dy="0.35em"
                    textAnchor="end"
                    fontSize={10.5}
                    fill="var(--encre-3)"
                    opacity={lumiere ? 1 : 0.4}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {nombre(o.lignes)}
                  </text>
                )}
              </g>
            );
          }),
        )}
      </svg>
    </div>
  );
}
