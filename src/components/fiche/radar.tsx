// Radar des étapes du métier : chaque axe compte les projets qui couvrent
// vraiment l'étape, avec le chiffre écrit au bout de l'axe.

import type { CSSProperties } from "react";
import type { AxeRadar } from "@/lib/competences";

const L = 620;
const H = 470;
const CX = L / 2;
const CY = H / 2;
const R = 128;

function point(i: number, n: number, rayon: number): [number, number] {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  return [CX + Math.cos(a) * rayon, CY + Math.sin(a) * rayon];
}

export function Radar({ axes, max, compact = false }: { axes: AxeRadar[]; max: number; compact?: boolean }) {
  const n = axes.length;
  const forme = axes.map((a, i) => point(i, n, (a.valeur / max) * R));
  const description = `Étapes du métier couvertes, sur ${max} projets : ${axes.map((a) => `${a.nom} ${a.valeur}`).join(", ")}.`;
  return (
    <svg viewBox={`0 0 ${L} ${H}`} className="block h-auto w-full" role="img" aria-label={description}>
      {/* Anneaux : 1, 2, … max projets */}
      {Array.from({ length: max }, (_, k) => (
        <polygon
          key={k}
          points={axes.map((_, i) => point(i, n, ((k + 1) / max) * R).join(",")).join(" ")}
          fill="none"
          stroke="var(--trait-fort)"
          strokeWidth="1"
          strokeDasharray={k + 1 === max ? undefined : "2 4"}
        />
      ))}
      {axes.map((_, i) => {
        const [x, y] = point(i, n, R);
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="var(--trait-fort)" strokeWidth="1" />;
      })}
      <polygon
        className="radar-forme"
        points={forme.map((p) => p.join(",")).join(" ")}
        fill="color-mix(in oklab, var(--accent) 22%, transparent)"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {forme.map(([x, y], i) => (
        <circle key={i} className="apres-trace" cx={x} cy={y} r="4" fill="var(--accent)" style={{ "--delai-apres": "700ms" } as CSSProperties} />
      ))}
      {axes.map((a, i) => {
        const [x, y] = point(i, n, R + (compact ? 30 : 34));
        const ancre = Math.abs(x - CX) < 4 ? "middle" : x > CX ? "start" : "end";
        const dy = y < CY - 4 ? -6 : y > CY + 4 ? 30 : 6;
        return (
          <g key={a.id}>
            <text x={x} y={y + dy - 24} textAnchor={ancre} fontSize="32" fill="var(--encre)" fontFamily="var(--font-donnees)">
              {a.valeur}
            </text>
            <text x={x} y={y + dy} textAnchor={ancre} fontSize="20" fill="var(--encre-2)" fontFamily="var(--font-donnees)">
              {a.nom}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
