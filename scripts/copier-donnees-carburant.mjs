// Copie les exports JSON du projet Prix des carburants dans public/data/carburant/.
// Le site les lit au build (chiffres de la page, résultats pour Lyon) et s'en
// sert de secours si les fichiers publiés chaque matin sur GitHub Pages ne
// répondent pas.
//
// Utilisation : npm run donnees:carburant [-- <chemin vers Carburant/exports>]

import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const source = resolve(process.argv[2] ?? "../Carburant/exports");
const cible = resolve("public/data/carburant");
const FICHIERS = ["metadata.json", "prix_actuels.json"];

for (const fichier of FICHIERS) {
  if (!existsSync(resolve(source, fichier))) {
    console.error(`Introuvable : ${resolve(source, fichier)}`);
    process.exit(1);
  }
}

rmSync(cible, { recursive: true, force: true });
mkdirSync(cible, { recursive: true });
for (const fichier of FICHIERS) copyFileSync(resolve(source, fichier), resolve(cible, fichier));

const metadata = JSON.parse(readFileSync(resolve(cible, "metadata.json"), "utf-8"));
const tests = metadata.derniere_execution_dbt?.tests ?? {};
console.log(`Exports copiés dans ${cible}`);
console.log(`  données jusqu'au ${metadata.reference_at}, ${metadata.volumes.stations} stations`);
console.log(`  tests dbt : ${tests.pass ?? "?"} réussis sur ${Object.values(tests).reduce((a, b) => a + b, 0)}`);
