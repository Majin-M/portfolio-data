// Panneau fixe de la fiche : qui, en une phrase, trois chiffres vérifiables,
// les certifications et les liens.

import { Logo } from "@/components/logos";
import { Compteur } from "@/components/mouvement";
import { CERTIFICATIONS, IDENTITE } from "@/contenu/competences";
import type { ChiffreFiche } from "@/lib/competences-serveur";

/** Photo en bichromie avec l'accent ; sans photo, les initiales. */
export function Portrait({ taille = "size-28" }: { taille?: string }) {
  return (
    <div className={`relative ${taille} shrink-0 overflow-hidden border border-trait-fort bg-fond-2`}>
      {IDENTITE.photo ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- export statique, image locale */}
          <img src={IDENTITE.photo} alt={`Portrait de ${IDENTITE.nom}`} className="size-full object-cover grayscale contrast-125" />
          <span aria-hidden className="absolute inset-0 bg-accent mix-blend-multiply opacity-60" />
        </>
      ) : (
        <span aria-hidden className="flex size-full items-center justify-center font-donnees text-2xl tracking-[0.2em] text-accent">
          {IDENTITE.initiales}
        </span>
      )}
      <span aria-hidden className="absolute top-0 left-0 size-3 border-t-2 border-l-2 border-accent" />
      <span aria-hidden className="absolute right-0 bottom-0 size-3 border-r-2 border-b-2 border-accent" />
    </div>
  );
}

export function Chiffres({ chiffres }: { chiffres: ChiffreFiche[] }) {
  return (
    <ul className="space-y-3">
      {chiffres.map((c, i) => (
        <li key={c.legende} className="flex items-baseline gap-3">
          <span aria-hidden className="size-2 shrink-0 translate-y-[-2px] rounded-full bg-accent" />
          <Compteur valeur={c.valeur} delai={i * 150} className="min-w-8 font-donnees text-2xl text-encre" />
          <span className="text-sm leading-snug text-encre-2">{c.legende}</span>
        </li>
      ))}
    </ul>
  );
}

/** GitHub, LinkedIn et CV, chacun avec son logo. */
export function LiensProfil() {
  return (
    <>
      {IDENTITE.liens.map((l) => (
        <li key={l.href}>
          <a
            href={l.href}
            className="ui inline-flex items-center gap-2 border border-trait-fort px-3 py-1.5 !text-encre hover:border-accent hover:!text-accent"
            rel="noopener"
          >
            <Logo nom={l.label.startsWith("CV") ? "CV" : l.label} />
            {l.label}
          </a>
        </li>
      ))}
    </>
  );
}

export function Certifications({ compact = false }: { compact?: boolean }) {
  return (
    <ul className="space-y-3">
      {CERTIFICATIONS.map((c) => (
        <li key={c.intitule} className="border-l-2 border-accent bg-fond-2/60 py-2 pr-3 pl-3">
          <p className="flex items-baseline justify-between gap-3 font-donnees text-[0.7rem] tracking-[0.12em] text-encre-3 uppercase">
            <span>{c.organisme}</span>
            <span className="shrink-0">{c.annee}</span>
          </p>
          <p className="mt-1 leading-snug text-encre">{c.intitule}</p>
          {!compact && (
            <>
              <p className="mt-0.5 font-donnees text-xs text-encre-2">{c.detail}</p>
              <p className="mt-1 text-sm leading-snug text-encre-2">{c.couvre}</p>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

export function PanneauIdentite({ chiffres }: { chiffres: ChiffreFiche[] }) {
  return (
    <div className="border border-trait-fort bg-fond p-6">
      <div className="flex items-start gap-5">
        <Portrait />
        <div className="min-w-0">
          <h1 className="font-texte text-3xl leading-[1.02] font-medium tracking-tight">{IDENTITE.nom}</h1>
          <p className="mt-2 label !text-accent">{IDENTITE.titre}</p>
        </div>
      </div>
      <p className="mt-5 text-lg leading-snug text-encre-2">{IDENTITE.phrase}</p>

      <div className="mt-6 border-t border-trait pt-5">
        <Chiffres chiffres={chiffres} />
      </div>

      <h2 className="label mt-8 mb-3">Certifications</h2>
      <Certifications />

      <ul className="mt-8 flex flex-wrap gap-3 border-t border-trait pt-5">
        <LiensProfil />
      </ul>
    </div>
  );
}
