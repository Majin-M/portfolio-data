// Chiffres clés de la fiche, lus au build dans les exports des pipelines.

import { lireMetadataCarburant } from "@/lib/carburant";
import { projetsEnProduction } from "@/lib/competences";
import { lireMetadata } from "@/lib/prenoms";
import { PROJETS } from "@/lib/projets";

export type ChiffreFiche = { valeur: number; legende: string };

export function chiffresFiche(): ChiffreFiche[] {
  const prenoms = lireMetadata().dbt?.tests;
  const carburant = lireMetadataCarburant().derniere_execution_dbt?.tests ?? {};
  const totalCarburant = Object.values(carburant).reduce((a, b) => a + b, 0);
  const tests = (prenoms?.total ?? 0) + totalCarburant;
  const reussis = (prenoms?.pass ?? 0) + (carburant.pass ?? 0);
  const publies = PROJETS.filter((p) => p.statut === "publié");
  const guides = publies.filter((p) => p.guide).length;
  const production = projetsEnProduction().length;

  return [
    { valeur: production, legende: production > 1 ? "pipelines quotidiens en production" : "pipeline quotidien en production" },
    {
      valeur: tests,
      legende: `tests dbt (${prenoms?.total ?? 0} + ${totalCarburant})${reussis === tests ? ", tous réussis" : ""}`,
    },
    { valeur: publies.length, legende: `projets publiés${guides ? `, dont ${guides} guidé` : ""}` },
  ];
}
