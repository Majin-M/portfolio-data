import type { Metadata } from "next";
import { Conteneur } from "@/components/conteneur";
import { Espace } from "@/components/espace";
import { PanneauIdentite } from "@/components/fiche/identite";
import { OngletsFiche } from "@/components/fiche/onglets";
import { chiffresFiche } from "@/lib/competences-serveur";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Marc Steven Mouthoud, data engineer : parcours, certifications et outils utilisés dans les projets publiés.",
};

const PRINCIPES = [
  [
    "Montrer le système",
    "Un résultat ne dit pas comment il a été obtenu. Chaque projet montre ses sources, son pipeline, son modèle de données et ses contrôles.",
  ],
  [
    "Peu de projets, bien documentés",
    "Chaque projet met en avant une compétence différente, avec un README qui explique la question, l'architecture, les limites et la façon de le relancer.",
  ],
  [
    "Aucun chiffre inventé",
    "Les métriques affichées viennent des exports des pipelines ou d'exécutions datées. Cette fiche décrit les outils tels qu'ils servent dans les projets, avec un lien vers le code.",
  ],
  ["Les projets guidés annoncés comme tels", "Quand un projet suit un cours, la page le dit, avec ce que j'y ai ajouté."],
];

export default function APropos() {
  return (
    <Espace>
      <Conteneur className="pt-10 sm:pt-16">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-trait-fort pb-3">
          <p className="label !text-accent">À propos · fiche de compétences</p>
          <p className="label">Calculée à partir des projets publiés</p>
        </div>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-12">
          <div className="lg:sticky lg:top-6 lg:col-span-4">
            <PanneauIdentite chiffres={chiffresFiche()} />
          </div>
          <div className="min-w-0 lg:col-span-8">
            <OngletsFiche />
          </div>
        </div>

        <section className="mt-24 grid gap-12 border-t border-trait-fort pt-10 lg:grid-cols-12">
          <h2 className="label lg:col-span-4">Principes de ce portfolio</h2>
          <dl className="space-y-6 lg:col-span-8">
            {PRINCIPES.map(([titre, texte]) => (
              <div key={titre} className="border-t border-trait pt-4 first:border-t-0 first:pt-0">
                <dt className="font-medium">{titre}</dt>
                <dd className="mt-1 text-encre-2">{texte}</dd>
              </div>
            ))}
          </dl>
        </section>
      </Conteneur>
    </Espace>
  );
}
