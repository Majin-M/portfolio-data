// Barres horizontales : une part par catégorie, la valeur écrite au bout de
// chaque barre (pas besoin de survol ni de tableau pour la lire). Les barres
// se déploient quand le graphique entre dans l'écran.

import type { CSSProperties } from "react";
import { Declencheur } from "@/components/mouvement";
import { pourcent } from "@/lib/format";

export type Barre = { label: string; part: number; detail?: string };

export function Barres({
  barres,
  description,
  max,
  couleur = "var(--accent)",
  formater = pourcent,
}: {
  barres: Barre[];
  description: string;
  /** Borne de l'échelle (par défaut, la plus grande valeur). */
  max?: number;
  couleur?: string;
  /** Texte écrit au bout de la barre (par défaut, une part en pourcentage). */
  formater?: (valeur: number) => string;
}) {
  const borne = max ?? Math.max(...barres.map((b) => b.part));
  return (
    <Declencheur mode="dessin">
      <ul aria-label={description} className="space-y-3">
        {barres.map((b, i) => (
          <li key={b.label} className="grid grid-cols-[minmax(7rem,12rem)_1fr] items-center gap-4 sm:grid-cols-[14rem_1fr]">
            <span className="text-sm leading-tight text-encre-2">
              {b.label}
              {b.detail && <span className="block font-donnees text-xs text-encre-3">{b.detail}</span>}
            </span>
            <span className="flex items-center gap-3">
              <span className="relative h-3 flex-1 bg-fond-2">
                <span
                  className="barre absolute inset-y-0 left-0"
                  style={{ width: `${(b.part / borne) * 100}%`, background: couleur, "--delai": `${i * 90}ms` } as CSSProperties}
                />
              </span>
              <span className="w-16 shrink-0 text-right font-donnees text-sm text-encre tabular-nums">{formater(b.part)}</span>
            </span>
          </li>
        ))}
      </ul>
    </Declencheur>
  );
}
