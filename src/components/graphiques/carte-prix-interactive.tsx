"use client";

// Le sol de la carte des prix répond au pointeur : un cercle suit la souris, et
// un clic place la recherche « la moins chère autour de moi » sur ce point.
// Rien n'est chargé ici : le point cliqué est converti en latitude et
// longitude par la projection inverse.

import { useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { CADRE, EVENEMENT_LIEU, dansLaCarte, deprojeter, rayonAuSol } from "@/lib/carte-carburant";

const RAYON_CURSEUR_KM = 10;

export function CarteInteractive({ description, children }: { description: string; children: ReactNode }) {
  const ref = useRef<SVGSVGElement>(null);
  const [curseur, setCurseur] = useState<[number, number] | null>(null);

  /** Position du pointeur dans le repère du SVG, si elle tombe sur le sol. */
  function pointAuSol(e: PointerEvent<SVGSVGElement> | MouseEvent<SVGSVGElement>): [number, number] | null {
    const svg = ref.current;
    const matrice = svg?.getScreenCTM();
    if (!svg || !matrice) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrice.inverse());
    const { latitude, longitude } = deprojeter(p.x, p.y);
    return dansLaCarte(latitude, longitude) ? [p.x, p.y] : null;
  }

  function choisir(e: MouseEvent<SVGSVGElement>) {
    const p = pointAuSol(e);
    if (!p) return;
    window.dispatchEvent(new CustomEvent(EVENEMENT_LIEU, { detail: deprojeter(p[0], p[1]) }));
    document.getElementById("recherche")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const [rx, ry] = rayonAuSol(RAYON_CURSEUR_KM);
  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${CADRE.largeur} ${CADRE.hauteur}`}
      className="block h-auto w-full cursor-crosshair touch-manipulation"
      role="img"
      aria-label={description}
      onPointerMove={(e) => setCurseur(pointAuSol(e))}
      onPointerLeave={() => setCurseur(null)}
      onClick={choisir}
    >
      {children}
      {curseur && (
        <g pointerEvents="none">
          <ellipse cx={curseur[0]} cy={curseur[1]} rx={rx} ry={ry} fill="var(--encre)" fillOpacity=".08" stroke="var(--encre)" strokeWidth="1.5" />
          <line x1={curseur[0]} y1={curseur[1]} x2={curseur[0]} y2={curseur[1] - 46} stroke="var(--encre)" strokeWidth="1" strokeDasharray="2 3" />
          <text x={curseur[0]} y={curseur[1] - 54} textAnchor="middle" fontSize="17" fill="var(--encre)" fontFamily="var(--font-donnees)">
            chercher ici
          </text>
        </g>
      )}
    </svg>
  );
}
