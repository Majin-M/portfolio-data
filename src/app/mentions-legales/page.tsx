import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Conteneur } from "@/components/conteneur";
import { Espace } from "@/components/espace";

export const metadata: Metadata = {
  title: "Mentions légales et confidentialité",
  description: "Éditeur, hébergeur et données personnelles : ce que ce site collecte, et ce qu'il ne collecte pas.",
};

const CONTACT = "marcsmouthoud@gmail.com";

function Bloc({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-trait py-8 lg:grid-cols-12">
      <h2 className="label lg:col-span-4">{titre}</h2>
      <div className="space-y-3 leading-relaxed text-encre-2 lg:col-span-8">{children}</div>
    </section>
  );
}

export default function MentionsLegales() {
  return (
    <Espace>
      <Conteneur className="pt-10 sm:pt-16">
        <p className="label !text-accent">Mentions légales et confidentialité</p>
        <h1 className="mt-4 max-w-3xl font-texte text-4xl leading-tight font-medium tracking-tight sm:text-5xl">
          Ce site ne dépose aucun cookie et ne mesure pas son audience.
        </h1>
        <p className="mt-4 text-sm text-encre-3">Mis à jour le 29 septembre 2026.</p>

        <div className="mt-12">
          <Bloc titre="Éditeur">
            <p>
              Marc Steven Mouthoud, à titre personnel. Contact :{" "}
              <a href={`mailto:${CONTACT}`} className="lien">
                {CONTACT}
              </a>
              .
            </p>
          </Bloc>

          <Bloc titre="Hébergeur">
            <p>
              Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis. Contact :{" "}
              <a href="mailto:privacy@vercel.com" className="lien">
                privacy@vercel.com
              </a>
              .
            </p>
          </Bloc>

          <Bloc titre="Données personnelles">
            <p>
              Ce site ne demande aucune inscription, n&apos;utilise aucun formulaire, ne dépose aucun cookie et n&apos;utilise
              aucun outil de mesure d&apos;audience ni de publicité. Les polices sont servies par le site lui-même.
            </p>
            <p>
              <span className="text-encre">Hébergement.</span> Comme tout hébergeur, Vercel enregistre dans ses journaux
              techniques l&apos;adresse IP et le navigateur des visiteurs, pour faire fonctionner et sécuriser le service. Ces
              journaux sont traités par Vercel, selon sa{" "}
              <a href="https://vercel.com/legal/privacy-policy" className="lien" rel="noopener">
                politique de confidentialité
              </a>
              .
            </p>
            <p>
              <span className="text-encre">Recherche de station.</span> Sur la page{" "}
              <Link href="/projets/prix-carburants" className="lien">
                Prix des carburants
              </Link>
              , la recherche charge les prix du jour depuis GitHub Pages : GitHub reçoit alors l&apos;adresse IP du visiteur,
              selon sa{" "}
              <a
                href="https://docs.github.com/fr/site-policy/privacy-policies/github-general-privacy-statement"
                className="lien"
                rel="noopener"
              >
                déclaration de confidentialité
              </a>
              . C&apos;est le seul service tiers contacté par le site.
            </p>
            <p>
              <span className="text-encre">Position.</span> Le bouton « Me localiser » demande la position au navigateur, qui
              en demande l&apos;autorisation. La position sert à calculer les distances dans le navigateur ; elle n&apos;est ni
              envoyée ni enregistrée.
            </p>
            <p>
              <span className="text-encre">Thème.</span> Le choix entre thème sombre et thème clair est enregistré dans le
              navigateur du visiteur, et nulle part ailleurs.
            </p>
          </Bloc>

          <Bloc titre="Vos droits">
            <p>
              Vous disposez d&apos;un droit d&apos;accès, de rectification et d&apos;effacement des données qui vous concernent.
              Pour toute question, écrivez à{" "}
              <a href={`mailto:${CONTACT}`} className="lien">
                {CONTACT}
              </a>
              . Vous pouvez aussi adresser une réclamation à la{" "}
              <a href="https://www.cnil.fr/fr/plaintes" className="lien" rel="noopener">
                CNIL
              </a>
              .
            </p>
          </Bloc>

          <Bloc titre="Contenus et données">
            <p>
              Les textes, graphiques et le code du site sont de Marc Steven Mouthoud. Les données affichées viennent de sources
              publiques, citées sur chaque page projet : INSEE, prix-carburants.gouv.fr (Licence Ouverte), enquête FinScope.
            </p>
          </Bloc>
        </div>
      </Conteneur>
    </Espace>
  );
}
