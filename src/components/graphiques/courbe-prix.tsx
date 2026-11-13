"use client";

// Évolution quotidienne du prix médian au litre, une courbe par carburant.
// Le survol (ou les flèches du clavier) donne le prix de chaque courbe ce
// jour-là et le nombre de stations qui ont servi à le calculer.

import { scaleLinear, scaleUtc } from "d3-scale";
import { line } from "d3-shape";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useVisible } from "@/components/mouvement";
import { euros } from "@/lib/carburant-commun";
import { nombre } from "@/lib/format";

export type PointPrix = { jour: string; prix: number; stations: number };
export type SeriePrix = { id: string; label: string; couleur: string; points: PointPrix[] };
/** Jour mis en avant sur une courbe : un point et son prix. */
export type RepereJour = { serie: string; jour: string; texte: string };

const LARGEUR_INITIALE = 720;
const JOUR_MS = 86_400_000;

const moisCourt = new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", month: "short" });
const jourLong = new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", dateStyle: "long" });

function instant(jour: string): number {
  return Date.parse(`${jour}T00:00:00Z`);
}

export function CourbePrix({
  series,
  description,
  hauteur = 340,
  reperes = [],
}: {
  series: SeriePrix[];
  /** Résumé lu par les lecteurs d'écran. */
  description: string;
  hauteur?: number;
  reperes?: RepereJour[];
}) {
  const conteneur = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [largeur, setLargeur] = useState(LARGEUR_INITIALE);
  const [survol, setSurvol] = useState<number | null>(null);
  const visible = useVisible(conteneur);

  useEffect(() => {
    const element = conteneur.current;
    if (!element) return;
    const observateur = new ResizeObserver(([entree]) => {
      setLargeur(Math.max(280, Math.round(entree.contentRect.width)));
    });
    observateur.observe(element);
    return () => observateur.disconnect();
  }, []);

  // Jours communs à toutes les séries, dans l'ordre : l'axe et le survol s'y alignent.
  const jours = series[0].points.map((p) => p.jour);
  const parJour = useMemo(() => series.map((s) => new Map(s.points.map((p) => [p.jour, p]))), [series]);

  const etroit = largeur < 520;
  const marge = { haut: 18, droite: etroit ? 12 : 116, bas: 44, gauche: 52 };
  const hauteurTrace = hauteur - marge.haut - marge.bas;

  const prix = series.flatMap((s) => s.points.map((p) => p.prix));
  const x = scaleUtc()
    .domain([instant(jours[0]), instant(jours[jours.length - 1])])
    .range([marge.gauche, largeur - marge.droite]);
  const y = scaleLinear()
    .domain([Math.min(...prix), Math.max(...prix)])
    .nice(5)
    .range([marge.haut + hauteurTrace, marge.haut]);
  const ticksY = y.ticks(5);

  // Un repère par mois (un sur trois sur écran étroit), l'année sous janvier.
  const mois = jours.filter((j) => j.endsWith("-01")).filter((j) => !etroit || (Number(j.slice(5, 7)) - 1) % 3 === 0);

  const trace = line<PointPrix>()
    .x((p) => x(instant(p.jour)))
    .y((p) => y(p.prix));

  const fins = series.map((s) => {
    const p = s.points[s.points.length - 1];
    return { ...s, px: x(instant(p.jour)), py: y(p.prix), prix: p.prix };
  });
  const finsLisibles = !etroit && fins.every((f, i) => fins.every((g, j) => i === j || Math.abs(f.py - g.py) >= 16));

  const reperesVisibles = reperes
    .map((r) => {
      const i = series.findIndex((s) => s.id === r.serie);
      const p = i >= 0 ? parJour[i].get(r.jour) : undefined;
      return p ? { ...r, i, p, px: x(instant(r.jour)), py: y(p.prix) } : null;
    })
    .filter((r) => r !== null);

  function indexDepuisPointeur(evenement: PointerEvent<SVGRectElement>) {
    const cadre = svg.current?.getBoundingClientRect();
    if (!cadre) return null;
    const px = (evenement.clientX - cadre.left) * (largeur / cadre.width);
    const k = Math.round((x.invert(px).getTime() - instant(jours[0])) / JOUR_MS);
    return Math.min(jours.length - 1, Math.max(0, k));
  }

  function clavier(evenement: KeyboardEvent<SVGRectElement>) {
    const pas = evenement.shiftKey ? 30 : 1;
    const actuel = survol ?? jours.length - 1;
    let suivant: number | null = null;
    if (evenement.key === "ArrowLeft") suivant = actuel - pas;
    else if (evenement.key === "ArrowRight") suivant = actuel + pas;
    else if (evenement.key === "Home") suivant = 0;
    else if (evenement.key === "End") suivant = jours.length - 1;
    else if (evenement.key === "Escape") return setSurvol(null);
    if (suivant === null) return;
    evenement.preventDefault();
    setSurvol(Math.min(jours.length - 1, Math.max(0, suivant)));
  }

  const jourSurvol = survol === null ? null : jours[survol];
  const xSurvol = jourSurvol === null ? null : x(instant(jourSurvol));
  const bulleAGauche = xSurvol !== null && xSurvol > largeur / 2;

  return (
    <div className="w-full">
      {series.length > 1 && (
        <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 font-donnees text-xs text-encre-2">
          {series.map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              <span aria-hidden className="inline-block h-0.5 w-4 rounded-full" style={{ background: s.couleur }} />
              {s.label}
            </li>
          ))}
        </ul>
      )}

      <div
        ref={conteneur}
        className="relative w-full"
        data-dessin=""
        data-visible={visible ? "" : undefined}
      >
        <svg
          ref={svg}
          viewBox={`0 0 ${largeur} ${hauteur}`}
          width="100%"
          role="group"
          aria-label={description}
          className="block h-auto overflow-visible font-donnees"
        >
          {/* Grille horizontale et prix */}
          {ticksY.map((t) => (
            <g key={t}>
              <line
                x1={marge.gauche}
                x2={largeur - marge.droite}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--trait)"
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <text
                x={marge.gauche - 8}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                fontSize={11}
                fill="var(--encre-3)"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {euros(t, 2)}
              </text>
            </g>
          ))}

          {/* Mois, et l'année sous chaque janvier */}
          {mois.map((j) => (
            <g key={j}>
              <line
                x1={x(instant(j))}
                x2={x(instant(j))}
                y1={marge.haut + hauteurTrace}
                y2={marge.haut + hauteurTrace + 4}
                stroke="var(--trait-fort)"
                shapeRendering="crispEdges"
              />
              <text x={x(instant(j))} y={hauteur - 24} textAnchor="middle" fontSize={11} fill="var(--encre-3)">
                {moisCourt.format(instant(j)).replace(".", "")}
              </text>
              {(j.slice(5, 7) === "01" || j === mois[0]) && (
                <text x={x(instant(j))} y={hauteur - 8} textAnchor="middle" fontSize={11} fill="var(--encre-2)">
                  {j.slice(0, 4)}
                </text>
              )}
            </g>
          ))}

          {/* Courbes */}
          {series.map((s, i) => (
            <path
              key={s.id}
              d={trace(s.points) ?? undefined}
              pathLength={1}
              className="trace"
              fill="none"
              stroke={s.couleur}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 4px color-mix(in srgb, ${s.couleur} 45%, transparent))`,
                ["--delai" as string]: `${i * 150}ms`,
              }}
            />
          ))}

          {/* Dernier jour : point et prix */}
          {fins.map((f) => (
            <circle key={f.id} className="apres-trace" cx={f.px} cy={f.py} r={4} fill={f.couleur} stroke="var(--fond)" strokeWidth={2} />
          ))}
          {finsLisibles &&
            fins.map((f) => (
              <text key={f.id} className="apres-trace" x={f.px + 9} y={f.py} dy="0.32em" fontSize={11} fill="var(--encre-2)">
                {f.label} <tspan fill="var(--encre)">{euros(f.prix)}</tspan>
              </text>
            ))}

          {/* Repères du récit */}
          {reperesVisibles.map((r) => {
            const aGauche = r.px > largeur * 0.6;
            // Sous le point : un repère marque un creux, la courbe repart au-dessus.
            return (
              <g key={`${r.serie}-${r.jour}`} className="apres-trace" pointerEvents="none">
                <circle cx={r.px} cy={r.py} r={9} fill="none" stroke={series[r.i].couleur} strokeWidth={1.5} className="lueur" />
                <circle cx={r.px} cy={r.py} r={4} fill={series[r.i].couleur} stroke="var(--fond)" strokeWidth={2} />
                <text
                  x={aGauche ? r.px - 12 : r.px + 12}
                  y={r.py + 26}
                  textAnchor={aGauche ? "end" : "start"}
                  fontSize={13}
                  fill="var(--encre)"
                  stroke="var(--fond)"
                  strokeWidth={4}
                  paintOrder="stroke"
                >
                  {euros(r.p.prix)}
                  {!etroit && <tspan fill="var(--encre-3)" fontSize={11}>{` · ${r.texte}`}</tspan>}
                </text>
              </g>
            );
          })}

          {/* Réticule */}
          {jourSurvol !== null && xSurvol !== null && (
            <g pointerEvents="none">
              <line
                x1={xSurvol}
                x2={xSurvol}
                y1={marge.haut}
                y2={marge.haut + hauteurTrace}
                stroke="var(--encre-3)"
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              {series.map((s, i) => {
                const p = parJour[i].get(jourSurvol);
                return p ? <circle key={s.id} cx={xSurvol} cy={y(p.prix)} r={4} fill={s.couleur} stroke="var(--fond)" strokeWidth={2} /> : null;
              })}
            </g>
          )}

          {/* Zone de survol : le pointeur n'a pas à toucher la courbe */}
          <rect
            x={marge.gauche}
            y={marge.haut}
            width={Math.max(0, largeur - marge.gauche - marge.droite)}
            height={hauteurTrace}
            fill="transparent"
            tabIndex={0}
            role="slider"
            aria-label="Jour (flèches gauche et droite, Maj : par 30 jours)"
            aria-valuemin={0}
            aria-valuemax={jours.length - 1}
            aria-valuenow={survol ?? jours.length - 1}
            aria-valuetext={jourLong.format(instant(jourSurvol ?? jours[jours.length - 1]))}
            className="cursor-crosshair outline-none focus-visible:[outline:2px_solid_var(--accent)]"
            onPointerMove={(e) => setSurvol(indexDepuisPointeur(e))}
            onPointerDown={(e) => setSurvol(indexDepuisPointeur(e))}
            onPointerLeave={() => setSurvol(null)}
            onFocus={() => setSurvol((s) => s ?? jours.length - 1)}
            onBlur={() => setSurvol(null)}
            onKeyDown={clavier}
          />
        </svg>

        {jourSurvol !== null && xSurvol !== null && (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute z-10 min-w-40 rounded-sm border border-trait-fort bg-fond-2/95 px-3 py-2 font-donnees text-xs shadow-lg backdrop-blur-sm"
            style={{
              top: `${(marge.haut / hauteur) * 100}%`,
              left: `${(xSurvol / largeur) * 100}%`,
              transform: bulleAGauche ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
            }}
          >
            <p className="mb-1 text-encre-3">{jourLong.format(instant(jourSurvol))}</p>
            <ul className="space-y-0.5">
              {series.map((s, i) => {
                const p = parJour[i].get(jourSurvol);
                return (
                  <li key={s.id} className="flex items-center gap-2 whitespace-nowrap">
                    <span aria-hidden className="inline-block h-0.5 w-3 rounded-full" style={{ background: s.couleur }} />
                    <span className="font-medium text-encre">{p ? euros(p.prix) : "n/d"}</span>
                    <span className="text-encre-3">
                      {s.label}
                      {p ? ` · ${nombre(p.stations)} stations` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <TableauPrix series={series} />
    </div>
  );
}

/** Vue tableau : une ligne par semaine (le lundi), chaque valeur lisible sans survol. */
function TableauPrix({ series }: { series: SeriePrix[] }) {
  const lundis = series[0].points.filter((p) => new Date(instant(p.jour)).getUTCDay() === 1).map((p) => p.jour);
  const parJour = series.map((s) => new Map(s.points.map((p) => [p.jour, p])));
  return (
    <details className="mt-3">
      <summary className="ui w-fit cursor-pointer text-sm">Voir les données (chaque lundi)</summary>
      <div className="mt-2 max-h-72 overflow-auto border-t border-trait">
        <table className="tableau">
          <thead className="sticky top-0 bg-fond">
            <tr>
              <th scope="col">Jour</th>
              {series.map((s) => (
                <th key={s.id} scope="col" className="num">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lundis.map((j) => (
              <tr key={j}>
                <th scope="row" className="border-b-trait font-donnees text-xs text-encre-2">
                  {jourLong.format(instant(j))}
                </th>
                {series.map((s, i) => {
                  const p = parJour[i].get(j);
                  return (
                    <td key={s.id} className="num">
                      {p ? euros(p.prix) : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
