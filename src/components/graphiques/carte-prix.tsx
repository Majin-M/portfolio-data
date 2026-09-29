// Carte des prix en 2.5D : chaque station est placée à ses coordonnées, la France
// n'est dessinée par rien d'autre que ses stations. Autour d'un prix repère
// (le prix médian arrondi aux 10 centimes), les stations moins chères restent
// au sol, en points bleus ; les plus chères se dressent en pics orangés,
// d'autant plus hauts que le litre dépasse le repère.
//
// Calculée au build et rendue en SVG : lisible sans JavaScript. Les marques
// d'une même classe de prix forment un seul tracé, pour garder la page légère.

import type { CSSProperties } from "react";
import { CarteInteractive } from "@/components/graphiques/carte-prix-interactive";
import { Declencheur } from "@/components/mouvement";
import { CARBURANTS, JOURS_PRIX_RECENT, euros, joliNom, type Station } from "@/lib/carburant-commun";
import { PX_PAR_EURO, projeter } from "@/lib/carte-carburant";
import { decimal } from "@/lib/format";

type Marque = { x: number; y: number; prix: number; station: Station };

const r = (v: number) => Math.round(v * 10) / 10;

/** Deux classes au sol sous le repère, trois classes de pics au-dessus, par pas de 10 centimes. */
function classes(repere: number) {
  const b = [repere - 0.1, repere, repere + 0.1, repere + 0.2];
  // Deux teintes, chacune mélangée au fond sans transparence : les marques
  // superposées ne s'additionnent pas.
  const mix = (teinte: string, part: number) => `color-mix(in oklab, ${teinte} ${part}%, var(--fond))`;
  return [
    { libelle: `moins de ${euros(b[0], 2)}`, min: -Infinity, max: b[0], pic: false, couleur: mix("var(--serie-m)", 100) },
    { libelle: `${decimal(b[0], 2)} à ${euros(b[1], 2)}`, min: b[0], max: b[1], pic: false, couleur: mix("var(--serie-m)", 70) },
    { libelle: `${decimal(b[1], 2)} à ${euros(b[2], 2)}`, min: b[1], max: b[2], pic: true, couleur: mix("var(--accent)", 55) },
    { libelle: `${decimal(b[2], 2)} à ${euros(b[3], 2)}`, min: b[2], max: b[3], pic: true, couleur: mix("var(--accent)", 80) },
    { libelle: `${euros(b[3], 2)} et plus`, min: b[3], max: Infinity, pic: true, couleur: mix("var(--accent)", 100) },
  ];
}

function mediane(valeurs: number[]) {
  const t = [...valeurs].sort((a, b) => a - b);
  const m = Math.floor(t.length / 2);
  return t.length % 2 ? t[m] : (t[m - 1] + t[m]) / 2;
}

function lieuStation(s: Station) {
  return `${joliNom(s.ville)} (${s.codePostal.slice(0, 2)})`;
}

export function CartePrix({ stations, carburantId }: { stations: Station[]; carburantId: number }) {
  const marques: Marque[] = [];
  const sansPrix: [number, number][] = [];
  for (const station of stations) {
    const [x, y] = projeter(station.latitude, station.longitude);
    const p = station.prix.find((q) => q.carburantId === carburantId && !q.suspect && q.ageJours <= JOURS_PRIX_RECENT);
    if (p) marques.push({ x, y, prix: p.prix, station });
    else sansPrix.push([x, y]);
  }
  // Du fond vers l'avant : les pics du sud passent devant ceux du nord.
  marques.sort((a, b) => a.y - b.y);

  const prix = marques.map((m) => m.prix);
  const medianeFrance = mediane(prix);
  const repere = Math.round(medianeFrance * 10) / 10;
  const hauteur = (m: Marque) => (m.prix - repere) * PX_PAR_EURO + 3;
  const moinsChere = marques.reduce((a, b) => (b.prix < a.prix ? b : a));
  const plusChere = marques.reduce((a, b) => (b.prix > a.prix ? b : a));
  const autoroutes = marques.filter((m) => m.station.autoroute).map((m) => m.prix);
  const medianeAutoroutes = autoroutes.length ? mediane(autoroutes) : null;
  const nom = CARBURANTS[carburantId].toLowerCase();

  const lesClasses = classes(repere).map((c) => {
    const dedans = marques.filter((m) => m.prix >= c.min && m.prix < c.max);
    return {
      ...c,
      nombre: dedans.length,
      trace: dedans
        .map((m) => (c.pic ? `M${r(m.x)} ${r(m.y)}v${-r(hauteur(m))}` : `M${r(m.x)} ${r(m.y)}h0`))
        .join(""),
    };
  });
  const traceSansPrix = sansPrix.map(([x, y]) => `M${r(x)} ${r(y)}h0`).join("");
  const auSol = lesClasses.filter((c) => !c.pic).reduce((t, c) => t + c.nombre, 0);

  const description = `Carte de France des ${stations.length} stations, prix du ${nom} de ${JOURS_PRIX_RECENT} jours ou moins. ${auSol} stations sont sous ${euros(repere, 2)} et restent au sol ; ${marques.length - auSol} le dépassent et se dressent en pics. La moins chère : ${euros(moinsChere.prix)} à ${lieuStation(moinsChere.station)}. La plus chère : ${euros(plusChere.prix)} à ${lieuStation(plusChere.station)}.`;

  return (
    <div>
      <Declencheur mode="dessin" className="carte-prix">
        <CarteInteractive description={description}>
          <path d={traceSansPrix} className="carte-sol" stroke="var(--trait-fort)" strokeWidth="1.8" strokeLinecap="round" />
          {lesClasses
            .filter((c) => !c.pic)
            .map((c) => (
              <path key={c.libelle} d={c.trace} className="carte-sol" stroke={c.couleur} strokeWidth="3.2" strokeLinecap="round" />
            ))}
          {lesClasses
            .filter((c) => c.pic)
            .map((c, i) => (
              <path
                key={c.libelle}
                d={c.trace}
                className="pic"
                stroke={c.couleur}
                strokeWidth="1.4"
                style={{ "--delai": `${500 + i * 180}ms` } as CSSProperties}
              />
            ))}
          {/* Les deux extrêmes, repérés sur la carte et écrits sous la légende. */}
          <g className="apres-trace" fill="none" stroke="var(--encre)" strokeWidth="1.5">
            <circle cx={moinsChere.x} cy={moinsChere.y} r="7" />
            <circle cx={plusChere.x} cy={plusChere.y - hauteur(plusChere)} r="7" />
          </g>
        </CarteInteractive>
      </Declencheur>

      <div className="mt-6 grid gap-y-3 font-donnees text-xs text-encre-2" aria-hidden>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="w-14 text-encre">Au sol</span>
          {lesClasses
            .filter((c) => !c.pic)
            .map((c) => (
              <span key={c.libelle} className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: c.couleur }} />
                {c.libelle}
              </span>
            ))}
        </p>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="w-14 text-encre">En pic</span>
          {lesClasses
            .filter((c) => c.pic)
            .map((c) => (
              <span key={c.libelle} className="flex items-center gap-1.5">
                <span className="h-3 w-1 rounded-sm" style={{ background: c.couleur }} />
                {c.libelle}
              </span>
            ))}
        </p>
      </div>

      <dl className="mt-6 grid gap-x-8 gap-y-4 border-t border-trait pt-5 sm:grid-cols-3">
        <div>
          <dt className="label">La moins chère</dt>
          <dd className="mt-1 font-donnees text-lg text-encre">{euros(moinsChere.prix)}</dd>
          <dd className="text-sm text-encre-2">{lieuStation(moinsChere.station)}</dd>
        </div>
        <div>
          <dt className="label">La plus chère</dt>
          <dd className="mt-1 font-donnees text-lg text-encre">{euros(plusChere.prix)}</dd>
          <dd className="text-sm text-encre-2">
            {lieuStation(plusChere.station)}
            {plusChere.station.autoroute ? ", autoroute" : ""}
          </dd>
        </div>
        {medianeAutoroutes !== null && (
          <div>
            <dt className="label">Sur autoroute</dt>
            <dd className="mt-1 font-donnees text-lg text-encre">{euros(medianeAutoroutes)}</dd>
            <dd className="text-sm text-encre-2">prix médian, contre {euros(medianeFrance)} partout</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
