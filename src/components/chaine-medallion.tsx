// Ouverture du projet entrepôt SQL : l'architecture Medallion racontée par
// ses médailles. Les données passent du bronze à l'argent puis à l'or ; les
// médailles grandissent parce que la valeur des données augmente.

import type { CSSProperties, ReactNode } from "react";
import { Medaille, type Metal } from "@/components/medaille";
import { Declencheur } from "@/components/mouvement";

export type EtapeMedallion = {
  metal: Metal;
  numero: string;
  couche: string;
  role: string;
  detail: string;
  valeur: string;
  taille: number;
};

const COULEUR: Record<Metal, string> = { bronze: "var(--bronze)", argent: "var(--argent)", or: "var(--or)" };

function Flux({ debut, fin }: { debut: string; fin: string }) {
  const style = { "--couleur-debut": debut, "--couleur-fin": fin } as CSSProperties;
  return (
    <>
      <div aria-hidden className="flux-couche horizontal hidden h-px min-w-10 flex-1 self-center lg:block" style={style}>
        <span className="absolute inset-0" style={{ background: `linear-gradient(to right, ${debut}, ${fin})`, opacity: 0.45 }} />
        {[0, 0.73, 1.46].map((d) => (
          <span key={d} className="goutte" style={{ animationDelay: `${-d}s` }} />
        ))}
      </div>
      <div aria-hidden className="flux-couche vertical mx-auto h-10 w-px lg:hidden" style={style}>
        <span
          className="absolute inset-0"
          style={{ background: `linear-gradient(to bottom, ${debut}, ${fin})`, opacity: 0.45 }}
        />
        {[0, 1.1].map((d) => (
          <span key={d} className="goutte" style={{ animationDelay: `${-d}s` }} />
        ))}
      </div>
    </>
  );
}

function Extremite({ label, titre, children }: { label: string; titre: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center lg:w-32 lg:shrink-0">
      <p className="label">{label}</p>
      <p className="mt-2 font-texte text-lg leading-tight">{titre}</p>
      <div className="mt-2 font-donnees text-xs leading-relaxed text-encre-3">{children}</div>
    </div>
  );
}

export function ChaineMedallion({ etapes, sources, usage }: { etapes: EtapeMedallion[]; sources: string[]; usage: string[] }) {
  return (
    <Declencheur mode="dessin" className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-center lg:gap-0">
      <Extremite label="Sources" titre="CRM + ERP">
        {sources.map((s) => (
          <p key={s}>{s}</p>
        ))}
      </Extremite>
      <Flux debut="var(--encre-3)" fin={COULEUR[etapes[0].metal]} />
      {etapes.map((e, i) => (
        <div key={e.couche} className="contents">
          <figure className="flex flex-col items-center text-center">
            <Medaille
              metal={e.metal}
              numero={e.numero}
              inscription={`${e.couche} · ${e.role}`}
              valeur={e.valeur}
              taille={e.taille}
              delai={300 + i * 500}
            />
            <figcaption className="mt-3 max-w-44">
              <p className="label" style={{ color: COULEUR[e.metal] }}>
                {e.couche}
              </p>
              <p className="mt-1 text-sm leading-snug text-encre-2">{e.detail}</p>
            </figcaption>
          </figure>
          <Flux debut={COULEUR[e.metal]} fin={i < etapes.length - 1 ? COULEUR[etapes[i + 1].metal] : "var(--encre-2)"} />
        </div>
      ))}
      <Extremite label="Usage" titre="Analyses">
        {usage.map((u) => (
          <p key={u}>{u}</p>
        ))}
      </Extremite>
    </Declencheur>
  );
}
