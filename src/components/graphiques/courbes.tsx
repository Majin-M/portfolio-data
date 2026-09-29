"use client";

import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useValeurAnimee, useVisible } from "@/components/mouvement";
import { decimalesPourPart, nombre, pourcent } from "@/lib/format";

export type SerieCourbe = {
  id: string;
  label: string;
  /** Couleur de la série, en variable CSS (ex. "var(--serie-f)"). */
  couleur: string;
  /** [année, valeur], triés par année. */
  points: [number, number][];
  /** Années non publiées : la valeur y vaut 0, affichée à part sous l'axe. */
  absences?: number[];
};

export type Annotation = { x: number; label: string; court?: string };

/** Point mis en avant : un anneau et sa valeur. */
export type Repere = { serie: string; annee: number };

type Props = {
  series: SerieCourbe[];
  format: "nombre" | "pourcent";
  /** Résumé lu par les lecteurs d'écran. */
  description: string;
  hauteur?: number;
  annotations?: Annotation[];
  /** Estompe le tracé pendant un chargement, sans le faire disparaître. */
  attente?: boolean;
  /** Les courbes se dessinent quand le graphique entre dans l'écran. */
  dessin?: boolean;
  /** Change quand les données changent : les courbes se redessinent. */
  cle?: string;
  /** Révèle les courbes jusqu'à cette année (récit défilant). */
  jusqua?: number;
  reperes?: Repere[];
  tableau?: boolean;
};

const LARGEUR_INITIALE = 720;
const HAUTEUR_BANDE = 3;
const ECART_BANDE = 3;

function formateur(format: Props["format"]) {
  return format === "pourcent" ? (v: number) => pourcent(v, decimalesPourPart(v)) : nombre;
}

function graduationsY(format: Props["format"], ticks: number[]) {
  if (format === "nombre") return ticks.map((t) => nombre(t));
  const pas = ticks.length > 1 ? (ticks[1] - ticks[0]) * 100 : 1;
  const decimales = pas >= 1 ? 0 : pas >= 0.1 ? 1 : 2;
  return ticks.map((t) => (t === 0 ? pourcent(0, 0) : pourcent(t, decimales)));
}

/** Regroupe des années en intervalles continus : [1900, 1901, 1905] -> [[1900, 1901], [1905, 1905]]. */
function intervalles(annees: number[]): [number, number][] {
  const tries = [...annees].sort((a, b) => a - b);
  const sortie: [number, number][] = [];
  for (const a of tries) {
    const dernier = sortie[sortie.length - 1];
    if (dernier && a === dernier[1] + 1) dernier[1] = a;
    else sortie.push([a, a]);
  }
  return sortie;
}

/** Valeur d'une série à une année fractionnaire (interpolation linéaire). */
function valeurA(valeurs: Map<number, number>, annee: number): number | undefined {
  const bas = Math.floor(annee);
  const haut = Math.ceil(annee);
  const vBas = valeurs.get(bas);
  const vHaut = valeurs.get(haut);
  if (vBas === undefined || vHaut === undefined) return vBas ?? vHaut;
  return vBas + (vHaut - vBas) * (annee - bas);
}

export function Courbes({
  series,
  format,
  description,
  hauteur = 300,
  annotations = [],
  attente = false,
  dessin = true,
  cle = "",
  jusqua,
  reperes = [],
  tableau = true,
}: Props) {
  const conteneur = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const idClip = useId();
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

  const annees = series.flatMap((s) => s.points.map(([a]) => a));
  const xMin = Math.min(...annees);
  const xMax = Math.max(...annees);
  const revele = useValeurAnimee(jusqua ?? xMax, 1100);
  const progressif = jusqua !== undefined;
  const limite = progressif ? revele : xMax;

  const fmt = formateur(format);
  const etroit = largeur < 520;
  const avecAbsences = series.filter((s) => s.absences && s.absences.length > 0);
  const hauteurBandes = avecAbsences.length * (HAUTEUR_BANDE + ECART_BANDE);

  const marge = {
    haut: annotations.length > 0 ? 30 : 16,
    droite: etroit ? 16 : progressif ? 24 : 112,
    bas: 26 + hauteurBandes,
    gauche: format === "pourcent" ? 44 : 56,
  };
  const hauteurTrace = hauteur - marge.haut - marge.bas;

  const yMax = Math.max(0, ...series.flatMap((s) => s.points.map(([, v]) => v)));

  const x = scaleLinear()
    .domain([xMin, xMax])
    .range([marge.gauche, largeur - marge.droite]);
  const y = scaleLinear()
    .domain([0, yMax > 0 ? yMax * 1.04 : 1])
    .nice(hauteur < 260 ? 4 : 5)
    .range([marge.haut + hauteurTrace, marge.haut]);

  const ticksY = y.ticks(hauteur < 260 ? 4 : 5);
  const libellesY = graduationsY(format, ticksY);
  const pasX = etroit ? 50 : 25;
  const ticksX: number[] = [];
  for (let a = Math.ceil(xMin / pasX) * pasX; a <= xMax; a += pasX) ticksX.push(a);

  const trace = line<[number, number]>()
    .x((d) => x(d[0]))
    .y((d) => y(d[1]));

  const valeurs = useMemo(() => series.map((s) => new Map(s.points.map(([a, v]) => [a, v]))), [series]);
  const absences = useMemo(() => series.map((s) => new Set(s.absences ?? [])), [series]);

  // Extrémités : fin de la série, ou front de la révélation progressive.
  const fins = series.map((s, i) => {
    const v = valeurA(valeurs[i], limite) ?? 0;
    return { id: s.id, label: s.label, couleur: s.couleur, x: x(limite), y: y(v), valeur: v };
  });
  const finsLisibles =
    !etroit &&
    !progressif &&
    series.length <= 4 &&
    fins.every((f, i) => fins.every((g, j) => i === j || Math.abs(f.y - g.y) >= 16));

  const reperesVisibles = reperes
    .map((r) => {
      const i = series.findIndex((s) => s.id === r.serie);
      const v = i >= 0 ? valeurs[i].get(r.annee) : undefined;
      return v === undefined || r.annee > limite + 0.5 ? null : { ...r, i, v, px: x(r.annee), py: y(v) };
    })
    .filter((r) => r !== null);

  function anneeDepuisPointeur(evenement: PointerEvent<SVGRectElement>) {
    const cadre = svg.current?.getBoundingClientRect();
    if (!cadre) return null;
    const echelle = largeur / cadre.width;
    const px = (evenement.clientX - cadre.left) * echelle;
    return Math.min(Math.floor(limite), Math.max(xMin, Math.round(x.invert(px))));
  }

  function clavier(evenement: KeyboardEvent<SVGRectElement>) {
    const pas = evenement.shiftKey ? 10 : 1;
    const fin = Math.floor(limite);
    const actuel = survol ?? fin;
    let suivant: number | null = null;
    if (evenement.key === "ArrowLeft") suivant = actuel - pas;
    else if (evenement.key === "ArrowRight") suivant = actuel + pas;
    else if (evenement.key === "Home") suivant = xMin;
    else if (evenement.key === "End") suivant = fin;
    else if (evenement.key === "Escape") return setSurvol(null);
    if (suivant === null) return;
    evenement.preventDefault();
    setSurvol(Math.min(fin, Math.max(xMin, suivant)));
  }

  const xSurvol = survol === null ? null : x(survol);
  const bulleAGauche = xSurvol !== null && xSurvol > largeur / 2;
  const dessine = dessin && !progressif;

  return (
    <div className="w-full">
      {(series.length > 1 || avecAbsences.length > 0) && (
        <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 font-donnees text-xs text-encre-2">
          {series.length > 1 &&
            series.map((s) => (
              <li key={s.id} className="flex items-center gap-2">
                <span aria-hidden className="inline-block h-0.5 w-4 rounded-full" style={{ background: s.couleur }} />
                {s.label}
              </li>
            ))}
          {avecAbsences.length > 0 && (
            <li className="flex items-center gap-2 text-encre-3">
              <span aria-hidden className="inline-flex flex-col gap-[3px]">
                {avecAbsences.map((s) => (
                  <span key={s.id} className="block h-[3px] w-4 opacity-45" style={{ background: s.couleur }} />
                ))}
              </span>
              sous l&apos;axe : années non publiées (valeur 0)
            </li>
          )}
        </ul>
      )}

      <div
        ref={conteneur}
        className="relative w-full"
        style={{ opacity: attente ? 0.45 : 1, transition: "opacity 150ms" }}
        data-dessin={dessine ? "" : undefined}
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
          <defs>
            <clipPath id={idClip}>
              <rect x={0} y={0} width={Math.max(0, x(limite) + 1)} height={hauteur} />
            </clipPath>
          </defs>

          {/* Grille horizontale et graduations */}
          {ticksY.map((t, i) => (
            <g key={t}>
              <line
                x1={marge.gauche}
                x2={largeur - marge.droite}
                y1={y(t)}
                y2={y(t)}
                stroke={t === 0 ? "var(--trait-fort)" : "var(--trait)"}
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
                {libellesY[i]}
              </text>
            </g>
          ))}
          {ticksX.map((a) => (
            <text
              key={a}
              x={x(a)}
              y={hauteur - 6}
              textAnchor="middle"
              fontSize={11}
              fill="var(--encre-3)"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {a}
            </text>
          ))}

          {/* Annotations éditoriales */}
          {annotations.map((n) => {
            const ax = x(n.x);
            const versLaGauche = ax > largeur - marge.droite - 150;
            const atteinte = n.x <= limite;
            return (
              <g key={n.x} style={{ opacity: atteinte ? 1 : 0.25, transition: "opacity 400ms" }}>
                <line
                  x1={ax}
                  x2={ax}
                  y1={marge.haut - 18}
                  y2={marge.haut + hauteurTrace}
                  stroke="var(--trait-fort)"
                  strokeWidth={1}
                  shapeRendering="crispEdges"
                />
                <text
                  x={versLaGauche ? ax - 5 : ax + 5}
                  y={marge.haut - 10}
                  textAnchor={versLaGauche ? "end" : "start"}
                  fontSize={10.5}
                  fill="var(--encre-3)"
                >
                  {etroit ? (n.court ?? String(n.x)) : n.label}
                </text>
              </g>
            );
          })}

          {/* Années non publiées, sous l'axe */}
          {avecAbsences.map((s, i) => {
            const yBande = marge.haut + hauteurTrace + 5 + i * (HAUTEUR_BANDE + ECART_BANDE);
            const demiPas = (x(xMin + 1) - x(xMin)) / 2;
            return (
              <g key={`${s.id}-${cle}`} className="apres-trace" style={{ opacity: 0.45 }}>
                {intervalles(s.absences ?? []).map(([debut, fin]) => (
                  <rect
                    key={debut}
                    x={x(debut) - demiPas}
                    width={x(fin) - x(debut) + 2 * demiPas}
                    y={yBande}
                    height={HAUTEUR_BANDE}
                    fill={s.couleur}
                  />
                ))}
              </g>
            );
          })}

          {/* Courbes, légèrement lumineuses */}
          <g clipPath={progressif ? `url(#${idClip})` : undefined}>
            {series.map((s) => (
              <path
                key={`${s.id}-${cle}`}
                d={trace(s.points) ?? undefined}
                pathLength={1}
                className="trace"
                fill="none"
                stroke={s.couleur}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 4px color-mix(in srgb, ${s.couleur} 45%, transparent))` }}
              />
            ))}
          </g>

          {/* Extrémités : point et étiquette */}
          {fins.map((f) => (
            <circle
              key={`${f.id}-${cle}`}
              className="apres-trace"
              cx={f.x}
              cy={f.y}
              r={4}
              fill={f.couleur}
              stroke="var(--fond)"
              strokeWidth={2}
            />
          ))}
          {finsLisibles &&
            fins.map((f) => (
              <text
                key={`${f.id}-${cle}`}
                className="apres-trace"
                x={f.x + 9}
                y={f.y}
                dy="0.32em"
                fontSize={11}
                fill="var(--encre-2)"
              >
                {series.length > 1 ? `${f.label} ` : ""}
                <tspan fill="var(--encre)">{fmt(f.valeur)}</tspan>
              </text>
            ))}

          {/* Repères du récit */}
          {reperesVisibles.map((r, k) => {
            const aGauche = r.px > largeur * 0.6;
            // Deux repères proches : le plus bas prend son étiquette sous le point.
            const voisin = reperesVisibles.find((q, j) => j !== k && Math.abs(q.py - r.py) < 22 && Math.abs(q.px - r.px) < 120);
            const dessous = voisin !== undefined && r.py > voisin.py;
            return (
              <g key={`${r.serie}-${r.annee}`} pointerEvents="none">
                <circle cx={r.px} cy={r.py} r={9} fill="none" stroke={series[r.i].couleur} strokeWidth={1.5} className="lueur" />
                <circle cx={r.px} cy={r.py} r={4} fill={series[r.i].couleur} stroke="var(--fond)" strokeWidth={2} />
                <text
                  x={aGauche ? r.px - 16 : r.px + 16}
                  y={dessous ? r.py + 24 : r.py - 14}
                  textAnchor={aGauche ? "end" : "start"}
                  fontSize={13}
                  fill="var(--encre)"
                  stroke="var(--fond)"
                  strokeWidth={4}
                  paintOrder="stroke"
                >
                  {format === "pourcent" ? pourcent(r.v, 1) : fmt(r.v)}
                  <tspan fill="var(--encre-3)" fontSize={11}>{` · ${series[r.i].label.toLowerCase()} ${r.annee}`}</tspan>
                </text>
              </g>
            );
          })}

          {/* Réticule */}
          {survol !== null && xSurvol !== null && (
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
                const v = valeurs[i].get(survol);
                if (v === undefined) return null;
                return <circle key={s.id} cx={xSurvol} cy={y(v)} r={4} fill={s.couleur} stroke="var(--fond)" strokeWidth={2} />;
              })}
            </g>
          )}

          {/* Zone de survol : le pointeur n'a pas à toucher la courbe */}
          <rect
            x={marge.gauche}
            y={marge.haut}
            width={Math.max(0, largeur - marge.gauche - marge.droite)}
            height={hauteurTrace + hauteurBandes + 6}
            fill="transparent"
            tabIndex={0}
            role="slider"
            aria-label="Année (flèches gauche et droite, Maj : par 10 ans)"
            aria-valuemin={xMin}
            aria-valuemax={Math.floor(limite)}
            aria-valuenow={survol ?? Math.floor(limite)}
            className="cursor-crosshair outline-none focus-visible:[outline:2px_solid_var(--accent)]"
            onPointerMove={(e) => setSurvol(anneeDepuisPointeur(e))}
            onPointerDown={(e) => setSurvol(anneeDepuisPointeur(e))}
            onPointerLeave={() => setSurvol(null)}
            onFocus={() => setSurvol((s) => s ?? Math.floor(limite))}
            onBlur={() => setSurvol(null)}
            onKeyDown={clavier}
          />
        </svg>

        {survol !== null && xSurvol !== null && (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute z-10 min-w-36 rounded-sm border border-trait-fort bg-fond-2/95 px-3 py-2 font-donnees text-xs shadow-lg backdrop-blur-sm"
            style={{
              top: `${(marge.haut / hauteur) * 100}%`,
              left: `${(xSurvol / largeur) * 100}%`,
              transform: bulleAGauche ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
            }}
          >
            <p className="mb-1 text-encre-3">{survol}</p>
            <ul className="space-y-0.5">
              {series.map((s, i) => {
                const v = valeurs[i].get(survol);
                const absent = absences[i].has(survol);
                return (
                  <li key={s.id} className="flex items-center gap-2 whitespace-nowrap">
                    <span aria-hidden className="inline-block h-0.5 w-3 rounded-full" style={{ background: s.couleur }} />
                    <span className="font-medium text-encre">{absent ? "non publié" : v === undefined ? "n/d" : fmt(v)}</span>
                    {series.length > 1 && <span className="text-encre-3">{s.label}</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {tableau && <TableauSeries series={series} format={format} />}
    </div>
  );
}

/** Vue tableau d'une série annuelle : chaque valeur lisible sans survol. */
export function TableauSeries({ series, format }: { series: SerieCourbe[]; format: Props["format"] }) {
  const fmt = formateur(format);
  const annees = series.flatMap((s) => s.points.map(([a]) => a));
  const xMin = Math.min(...annees);
  const xMax = Math.max(...annees);
  const valeurs = series.map((s) => new Map(s.points.map(([a, v]) => [a, v])));
  const absences = series.map((s) => new Set(s.absences ?? []));
  return (
    <details className="mt-3">
      <summary className="ui w-fit cursor-pointer text-sm">Voir les données</summary>
      <div className="mt-2 max-h-72 overflow-auto border-t border-trait">
        <table className="tableau">
          <thead className="sticky top-0 bg-fond">
            <tr>
              <th scope="col">Année</th>
              {series.map((s) => (
                <th key={s.id} scope="col" className="num">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: xMax - xMin + 1 }, (_, k) => xMin + k).map((a) => (
              <tr key={a}>
                <th scope="row" className="!border-b-trait font-donnees !text-xs !text-encre-2">
                  {a}
                </th>
                {series.map((s, i) => {
                  const v = valeurs[i].get(a);
                  return (
                    <td key={s.id} className="num">
                      {absences[i].has(a) ? "non publié" : v === undefined ? "" : fmt(v)}
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
