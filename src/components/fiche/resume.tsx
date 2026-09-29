// Première scène de l'accueil : qui je suis, en un coup d'œil. Portrait, métier,
// une phrase, trois chiffres vérifiables et les liens utiles à un recruteur.
// La fiche complète (radar, certifications, parcours) est sur la page À propos.

import Link from "next/link";
import { Chiffres, LiensProfil, Portrait } from "@/components/fiche/identite";
import { IDENTITE } from "@/contenu/competences";
import type { ChiffreFiche } from "@/lib/competences-serveur";

export function FicheResume({ chiffres }: { chiffres: ChiffreFiche[] }) {
  return (
    <section aria-labelledby="qui" className="grid items-center gap-10 pt-12 pb-10 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <div className="flex items-center gap-5">
          <Portrait taille="size-24 sm:size-28" />
          <div>
            <h1 id="qui" className="font-texte text-4xl leading-[1.02] font-medium tracking-tight sm:text-5xl">
              {IDENTITE.nom}
            </h1>
            <p className="mt-2 label !text-accent">{IDENTITE.titre}</p>
          </div>
        </div>
        <p className="mt-6 max-w-xl text-xl leading-snug text-encre-2">{IDENTITE.phrase}</p>
        <ul className="mt-6 flex flex-wrap gap-3">
          <LiensProfil />
          <li className="flex items-center">
            <Link href="/a-propos" className="ui px-1 !text-encre hover:!text-accent">
              Parcours et compétences
            </Link>
          </li>
        </ul>
      </div>
      <div className="lg:col-span-5">
        <Chiffres chiffres={chiffres} />
      </div>
    </section>
  );
}

