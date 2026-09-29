import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Conteneur } from "@/components/conteneur";
import { Chapitre, Depliable, Figure, GrandsChiffres, Mesures, Ouverture, Statut } from "@/components/edition";
import { Espace } from "@/components/espace";
import { Logo } from "@/components/logos";
import { Courbes, type Annotation } from "@/components/graphiques/courbes";
import { Paysage } from "@/components/graphiques/paysage";
import { Revele } from "@/components/mouvement";
import { Recit, type EtapeRecit } from "@/components/recit";
import { RecherchePrenom } from "@/components/recherche-prenom";
import { SchemaPipelinePrenoms } from "@/components/schema-pipeline-prenoms";
import { date, nombre, pourcent } from "@/lib/format";
import {
  compterFichiersSeries,
  lireDiversite,
  lireEcartRegions,
  lireMetadata,
  lirePaysage,
  type FichierSeries,
} from "@/lib/prenoms";
import type { LigneDiversite, Sexe } from "@/lib/prenoms-commun";

export const metadata: Metadata = {
  title: "Prénoms de France, 1900-2025",
  description:
    "Pipeline Python, DuckDB et dbt sur le fichier des prénoms de l'INSEE : 126 ans de naissances, 39 tests de qualité, séries interactives.",
};

const PRENOM_INITIAL = "STEVEN";
const EXEMPLES = ["MARIE", "JEAN", "NATHALIE", "KEVIN", "CAMILLE", "DOMINIQUE", "LÉA", "LIAM"];
const DEPOT = "https://github.com/Majin-M/prenoms_france";

// Repères communs aux séries annuelles.
const REPERES: Annotation[] = [
  { x: 1946, label: "1946 · exhaustivité garantie", court: "1946" },
  { x: 2012, label: "2012 · Mayotte", court: "2012" },
];

// Naissances de 2020 : mesure faite pendant l'exploration (NOTES.md du dépôt).
const NAISSANCES_2020_FICHIER = 677665;
const NAISSANCES_2020_INSEE = 735186;

function serieDiversite(lignes: LigneDiversite[], sexe: Sexe, colonne: keyof LigneDiversite) {
  return lignes.filter((l) => l.sexe === sexe).map((l) => [l.annee, l[colonne] as number] as [number, number]);
}

function lireSeries(initiale: string): FichierSeries {
  return JSON.parse(readFileSync(join(process.cwd(), "public", "data", "prenoms", "series", `${initiale}.json`), "utf-8"));
}

export default function PagePrenoms() {
  const metadata = lireMetadata();
  const diversite = lireDiversite();
  const ecart = lireEcartRegions();
  const fichiersSeries = compterFichiersSeries();
  const { premiere, derniere } = metadata.annees;
  const paysage = lirePaysage(premiere, derniere);

  const ligne = (annee: number, sexe: Sexe) => {
    const l = diversite.find((d) => d.annee === annee && d.sexe === sexe);
    if (!l) throw new Error(`Pas de ligne de diversité pour ${annee} ${sexe}`);
    return l;
  };

  // Série du prénom affiché au chargement, préparée au build.
  const seriesInitiales: FichierSeries = { [PRENOM_INITIAL]: lireSeries(PRENOM_INITIAL[0])[PRENOM_INITIAL] };

  // Dénominateurs des parts : naissances recensées par année et par sexe.
  const totaux: Record<number, Record<Sexe, number>> = {};
  for (const l of diversite) (totaux[l.annee] ??= { F: 0, M: 0 })[l.sexe] = l.nombre_naissances;

  // Chiffres du récit, lus dans les exports.
  const f1900 = ligne(premiere, "F");
  const f1970 = ligne(1970, "F");
  const m1970 = ligne(1970, "M");
  const fFin = ligne(derniere, "F");
  const mFin = ligne(derniere, "M");
  const pic = diversite.filter((l) => l.sexe === "M").reduce((a, b) => (b.part_top_10 > a.part_top_10 ? b : a));
  const marie1900 = lireSeries("M").MARIE?.F?.find(([a]) => a === premiere)?.[1];
  const ecartDebut = ecart[0];
  const ecartFin = ecart[ecart.length - 1];

  const etapesTop10: EtapeRecit[] = [
    {
      id: "debut",
      surtitre: String(premiere),
      chiffres: [{ valeur: f1900.part_top_10, format: "pourcent", legende: "des filles" }],
      texte: `Dix prénoms suffisent pour nommer près d'une fille sur deux.${marie1900 ? ` Marie, à elle seule : ${pourcent(marie1900 / f1900.nombre_naissances)}.` : ""}`,
      jusqua: premiere + 15,
      reperes: [{ serie: "F", annee: premiere }],
    },
    {
      id: "pic",
      surtitre: String(pic.annee),
      chiffres: [{ valeur: pic.part_top_10, format: "pourcent", legende: "des garçons" }],
      texte: "Le sommet de la série : un garçon sur deux reçoit l'un des dix prénoms les plus donnés.",
      jusqua: pic.annee + 6,
      reperes: [{ serie: "M", annee: pic.annee }],
    },
    {
      id: "rencontre",
      surtitre: "Années 1970",
      chiffres: [
        { valeur: f1970.part_top_10, format: "pourcent", legende: "des filles, 1970" },
        { valeur: m1970.part_top_10, format: "pourcent", legende: "des garçons, 1970" },
      ],
      texte: "Les deux courbes se rejoignent, puis baissent ensemble.",
      jusqua: 1988,
      reperes: [
        { serie: "F", annee: 1970 },
        { serie: "M", annee: 1970 },
      ],
    },
    {
      id: "fin",
      surtitre: String(derniere),
      chiffres: [
        { valeur: fFin.part_top_10, format: "pourcent", legende: "des filles" },
        { valeur: mFin.part_top_10, format: "pourcent", legende: "des garçons" },
      ],
      texte: "Environ un enfant sur dix.",
      jusqua: derniere,
      reperes: [
        { serie: "F", annee: derniere },
        { serie: "M", annee: derniere },
      ],
    },
  ];

  const dbt = metadata.dbt;
  const durees = Object.fromEntries((dbt?.modeles ?? []).map((m) => [m.nom, m.duree_s]));
  const statut = dbt ? (
    <Statut>
      Dernière exécution le {date(dbt.execute_le)} · {dbt.tests.pass ?? 0}/{dbt.tests.total} tests · dbt {dbt.version}
    </Statut>
  ) : null;

  return (
    <Espace>
      <article>
        <Ouverture
          identifiant="Projet 01 · Batch ETL"
          source="INSEE / édition 2026"
          titre="Prénoms de France"
          periode={`${premiere} — ${derniere}`}
          phrase={
            <p>
              {derniere - premiere + 1} ans de naissances, {nombre(metadata.lignes.source)} lignes. Chaque crête est un prénom qui
              a été, au moins une année, le plus donné en France.
            </p>
          }
          statut={statut}
          liens={[
            { label: "Dépôt GitHub", href: DEPOT },
            { label: "Source INSEE", href: "https://www.insee.fr/fr/statistiques/8595130" },
          ]}
          halo={false}
          visuel={<Paysage cretes={paysage} premiere={premiere} />}
          legendeVisuel={
            <>
              Les {paysage.length} prénoms arrivés en tête au moins une année, de {paysage[0].prenom} à{" "}
              {paysage[paysage.length - 1].prenom}, rangés par année de pic. Chaque courbe a sa propre échelle : sa hauteur montre
              la forme d&apos;une mode, pas son ampleur.
            </>
          }
        />

        <Conteneur>
          {/* L'histoire */}
          <section aria-labelledby="histoire-1" className="border-t border-trait pt-24">
            <Chapitre numero="L'histoire · 1" titre="La fin des prénoms dominants">
              <p id="histoire-1">Part des naissances portée par les dix prénoms les plus donnés de l&apos;année.</p>
            </Chapitre>
            <div className="mt-6">
              <Recit
                series={[
                  { id: "F", label: "Filles", couleur: "var(--serie-f)", points: serieDiversite(diversite, "F", "part_top_10") },
                  { id: "M", label: "Garçons", couleur: "var(--serie-m)", points: serieDiversite(diversite, "M", "part_top_10") },
                ]}
                format="pourcent"
                description={`Part des naissances portée par les 10 prénoms les plus donnés, filles et garçons, ${premiere}-${derniere}`}
                annotations={REPERES}
                etapes={etapesTop10}
              />
            </div>
          </section>

          <section className="border-t border-trait py-24">
            <Chapitre numero="L'histoire · 2" titre="Toujours plus de prénoms">
              <p>
                Combien de prénoms faut-il, du plus donné au moins donné, pour nommer la moitié des filles nées dans l&apos;année
                ?
              </p>
            </Chapitre>
            <Revele className="mt-14">
              <GrandsChiffres
                separateur="→"
                chiffres={[
                  { valeur: f1900.nombre_prenoms_moitie_naissances, legende: `prénoms en ${premiere}` },
                  { valeur: fFin.nombre_prenoms_moitie_naissances, legende: `prénoms en ${derniere}` },
                ]}
              />
            </Revele>
            <div className="mt-16">
              <Figure
                numero="01"
                source="mart_diversite_prenoms_par_annee"
                legende={
                  <>
                    Chez les garçons : {ligne(premiere, "M").nombre_prenoms_moitie_naissances} en {premiere},{" "}
                    {mFin.nombre_prenoms_moitie_naissances} en {derniere}. Les prénoms trop rares ne sont pas dans le fichier : la
                    diversité réelle est plus grande encore.
                  </>
                }
              >
                <Courbes
                  format="nombre"
                  hauteur={340}
                  description={`Nombre de prénoms couvrant la moitié des naissances, filles et garçons, ${premiere}-${derniere}`}
                  annotations={REPERES}
                  series={[
                    {
                      id: "F",
                      label: "Filles",
                      couleur: "var(--serie-f)",
                      points: serieDiversite(diversite, "F", "nombre_prenoms_moitie_naissances"),
                    },
                    {
                      id: "M",
                      label: "Garçons",
                      couleur: "var(--serie-m)",
                      points: serieDiversite(diversite, "M", "nombre_prenoms_moitie_naissances"),
                    },
                  ]}
                />
              </Figure>
            </div>
          </section>

          <section className="border-t border-trait py-24">
            <Chapitre numero="L'histoire · 3" titre="Ce que le fichier ne dit pas">
              <p>
                Un prénom trop rare n&apos;est pas publié, et aucune ligne ne regroupe les prénoms écartés. Une somme de
                naissances n&apos;est donc pas un total de naissances.
              </p>
            </Chapitre>
            <Revele className="mt-14">
              <GrandsChiffres
                chiffres={[
                  {
                    valeur: (NAISSANCES_2020_INSEE - NAISSANCES_2020_FICHIER) / NAISSANCES_2020_INSEE,
                    format: "pourcent",
                    decimales: 1,
                    legende: "des naissances de 2020 absentes du fichier",
                  },
                ]}
              />
              <p className="mt-6 max-w-xl text-encre-2">
                {nombre(NAISSANCES_2020_FICHIER)} naissances dans le fichier, {nombre(NAISSANCES_2020_INSEE)} selon l&apos;INSEE :
                environ une sur treize manque.
              </p>
            </Revele>
            <div className="mt-16">
              <Figure
                numero="02"
                titre="Le même seuil s'applique à chaque région : la somme des régions n'atteint jamais le total France"
                source="mart_ecart_regions_france"
                legende={
                  <>
                    Part des naissances du total France absentes de la somme des régions : de {pourcent(ecartDebut.part_ecart)} en{" "}
                    {ecartDebut.annee} à {pourcent(ecartFin.part_ecart)} en {ecartFin.annee}. L&apos;écart va toujours dans le
                    même sens, ce qui écarte l&apos;arrondi à 5 comme cause.
                  </>
                }
              >
                <Courbes
                  format="pourcent"
                  hauteur={280}
                  description={`Écart entre le total France et la somme des régions, ${premiere}-${derniere}`}
                  annotations={REPERES}
                  series={[
                    {
                      id: "ecart",
                      label: "Écart",
                      couleur: "var(--accent)",
                      points: ecart.map((e) => [e.annee, e.part_ecart] as [number, number]),
                    },
                  ]}
                />
              </Figure>
            </div>
          </section>

          <section className="border-t border-trait py-24">
            <Chapitre numero="À vous" titre="Tape ton prénom">
              <p>Chaque année depuis {premiere}, combien d&apos;enfants l&apos;ont reçu.</p>
            </Chapitre>
            <div className="mt-12">
              <Figure
                numero="03"
                source={`Séries nationales · ${nombre(metadata.lignes.series_exportees)} lignes publiées`}
                legende={
                  <>
                    Effectifs arrondis à 5 par l&apos;INSEE. Une année non publiée vaut 0 : aucune naissance, ou trop peu pour
                    être diffusées. La part est calculée sur les naissances recensées dans le fichier : elle est légèrement
                    surestimée.
                  </>
                }
              >
                <RecherchePrenom
                  totaux={totaux}
                  premiere={premiere}
                  derniere={derniere}
                  prenomInitial={PRENOM_INITIAL}
                  seriesInitiales={seriesInitiales}
                  exemples={EXEMPLES}
                />
              </Figure>
            </div>
          </section>

          {/* Sous le capot */}
          <section aria-labelledby="capot" className="border-t border-trait-fort py-24">
            <Chapitre numero="Sous le capot" titre="Le pipeline">
              <p id="capot">
                Une commande, <code className="code-inline">run.ps1</code>, enchaîne l&apos;ingestion, les modèles dbt et leurs
                tests, puis l&apos;export. À chaque push, GitHub Actions rejoue l&apos;ensemble sur Linux, avec le vrai fichier de
                l&apos;INSEE.
              </p>
            </Chapitre>
            {statut && <div className="mt-8">{statut}</div>}

            <div className="mt-12">
              <Figure numero="04" source={dbt ? `dbt ${dbt.version} · durées de la dernière exécution` : undefined}>
                <SchemaPipelinePrenoms durees={durees} fichiersSeries={fichiersSeries} />
              </Figure>
            </div>

            <div className="mt-12">
              <Mesures
                items={[
                  { label: "Lignes source", valeur: metadata.lignes.source },
                  {
                    label: "Lignes exportées",
                    valeur: metadata.lignes.series_exportees,
                    detail: "lignes publiées, sans les zéros complétés",
                  },
                  ...(dbt
                    ? [
                        { label: "Tests dbt réussis", valeur: `${dbt.tests.pass ?? 0} / ${dbt.tests.total}` },
                        {
                          label: "Durée de dbt build",
                          valeur: dbt.duree_totale_s,
                          format: "decimal" as const,
                          decimales: 1,
                          suffixe: " s",
                          detail: `${dbt.modeles.length} modèles`,
                        },
                      ]
                    : []),
                ]}
                source={`Lu dans metadata.json, écrit par export.py le ${date(metadata.genere_le)}.`}
              />
            </div>

            <div className="mt-20">
              <Depliable id="dataset" numero="01" titre="Le dataset" resume="INSEE, fichier des prénoms, un fichier Parquet">
                <table className="tableau max-w-3xl">
                  <tbody>
                    {[
                      ["Producteur", "INSEE, fichier des prénoms, édition juillet 2026"],
                      ["Format", "Parquet, un seul fichier"],
                      ["Période", `Naissances de ${premiere} à ${derniere} (${derniere - premiere + 1} années)`],
                      [
                        "Volume",
                        `${nombre(metadata.lignes.source)} lignes : France 724 645, régions 1 928 764, départements 3 969 540`,
                      ],
                      ["Grain", "Un prénom, un sexe, une année, une zone géographique"],
                      ["Périmètre", "France hors Mayotte avant 2012, Mayotte incluse à partir de 2012"],
                      ["Empreinte", `sha256 ${metadata.source.sha256.slice(0, 16)}…`],
                      ["Licence", "Licence Ouverte 2.0 (Etalab)"],
                    ].map(([cle, val]) => (
                      <tr key={cle}>
                        <th scope="row" className="w-32 !border-b-trait">
                          {cle}
                        </th>
                        <td>{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-6 max-w-2xl">
                  Les effectifs sont arrondis à un multiple de 5, et une année sans naissance publiée n&apos;a pas de ligne : LIAM
                  n&apos;apparaît que sur 41 des 126 années. Une zone s&apos;identifie par deux colonnes : le code <code>11</code>{" "}
                  désigne l&apos;Île-de-France au niveau région, mais l&apos;Aude au niveau département.
                </p>
              </Depliable>

              <Depliable
                id="question"
                numero="02"
                titre="La question"
                resume="Diversification des prénoms, et limites du fichier"
              >
                <p className="max-w-2xl">
                  <strong>Les prénoms se sont-ils diversifiés, et à quel rythme ?</strong> Deux indicateurs du mart{" "}
                  <code>mart_diversite_prenoms_par_annee</code> y répondent : la part des naissances portée par les dix prénoms
                  les plus donnés, et le nombre de prénoms qui couvrent la moitié des naissances. La seconde question est née de
                  l&apos;exploration : que ne dit pas le fichier ?
                </p>
              </Depliable>

              <Depliable id="modele" numero="03" titre="Le modèle de données" resume="raw, staging, marts dans DuckDB">
                <p className="max-w-2xl">
                  <strong>raw</strong> est une copie fidèle de la source, avec sa date de chargement et son empreinte ;{" "}
                  <strong>staging</strong> renomme et type sans rien filtrer ; <strong>marts</strong> contient les tables prêtes
                  pour l&apos;analyse et l&apos;export.
                </p>
                <div className="mt-6 overflow-x-auto">
                  <table className="tableau min-w-[640px]">
                    <thead>
                      <tr>
                        <th scope="col">Couche</th>
                        <th scope="col">Objet</th>
                        <th scope="col">Grain</th>
                        <th scope="col" className="num">
                          Lignes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["raw", "raw.prenoms", "table", "prénom, sexe, année, zone", 6622949],
                        ["staging", "stg_insee__prenoms", "vue", "prénom, sexe, année, zone", 6622949],
                        [
                          "marts",
                          "mart_prenoms_serie_nationale",
                          "table",
                          "prénom, sexe, année (années absentes complétées par 0)",
                          6594840,
                        ],
                        ["marts", "mart_diversite_prenoms_par_annee", "table", "année, sexe", 252],
                        ["marts", "mart_ecart_regions_france", "table", "année", 126],
                      ].map(([couche, objet, type, grain, lignes]) => (
                        <tr key={objet as string}>
                          <td className="mono text-encre-3">{couche}</td>
                          <td>
                            <span className="mono">{objet}</span> <span className="text-sm text-encre-3">{type}</span>
                          </td>
                          <td className="text-encre-2">{grain}</td>
                          <td className="num">{nombre(lignes as number)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-6 max-w-2xl">
                  Un 0 ajouté par le pipeline ne veut pas dire la même chose qu&apos;une valeur publiée : la colonne{" "}
                  <code>est_publie</code> garde la différence dans la table, pas seulement dans la documentation.
                </p>
              </Depliable>

              <Depliable id="qualite" numero="04" titre="La qualité" resume="39 tests dbt, chacun vu en échec au moins une fois">
                <p className="max-w-2xl">
                  28 tests génériques (<code>not_null</code>, <code>unique</code>, <code>accepted_values</code>), 10 tests
                  singuliers bloquants et 1 avertissement. Chaque particularité découverte pendant l&apos;exploration est devenue
                  un test singulier, et chacun a été lancé une fois sur des données volontairement faussées : un test mal écrit
                  peut passer à tous les coups.
                </p>
                <div className="mt-6 overflow-x-auto">
                  <table className="tableau min-w-[640px]">
                    <thead>
                      <tr>
                        <th scope="col">Constat d&apos;exploration</th>
                        <th scope="col">Test</th>
                        <th scope="col">Sévérité</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Tous les effectifs sont des multiples de 5, minimum 5", "assert_naissances_multiples_de_5", "bloquant"],
                        ["Aucun doublon sur prénom, sexe, année, niveau, zone", "assert_grain_unique", "bloquant"],
                        ["126 années continues depuis 1900", "assert_annees_continues_depuis_1900", "bloquant"],
                        ["Chaque zone couverte chaque année, Mayotte à partir de 2012", "assert_couverture_zones", "bloquant"],
                        ["Le code géographique correspond à son niveau", "assert_geo_code_coherent_avec_niveau", "bloquant"],
                        ["Aucune ligne ne regroupe les prénoms rares", "assert_pas_de_prenoms_regroupes", "bloquant"],
                        [
                          "Série nationale complète : 126 années par prénom et sexe",
                          "assert_serie_nationale_complete",
                          "bloquant",
                        ],
                        [
                          "Aucune naissance perdue entre staging et mart",
                          "assert_serie_nationale_conserve_les_naissances",
                          "bloquant",
                        ],
                        ["Les parts d'une année et d'un sexe somment à 1", "assert_parts_somment_a_1", "bloquant"],
                        ["Indicateurs de diversité cohérents entre eux", "assert_diversite_coherente", "bloquant"],
                        [
                          "Écart régions / France sous 15 % (mesuré : 0,7 % à 11,6 %)",
                          "assert_regions_coherentes_avec_france",
                          "avertissement",
                        ],
                      ].map(([constat, test, severite]) => (
                        <tr key={test}>
                          <td>{constat}</td>
                          <td className="mono text-encre-2">{test}</td>
                          <td className={`mono ${severite === "bloquant" ? "text-encre-3" : "text-accent"}`}>{severite}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-6 max-w-2xl">
                  Le seuil de l&apos;avertissement a été fixé après mesure : à 1 %, il se serait déclenché sur 226 des 252 couples
                  année-sexe, et un avertissement permanent n&apos;est plus lu.
                </p>
              </Depliable>

              <Depliable
                id="decisions"
                numero="05"
                titre="Les décisions techniques"
                resume="DuckDB, couches, export par initiale"
              >
                <dl className="max-w-2xl space-y-6">
                  {[
                    [
                      "DuckDB dans un fichier local",
                      "Base analytique en colonnes, sans serveur. Elle lit le Parquet directement et traite les 6,6 millions de lignes en quelques secondes.",
                    ],
                    [
                      "raw est une copie fidèle, avec _loaded_at et _source_sha256",
                      "On sait toujours quelle version du fichier a été chargée, et quand. Tout nettoyage se fait dans dbt, où il est versionné et testé.",
                    ],
                    [
                      "Staging en vue, marts en tables",
                      "Le staging ne fait que renommer et typer : une vue suffit. La série nationale (6,6 millions de lignes, fonctions de fenêtre) est matérialisée pour ne pas être recalculée à chaque lecture.",
                    ],
                    [
                      "L'export n'envoie que les lignes publiées, découpées par initiale",
                      "89 % des lignes du mart sont des zéros complétés. Le site ne charge que le fichier de l'initiale tapée et complète lui-même les zéros.",
                    ],
                    [
                      "Parts calculées sur les naissances recensées",
                      "C'est le seul dénominateur disponible dans la source. La proportion neutralise l'effet du baby-boom, qui fausse les effectifs bruts.",
                    ],
                    [
                      "Une variable dbt derniere_annee",
                      "Une nouvelle édition de l'INSEE demande de changer une seule ligne, et une édition incomplète est détectée.",
                    ],
                  ].map(([titre, texte]) => (
                    <div key={titre}>
                      <dt className="font-medium text-encre">{titre}</dt>
                      <dd className="mt-1 text-encre-2">{texte}</dd>
                    </div>
                  ))}
                </dl>
              </Depliable>

              <Depliable
                id="ameliorations"
                numero="06"
                titre="Ce que j'améliorerais"
                resume="Un vrai dénominateur, une hypothèse à vérifier"
              >
                <ul className="max-w-2xl list-none space-y-4">
                  <li>
                    <strong>Un vrai dénominateur.</strong> Ajouter les naissances annuelles de l&apos;INSEE comme seconde source,
                    pour calculer les parts sur le nombre réel de naissances.
                  </li>
                  <li>
                    <strong>Vérifier une hypothèse.</strong> La part des naissances absentes du fichier augmente-t-elle avec la
                    diversification des prénoms ? Il faut refaire le calcul de 2020 sur 1950, 1980 et 2000.
                  </li>
                  <li>
                    <strong>Documenter les dépendances.</strong> Publier le graphe de <code>dbt docs</code> et ajouter un
                    référentiel des régions et départements (seed dbt).
                  </li>
                  <li>
                    <strong>Lire avec prudence avant 1946</strong> : l&apos;INSEE ne garantit pas l&apos;exhaustivité des données
                    antérieures, et le périmètre change en 2012 avec l&apos;entrée de Mayotte.
                  </li>
                </ul>
              </Depliable>
            </div>

            <a href={DEPOT} className="ui mt-12 inline-flex items-center gap-2 !text-encre hover:!text-accent" rel="noopener">
              <Logo nom="GitHub" className="size-4" />
              Tout le détail sur GitHub ↗
            </a>
          </section>
        </Conteneur>
      </article>
    </Espace>
  );
}
