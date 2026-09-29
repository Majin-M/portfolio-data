import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { ChaineMedallion } from "@/components/chaine-medallion";
import { Conteneur } from "@/components/conteneur";
import { BlocCode, Chapitre, Depliable, Figure, GrandsChiffres, Mesures, Ouverture, Statut } from "@/components/edition";
import { Espace } from "@/components/espace";
import { LignageSql } from "@/components/lignage-sql";
import { Revele } from "@/components/mouvement";
import {
  AJOUTS,
  CONTROLES_GOLD,
  CONTROLES_SILVER,
  COUCHES,
  COURS,
  DEPOT,
  ETOILE,
  EXECUTE_LE,
  EXTRAIT_SILVER,
  INTEGRATION,
  LIGNAGE,
  REQUETES,
  type Colonne,
  type Requete,
} from "@/contenu/entrepot-sql";
import { date, nombre } from "@/lib/format";

export const metadata: Metadata = {
  title: "Entrepôt de données SQL",
  description:
    "Projet guidé : entrepôt SQL Server en architecture Medallion, des fichiers CRM et ERP jusqu'à un schéma en étoile et ses requêtes d'analyse.",
};

const executeLe = date(EXECUTE_LE);

// L'accent de la page prend la couleur de la couche concernée : l'or (gold)
// par défaut, l'argent (silver) pour la scène de nettoyage.
const METAL_OR = {
  "--accent": "var(--or)",
  "--lueur": "color-mix(in srgb, var(--or) 50%, transparent)",
  "--halo": "color-mix(in srgb, var(--or) 9%, transparent)",
} as CSSProperties;
const METAL_ARGENT = {
  "--accent": "var(--argent)",
  "--lueur": "color-mix(in srgb, var(--argent) 45%, transparent)",
} as CSSProperties;

function lignesCouche(nom: string) {
  return COUCHES.find((c) => c.nom === nom)!.objets.reduce((t, o) => t + (o.lignes ?? 0), 0);
}
const lignesFaits = COUCHES.find((c) => c.nom === "Gold")!.objets.find((o) => o.nom === "fact_sales")!.lignes!;

function requete(id: string): Requete {
  const r = REQUETES.find((q) => q.id === id);
  if (!r) throw new Error(`Requête inconnue : ${id}`);
  return r;
}

function Resultat({ r }: { r: Requete }) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="tableau">
          <thead>
            <tr>
              {r.colonnes.map((c) => (
                <th key={c.nom} scope="col" className={c.num ? "num" : undefined}>
                  {c.nom}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {r.lignes.map((ligne) => (
              <tr key={String(ligne[0])}>
                {ligne.map((v, j) => (
                  <td key={r.colonnes[j].nom} className={r.colonnes[j].num ? "num" : "mono"}>
                    {typeof v === "number" ? nombre(v) : v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details className="mt-4">
        <summary className="ui w-fit cursor-pointer text-sm">Voir la requête SQL</summary>
        <div className="mt-3">
          <BlocCode code={r.sql} titre="scripts/analytics/analyses_metier.sql" />
        </div>
      </details>
    </div>
  );
}

function TableEtoile({ nom, role, colonnes }: { nom: string; role: string; colonnes: Colonne[] }) {
  const faits = nom.startsWith("fact_");
  return (
    <div
      className="min-w-0 border bg-fond-2"
      style={{
        borderColor: faits ? "var(--or)" : "color-mix(in srgb, var(--or) 45%, transparent)",
        boxShadow: faits ? "0 0 24px color-mix(in srgb, var(--or) 18%, transparent)" : undefined,
      }}
    >
      <div className="border-b border-trait px-4 py-3">
        <p className="label">{faits ? "Table de faits" : "Dimension"}</p>
        <p className="mt-1 font-donnees text-base text-encre">gold.{nom}</p>
        <p className="mt-1 text-sm leading-snug text-encre-3">{role}</p>
      </div>
      <ul className="px-4 py-3 font-donnees text-xs leading-relaxed">
        {colonnes.map((c) => (
          <li key={c.nom} className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className={c.cle ? "text-encre" : "text-encre-2"}>{c.nom}</span>
            <span className={c.cle ? "text-accent" : "text-encre-3"}>
              {c.cle === "FK" ? `FK ${c.description}` : (c.cle ?? c.type.replace(/\(\d+\)/, ""))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PageEntrepotSql() {
  const [dimClients, faits, dimProduits] = ETOILE;
  const indicateurs = requete("indicateurs");
  const categories = requete("categories");
  const segments = requete("segments");

  // Chiffres du récit, calculés à partir des résultats des requêtes.
  const valeurIndicateur = (nom: string) => Number(indicateurs.lignes.find((l) => l[0] === nom)?.[1]);
  const velos = categories.lignes.find((l) => l[0] === "Bikes")!;
  const partVelos = Number(velos[1]) / Number(velos[2]);
  const clients = segments.lignes.reduce((s, l) => s + Number(l[1]), 0);
  const ventes = segments.lignes.reduce((s, l) => s + Number(l[2]), 0);
  const vip = segments.lignes.find((l) => l[0] === "VIP")!;
  const bronzeClients = COUCHES.find((c) => c.nom === "Bronze")!.objets.find((o) => o.nom === "crm_cust_info")!.lignes!;
  const silverClients = COUCHES.find((c) => c.nom === "Silver")!.objets.find((o) => o.nom === "crm_cust_info")!.lignes!;

  return (
    <Espace>
      <article style={METAL_OR}>
        <Ouverture
          identifiant="Projet 02 · Projet guidé"
          source="Data With Baraa / données fictives"
          titre="Entrepôt de données SQL"
          periode="CRM + ERP → bronze → silver → gold"
          phrase={
            <p>
              Deux systèmes, six fichiers, trois couches : les ventes consolidées en un schéma en étoile qu&apos;on interroge
              directement.
            </p>
          }
          statut={
            <Statut>
              Exécuté le {executeLe} · {CONTROLES_GOLD.length} contrôles gold · 0 anomalie
            </Statut>
          }
          mention={
            <>
              <p>
                Réalisé en suivant le cours{" "}
                <a href={COURS} className="lien" rel="noopener">
                  SQL Data Warehouse
                </a>{" "}
                de Data With Baraa. Ce que j&apos;y ai ajouté ou modifié :
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {AJOUTS.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </>
          }
          liens={[{ label: "Dépôt GitHub", href: DEPOT }]}
          disposition="dessous"
          visuel={
            <ChaineMedallion
              etapes={[
                {
                  metal: "bronze",
                  numero: "I",
                  couche: "Bronze",
                  role: "brut",
                  detail: "6 tables brutes, chargées par BULK INSERT",
                  valeur: `${nombre(lignesCouche("Bronze"))} lignes`,
                  taille: 150,
                },
                {
                  metal: "argent",
                  numero: "II",
                  couche: "Silver",
                  role: "nettoyé",
                  detail: "6 tables nettoyées par silver.load_silver",
                  valeur: `${nombre(lignesCouche("Silver"))} lignes`,
                  taille: 168,
                },
                {
                  metal: "or",
                  numero: "III",
                  couche: "Gold",
                  role: "métier",
                  detail: "5 vues : schéma en étoile et reporting",
                  valeur: `${nombre(lignesFaits)} faits`,
                  taille: 192,
                },
              ]}
              sources={["3 fichiers CRM", "3 fichiers ERP"]}
              usage={[`${REQUETES.length} requêtes publiées`, "0 anomalie en gold"]}
            />
          }
          legendeVisuel={
            <>
              Architecture Medallion : chaque couche est une médaille. Le bronze garde les données telles qu&apos;elles arrivent,
              l&apos;argent les nettoie, l&apos;or les organise pour le métier. Volumes mesurés le {executeLe}.
            </>
          }
        />

        <Conteneur>
          {/* L'histoire */}
          <section className="border-t border-trait py-24">
            <Chapitre numero="Le système" titre="Suivre chaque table">
              <p>
                Survolez une table : son origine et tout ce qu&apos;elle alimente s&apos;allument, dans la couleur de leur couche.
              </p>
            </Chapitre>
            <div className="mt-12">
              <Figure
                numero="01"
                source={`Lignage · volumes du ${executeLe}`}
                legende={
                  <>
                    <code className="code-inline">fact_sales</code> récupère aussi les clés des deux dimensions.
                  </>
                }
              >
                <div className="hidden md:block">
                  <LignageSql colonnes={LIGNAGE.colonnes} liens={LIGNAGE.liens} />
                </div>
                <ol className="grid gap-3 md:hidden">
                  {COUCHES.map((c) => (
                    <li
                      key={c.nom}
                      className={`border bg-fond-2 p-4 ${c.nom === "Gold" ? "border-accent" : "border-trait-fort"}`}
                    >
                      <p className="label !text-encre">{c.nom}</p>
                      <p className="mt-1 text-sm text-encre-2">{c.role}</p>
                      <ul className="mt-3 space-y-0.5 border-t border-trait pt-3 font-donnees text-xs">
                        {c.objets.map((o) => (
                          <li key={o.nom} className="flex flex-wrap justify-between gap-x-2">
                            <span className="text-encre-2">{o.nom}</span>
                            {o.lignes !== undefined && (
                              <span className="ml-auto text-encre-3 tabular-nums">{nombre(o.lignes)}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              </Figure>
            </div>
          </section>

          <section className="border-t border-trait py-24">
            <Chapitre numero="L'histoire · 1" titre="Le modèle en chiffres">
              <p>
                Un vendeur de vélos et d&apos;accessoires, des ventes de fin 2010 à début 2014. Tous les chiffres sortent des vues
                gold.
              </p>
            </Chapitre>
            <div className="mt-12">
              <Mesures
                items={[
                  {
                    label: "Chiffre d'affaires",
                    valeur: valeurIndicateur("Chiffre d'affaires total"),
                    detail: "unités monétaires entières",
                  },
                  { label: "Commandes", valeur: valeurIndicateur("Nombre de commandes") },
                  { label: "Clients", valeur: valeurIndicateur("Nombre de clients") },
                  { label: "Produits actifs", valeur: valeurIndicateur("Nombre de produits") },
                ]}
                source={`Requête « indicateurs clés », exécutée le ${executeLe}.`}
              />
            </div>
            <details className="mt-6">
              <summary className="ui w-fit cursor-pointer text-sm">Voir la requête et tous les indicateurs</summary>
              <div className="mt-4 max-w-3xl">
                <Resultat r={indicateurs} />
              </div>
            </details>
          </section>

          <section className="border-t border-trait py-24" style={METAL_ARGENT}>
            <Chapitre numero="L'histoire · 2" titre="Un client, une ligne">
              <p>
                Le CRM contient des doublons et des clés vides. Silver garde l&apos;enregistrement le plus récent de chaque client
                et écarte les autres.
              </p>
            </Chapitre>
            <Revele className="mt-14">
              <GrandsChiffres
                separateur="→"
                chiffres={[
                  { valeur: bronzeClients, legende: "lignes clients en bronze" },
                  { valeur: silverClients, legende: "clients en silver" },
                ]}
              />
            </Revele>
            <div className="mt-12 max-w-3xl">
              <BlocCode titre="Extrait de silver.load_silver : clients" code={EXTRAIT_SILVER} />
            </div>
          </section>

          <section className="border-t border-trait py-24">
            <Chapitre numero="L'histoire · 3" titre="Une entreprise de vélos">
              <p>{categories.question}</p>
            </Chapitre>
            <Revele className="mt-14">
              <GrandsChiffres
                chiffres={[{ valeur: partVelos, format: "pourcent", legende: "du chiffre d'affaires vient des vélos" }]}
              />
            </Revele>
            <div className="mt-12 max-w-3xl">
              <Figure numero="02" source={`analyses_metier.sql · ${executeLe}`} legende={categories.lecture}>
                <Resultat r={categories} />
              </Figure>
            </div>
          </section>

          <section className="border-t border-trait py-24">
            <Chapitre numero="L'histoire · 4" titre="Peu de clients, beaucoup de ventes">
              <p>{segments.question}</p>
            </Chapitre>
            <Revele className="mt-14">
              <GrandsChiffres
                separateur="→"
                chiffres={[
                  { valeur: Number(vip[1]) / clients, format: "pourcent", legende: "des clients sont VIP" },
                  { valeur: Number(vip[2]) / ventes, format: "pourcent", legende: "des ventes" },
                ]}
              />
            </Revele>
            <div className="mt-12 max-w-3xl">
              <Figure numero="03" source={`analyses_metier.sql · ${executeLe}`} legende={segments.lecture}>
                <Resultat r={segments} />
              </Figure>
            </div>
          </section>

          {/* Sous le capot */}
          <section className="border-t border-trait-fort py-24">
            <Chapitre numero="Sous le capot" titre="Le schéma en étoile">
              <p>Une table de faits au grain de la ligne de commande, reliée à deux dimensions par des clés de substitution.</p>
            </Chapitre>
            <div className="mt-12">
              <Figure
                numero="04"
                source="Vues SQL Server · clés de substitution par ROW_NUMBER()"
                legende={
                  <>
                    Deux vues de reporting, <code className="code-inline">report_customers</code> et{" "}
                    <code className="code-inline">report_products</code>, agrègent ensuite les indicateurs par client et par
                    produit.
                  </>
                }
              >
                <Revele className="grid items-start gap-4 md:grid-cols-3">
                  <TableEtoile nom={dimClients.nom} role={dimClients.role} colonnes={dimClients.colonnes} />
                  <TableEtoile nom={faits.nom} role={faits.role} colonnes={faits.colonnes} />
                  <TableEtoile nom={dimProduits.nom} role={dimProduits.role} colonnes={dimProduits.colonnes} />
                </Revele>
              </Figure>
            </div>

            <div className="mt-20">
              <Depliable id="dataset" numero="01" titre="Le dataset" resume="Six fichiers CSV, un CRM et un ERP">
                <p className="max-w-2xl">
                  Six fichiers CSV fournis avec le cours, issus de deux systèmes : le <strong>CRM</strong> (clients, produits et
                  leur historique, lignes de vente) et l&apos;<strong>ERP</strong> (informations complémentaires sur les clients,
                  pays, catégories de produits). Les données sont fictives, figées, et volontairement imparfaites : doublons,
                  espaces parasites, codes à la place des libellés, dates invalides, montants incohérents.
                </p>
              </Depliable>

              <Depliable id="question" numero="02" titre="La question" resume="Consolider deux systèmes aux clés différentes">
                <p className="max-w-2xl">
                  <strong>
                    Comment consolider deux systèmes qui ne partagent pas les mêmes clés en un modèle unique, prêt pour
                    l&apos;analyse ?
                  </strong>{" "}
                  Le client s&apos;appelle <code>cst_key</code> dans le CRM et <code>cid</code> dans l&apos;ERP, avec un préfixe
                  ou des tirets en plus ; la catégorie d&apos;un produit est cachée dans les cinq premiers caractères de sa clé.
                </p>
              </Depliable>

              <Depliable
                id="integration"
                numero="03"
                titre="L'intégration des deux systèmes"
                resume="Cinq relations, rétablies en silver"
              >
                <div className="overflow-x-auto">
                  <table className="tableau min-w-[640px]">
                    <thead>
                      <tr>
                        <th scope="col">De</th>
                        <th scope="col">Vers</th>
                        <th scope="col">Clé</th>
                        <th scope="col">Transformation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {INTEGRATION.map((r) => (
                        <tr key={`${r.de}-${r.vers}`}>
                          <td className="mono">{r.de}</td>
                          <td className="mono">{r.vers}</td>
                          <td className="mono text-encre-2">{r.cle}</td>
                          <td className="text-sm text-encre-2">{r.note || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Depliable>

              <Depliable
                id="catalogue"
                numero="04"
                titre="Le catalogue de la couche gold"
                resume="Chaque colonne, son type, son sens"
              >
                {ETOILE.map((t) => (
                  <div key={t.nom} className="mt-8 first:mt-0">
                    <p className="font-donnees text-sm text-encre">gold.{t.nom}</p>
                    <p className="mt-1 text-sm text-encre-2">
                      {t.role} Sources : <span className="font-donnees text-xs">{t.sources}</span>.
                    </p>
                    <div className="mt-3 overflow-x-auto">
                      <table className="tableau min-w-[520px]">
                        <thead>
                          <tr>
                            <th scope="col">Colonne</th>
                            <th scope="col">Type</th>
                            <th scope="col">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {t.colonnes.map((c) => (
                            <tr key={c.nom}>
                              <td className="mono">
                                {c.nom}
                                {c.cle && <span className="ml-2 text-accent">{c.cle}</span>}
                              </td>
                              <td className="mono text-encre-3">{c.type}</td>
                              <td className="text-sm text-encre-2">{c.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </Depliable>

              <Depliable
                id="qualite"
                numero="05"
                titre="La qualité"
                resume={`Contrôles silver et gold, 0 anomalie le ${executeLe}`}
              >
                <div className="grid gap-10 lg:grid-cols-2">
                  <div>
                    <p className="label mb-3">Contrôles silver</p>
                    <p className="text-encre-2">
                      Un script de requêtes à relire après chaque chargement. Chaque requête annonce son résultat attendu, le plus
                      souvent « aucune ligne ».
                    </p>
                    <ul className="mt-4 space-y-2">
                      {CONTROLES_SILVER.map((c) => (
                        <li key={c} className="flex gap-3 text-encre-2">
                          <span aria-hidden className="font-donnees text-encre-3">
                            —
                          </span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="min-w-0">
                    <p className="label mb-3">Contrôles gold · exécutés le {executeLe}</p>
                    <div className="overflow-x-auto">
                      <table className="tableau min-w-[420px]">
                        <thead>
                          <tr>
                            <th scope="col">Contrôle</th>
                            <th scope="col">Attendu</th>
                            <th scope="col">Obtenu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {CONTROLES_GOLD.map((c) => (
                            <tr key={c.controle}>
                              <td className="text-sm">{c.controle}</td>
                              <td className="mono text-encre-3">{c.attendu}</td>
                              <td className="mono text-encre">{c.obtenu}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </Depliable>

              <Depliable id="decisions" numero="06" titre="Les décisions techniques" resume="Medallion, vues, chargement complet">
                <dl className="max-w-2xl space-y-6">
                  {[
                    [
                      "Trois couches, un rôle chacune",
                      "Bronze garde la trace de ce qui est arrivé, silver concentre le nettoyage, gold ne contient que de la logique métier. Un problème se localise à une couche.",
                    ],
                    [
                      "Gold en vues",
                      "Aucune donnée n'est dupliquée : les vues sont calculées à partir de silver à chaque requête, toujours à jour après un chargement.",
                    ],
                    [
                      "Chargement complet",
                      "Vider puis recharger chaque table est simple et idempotent, sur des volumes de quelques dizaines de milliers de lignes.",
                    ],
                    [
                      "Clés de substitution",
                      "Les dimensions reçoivent leur propre clé, indépendante des identifiants des systèmes sources, et la table de faits ne référence que ces clés.",
                    ],
                    [
                      "Le CRM prioritaire sur l'ERP",
                      "Quand les deux systèmes donnent le genre d'un client, le CRM l'emporte ; l'ERP sert de repli quand le CRM n'en a pas.",
                    ],
                    [
                      "Produits actifs seulement",
                      "dim_products ne garde que la version courante de chaque produit : l'historique des versions n'est pas demandé dans ce projet.",
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
                numero="07"
                titre="Ce que j'améliorerais"
                resume="Clés stables, contrôles automatiques, encodage"
              >
                <ul className="max-w-2xl list-none space-y-4">
                  <li>
                    <strong>Des clés stables.</strong> Les clés de substitution sont calculées par <code>ROW_NUMBER()</code> dans
                    des vues : un nouveau client inséré au milieu de l&apos;ordre décale toutes les clés suivantes. Matérialiser
                    les dimensions avec une colonne <code>IDENTITY</code> les rendrait stables.
                  </li>
                  <li>
                    <strong>Des contrôles qui échouent tout seuls.</strong> Les contrôles qualité sont des requêtes à relire. Les
                    transformer en tests qui échouent (tSQLt, ou dbt comme dans le projet Prénoms) permettrait de bloquer un
                    chargement défectueux.
                  </li>
                  <li>
                    <strong>Un encodage explicite.</strong> Lancés avec <code>sqlcmd</code> sans l&apos;option{" "}
                    <code>-f 65001</code>, les scripts en UTF-8 sont lus dans la page de code Windows et les libellés écrits par
                    silver deviennent « FÃ©minin ». Constaté en préparant cette page.
                  </li>
                  <li>
                    <strong>Une exécution en une commande.</strong> Les scripts se lancent un par un, dans l&apos;ordre, avec des
                    chemins de fichiers codés en dur dans <code>BULK INSERT</code>.
                  </li>
                  <li>
                    <strong>L&apos;historique.</strong> Le chargement complet écrase l&apos;état précédent. Garder
                    l&apos;historique des clients et des produits (dimensions à évolution lente) serait l&apos;étape suivante.
                  </li>
                </ul>
              </Depliable>
            </div>

            <a href={DEPOT} className="ui mt-12 inline-block !text-encre hover:!text-accent" rel="noopener">
              Tout le détail sur GitHub ↗
            </a>
          </section>
        </Conteneur>
      </article>
    </Espace>
  );
}
