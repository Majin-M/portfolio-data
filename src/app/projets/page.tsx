import type { Metadata } from "next";
import Link from "next/link";
import { Conteneur } from "@/components/conteneur";
import { Espace } from "@/components/espace";
import { Revele } from "@/components/mouvement";
import { VignetteCourbe } from "@/components/vignette-courbe";
import { lireDiversite } from "@/lib/prenoms";
import { PROJETS, type Projet } from "@/lib/projets";

export const metadata: Metadata = {
  title: "Projets",
  description: "Peu de projets, bien documentés : chacun montre une compétence différente du data engineering.",
};

function Apercu({ projet }: { projet: Projet }) {
  if (projet.id !== "prenoms-de-france") return null;
  const diversite = lireDiversite();
  const serie = (sexe: "F" | "M") =>
    diversite.filter((l) => l.sexe === sexe).map((l) => [l.annee, l.part_top_10] as [number, number]);
  return (
    <figure className="mt-4 md:mt-0">
      <VignetteCourbe
        description="Part des naissances portée par les 10 prénoms les plus donnés, 1900-2025 : de 45 % à moins de 11 %"
        series={[
          { id: "F", couleur: "var(--serie-f)", points: serie("F") },
          { id: "M", couleur: "var(--serie-m)", points: serie("M") },
        ]}
      />
      <figcaption className="label mt-1 normal-case tracking-normal">Part du top 10, filles et garçons, 1900-2025</figcaption>
    </figure>
  );
}

export default function PageProjets() {
  return (
    <Espace>
      <Conteneur className="pt-10 sm:pt-16">
        <div className="border-b border-trait-fort pb-3">
          <p className="label !text-accent">Archive · {PROJETS.length} entrées</p>
        </div>
        <h1 className="mt-8 font-texte text-6xl leading-none font-medium tracking-tight sm:text-7xl">Projets</h1>
        <p className="mt-6 max-w-2xl text-xl leading-snug text-encre-2">
          Peu de projets, bien documentés : chacun montre une compétence différente du métier. Le vrai portfolio, ce sont les
          dépôts GitHub ; ces pages en sont la vitrine.
        </p>

        <ol className="mt-14">
          {PROJETS.map((p, i) => (
            <Revele
              as="li"
              key={p.id}
              delai={i * 120}
              className="grid gap-4 border-t border-trait py-10 md:grid-cols-12 md:gap-8"
            >
              <p className="font-donnees text-4xl text-encre-3 md:col-span-1">{p.numero}</p>
              <div className="md:col-span-7">
                <p className="label">{p.guide ?? p.competence}</p>
                {p.href ? (
                  <h2 className="mt-2 w-fit font-texte text-4xl leading-tight font-medium">
                    <Link href={p.href} transitionTypes={["plonger"]} className="hover:text-accent">
                      {p.titre}
                    </Link>
                  </h2>
                ) : (
                  <h2 className="mt-2 font-texte text-4xl leading-tight font-medium text-encre-2">{p.titre}</h2>
                )}
                <p className="mt-3 text-lg text-encre-2">{p.resume}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {p.stack.map((s) => (
                    <li key={s} className="border border-trait-fort px-2 py-0.5 font-donnees text-xs text-encre-2">
                      {s}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                  {p.href && (
                    <Link href={p.href} transitionTypes={["plonger"]} className="ui !text-encre hover:!text-accent">
                      Entrer dans le projet
                    </Link>
                  )}
                  {p.depot && (
                    <a href={p.depot} className="ui" rel="noopener">
                      Dépôt ↗
                    </a>
                  )}
                  {p.statut === "en cours" && <span className="ui">En cours : la page arrive avec le projet.</span>}
                </div>
              </div>
              <div className="md:col-span-4">
                <Apercu projet={p} />
              </div>
            </Revele>
          ))}
        </ol>
      </Conteneur>
    </Espace>
  );
}
