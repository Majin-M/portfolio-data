// Avant le build sur Vercel : télécharge les prix publiés ce matin par le
// pipeline Carburant sur GitHub Pages, dans public/data/carburant/. La date,
// la carte et les médianes de la page sont ainsi celles du dernier passage.
//
// Hors Vercel (build local), le script ne fait rien : la copie versionnée reste
// telle quelle, et `npm run donnees:carburant` la met à jour depuis le dépôt local.
// Si GitHub Pages ne répond pas, le build continue avec la copie versionnée.
//
// Utilisation : node scripts/telecharger-donnees-carburant.mjs [--forcer]

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SOURCE = "https://majin-m.github.io/Carburant";
const CIBLE = resolve("public/data/carburant");
const FICHIERS = ["metadata.json", "prix_actuels.json"];

if (!process.env.VERCEL && !process.argv.includes("--forcer")) {
  console.log("Build local : copie versionnée des prix des carburants conservée.");
  process.exit(0);
}

try {
  // Tout est téléchargé et vérifié avant d'écrire : jamais un fichier neuf à côté d'un ancien.
  const contenus = await Promise.all(
    FICHIERS.map(async (fichier) => {
      const reponse = await fetch(`${SOURCE}/${fichier}`, { signal: AbortSignal.timeout(30000) });
      if (!reponse.ok) throw new Error(`${fichier} : HTTP ${reponse.status}`);
      const texte = await reponse.text();
      JSON.parse(texte);
      return texte;
    }),
  );
  const metadata = JSON.parse(contenus[0]);
  const actuelle = JSON.parse(readFileSync(resolve(CIBLE, "metadata.json"), "utf-8"));
  if (metadata.reference_at < actuelle.reference_at) throw new Error(`données publiées plus anciennes que la copie (${metadata.reference_at})`);
  FICHIERS.forEach((fichier, i) => writeFileSync(resolve(CIBLE, fichier), contenus[i]));
  console.log(`Prix des carburants téléchargés : données jusqu'au ${metadata.reference_at}, ${metadata.volumes.stations} stations.`);
} catch (erreur) {
  console.warn(`Prix des carburants non téléchargés (${erreur.message}) : copie versionnée conservée.`);
}
