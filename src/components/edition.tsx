// Briques de mise en scène des pages projet : ouverture, scènes, chiffres en
// grand, figures, mesures, sections dépliables « sous le capot ».

import Link from "next/link";
import type { ReactNode } from "react";
import { Conteneur } from "@/components/conteneur";
import { Logo } from "@/components/logos";
import { Compteur, Revele } from "@/components/mouvement";

type Lien = { label: string; href: string };

/** Ouverture immersive : un visuel fort, un titre, une phrase. */
export function Ouverture({
  identifiant,
  source,
  titre,
  periode,
  phrase,
  statut,
  mention,
  liens = [],
  visuel,
  legendeVisuel,
  disposition = "cote",
  halo = true,
}: {
  identifiant: string;
  source: string;
  titre: string;
  periode?: string;
  phrase: ReactNode;
  statut?: ReactNode;
  mention?: ReactNode;
  liens?: Lien[];
  /** Sans visuel, l'ouverture se limite au titre et à la phrase. */
  visuel?: ReactNode;
  legendeVisuel?: ReactNode;
  /** "cote" : visuel à droite du titre ; "dessous" : visuel pleine largeur. */
  disposition?: "cote" | "dessous";
  /** Halo lumineux derrière le visuel (à éviter si le visuel masque avec la couleur du fond). */
  halo?: boolean;
}) {
  const cote = disposition === "cote";
  return (
    <section className="relative overflow-hidden">
      {halo && <div aria-hidden className="halo pointer-events-none absolute inset-0" />}
      <Conteneur className="relative pt-8 pb-16 sm:pt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-trait-fort pb-3">
          <Link href="/projets" transitionTypes={["remonter"]} className="label !text-accent hover:!text-encre">
            {identifiant}
          </Link>
          <p className="label">{source}</p>
        </div>
        <div className={`mt-10 grid gap-12 ${cote ? "xl:grid-cols-12 xl:gap-10" : ""}`}>
          <div className={cote ? "xl:col-span-4" : "grid gap-x-12 lg:grid-cols-2"}>
            <div>
              <h1 className="w-fit font-texte text-6xl leading-[0.92] font-medium tracking-tight sm:text-7xl">{titre}</h1>
              {periode && <p className="mt-4 font-donnees text-lg text-encre-2">{periode}</p>}
              <Revele delai={200} className="mt-8 max-w-md text-xl leading-snug text-encre-2">
                {phrase}
              </Revele>
            </div>
            <div className={cote ? "" : "lg:pt-2"}>
              {statut && (
                <Revele delai={400} className="mt-8">
                  {statut}
                </Revele>
              )}
              {mention && (
                <Revele delai={500} className="mt-8 max-w-md border-l-2 border-accent pl-4 text-base text-encre-2">
                  {mention}
                </Revele>
              )}
              {liens.length > 0 && (
                <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
                  {liens.map((l) => (
                    <li key={l.href}>
                      <a href={l.href} className="ui inline-flex items-center gap-2 !text-encre hover:!text-accent" rel="noopener">
                        {l.href.includes("github.com") && <Logo nom="GitHub" className="size-4" />}
                        {l.label} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {visuel && (
            <figure className={`min-w-0 ${cote ? "xl:col-span-8" : ""}`}>
              {visuel}
              {legendeVisuel && (
                <figcaption className="mt-4 max-w-2xl text-sm leading-relaxed text-encre-3">{legendeVisuel}</figcaption>
              )}
            </figure>
          )}
        </div>
      </Conteneur>
    </section>
  );
}

/** Titre de chapitre du récit : un sujet par écran. */
export function Chapitre({ numero, titre, children }: { numero: string; titre: string; children?: ReactNode }) {
  return (
    <Revele className="max-w-3xl">
      <p className="label !text-accent">{numero}</p>
      <h2 className="mt-3 font-texte text-4xl leading-[1.02] font-medium tracking-tight sm:text-6xl">{titre}</h2>
      {children && <div className="mt-6 text-xl leading-snug text-encre-2">{children}</div>}
    </Revele>
  );
}

export type Chiffre = {
  valeur: number;
  format?: "nombre" | "pourcent" | "decimal";
  decimales?: number;
  legende: string;
};

/** Chiffres en grand, qui se décomptent à l'entrée dans l'écran. */
export function GrandsChiffres({ chiffres, separateur }: { chiffres: Chiffre[]; separateur?: string }) {
  return (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-6">
      {chiffres.map((c, i) => (
        <div key={c.legende} className="flex items-end gap-x-8">
          {i > 0 && separateur && (
            <span aria-hidden className="pb-8 font-donnees text-3xl text-encre-3">
              {separateur}
            </span>
          )}
          <div>
            <Compteur
              valeur={c.valeur}
              format={c.format}
              decimales={c.decimales}
              delai={i * 250}
              className="block font-donnees text-6xl leading-none tracking-tight text-encre sm:text-8xl"
            />
            <span className="label mt-3 block">{c.legende}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Figure({
  numero,
  titre,
  source,
  legende,
  children,
}: {
  numero: string;
  titre?: ReactNode;
  source?: string;
  legende?: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="border-t border-trait-fort pt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="label !text-accent">Fig. {numero}</p>
        {source && <p className="label">{source}</p>}
      </div>
      {titre && <h3 className="mt-3 mb-5 max-w-3xl font-texte text-xl leading-snug font-medium sm:text-2xl">{titre}</h3>}
      <div className={titre ? "" : "mt-5"}>{children}</div>
      {legende && <figcaption className="mt-4 max-w-2xl text-sm leading-relaxed text-encre-2">{legende}</figcaption>}
    </figure>
  );
}

export type Mesure = {
  label: string;
  /** Un nombre se décompte à l'affichage ; un texte s'affiche tel quel. */
  valeur: number | string;
  format?: "nombre" | "pourcent" | "decimal";
  decimales?: number;
  suffixe?: string;
  detail?: string;
};

/** Bloc de métriques réelles : chaque valeur vient d'une exécution ou d'une source datée. */
export function Mesures({ items, source }: { items: Mesure[]; source?: string }) {
  return (
    <div>
      <dl className="grid grid-cols-1 border-t border-l border-trait min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {items.map((m) => (
          <div key={m.label} className="border-r border-b border-trait p-4">
            <dt className="label">{m.label}</dt>
            <dd className="mt-2 font-donnees text-2xl text-encre">
              {typeof m.valeur === "number" ? <Compteur valeur={m.valeur} format={m.format} decimales={m.decimales} /> : m.valeur}
              {m.suffixe && <span className="text-encre-2">{m.suffixe}</span>}
            </dd>
            {m.detail && <dd className="mt-1 text-sm text-encre-3">{m.detail}</dd>}
          </div>
        ))}
      </dl>
      {source && <p className="label mt-2 normal-case tracking-normal">{source}</p>}
    </div>
  );
}

export function BlocCode({ code, titre }: { code: string; titre?: string }) {
  return (
    <div className="overflow-hidden rounded-sm border border-trait bg-fond-2">
      {titre && <p className="label border-b border-trait px-4 py-2">{titre}</p>}
      <pre className="overflow-x-auto p-4 font-donnees text-[0.8rem] leading-relaxed text-encre-2">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/** Section dépliable de « sous le capot ». */
export function Depliable({
  id,
  numero,
  titre,
  resume,
  children,
  ouvert = false,
}: {
  id: string;
  numero: string;
  titre: string;
  resume?: string;
  children: ReactNode;
  ouvert?: boolean;
}) {
  return (
    <details id={id} open={ouvert} className="group scroll-mt-8 border-t border-trait last:border-b">
      <summary className="flex cursor-pointer list-none items-baseline gap-4 py-6 [&::-webkit-details-marker]:hidden">
        <span className="label w-10 shrink-0">§ {numero}</span>
        <span className="min-w-0">
          <span className="block font-texte text-2xl leading-tight font-medium transition-colors group-hover:text-accent sm:text-3xl">
            {titre}
          </span>
          {resume && <span className="mt-1 block text-encre-3">{resume}</span>}
        </span>
        <span
          aria-hidden
          className="ml-auto font-donnees text-xl text-encre-3 transition-transform duration-300 group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="prose-projet pb-12 pl-0 sm:pl-14">{children}</div>
    </details>
  );
}

/** Statut du pipeline, lu dans les métadonnées de la dernière exécution. */
export function Statut({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-3 font-donnees text-xs tracking-wider text-encre-2 uppercase">
      <span aria-hidden className="pouls shrink-0" />
      <span>{children}</span>
    </p>
  );
}
