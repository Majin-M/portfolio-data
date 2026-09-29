// Corrige un défaut de `next build` (export statique) sous Windows.
//
// Next écrit un fichier par segment pour le préchargement des liens, nommé
// d'après le chemin du segment : /projets/__PAGE__ -> __next.projets.__PAGE__.txt.
// Sous Windows, le chemin contient des « \ » que Next ne remplace pas par des
// points : le fichier atterrit dans un dossier « __next.projets\__PAGE__.txt »
// et le navigateur reçoit une 404 à chaque préchargement.
//
// Ce script remet ces fichiers à plat. Sous Linux ou macOS, il ne trouve rien
// à corriger.

import { existsSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const OUT = "out";
const IGNORES = new Set(["_next", "data"]);
let corriges = 0;

function fichiers(dossier) {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    return statSync(chemin).isDirectory() ? fichiers(chemin) : [chemin];
  });
}

function parcourir(dossier) {
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (!statSync(chemin).isDirectory() || IGNORES.has(nom)) continue;
    if (nom.startsWith("__next.")) {
      for (const fichier of fichiers(chemin)) {
        const aplati = `${nom}.${relative(chemin, fichier).split(sep).join(".")}`;
        renameSync(fichier, join(dossier, aplati));
        corriges++;
      }
      rmSync(chemin, { recursive: true });
    } else {
      parcourir(chemin);
    }
  }
}

if (!existsSync(OUT)) {
  console.error("Dossier out/ introuvable : lancer `next build` d'abord.");
  process.exit(1);
}
parcourir(OUT);
console.log(corriges ? `${corriges} fichiers de préchargement remis à plat dans out/.` : "Export correct, rien à corriger.");
