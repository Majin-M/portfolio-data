"use client";

// Panneau droit de la fiche : cinq onglets, tous calculés à partir de la liste
// des usages. Onglets au clavier (flèches, Début, Fin). Sans JavaScript, les
// cinq panneaux s'affichent l'un sous l'autre.

import Link from "next/link";
import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Radar } from "@/components/fiche/radar";
import { Logo } from "@/components/logos";
import { Declencheur } from "@/components/mouvement";
import { LANGAGES, OUTILS_HORS_DATA, PARCOURS, REGLES_STATUT, type Statut } from "@/contenu/competences";
import { barresOutils, matrice, radar, type Segment } from "@/lib/competences";

const ONGLETS = [
  { id: "profil", nom: "Profil" },
  { id: "outils", nom: "Outils" },
  { id: "langages", nom: "Langages" },
  { id: "projets", nom: "Projets" },
  { id: "parcours", nom: "Parcours" },
] as const;

const COULEUR: Record<Statut, string> = {
  production: "var(--accent)",
  projet: "color-mix(in oklab, var(--accent) 48%, var(--fond))",
  apprentissage: "transparent",
};

/** Creux du radar = feuille de route (README du profil GitHub). */
const A_VENIR = [
  "Orchestration : Airflow ou Dagster, planification, reprises, dépendances",
  "Data platform cloud : stockage objet, entrepôt managé",
  "Streaming : traitement de flux en temps réel",
];

function Legende() {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-encre-2">
      {(Object.keys(REGLES_STATUT) as Statut[]).map((s) => (
        <li key={s} className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-2.5 w-5"
            style={{ background: COULEUR[s], border: s === "apprentissage" ? "1px solid var(--encre-3)" : undefined }}
          />
          <span>
            <span className="font-donnees text-encre">{s}</span> : {REGLES_STATUT[s]}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Ce que fait un outil dans un projet : s'affiche au survol, au focus ou au toucher. */
function Detail({ segment, invite }: { segment: Segment | null; invite: string }) {
  return (
    <div aria-live="polite" className="min-h-20 border-t border-trait pt-4">
      {segment ? (
        <p className="leading-snug">
          <span className="font-donnees text-encre">
            {segment.outil} · {segment.titreProjet}
          </span>
          <span className="ml-2 font-donnees text-xs text-encre-3 uppercase">{segment.statut}</span>
          <br />
          <span className="text-encre-2">{segment.usage}</span>{" "}
          <a href={segment.preuve} className="lien text-sm" rel="noopener">
            voir le code ↗
          </a>
        </p>
      ) : (
        <p className="text-sm text-encre-3">{invite}</p>
      )}
    </div>
  );
}

function Profil() {
  const { axes, max } = radar();
  return (
    <div className="grid items-center gap-10 md:grid-cols-5">
      <div className="md:col-span-3">
        <p className="inline-flex items-center gap-2 border border-accent px-3 py-1.5 font-donnees text-xs tracking-[0.08em] text-accent uppercase">
          Calculé à partir des {max} projets publiés
        </p>
        <Declencheur mode="dessin">
          <Radar axes={axes} max={max} />
        </Declencheur>
        <p className="text-center text-sm text-encre-3">
          Chaque anneau compte un projet : au bord, l&apos;étape est couverte par les {max}.
        </p>
      </div>
      <div className="space-y-5 md:col-span-2">
        <p className="text-lg leading-snug text-encre-2">
          Les étapes du métier, pas des technologies. Chaque axe compte les projets publiés qui couvrent vraiment l&apos;étape,
          sur {max}.
        </p>
        <div>
          <h3 className="label mb-3">Les creux sont la feuille de route</h3>
          <ul className="space-y-2 text-sm leading-snug text-encre-2">
            {A_VENIR.map((a) => (
              <li key={a} className="border-l border-dashed border-encre-3 pl-3">
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Outils() {
  const barres = barresOutils();
  const max = Math.max(...barres.map((b) => b.segments.length));
  const [detail, setDetail] = useState<Segment | null>(null);
  return (
    <div className="space-y-8">
      <Declencheur mode="dessin">
        <ul className="space-y-3">
          {barres.map((b, i) => (
            <li key={b.outil} className="grid grid-cols-[7.5rem_1fr_4.5rem] items-center gap-3 sm:grid-cols-[9rem_1fr_6rem]">
              <span className="flex min-w-0 items-center gap-2 font-donnees text-sm text-encre">
                <Logo nom={b.outil} className="size-3.5" />
                <span className="truncate">{b.outil}</span>
              </span>
              <span className="flex h-3.5 gap-0.5">
                {b.statut === "apprentissage" ? (
                  <span className="h-full flex-1 border border-encre-3" aria-hidden />
                ) : (
                  Array.from({ length: max }, (_, k) => {
                    const s = b.segments[k];
                    return s ? (
                      <button
                        key={k}
                        type="button"
                        className="barre h-full flex-1 cursor-help outline-offset-2"
                        style={{ background: COULEUR[s.statut], "--delai": `${i * 50 + k * 140}ms` } as CSSProperties}
                        aria-label={`${b.outil} dans ${s.titreProjet}`}
                        onPointerEnter={() => setDetail(s)}
                        onFocus={() => setDetail(s)}
                        onClick={() => setDetail(s)}
                      />
                    ) : (
                      <span key={k} aria-hidden className="h-full flex-1 bg-trait" />
                    );
                  })
                )}
              </span>
              <span className="text-right font-donnees text-xs text-encre-2">
                {b.statut === "apprentissage" ? "apprentissage" : `${b.segments.length} projet${b.segments.length > 1 ? "s" : ""}`}
              </span>
            </li>
          ))}
        </ul>
      </Declencheur>
      <Detail segment={detail} invite="Un segment = un projet. Survolez-en un pour voir à quoi l'outil y sert." />
      <Legende />
      <div className="border-t border-trait pt-5">
        <h3 className="label mb-3">Hors projets data</h3>
        <ul className="space-y-3">
          {OUTILS_HORS_DATA.map((o) => (
            <li key={o.outil} className="leading-snug">
              <span className="flex items-center gap-2 font-donnees text-sm text-encre">
                <Logo nom={o.outil} className="size-3.5" />
                {o.outil} · {o.projet.nom}
              </span>
              <span className="mt-1 block text-sm text-encre-2">
                {o.usage}.{" "}
                <a href={o.preuve} className="lien" rel="noopener">
                  voir le code ↗
                </a>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Langages() {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {LANGAGES.map((l) => (
        <li key={l.nom} className="border border-trait-fort p-5">
          <p className="flex items-baseline justify-between gap-3">
            <span className="flex items-center gap-2.5 font-texte text-2xl">
              <Logo nom={l.nom} className="size-5" />
              {l.nom}
            </span>
            <span className="font-donnees text-xs tracking-[0.12em] text-accent uppercase">{l.contexte}</span>
          </p>
          <p className="mt-3 leading-snug text-encre-2">{l.pourQuoi}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {l.depots.map((d) => {
              const classes = "inline-block border border-trait-fort px-2 py-1 font-donnees text-xs text-encre hover:border-accent";
              return (
                <li key={d.href}>
                  {d.href.startsWith("/") ? (
                    <Link href={d.href} className={classes}>
                      {d.nom}
                    </Link>
                  ) : (
                    <a href={d.href} rel="noopener" className={classes}>
                      {d.nom} ↗
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function Projets() {
  const { lignes, projets } = matrice();
  const [detail, setDetail] = useState<Segment | null>(null);
  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse">
          <caption className="sr-only">Technologies utilisées dans chaque projet</caption>
          <thead>
            <tr>
              <th scope="col" className="w-36 pb-3 text-left font-donnees text-xs font-normal text-encre-3">
                technologie
              </th>
              {projets.map((p) => (
                <th key={p.id} scope="col" className="px-1 pb-3 align-bottom font-normal">
                  <Link href={p.href ?? "/projets"} className="group block text-center">
                    <span className="block font-donnees text-xs text-accent">{p.numero}</span>
                    <span className="block text-sm leading-tight text-encre-2 group-hover:text-encre">{p.titre}</span>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => (
              <tr key={l.outil} className="border-t border-trait">
                <th scope="row" className="py-2 text-left font-donnees text-sm font-normal text-encre">
                  <span className="flex items-center gap-2">
                    <Logo nom={l.outil} className="size-3.5" />
                    {l.outil}
                  </span>
                </th>
                {l.cellules.map((s, k) => (
                  <td key={projets[k].id} className="py-2 text-center">
                    {s && (
                      <button
                        type="button"
                        className="inline-flex size-7 cursor-help items-center justify-center rounded-full"
                        aria-label={`${l.outil} dans ${s.titreProjet}`}
                        onPointerEnter={() => setDetail(s)}
                        onFocus={() => setDetail(s)}
                        onClick={() => setDetail(s)}
                      >
                        <span className="size-3 rounded-full" style={{ background: COULEUR[s.statut] }} />
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Detail
        segment={detail}
        invite="Un point = une technologie dans un projet. Survolez-le pour voir son rôle ; cliquez sur un projet pour l'ouvrir."
      />
      <Legende />
    </div>
  );
}

function Parcours() {
  return (
    <ol className="relative border-l border-trait-fort">
      {PARCOURS.map((j, i) => (
        <li key={`${j.titre}-${i}`} className="relative grid gap-1 pb-6 pl-6 sm:grid-cols-[7.5rem_1fr] sm:gap-4">
          <span
            aria-hidden
            className="absolute top-1.5 -left-[5px] size-2.5 rounded-full"
            style={{ background: j.type === "projet" ? "var(--accent)" : j.type === "expérience" ? "var(--encre)" : "var(--encre-3)" }}
          />
          <p className="font-donnees text-sm text-encre-2">
            {j.debut}
            {j.fin ? `–${j.fin}` : ""}
          </p>
          <div>
            <p className="font-donnees text-[0.7rem] tracking-[0.12em] text-encre-3 uppercase">{j.type}</p>
            <p className="mt-0.5 leading-snug text-encre">
              {j.href ? (
                <Link href={j.href} className="hover:text-accent">
                  {j.titre}
                </Link>
              ) : (
                j.titre
              )}
            </p>
            <p className="text-sm leading-snug text-encre-2">
              {j.lieu} · {j.detail}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

const CONTENUS = { profil: Profil, outils: Outils, langages: Langages, projets: Projets, parcours: Parcours };

export function OngletsFiche() {
  const [actif, setActif] = useState(0);
  const boutons = useRef<(HTMLButtonElement | null)[]>([]);

  function clavier(e: KeyboardEvent<HTMLDivElement>) {
    const n = ONGLETS.length;
    const cibles: Record<string, number> = { ArrowRight: (actif + 1) % n, ArrowLeft: (actif - 1 + n) % n, Home: 0, End: n - 1 };
    if (!(e.key in cibles)) return;
    e.preventDefault();
    setActif(cibles[e.key]);
    boutons.current[cibles[e.key]]?.focus();
  }

  return (
    <div className="border border-trait-fort bg-fond">
      <div role="tablist" aria-label="Fiche de compétences" className="flex overflow-x-auto border-b border-trait-fort" onKeyDown={clavier}>
        {ONGLETS.map((o, i) => (
          <button
            key={o.id}
            ref={(el) => {
              boutons.current[i] = el;
            }}
            id={`onglet-${o.id}`}
            role="tab"
            type="button"
            aria-selected={i === actif}
            aria-controls={`panneau-${o.id}`}
            tabIndex={i === actif ? 0 : -1}
            onClick={() => setActif(i)}
            className={`relative shrink-0 px-4 py-3.5 font-donnees text-xs tracking-[0.15em] uppercase transition-colors sm:px-5 ${
              i === actif ? "text-encre" : "text-encre-3 hover:text-encre-2"
            }`}
          >
            {o.nom}
            {i === actif && <span aria-hidden className="absolute inset-x-3 -bottom-px h-0.5 bg-accent" />}
          </button>
        ))}
      </div>
      {ONGLETS.map((o, i) => {
        const Contenu = CONTENUS[o.id];
        return (
          <section
            key={o.id}
            id={`panneau-${o.id}`}
            role="tabpanel"
            aria-labelledby={`onglet-${o.id}`}
            tabIndex={0}
            data-inactif={i === actif ? undefined : ""}
            className="fiche-panneau p-5 sm:p-8"
          >
            <h2 className="sr-only">{o.nom}</h2>
            <Contenu />
          </section>
        );
      })}
    </div>
  );
}
