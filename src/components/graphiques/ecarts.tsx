// Écarts entre deux groupes : une ligne par catégorie, un point par groupe,
// reliés par un trait. Les deux valeurs sont écrites au bout de la ligne,
// chacune précédée de la pastille de son groupe (le texte reste à l'encre, pour
// le contraste). Sur mobile, le libellé passe au-dessus de sa ligne pour
// laisser la place au trait. Le trait se déploie quand le graphique entre dans
// l'écran.

import type { CSSProperties } from "react";
import { Declencheur } from "@/components/mouvement";
import { pourcent } from "@/lib/format";

export type Groupe = { label: string; couleur: string };
export type Ecart = { label: string; a: number; b: number; detail?: string };

export function Ecarts({
  lignes,
  groupes,
  description,
  max = 1,
  decimales = 1,
}: {
  lignes: Ecart[];
  /** Les deux groupes comparés, dans l'ordre des valeurs a et b. */
  groupes: [Groupe, Groupe];
  description: string;
  /** Borne de l'échelle (par défaut 100 %). */
  max?: number;
  decimales?: number;
}) {
  const position = (v: number) => `${(v / max) * 100}%`;
  return (
    <div>
      <ul className="mb-5 flex flex-wrap gap-x-6 gap-y-1" aria-hidden="true">
        {groupes.map((g) => (
          <li key={g.label} className="flex items-center gap-2 text-sm text-encre-2">
            <span className="size-2.5 rounded-full" style={{ background: g.couleur }} />
            {g.label}
          </li>
        ))}
      </ul>
      <Declencheur mode="dessin">
        <ul aria-label={description} className="space-y-4">
          {lignes.map((l, i) => {
            const [bas, haut] = l.a <= l.b ? [l.a, l.b] : [l.b, l.a];
            return (
              <li
                key={l.label}
                className="grid gap-2 sm:grid-cols-[14rem_1fr] sm:items-center sm:gap-4"
              >
                <span className="text-sm leading-tight text-encre-2">
                  {l.label}
                  {l.detail && <span className="block font-donnees text-xs text-encre-3">{l.detail}</span>}
                </span>
                <span className="flex items-center gap-3">
                  <span className="relative h-3 flex-1">
                    <span className="absolute inset-x-0 top-1/2 h-px bg-trait" />
                    <span
                      className="barre absolute top-1/2 h-0.5 -translate-y-1/2 bg-encre-3"
                      style={
                        { left: position(bas), width: `calc(${position(haut)} - ${position(bas)})`, "--delai": `${i * 90}ms` } as CSSProperties
                      }
                    />
                    {[l.a, l.b].map((v, j) => (
                      <span
                        key={groupes[j].label}
                        className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-fond"
                        style={{ left: position(v), background: groupes[j].couleur }}
                      />
                    ))}
                  </span>
                  <span className="w-40 shrink-0 text-right font-donnees text-sm whitespace-nowrap tabular-nums">
                    <span className="sr-only">
                      {groupes[0].label} : {pourcent(l.a, decimales)}, {groupes[1].label} : {pourcent(l.b, decimales)}
                    </span>
                    <span aria-hidden="true" className="inline-flex items-center gap-1.5 text-encre">
                      {[l.a, l.b].map((v, j) => (
                        <span key={groupes[j].label} className="inline-flex items-center gap-1.5">
                          {j > 0 && <span className="text-encre-3">·</span>}
                          <span className="size-1.5 rounded-full" style={{ background: groupes[j].couleur }} />
                          {pourcent(v, decimales)}
                        </span>
                      ))}
                    </span>
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </Declencheur>
    </div>
  );
}
