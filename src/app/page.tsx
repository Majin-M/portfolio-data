import { SystemeAccueil, type Apercu } from "@/components/accueil/systeme";
import { Conteneur } from "@/components/conteneur";
import { Espace } from "@/components/espace";
import { FicheResume } from "@/components/fiche/resume";
import { COUCHES } from "@/contenu/entrepot-sql";
import { DONNEES as INCLUSION } from "@/contenu/inclusion-financiere";
import { chiffresFiche } from "@/lib/competences-serveur";
import { decimal, nombre, pourcent } from "@/lib/format";
import { lireMetadataCarburant, testsCarburant, volumesCarburant } from "@/lib/carburant";
import { lireDiversite, lireMetadata, volumesPrenoms } from "@/lib/prenoms";
import { PROJETS } from "@/lib/projets";

export default function Accueil() {
  const metadata = lireMetadata();
  const dbt = metadata.dbt;
  const diversite = lireDiversite();
  const carburant = lireMetadataCarburant();
  // Les volumes des projets Prénoms et Carburant viennent de la dernière exécution de leur pipeline.
  const projets = PROJETS.map((p) =>
    p.id === "prenoms-de-france"
      ? { ...p, volumes: volumesPrenoms() }
      : p.id === "prix-carburants"
        ? { ...p, volumes: { ...p.volumes, ...volumesCarburant() } }
        : p,
  );

  // Ce que chaque carte dit de son projet, en un coup d'œil (valeurs réelles).
  const filles = diversite.filter((l) => l.sexe === "F").map((l) => [l.annee, l.part_top_10] as [number, number]);
  const couche = (nom: string) => COUCHES.find((c) => c.nom === nom)!;
  const lignesCouche = (nom: string) => couche(nom).objets.reduce((t, o) => t + (o.lignes ?? 0), 0);
  const faits = couche("Gold").objets.find((o) => o.nom === "fact_sales")!.lignes!;
  const [debutTop10, finTop10] = [filles[0][1], filles[filles.length - 1][1]];
  const apercus: Record<string, Apercu> = {
    "prenoms-de-france": {
      visuel: { type: "courbe", points: filles, debut: pourcent(debutTop10, 0), fin: pourcent(finTop10, 0) },
      chiffre: {
        valeur: `${decimal(metadata.lignes.source / 1e6, 1)} M`,
        legende: `lignes INSEE, ${dbt ? `${dbt.tests.pass ?? 0}/${dbt.tests.total}` : "39"} tests de qualité`,
      },
      phrase: `Les dix prénoms les plus donnés portaient ${pourcent(debutTop10, 0)} des filles en ${metadata.annees.premiere}, ${pourcent(finTop10, 0)} en ${metadata.annees.derniere}.`,
      stack: ["Python", "dbt", "DuckDB"],
    },
    "entrepot-sql": {
      visuel: {
        type: "medailles",
        volumes: [nombre(lignesCouche("Bronze")), nombre(lignesCouche("Silver")), `${nombre(faits)} faits`],
      },
      chiffre: { valeur: "3 couches", legende: "brut, nettoyé, prêt pour le métier" },
      phrase: "Les ventes d'un CRM et d'un ERP réunies dans un schéma en étoile, prêt pour l'analyse.",
      stack: ["SQL Server", "T-SQL"],
    },
    "inclusion-financiere": {
      visuel: { type: "unites", sur100: Math.round(INCLUSION.tauxCompte * 100) },
      chiffre: { valeur: pourcent(INCLUSION.tauxCompte, 0), legende: "des répondants ont un compte bancaire" },
      phrase: `${nombre(INCLUSION.reponses)} réponses en Afrique de l'Est : qui a un compte, et peut-on le prédire ?`,
      stack: ["Python", "scikit-learn"],
    },
    "prix-carburants": {
      visuel: { type: "stations" },
      chiffre: {
        valeur: nombre(carburant.volumes.changements_de_prix),
        legende: `changements de prix historisés, ${testsCarburant(carburant)} tests de qualité`,
      },
      phrase: `Chaque matin, les prix de ${nombre(carburant.volumes.stations)} stations, pour trouver la moins chère autour de soi.`,
      stack: ["Python", "dbt", "DuckDB"],
    },
  };

  return (
    <Espace>
      <Conteneur>
        <FicheResume chiffres={chiffresFiche()} />
      </Conteneur>
      <SystemeAccueil projets={projets} apercus={apercus} />
    </Espace>
  );
}
