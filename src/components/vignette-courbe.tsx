// Petite courbe sans axe, rendue au build : aperçu d'une série dans une liste.

import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";

type Serie = { id: string; couleur: string; points: [number, number][] };

export function VignetteCourbe({ series, description }: { series: Serie[]; description: string }) {
  const largeur = 240;
  const hauteur = 72;
  const tous = series.flatMap((s) => s.points);
  const x = scaleLinear()
    .domain([Math.min(...tous.map((p) => p[0])), Math.max(...tous.map((p) => p[0]))])
    .range([4, largeur - 4]);
  const y = scaleLinear()
    .domain([0, Math.max(...tous.map((p) => p[1]))])
    .range([hauteur - 4, 6]);
  const trace = line<[number, number]>()
    .x((d) => x(d[0]))
    .y((d) => y(d[1]));

  return (
    <svg viewBox={`0 0 ${largeur} ${hauteur}`} className="block h-auto w-full max-w-60" role="img" aria-label={description}>
      <line x1={4} x2={largeur - 4} y1={hauteur - 4} y2={hauteur - 4} stroke="var(--trait-fort)" strokeWidth={1} />
      {series.map((s) => (
        <path
          key={s.id}
          d={trace(s.points) ?? undefined}
          fill="none"
          stroke={s.couleur}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
