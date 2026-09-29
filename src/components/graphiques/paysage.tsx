"use client";

// « Paysage de données » : une crête par prénom arrivé en tête au moins une
// année, rangées par année de pic. Chaque crête a sa propre échelle : la
// hauteur montre la forme d'une mode, pas son ampleur.

import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { useVisible } from "@/components/mouvement";
import { nombre } from "@/lib/format";

export type Crete = {
  prenom: string;
  sexe: "F" | "M";
  pic: number;
  maximum: number;
  anneesEnTete: number;
  forme: number[];
};

const LARGEUR_INITIALE = 900;

export function Paysage({ cretes, premiere }: { cretes: Crete[]; premiere: number }) {
  const conteneur = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [largeur, setLargeur] = useState(LARGEUR_INITIALE);
  const [actif, setActif] = useState<number | null>(null);
  const [pointeur, setPointeur] = useState<{ x: number; y: number } | null>(null);
  const visible = useVisible(conteneur, "0px");

  useEffect(() => {
    const element = conteneur.current;
    if (!element) return;
    const observateur = new ResizeObserver(([entree]) => setLargeur(Math.max(300, Math.round(entree.contentRect.width))));
    observateur.observe(element);
    return () => observateur.disconnect();
  }, []);

  const etroit = largeur < 640;
  const n = cretes.length;
  const annees = cretes[0]?.forme.length ?? 0;
  const derniere = premiere + annees - 1;
  const gauche = etroit ? 74 : 108;
  const droite = etroit ? 8 : 16;
  const pas = etroit ? 11 : 15;
  const amplitude = etroit ? 48 : 88;
  const haut = amplitude + 10;
  const hauteur = haut + (n - 1) * pas + 34;

  const x = scaleLinear()
    .domain([premiere, derniere])
    .range([gauche, largeur - droite]);
  const base = (i: number) => haut + i * pas;
  const graduations = etroit ? [1900, 1950, 2000] : [1900, 1925, 1950, 1975, 2000, 2025];

  const trace = (i: number) =>
    line<number>()
      .x((_, k) => x(premiere + k))
      .y((v) => base(i) - v * amplitude)(cretes[i].forme) ?? "";

  // La crête visée est celle dont le tracé passe le plus près du pointeur.
  function viser(evenement: PointerEvent<SVGSVGElement>) {
    const cadre = svg.current?.getBoundingClientRect();
    if (!cadre) return;
    const echelle = largeur / cadre.width;
    const px = (evenement.clientX - cadre.left) * echelle;
    const py = (evenement.clientY - cadre.top) * echelle;
    const k = Math.min(annees - 1, Math.max(0, Math.round(x.invert(px) - premiere)));
    let meilleur = 0;
    let ecart = Infinity;
    cretes.forEach((c, i) => {
      const d = Math.abs(base(i) - c.forme[k] * amplitude - py);
      if (d < ecart) {
        ecart = d;
        meilleur = i;
      }
    });
    setActif(ecart < pas * 2.5 ? meilleur : null);
    setPointeur({ x: evenement.clientX - cadre.left, y: evenement.clientY - cadre.top });
  }

  const c = actif !== null ? cretes[actif] : null;

  return (
    <div ref={conteneur} className="relative w-full" data-dessin="" data-visible={visible ? "" : undefined}>
      <svg
        ref={svg}
        viewBox={`0 0 ${largeur} ${hauteur}`}
        width="100%"
        className="block h-auto font-donnees"
        role="img"
        aria-label={`Paysage des ${n} prénoms arrivés en tête au moins une année entre ${premiere} et ${derniere}, rangés par année de pic, de ${cretes[0]?.prenom} à ${cretes[n - 1]?.prenom}`}
        onPointerMove={viser}
        onPointerDown={viser}
        onPointerLeave={() => {
          setActif(null);
          setPointeur(null);
        }}
      >
        {graduations.map((a) => (
          <g key={a}>
            <line
              x1={x(a)}
              x2={x(a)}
              y1={hauteur - 30}
              y2={hauteur - 24}
              stroke="var(--trait-fort)"
              strokeWidth={1}
              shapeRendering="crispEdges"
            />
            <text x={x(a)} y={hauteur - 8} textAnchor="middle" fontSize={11} fill="var(--encre-3)">
              {a}
            </text>
          </g>
        ))}

        {cretes.map((crete, i) => {
          const d = trace(i);
          const allume = actif === i;
          const estompe = actif !== null && !allume;
          return (
            <g
              key={`${crete.prenom}-${crete.sexe}`}
              style={{ "--delai": `${i * 55}ms`, "--duree-trace": "1500ms" } as CSSProperties}
            >
              {/* Le fond masque les crêtes situées derrière */}
              <path d={`${d}L${x(derniere)},${base(i)}L${x(premiere)},${base(i)}Z`} fill="var(--fond)" />
              <path
                d={d}
                pathLength={1}
                className="trace"
                fill="none"
                stroke={allume ? "var(--accent)" : "var(--encre-2)"}
                strokeOpacity={estompe ? 0.28 : allume ? 1 : 0.8}
                strokeWidth={allume ? 2 : 1.25}
                strokeLinejoin="round"
                style={{
                  transition: "stroke 200ms, stroke-opacity 200ms",
                  filter: allume ? "drop-shadow(0 0 6px var(--lueur))" : undefined,
                }}
              />
              <text
                x={gauche - 8}
                y={base(i)}
                dy="0.1em"
                textAnchor="end"
                fontSize={etroit ? 9 : 10.5}
                fill={allume ? "var(--encre)" : "var(--encre-3)"}
                className="apres-trace"
                style={{ "--delai-apres": `${300 + i * 55}ms` } as CSSProperties}
              >
                {crete.prenom}
              </text>
            </g>
          );
        })}
      </svg>

      {c && pointeur && (
        <div
          role="status"
          className="pointer-events-none absolute z-10 rounded-sm border border-trait-fort bg-fond-2/95 px-3 py-2 font-donnees text-xs shadow-lg backdrop-blur-sm"
          style={{
            left: pointeur.x,
            top: pointeur.y,
            transform: `translate(${pointeur.x > largeur / 2 ? "calc(-100% - 14px)" : "14px"}, -110%)`,
          }}
        >
          <p className="text-sm text-encre">{c.prenom}</p>
          <p className="text-encre-3">{c.sexe === "F" ? "filles" : "garçons"}</p>
          <p className="mt-1 text-encre-2">
            pic en {c.pic} : <span className="text-encre">{nombre(c.maximum)}</span> naissances
          </p>
          <p className="text-encre-2">
            en tête {c.anneesEnTete} {c.anneesEnTete > 1 ? "années" : "année"}
          </p>
        </div>
      )}
    </div>
  );
}
