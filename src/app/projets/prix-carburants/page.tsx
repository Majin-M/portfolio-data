import type { Metadata } from "next";
import { Conteneur } from "@/components/conteneur";
import { BlocCode, Chapitre, Depliable, Figure, GrandsChiffres, Mesures, Ouverture, Statut } from "@/components/edition";
import { Espace } from "@/components/espace";
import { Logo } from "@/components/logos";
import { Barres } from "@/components/graphiques/barres";
import { CartePrix } from "@/components/graphiques/carte-prix";
import { Revele } from "@/components/mouvement";
import { RechercheStation } from "@/components/recherche-station";
import {
  DEPOT,
  DONNEES_PUBLIEES,
  E85_HAUT,
  LOT_NUIT,
  MESURE_LE,
  PIPELINE,
  SEUILS_SUSPECTS,
  TESTS_EN_ECHEC,
} from "@/contenu/prix-carburants";
import { JOURS_PRIX_RECENT, euros, jourDonnees } from "@/lib/carburant-commun";
import { lireMetadataCarburant, lireStationsCarburant, medianesParCarburant, testsCarburant } from "@/lib/carburant";
import { date, decimal, nombre, pourcent } from "@/lib/format";

export const metadata: Metadata = {
  title: "Prix des carburants",
  description:
    "Les prix de toutes les stations de France, chaque matin : un pipeline qui historise les changements de prix et une recherche de la station la moins chère autour de soi.",
};

const CARBURANT_INITIAL = 1;
const RAYON_INITIAL = 10;

export default function PagePrixCarburants() {
  const meta = lireMetadataCarburant();
  const stations = lireStationsCarburant();
  const medianes = medianesParCarburant(stations);
  const tests = testsCarburant(meta);
  const jour = jourDonnees(meta.reference_at);
  const mesureLe = date(MESURE_LE);

  // Prix repère de la carte : le prix médian du gazole, arrondi aux 10 centimes (voir CartePrix).
  const repereCarte = Math.round(medianes.find((m) => m.carburantId === CARBURANT_INITIAL)!.mediane * 10) / 10;

  const maxE85 = Math.max(...E85_HAUT.map((t) => t.releves));

  return (
    <Espace>
      <article>
        <Ouverture
          identifiant="Projet 04 · Ingestion quotidienne"
          source="prix-carburants.gouv.fr · Licence Ouverte"
          titre="Prix des carburants"
          periode={`${nombre(meta.volumes.stations)} stations · historique depuis 2025`}
          disposition="dessous"
          phrase={
            <p>
              Trouvez la station la moins chère autour de vous. Les prix de toutes les stations de France, relevés chaque matin
              par un pipeline qui garde chaque changement de prix.
            </p>
          }
          statut={
            <Statut>
              Prix du {jour} · {tests} tests dbt · mis à jour chaque matin
            </Statut>
          }
          liens={[
            { label: "Dépôt GitHub", href: DEPOT },
            { label: "Données publiées", href: DONNEES_PUBLIEES },
          ]}
        />

        <Conteneur>
          {/* L'outil d'abord : la question, puis la réponse */}
          <section id="recherche" className="scroll-mt-6 pb-24" aria-label="Trouver la station la moins chère">
            <RechercheStation
              carburantInitial={CARBURANT_INITIAL}
              rayonInitial={RAYON_INITIAL}
              referenceInitiale={meta.reference_at}
              exemples={["Lyon", "Bordeaux", "Rennes", "67000", "Ajaccio"]}
            />
          </section>

          {/* La France des prix */}
          <section className="border-t border-trait py-24">
            <div className="grid gap-14 xl:grid-cols-12">
              <figure className="min-w-0 xl:col-span-8">
                <p className="label mb-4">Prix du gazole, station par station, le {jour}</p>
                <CartePrix stations={stations} carburantId={CARBURANT_INITIAL} />
                <figcaption className="mt-4 max-w-2xl text-sm leading-relaxed text-encre-3">
                  Chaque station est à ses coordonnées : la France n&apos;est dessinée par rien d&apos;autre. Prix du gazole de{" "}
                  {JOURS_PRIX_RECENT} jours ou moins ; les stations sans prix récent restent en gris. Un pic est d&apos;autant
                  plus haut que le litre dépasse {euros(repereCarte, 2)}, le prix médian arrondi. Cliquez sur la carte pour
                  chercher autour d&apos;un point.
                </figcaption>
              </figure>
              <Revele className="xl:col-span-4">
                <p className="label mb-6">Prix médian au litre, le {jour}</p>
                <Barres
                  barres={medianes.map((m) => ({ label: m.nom, part: m.mediane, detail: `${nombre(m.stations)} stations` }))}
                  description={`Prix médian au litre par carburant, le ${jour}`}
                  max={2.5}
                  formater={(v) => euros(v, 2)}
                />
              </Revele>
            </div>
          </section>

          {/* L'histoire */}
          <section className="border-t border-trait py-24">
            <Chapitre numero="L'histoire · 1" titre="Un relevé n'est pas un changement">
              <p>
                Le fichier officiel note le prix de chaque station plusieurs fois par jour, souvent sans qu&apos;il ait bougé.
                Pour garder l&apos;historique des vrais changements, il faut d&apos;abord écarter les répétitions.
              </p>
            </Chapitre>
            <Revele className="mt-14">
              <GrandsChiffres
                separateur="→"
                chiffres={[
                  { valeur: PIPELINE.releves, legende: "relevés, 2025-2026" },
                  { valeur: PIPELINE.changements, legende: "vrais changements de prix" },
                ]}
              />
            </Revele>
            <div className="mt-12 grid gap-10 lg:grid-cols-2">
              <p className="max-w-xl text-xl leading-snug text-encre-2">
                {pourcent(PIPELINE.partRepetes, 0)} des relevés répètent le prix précédent de la même station pour le même
                carburant. Parmi les changements restants, {nombre(PIPELINE.hausses)} hausses et {nombre(PIPELINE.baisses)}{" "}
                baisses, pour une variation médiane de {decimal(PIPELINE.variationMediane * 100, 1)} centime.
              </p>
              <BlocCode
                titre="mart_changements_prix.sql (extrait)"
                code={`select *
from {{ ref('stg_roulez_eco__prix') }}
qualify prix_litre is distinct from lag(prix_litre) over (
    partition by station_id, carburant_id
    order by maj_at
)`}
              />
            </div>
          </section>

          <section className="border-t border-trait py-24">
            <Chapitre numero="L'histoire · 2" titre="Quelle heure est-il dans le fichier ?">
              <p>
                Les relevés sont datés sans fuseau horaire. Heure de Paris ou UTC ? La réponse change l&apos;ordre des relevés à
                chaque changement d&apos;heure, et l&apos;âge des prix affichés.
              </p>
            </Chapitre>
            <div className="mt-14 grid gap-14 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <p className="max-w-xl text-xl leading-snug text-encre-2">
                  Compter les relevés entre 2 h et 3 h la nuit du passage à l&apos;heure d&apos;été ne prouve rien : même un
                  dimanche ordinaire n&apos;en compte aucun. La preuve vient d&apos;un traitement automatique qui tourne chaque
                  nuit à 01:17, heure de Paris, toute l&apos;année. Le lendemain de chaque changement d&apos;heure, il se décale
                  une seule fois d&apos;une heure, dans le sens attendu.
                </p>
              </div>
              <div className="lg:col-span-7">
              <Figure
                numero="01"
                titre="Le lot de 01:17 autour des changements d'heure 2025"
                source="raw.prix · relevés par tranche horaire"
                legende="Relevés entre 01:10 et 01:25, et entre 02:10 et 02:25. Le 27 octobre, le lot a tourné à 00:17."
              >
                <div className="overflow-x-auto">
                  <table className="tableau min-w-[480px]">
                    <thead>
                      <tr>
                        <th scope="col">Nuit</th>
                        <th scope="col" className="num">
                          01:10-01:25
                        </th>
                        <th scope="col" className="num">
                          02:10-02:25
                        </th>
                        <th scope="col">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {LOT_NUIT.map((n) => (
                        <tr key={n.jour}>
                          <td className="mono">{date(n.jour)}</td>
                          <td className="num">{nombre(n.h01)}</td>
                          <td className="num">{nombre(n.h02)}</td>
                          <td className="text-encre-2">{n.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Figure>
              </div>
            </div>
            <p className="mt-12 max-w-2xl text-encre-2">
              Les relevés sont donc lus en heure de Paris et stockés avec leur fuseau. La relecture du projet a trouvé un
              deuxième piège : compté sur une machine en UTC, comme les serveurs de GitHub Actions,{" "}
              {nombre(PIPELINE.prixActuelsAgeChangeEnUtc)} prix actuels auraient changé d&apos;âge. Les jours sont désormais
              comptés explicitement à l&apos;heure de Paris.
            </p>
          </section>

          <section className="border-t border-trait py-24">
            <Chapitre numero="L'histoire · 3" titre="Des prix d'essence dans la case E85">
              <p>
                L&apos;E85 coûte environ 0,85 € le litre. Pourtant, quelques stations y affichent des prix de 1,60 à 2,30 € : le
                prix de l&apos;essence, saisi dans la mauvaise case.
              </p>
            </Chapitre>
            <div className="mt-14 grid gap-14 lg:grid-cols-2">
              <Figure
                numero="02"
                titre="Relevés d'E85 au-dessus de 1,20 €"
                source="stg_roulez_eco__prix · 2025-2026"
                legende={`Un creux net à 1,50 € sépare les deux groupes : au-delà, le prix est marqué suspect. Même règle pour le GPLc au-delà de ${euros(SEUILS_SUSPECTS.gplc, 2)}.`}
              >
                <Barres
                  barres={E85_HAUT.map((t) => ({ label: `${t.tranche} €`, part: t.releves }))}
                  description="Nombre de relevés d'E85 par tranche de prix au-dessus de 1,20 €"
                  max={maxE85}
                  couleur="var(--encre-2)"
                  formater={(v) => nombre(v)}
                />
              </Figure>
              <div>
                <GrandsChiffres chiffres={[{ valeur: meta.volumes.prix_suspects, legende: "prix actuels marqués suspects" }]} />
                <p className="mt-8 max-w-xl text-xl leading-snug text-encre-2">
                  Ils ne sont pas supprimés : l&apos;information reste dans les données. Mais la recherche ne les classe jamais,
                  pour ne pas désigner comme la moins chère une station sur la foi d&apos;une erreur de saisie.
                </p>
              </div>
            </div>
          </section>

          {/* Sous le capot */}
          <section className="border-t border-trait-fort py-24">
            <Chapitre numero="Sous le capot" titre="Le pipeline">
              <p>
                Chaque matin à 5 h UTC, GitHub Actions télécharge le fichier de l&apos;année, reconstruit les couches, lance les
                tests et ne publie les prix que si tous réussissent.
              </p>
            </Chapitre>
            <ol className="mt-12 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              {[
                ["Source", "ZIP annuel, XML", `${decimal(PIPELINE.zipMo, 1)} Mo, ${nombre(PIPELINE.xmlMo)} Mo décompressé, ISO-8859-1`],
                ["Ingestion", "ingest.py", "Content-Type contrôlé, empreinte sha256, lecture en flux (iterparse)"],
                ["Raw", "Parquet par année", `${decimal(PIPELINE.parquetMo, 1)} Mo pour 2026, vues DuckDB`],
                ["Staging", "dbt, vues", "typage, heure de Paris, balises vides et conflits écartés"],
                ["Marts", "dbt, tables", `changements, stations, prix actuels · ${tests} tests`],
                ["Publication", "GitHub Pages", "prix_actuels.json, lu par cette page à chaque visite"],
              ].map(([etape, objet, detail], i) => (
                <Revele as="li" key={etape} delai={i * 120} className="border border-trait-fort bg-fond-2 p-4">
                  <p className="label">
                    {String(i + 1).padStart(2, "0")} · {etape}
                  </p>
                  <p className="mt-2 font-donnees text-sm text-encre">{objet}</p>
                  <p className="mt-2 text-sm leading-snug text-encre-2">{detail}</p>
                </Revele>
              ))}
            </ol>

            <div className="mt-12">
              <Mesures
                items={[
                  { label: "Relevés chargés", valeur: PIPELINE.releves, detail: "fichiers 2025 et 2026" },
                  { label: "Changements de prix", valeur: meta.volumes.changements_de_prix },
                  { label: "Stations avec prix", valeur: meta.volumes.stations },
                  { label: "Tests dbt", valeur: tests, detail: "à chaque exécution" },
                ]}
                source={`Dernière exécution : données du ${jour}. Relevés mesurés le ${mesureLe}.`}
              />
            </div>

            <div className="mt-20">
              <Depliable id="source" numero="01" titre="La source" resume="Un fichier par année, piégé de plusieurs façons">
                <p className="max-w-2xl">
                  Le site officiel publie un fichier XML par année, qui contient chaque relevé depuis le 1er janvier, et un flux
                  quotidien. Le flux quotidien n&apos;est qu&apos;une photo : un seul prix par station et par carburant. Seul le
                  fichier annuel garde l&apos;historique, et il sert à la fois à la reprise du passé et au chargement du matin.
                </p>
                <ul className="mt-6 max-w-2xl list-none space-y-4">
                  <li>
                    <strong>Un faux succès.</strong> Pour une date indisponible, le serveur répond HTTP 200 avec une page HTML.
                    Seul le <code className="code-inline">Content-Type</code> dit si l&apos;on a reçu des données.
                  </li>
                  <li>
                    <strong>Un encodage ancien.</strong> Le XML est en ISO-8859-1 ; lu comme de l&apos;UTF-8, il casse les
                    accents des adresses.
                  </li>
                  <li>
                    <strong>Des stations sans prix.</strong> Sur {nombre(PIPELINE.stationsFichier2026)} stations du fichier 2026,{" "}
                    {nombre(PIPELINE.stationsAvecPrix2026)} ont publié au moins un prix. Les autres ont des coordonnées parfois
                    fausses (à 0, latitude et longitude inversées) et sont écartées.
                  </li>
                  <li>
                    <strong>Pas de nom ni d&apos;enseigne.</strong> Une station n&apos;est connue que par son adresse et sa ville,
                    écrites tantôt en majuscules, tantôt non.
                  </li>
                </ul>
              </Depliable>

              <Depliable
                id="qualite"
                numero="02"
                titre="La qualité"
                resume={`${tests} tests, chacun vu en échec sur un défaut injecté`}
              >
                <p className="max-w-2xl">
                  Chaque constat d&apos;exploration devient un test dbt, relancé à chaque exécution. Un test mal écrit pouvant
                  passer à tous les coups, un script injecte pour chacun des {PIPELINE.testsSinguliers} tests singuliers un
                  défaut précis, dans les données ou dans le code, et vérifie qu&apos;il est détecté. Quelques exemples :
                </p>
                <div className="mt-6 overflow-x-auto">
                  <table className="tableau min-w-[560px] max-w-3xl">
                    <thead>
                      <tr>
                        <th scope="col">Test</th>
                        <th scope="col">Défaut injecté</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TESTS_EN_ECHEC.map(([test, defaut]) => (
                        <tr key={test}>
                          <td className="mono">{test}</td>
                          <td className="text-encre-2">{defaut}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-6 max-w-2xl">
                  La première exécution a trouvé un test inopérant : un prix en millièmes, le format des anciens fichiers, faisait
                  planter la conversion avant que le test de plage ne s&apos;exécute. Le type du prix a été élargi pour que ce
                  soit le test qui signale le défaut.
                </p>
              </Depliable>

              <Depliable id="decisions" numero="03" titre="Les décisions techniques" resume="Sans état, dans le navigateur, traçable">
                <dl className="max-w-2xl space-y-6">
                  {[
                    [
                      "Réécrire l'année en cours chaque matin",
                      "Plutôt qu'un chargement incrémental, qui perdrait un relevé publié en retard. Environ une minute.",
                    ],
                    [
                      "Une couche raw fidèle, en texte",
                      "Aucune conversion à l'ingestion : une valeur mal formée ne devient jamais un NULL silencieux. Le typage se fait dans dbt, versionné et testé.",
                    ],
                    [
                      "Un pipeline sans état",
                      "Le serveur de GitHub Actions repart de zéro à chaque fois et reconstruit l'historique depuis la source officielle. Le ZIP de chaque semaine est archivé dans une release GitHub.",
                    ],
                    [
                      "Les prix servis par GitHub Pages",
                      "Cette page lit prix_actuels.json à chaque visite : elle affiche les prix du matin sans être reconstruite. Si le fichier ne répond pas, elle se rabat sur la copie faite à son build.",
                    ],
                    [
                      "La position reste dans le navigateur",
                      "Les distances sont calculées sur votre appareil, et la ville se retrouve parmi les stations elles-mêmes : aucun service de géolocalisation tiers.",
                    ],
                  ].map(([titre, texte]) => (
                    <div key={titre}>
                      <dt className="font-medium text-encre">{titre}</dt>
                      <dd className="mt-1 text-encre-2">{texte}</dd>
                    </div>
                  ))}
                </dl>
              </Depliable>

              <Depliable id="limites" numero="04" titre="Les limites" resume="Ce que les données ne disent pas">
                <ul className="max-w-2xl list-none space-y-4">
                  <li>
                    <strong>Des prix parfois anciens.</strong> Le dernier prix d&apos;une station peut dater de plusieurs semaines :
                    au-delà de 7 jours, il n&apos;est classé que sur demande, et affiché grisé.
                  </li>
                  <li>
                    <strong>Les ruptures de stock ne sont pas chargées.</strong> Un carburant en rupture garde son dernier prix.
                  </li>
                  <li>
                    <strong>Des distances à vol d&apos;oiseau</strong>, pas des temps de trajet.
                  </li>
                  <li>
                    <strong>Des adresses déclarées par les stations.</strong> Une ville ou un code postal se retrouve parmi les
                    stations qui les déclarent, parfois à tort : la seule station du 13001 est en réalité dans le 11e
                    arrondissement de Marseille. Les coordonnées, elles, sont justes, et les distances en dépendent seules.
                  </li>
                  <li>
                    <strong>La métropole et la Corse seulement.</strong> Aucune station d&apos;outre-mer n&apos;a publié de prix
                    dans les fichiers.
                  </li>
                  <li>
                    <strong>Des seuils de prix suspects heuristiques</strong>, tirés de la distribution des prix, pas d&apos;une
                    règle officielle.
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
