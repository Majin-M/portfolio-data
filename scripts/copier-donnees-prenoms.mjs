// Copie les exports JSON du projet Prénoms de France dans public/data/prenoms/.
// Les données ne changent qu'une fois par an (édition INSEE) : on relance ce
// script après chaque `run.ps1` du dépôt prenoms_france.
//
// Utilisation : npm run donnees:prenoms [-- <chemin vers prenoms_france/exports>]

import { cpSync, existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const source = resolve(process.argv[2] ?? "../prenoms_france/exports");
const cible = resolve("public/data/prenoms");

for (const fichier of ["metadata.json", "diversite.json", "ecart_regions.json", "series"]) {
  if (!existsSync(resolve(source, fichier))) {
    console.error(`Introuvable : ${resolve(source, fichier)}`);
    process.exit(1);
  }
}

rmSync(cible, { recursive: true, force: true });
cpSync(source, cible, { recursive: true });

const metadata = JSON.parse(readFileSync(resolve(cible, "metadata.json"), "utf-8"));
console.log(`Exports copiés dans ${cible}`);
console.log(`  généré le ${metadata.genere_le}, années ${metadata.annees.premiere}-${metadata.annees.derniere}`);
console.log(`  tests dbt : ${metadata.dbt?.tests?.pass ?? "?"} / ${metadata.dbt?.tests?.total ?? "?"}`);
