import type { Metadata } from "next";
import { Conteneur } from "@/components/conteneur";
import { Chapitre, Depliable, Figure, GrandsChiffres, Mesures, Ouverture, Statut } from "@/components/edition";
import { Espace } from "@/components/espace";
import { Logo } from "@/components/logos";
import { Barres } from "@/components/graphiques/barres";
import { Ecarts } from "@/components/graphiques/ecarts";
import { Revele } from "@/components/mouvement";
import {
  ANOMALIES,
  CORRECTIONS,
  DEPOT,
  DONNEES,
  GENRE_CASES,
  GENRE_PAR_EDUCATION,
  GENRE_PAR_PAYS,
  INDEPENDANTS_ADDITIONNES,
  MESURE_LE,
  MODELE,
  MODELE_AVEC_ID,
  PAR_EDUCATION,
  PAR_EMPLOI_PAYS,
  PAR_GENRE,
  PAR_PAYS,
  TELEPHONE,
  TELEPHONE_PAR_PAYS,
} from "@/contenu/inclusion-financiere";
import { date, decimal, nombre, pourcent } from "@/lib/format";

export const metadata: Metadata = {
  title: "Inclusion financière",
  description:
    "Qui possède un compte bancaire en Afrique de l'Est ? Analyse exploratoire, nettoyage et modèle de prédiction sur 23 524 réponses aux enquêtes FinScope.",
};

const mesureLe = date(MESURE_LE);

const KENYA = 0;
const TANZANIE = 2;
const ligneEmploi = (label: string) => PAR_EMPLOI_PAYS.find((l) => l.label === label)!;
const PUBLIC = ligneEmploi("Salarié du public");
const INFORMEL = ligneEmploi("Emploi informel");
const INDEPENDANT = ligneEmploi("Indépendant");

const FEMMES = { label: "Femmes", couleur: "var(--serie-f)" };
const HOMMES = { label: "Hommes", couleur: "var(--serie-m)" };
const SANS_TELEPHONE = { label: "Sans téléphone", couleur: "var(--serie-neutre)" };
const AVEC_TELEPHONE = { label: "Avec téléphone", couleur: "var(--accent)" };
const ecartsGenrePays = GENRE_PAR_PAYS.map((p) => `${p.label} ${pourcent(p.femmes, 0)} contre ${pourcent(p.hommes, 0)}`);

export default function PageInclusionFinanciere() {
  return (
    <Espace>
      <article>
        <Ouverture
          identifiant="Projet 03 · Analyse et machine learning"
          source="Enquêtes FinScope · Afrique de l'Est"
          titre="Inclusion financière"
          periode="Kenya · Rwanda · Tanzanie · Ouganda · 2016-2018"
          phrase={
            <p>
              {nombre(DONNEES.reponses)} réponses à une enquête. Une question : qui possède un compte bancaire, et peut-on le
              prédire ?
            </p>
          }
          statut={
            <Statut>
              Mesuré le {mesureLe} · Random Forest · AUC {decimal(MODELE.auc, 2)}
            </Statut>
          }
          liens={[{ label: "Dépôt GitHub", href: DEPOT }]}
          visuel={
            <div>
              <p className="label mb-6">Part des répondants qui ont un compte bancaire</p>
              <Barres
                barres={PAR_PAYS.map((p) => ({ label: p.label, part: p.part, detail: `${nombre(p.effectif)} répondants · ${p.annee}` }))}
                description="Part des répondants ayant un compte bancaire, par pays"
                max={0.3}
              />
              <div className="mt-10">
                <GrandsChiffres
                  chiffres={[{ valeur: DONNEES.tauxCompte, format: "pourcent", legende: "des répondants, tous pays confondus" }]}
                />
              </div>
            </div>
          }
          legendeVisuel={`Chaque pays n'a été enquêté qu'une année : l'écart entre deux pays est aussi un écart entre deux années, et rien ne permet de les séparer. Réponses dont la possession d'un compte est connue : ${nombre(DONNEES.lignesCibleConnue)} sur ${nombre(DONNEES.lignesNettoyees)} après nettoyage.`}
        />

        <Conteneur>
          {/* L'histoire */}
          <section className="border-t border-trait py-24">
            <Chapitre numero="L'histoire · 1" titre="L'emploi et l'éducation d'abord">
              <p>
                Dans chaque pays, avoir un compte dépend surtout de la situation de la personne. Mais les pays ne se comparent
                pas terme à terme : les types d&apos;emploi n&apos;y sont pas codés de la même façon.
              </p>
            </Chapitre>
            <div className="mt-14">
              <Figure
                numero="01"
                titre="Par type d'emploi, pays par pays"
                source="financial_inclusion_clean.csv"
                legende="Part des répondants qui ont un compte, et sous elle le nombre de répondants. Un tiret : la catégorie n'existe pas dans le fichier de ce pays. Ne figurent pas les personnes qui vivent d'aides publiques (7 à 91 répondants selon le pays), ni les réponses « ne sait pas » ou inconnues."
              >
                <div className="overflow-x-auto">
                  <table className="tableau min-w-[640px]" aria-label="Part des répondants ayant un compte bancaire, par type d'emploi et par pays">
                    <thead>
                      <tr>
                        <th scope="col">Type d&apos;emploi</th>
                        {PAR_PAYS.map((p) => (
                          <th key={p.label} scope="col" className="num">
                            {p.label} · {p.annee}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PAR_EMPLOI_PAYS.map((l) => (
                        <tr key={l.label}>
                          <th scope="row" className="!font-texte !text-sm !normal-case !tracking-normal text-encre-2">
                            {l.label}
                          </th>
                          {l.parts.map((part, i) => (
                            <td key={PAR_PAYS[i].label} className="num">
                              {part === null ? (
                                <span className="text-encre-3">—</span>
                              ) : (
                                <>
                                  <span className="text-encre">{pourcent(part, 0)}</span>
                                  <span className="ml-auto mt-1 block h-1 bg-fond-2" aria-hidden="true">
                                    <span className="block h-full bg-accent" style={{ width: `${part * 100}%` }} />
                                  </span>
                                  <span className="mt-1 block text-xs text-encre-3">{nombre(l.effectifs[i]!)}</span>
                                </>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Figure>
            </div>
            <p className="mt-10 max-w-2xl text-encre-2">
              Au Kenya, {pourcent(PUBLIC.parts[KENYA]!, 0)} des salariés du public ont un compte, contre{" "}
              {pourcent(INFORMEL.parts[KENYA]!, 0)} des personnes en emploi informel. Additionner les pays brouillerait la
              lecture : tous pays confondus, {pourcent(INDEPENDANTS_ADDITIONNES.part, 0)} des indépendants ont un compte, mais
              ils sont {pourcent(INDEPENDANT.parts[KENYA]!, 0)} au Kenya et {pourcent(INDEPENDANT.parts[TANZANIE]!, 0)} en
              Tanzanie, qui fournit à elle seule {pourcent(INDEPENDANTS_ADDITIONNES.partTanzanie, 0)} des indépendants. La
              catégorie « salarié du public » n&apos;existe qu&apos;au Kenya et au Rwanda, les deux pays où
              les comptes sont les plus fréquents ; « sans revenu », qu&apos;en Tanzanie et en Ouganda.
            </p>
            <div className="mt-14 max-w-3xl">
              <Figure
                numero="02"
                titre="Par niveau d'éducation, tous pays confondus"
                source="financial_inclusion_clean.csv"
                legende="Les cinq niveaux existent dans les quatre pays."
              >
                <Barres
                  barres={PAR_EDUCATION}
                  description="Part des répondants ayant un compte bancaire, par niveau d'éducation"
                  max={1}
                />
              </Figure>
            </div>
            <p className="mt-10 max-w-2xl text-encre-2">
              Sans instruction, la part tombe à {pourcent(PAR_EDUCATION[4].part)}.
            </p>
          </section>

          <section className="border-t border-trait py-24">
            <Chapitre numero="L'histoire · 2" titre="L'écart que rien ne comble">
              <p>
                Les femmes ont bien moins souvent un compte que les hommes. Ni le diplôme ni le téléphone ne font disparaître
                l&apos;écart.
              </p>
            </Chapitre>
            <Revele className="mt-14">
              <GrandsChiffres
                separateur="vs"
                chiffres={[
                  { valeur: PAR_GENRE.femmes, format: "pourcent", legende: "des femmes ont un compte" },
                  { valeur: PAR_GENRE.hommes, format: "pourcent", legende: "des hommes" },
                ]}
              />
            </Revele>
            <div className="mt-16 max-w-3xl">
              <Figure
                numero="03"
                titre="À diplôme égal, les femmes restent en dessous"
                source="financial_inclusion_clean.csv"
                legende={`Tous pays confondus. Sous chaque niveau, le nombre de femmes et d'hommes. Le supérieur passe sous la formation professionnelle à cause de la Tanzanie, où un tiers seulement de ses diplômés ont un compte, contre environ trois quarts dans les autres pays.`}
              >
                <Ecarts
                  groupes={[FEMMES, HOMMES]}
                  lignes={GENRE_PAR_EDUCATION.map((e) => ({
                    label: e.label,
                    a: e.femmes,
                    b: e.hommes,
                    detail: `${nombre(e.effectifFemmes)} f. · ${nombre(e.effectifHommes)} h.`,
                  }))}
                  description="Part des femmes et des hommes ayant un compte bancaire, par niveau d'éducation"
                  max={0.7}
                />
              </Figure>
            </div>
            <p className="mt-10 max-w-2xl text-encre-2">
              L&apos;écart tient dans chaque pays : {ecartsGenrePays.join(", ")}. Il tient aussi quand on croise pays et niveau
              d&apos;éducation : dans les {GENRE_CASES.femmesEnDessous} cases sur {GENRE_CASES.cases} qui comptent au moins{" "}
              {GENRE_CASES.seuil} femmes et {GENRE_CASES.seuil} hommes, les femmes ont moins souvent un compte.
            </p>

            <div className="mt-20 max-w-3xl">
              <Figure
                numero="04"
                titre="Sans téléphone, presque personne n'a de compte"
                source="financial_inclusion_clean.csv"
                legende="Part des répondants qui ont un compte, selon qu'ils ont accès ou non à un téléphone. Sous chaque pays, le nombre de répondants sans téléphone."
              >
                <Ecarts
                  groupes={[SANS_TELEPHONE, AVEC_TELEPHONE]}
                  lignes={TELEPHONE_PAR_PAYS.map((p) => ({
                    label: p.label,
                    a: p.sans,
                    b: p.avec,
                    detail: `${nombre(p.effectifSans)} sans téléphone`,
                  }))}
                  description="Part des répondants ayant un compte bancaire, sans et avec accès à un téléphone, par pays"
                  max={0.35}
                />
              </Figure>
            </div>
            <p className="mt-10 max-w-2xl text-encre-2">
              Sur {nombre(TELEPHONE.effectifSans)} personnes sans téléphone, {nombre(TELEPHONE.sansAvecCompte)} ont un compte (
              {pourcent(TELEPHONE.sans)}), contre {pourcent(TELEPHONE.avec)} de celles qui en ont un. Les femmes ont moins
              souvent accès à un téléphone ({pourcent(TELEPHONE.accesFemmes, 0)} contre {pourcent(TELEPHONE.accesHommes, 0)}), mais
              cela n&apos;explique pas tout : parmi les personnes qui en ont un, {pourcent(TELEPHONE.femmesAvecTelephone)} des
              femmes ont un compte, contre {pourcent(TELEPHONE.hommesAvecTelephone)} des hommes.
            </p>
            <p className="mt-6 max-w-2xl text-sm text-encre-3">
              Ce sont des écarts observés, pas des causes : le téléphone peut aider à ouvrir un compte comme accompagner un
              revenu qui le permet.
            </p>
          </section>

          <section className="border-t border-trait py-24">
            <Chapitre numero="L'histoire · 3" titre="Le piège de la précision">
              <p>
                Le modèle du dépôt a été entraîné sur toutes les données, sans mesure de performance. Évalué ici sur un jeu de
                test mis de côté, il a l&apos;air excellent. Il ne l&apos;est pas.
              </p>
            </Chapitre>
            <Revele className="mt-14">
              <GrandsChiffres
                separateur="vs"
                chiffres={[
                  { valeur: MODELE.precision, format: "pourcent", legende: "de bonnes réponses du modèle" },
                  { valeur: MODELE.base, format: "pourcent", legende: "en répondant toujours « pas de compte »" },
                ]}
              />
            </Revele>
            <p className="mt-10 max-w-2xl text-xl leading-snug text-encre-2">
              Seuls {pourcent(DONNEES.tauxCompte)} des répondants ont un compte : un modèle qui ne prédit jamais « oui » a déjà
              raison {pourcent(MODELE.base)} du temps. Le bon indicateur est le rappel : parmi les personnes qui ont un compte, le
              modèle n&apos;en retrouve que {pourcent(MODELE.rappel)}.
            </p>
            <div className="mt-12">
              <Mesures
                items={[
                  { label: "Précision globale", valeur: MODELE.precision, format: "pourcent" },
                  {
                    label: "Rappel sur « oui »",
                    valeur: MODELE.rappel,
                    format: "pourcent",
                    detail: "personnes avec compte retrouvées",
                  },
                  { label: "Précision sur « oui »", valeur: MODELE.precisionOui, format: "pourcent" },
                  { label: "AUC", valeur: MODELE.auc, format: "decimal", decimales: 3 },
                ]}
                source={`Jeu de test stratifié de ${nombre(MODELE.test)} réponses (${nombre(MODELE.testOui)} avec compte), mesuré le ${mesureLe}.`}
              />
            </div>
          </section>

          <section className="border-t border-trait py-24">
            <Chapitre numero="L'histoire · 4" titre="L'identifiant qui gonflait le score">
              <p>
                Dans la première version, la colonne <code className="code-inline">uniqueid</code> était encodée comme une
                variable : le modèle apprenait à partir d&apos;identifiants de répondants, qui ne disent rien d&apos;une personne.
                Elle est maintenant exclue.
              </p>
            </Chapitre>
            <Revele className="mt-14">
              <GrandsChiffres
                separateur="→"
                chiffres={[
                  { valeur: MODELE_AVEC_ID.variables, legende: "variables avec l'identifiant" },
                  { valeur: MODELE.variables, legende: "variables sans lui" },
                ]}
              />
            </Revele>
            <div className="mt-12 overflow-x-auto">
              <table className="tableau min-w-[560px] max-w-3xl">
                <thead>
                  <tr>
                    <th scope="col">Modèle</th>
                    <th scope="col" className="num">
                      Variables
                    </th>
                    <th scope="col" className="num">
                      Rappel « oui »
                    </th>
                    <th scope="col" className="num">
                      Précision « oui »
                    </th>
                    <th scope="col" className="num">
                      AUC
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Première version, avec l&apos;identifiant</td>
                    <td className="num">{nombre(MODELE_AVEC_ID.variables)}</td>
                    <td className="num">{pourcent(MODELE_AVEC_ID.rappel)}</td>
                    <td className="num">{pourcent(MODELE_AVEC_ID.precisionOui)}</td>
                    <td className="num">{decimal(MODELE_AVEC_ID.auc, 3)}</td>
                  </tr>
                  <tr>
                    <td>Version actuelle, sans l&apos;identifiant</td>
                    <td className="num">{nombre(MODELE.variables)}</td>
                    <td className="num">{pourcent(MODELE.rappel)}</td>
                    <td className="num">{pourcent(MODELE.precisionOui)}</td>
                    <td className="num">{decimal(MODELE.auc, 3)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-8 max-w-2xl text-encre-2">
              Sans l&apos;identifiant, l&apos;AUC passe de {decimal(MODELE_AVEC_ID.auc, 2)} à {decimal(MODELE.auc, 2)} : une
              partie du score venait d&apos;un signal que le modèle n&apos;aurait pas dû avoir. Il retrouve en revanche davantage
              de personnes avec un compte. Mêmes données nettoyées, même jeu de test, mêmes paramètres.
            </p>
          </section>

          {/* Sous le capot */}
          <section className="border-t border-trait-fort py-24">
            <Chapitre numero="Sous le capot" titre="Le pipeline">
              <p>
                Un CSV brut, une analyse exploratoire dans un notebook, un CSV nettoyé, puis un modèle entraîné au démarrage
                d&apos;une application Streamlit.
              </p>
            </Chapitre>
            <ol className="mt-12 grid gap-3 md:grid-cols-5">
              {[
                ["Source", "CSV FinScope", `${nombre(DONNEES.reponses)} réponses, ${DONNEES.colonnes} colonnes`],
                ["Exploration", "notebooks/EDA.ipynb", "profilage, manquants, doublons, distributions"],
                [
                  "Nettoyage",
                  "CSV nettoyé",
                  `${DONNEES.manquantsTraites} valeurs manquantes remplacées, ${DONNEES.horsPeriodeRetirees} lignes hors période retirées`,
                ],
                ["Modèle", "src/model.py", `Random Forest, ${MODELE.arbres} arbres, ${MODELE.variables} variables`],
                ["Usage", "app.py", "formulaire Streamlit, probabilité en temps réel"],
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

            <div className="mt-20">
              <Depliable
                id="architecture"
                numero="01"
                titre="Architecture et flux de données"
                resume="Les schémas du dépôt, de la source à l'application"
              >
                <div className="space-y-8">
                  {[
                    ["architecture", "Architecture : source FinScope, couches brute, nettoyée et modèle, application Streamlit"],
                    ["flux_de_donnees", "Flux de données : du CSV brut à la probabilité affichée dans le formulaire"],
                  ].map(([fichier, description]) => (
                    <figure key={fichier}>
                      <a
                        href={`/projets/inclusion-financiere/${fichier}.png`}
                        className="block overflow-hidden rounded-sm bg-white p-3 hover:outline hover:outline-accent"
                        rel="noopener"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- export statique, image locale */}
                        <img
                          src={`/projets/inclusion-financiere/${fichier}.png`}
                          alt={description}
                          className="h-auto w-full"
                          loading="lazy"
                        />
                      </a>
                      <figcaption className="mt-2 text-sm text-encre-3">{description}. Cliquez pour agrandir.</figcaption>
                    </figure>
                  ))}
                </div>
              </Depliable>

              <Depliable id="dataset" numero="02" titre="Le dataset" resume="Enquêtes FinScope, quatre pays, 2016 à 2018">
                <p className="max-w-2xl">
                  Réponses aux enquêtes <strong>FinScope</strong> menées au Kenya, au Rwanda, en Tanzanie et en Ouganda : pays,
                  année (une seule par pays), type de localisation, accès au téléphone, taille du foyer, âge (moyenne de {decimal(DONNEES.ageMoyen, 1)}{" "}
                  ans), genre, relation avec le chef du foyer, situation matrimoniale, niveau d&apos;éducation, type
                  d&apos;emploi, et la cible : la possession d&apos;un compte bancaire.
                </p>
              </Depliable>

              <Depliable
                id="qualite"
                numero="03"
                titre="La qualité"
                resume={`${CORRECTIONS.length} défauts corrigés, ${ANOMALIES.length} points restants`}
              >
                <p className="max-w-2xl">
                  Le nettoyage traite les {DONNEES.manquantsTraites} valeurs manquantes (le pays déduit de l&apos;année, la médiane
                  pour les nombres, « Unknown » pour les autres catégories), retire les lignes hors période et normalise les
                  noms de colonnes : {nombre(DONNEES.lignesNettoyees)} lignes, aucune valeur manquante, aucun doublon. Les défauts
                  relevés à l&apos;exploration et corrigés :
                </p>
                <div className="mt-6 overflow-x-auto">
                  <table className="tableau min-w-[560px] max-w-3xl">
                    <thead>
                      <tr>
                        <th scope="col">Corrigé</th>
                        <th scope="col">Détail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CORRECTIONS.map((c) => (
                        <tr key={c.constat}>
                          <td className="font-medium">{c.constat}</td>
                          <td className="text-encre-2">{c.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-8 max-w-2xl">Le profilage du fichier nettoyé montre ce qu&apos;il reste à traiter :</p>
                <div className="mt-6 overflow-x-auto">
                  <table className="tableau min-w-[560px] max-w-3xl">
                    <thead>
                      <tr>
                        <th scope="col">Reste à traiter</th>
                        <th scope="col">Détail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ANOMALIES.map((a) => (
                        <tr key={a.constat}>
                          <td className="font-medium">{a.constat}</td>
                          <td className="text-encre-2">{a.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Depliable>

              <Depliable
                id="decisions"
                numero="04"
                titre="Les décisions techniques"
                resume="Modules séparés, Random Forest, Streamlit"
              >
                <dl className="max-w-2xl space-y-6">
                  {[
                    [
                      "Séparer les responsabilités",
                      "Chargement et prétraitement dans src/data_processing.py, entraînement dans src/model.py, interface dans app.py.",
                    ],
                    [
                      "Random Forest",
                      "Un modèle robuste aux variables catégorielles encodées, sans mise à l'échelle, avec des paramètres fixés pour être reproductible.",
                    ],
                    [
                      "Aligner la saisie sur le modèle",
                      "Le formulaire est encodé de la même façon que les données d'entraînement, puis réaligné sur leurs colonnes.",
                    ],
                    [
                      "Une interface en français",
                      "Libellés traduits dans le formulaire, pour un usage direct par un public non technique.",
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
                numero="05"
                titre="Ce que j'améliorerais"
                resume="Évaluer, contrôler, entraîner une fois"
              >
                <ul className="max-w-2xl list-none space-y-4">
                  <li>
                    <strong>Évaluer le modèle.</strong> Séparer un jeu de test et publier le rappel et l&apos;AUC, pas seulement
                    la précision, trompeuse sur des classes aussi déséquilibrées.
                  </li>
                  <li>
                    <strong>Transformer les corrections en contrôles automatiques</strong>, relancés à chaque exécution : aucune
                    valeur manquante, années de 2016 à 2018, identifiant absent des variables. Puis traiter ce qui reste : modalité
                    « 6 », cibles inconnues.
                  </li>
                  <li>
                    <strong>Entraîner une fois, pas à chaque démarrage.</strong> Sauvegarder le modèle entraîné plutôt que de le
                    réentraîner à chaque lancement de l&apos;application.
                  </li>
                </ul>
              </Depliable>
            </div>

            <a href={DEPOT} className="ui mt-12 inline-flex items-center gap-2 text-encre hover:text-accent" rel="noopener">
              <Logo nom="GitHub" className="size-4" />
              Tout le détail sur GitHub ↗
            </a>
          </section>
        </Conteneur>
      </article>
    </Espace>
  );
}
