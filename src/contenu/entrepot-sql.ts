// Contenu de la page « Entrepôt de données SQL » (projet guidé).
//
// Les résultats viennent d'une exécution réelle sur la base locale :
// SQL Server Express, base DataWarehouse, le 27 septembre 2026, après
// `EXEC silver.load_silver` puis scripts/gold/ddl_gold.sql et
// ddl_gold_reports.sql. Les requêtes sont celles de
// scripts/analytics/analyses_metier.sql et tests/quality_checks_gold.sql.
// Pour les mettre à jour : relancer ces requêtes et recopier les résultats.

export const EXECUTE_LE = "2026-09-27";

export const DEPOT = "https://github.com/Majin-M/sql-data-warehouse-project";
export const COURS = "https://github.com/DataWithBaraa/sql-data-warehouse-project";

/** Ce que j'ai ajouté ou modifié par rapport au cours. À compléter. */
export const AJOUTS = [
  "Adaptation complète en français : scripts, commentaires, libellés des données, catalogue et conventions de nommage.",
];

export type Couche = {
  nom: string;
  role: string;
  type: string;
  chargement: string;
  objets: { nom: string; lignes?: number }[];
};

export const COUCHES: Couche[] = [
  {
    nom: "Sources",
    role: "Exports CSV de deux systèmes",
    type: "fichiers",
    chargement: "—",
    objets: [
      { nom: "crm/cust_info.csv" },
      { nom: "crm/prd_info.csv" },
      { nom: "crm/sales_details.csv" },
      { nom: "erp/CUST_AZ12.csv" },
      { nom: "erp/LOC_A101.csv" },
      { nom: "erp/PX_CAT_G1V2.csv" },
    ],
  },
  {
    nom: "Bronze",
    role: "Données brutes, telles quelles",
    type: "tables",
    chargement: "BULK INSERT, complet (vidage puis insertion)",
    objets: [
      { nom: "crm_cust_info", lignes: 18493 },
      { nom: "crm_prd_info", lignes: 397 },
      { nom: "crm_sales_details", lignes: 60398 },
      { nom: "erp_cust_az12", lignes: 18483 },
      { nom: "erp_loc_a101", lignes: 18484 },
      { nom: "erp_px_cat_g1v2", lignes: 37 },
    ],
  },
  {
    nom: "Silver",
    role: "Nettoyées, standardisées, normalisées",
    type: "tables",
    chargement: "procédure silver.load_silver",
    objets: [
      { nom: "crm_cust_info", lignes: 18484 },
      { nom: "crm_prd_info", lignes: 397 },
      { nom: "crm_sales_details", lignes: 60398 },
      { nom: "erp_cust_az12", lignes: 18483 },
      { nom: "erp_loc_a101", lignes: 18484 },
      { nom: "erp_px_cat_g1v2", lignes: 37 },
    ],
  },
  {
    nom: "Gold",
    role: "Prêtes pour le métier",
    type: "vues",
    chargement: "aucun : calculées à chaque requête",
    objets: [
      { nom: "dim_customers", lignes: 18484 },
      { nom: "dim_products", lignes: 295 },
      { nom: "fact_sales", lignes: 60398 },
      { nom: "report_customers", lignes: 18482 },
      { nom: "report_products", lignes: 130 },
    ],
  },
];

/** Relations entre les deux systèmes, après nettoyage en silver. */
export const INTEGRATION = [
  { de: "crm_sales_details", vers: "crm_prd_info", cle: "sls_prd_key = prd_key", note: "" },
  { de: "crm_sales_details", vers: "crm_cust_info", cle: "sls_cust_id = cst_id", note: "" },
  {
    de: "crm_prd_info",
    vers: "erp_px_cat_g1v2",
    cle: "cat_id = id",
    note: "cat_id : 5 premiers caractères de prd_key, « - » remplacé par « _ »",
  },
  { de: "crm_cust_info", vers: "erp_cust_az12", cle: "cst_key = cid", note: "préfixe NAS retiré de cid" },
  { de: "crm_cust_info", vers: "erp_loc_a101", cle: "cst_key = cid", note: "tirets retirés de cid" },
];

export type Colonne = { nom: string; type: string; cle?: "PK" | "FK"; description: string };

export const ETOILE: { nom: string; role: string; sources: string; colonnes: Colonne[] }[] = [
  {
    nom: "dim_customers",
    role: "Dimension client, enrichie des données démographiques et géographiques de l'ERP.",
    sources: "silver.crm_cust_info, erp_cust_az12, erp_loc_a101",
    colonnes: [
      { nom: "customer_key", type: "BIGINT", cle: "PK", description: "Clé de substitution" },
      { nom: "customer_id", type: "INT", description: "Identifiant du client dans le CRM" },
      { nom: "customer_number", type: "NVARCHAR(50)", description: "Identifiant alphanumérique (ex. AW00011000)" },
      { nom: "first_name", type: "NVARCHAR(50)", description: "Prénom" },
      { nom: "last_name", type: "NVARCHAR(50)", description: "Nom de famille" },
      { nom: "country", type: "NVARCHAR(50)", description: "Pays de résidence, n/a si inconnu" },
      { nom: "marital_status", type: "NVARCHAR(50)", description: "Marié(e), Célibataire" },
      { nom: "gender", type: "NVARCHAR(50)", description: "CRM prioritaire, ERP en repli" },
      { nom: "birthdate", type: "DATE", description: "Date de naissance" },
      { nom: "create_date", type: "DATE", description: "Création de la fiche client" },
    ],
  },
  {
    nom: "fact_sales",
    role: "Table de faits : une ligne par ligne de commande (commande × produit).",
    sources: "silver.crm_sales_details, dim_products, dim_customers",
    colonnes: [
      { nom: "order_number", type: "NVARCHAR(50)", description: "Numéro de commande (ex. SO54496)" },
      { nom: "product_key", type: "BIGINT", cle: "FK", description: "→ dim_products" },
      { nom: "customer_key", type: "BIGINT", cle: "FK", description: "→ dim_customers" },
      { nom: "order_date", type: "DATE", description: "Date de commande" },
      { nom: "shipping_date", type: "DATE", description: "Date d'expédition" },
      { nom: "due_date", type: "DATE", description: "Échéance du paiement" },
      { nom: "sales_amount", type: "INT", description: "quantity × price" },
      { nom: "quantity", type: "INT", description: "Unités commandées" },
      { nom: "price", type: "INT", description: "Prix unitaire" },
    ],
  },
  {
    nom: "dim_products",
    role: "Dimension produit : seuls les produits actifs sont conservés, sans l'historique des versions.",
    sources: "silver.crm_prd_info, erp_px_cat_g1v2",
    colonnes: [
      { nom: "product_key", type: "BIGINT", cle: "PK", description: "Clé de substitution" },
      { nom: "product_id", type: "INT", description: "Identifiant interne" },
      { nom: "product_number", type: "NVARCHAR(50)", description: "Code produit (ex. BK-R93R-62)" },
      { nom: "product_name", type: "NVARCHAR(50)", description: "Nom descriptif" },
      { nom: "category_id", type: "NVARCHAR(50)", description: "Lien vers la catégorie (ex. BI_RB)" },
      { nom: "category", type: "NVARCHAR(50)", description: "Bikes, Components…" },
      { nom: "subcategory", type: "NVARCHAR(50)", description: "Road Bikes…" },
      { nom: "maintenance", type: "NVARCHAR(50)", description: "Yes, No" },
      { nom: "cost", type: "INT", description: "Coût" },
      { nom: "product_line", type: "NVARCHAR(50)", description: "Route, Montagne, Touring, Autres ventes" },
      { nom: "start_date", type: "DATE", description: "Début de commercialisation" },
    ],
  },
];

/** Extrait de scripts/silver/proc_load_silver.sql : dédoublonnage et normalisation des clients. */
export const EXTRAIT_SILVER = `SELECT
    cst_id,
    cst_key,
    TRIM(cst_firstname) AS cst_firstname,
    TRIM(cst_lastname)  AS cst_lastname,
    CASE
        WHEN UPPER(TRIM(cst_marital_status)) = 'S' THEN 'Célibataire'
        WHEN UPPER(TRIM(cst_marital_status)) = 'M' THEN 'Marié(e)'
        ELSE 'n/a'
    END AS cst_marital_status,
    CASE
        WHEN UPPER(TRIM(cst_gndr)) = 'F' THEN 'Féminin'
        WHEN UPPER(TRIM(cst_gndr)) = 'M' THEN 'Masculin'
        ELSE 'n/a'
    END AS cst_gndr,
    cst_create_date
FROM (
    SELECT *,
        ROW_NUMBER() OVER (PARTITION BY cst_id ORDER BY cst_create_date DESC) AS flag_last
    FROM bronze.crm_cust_info
    WHERE cst_id IS NOT NULL
) t
WHERE flag_last = 1; -- l'enregistrement le plus récent par client`;

export const CONTROLES_SILVER = [
  "Clés primaires nulles ou en doublon",
  "Espaces indésirables en début ou fin de texte",
  "Valeurs standardisées : genre, statut marital, gamme de produit, pays",
  "Coûts nuls ou négatifs",
  "Dates incohérentes : début après fin, commande après expédition ou échéance",
  "Cohérence des ventes : montant = quantité × prix",
  "Dates de naissance hors plage (avant 1924 ou dans le futur)",
];

export const CONTROLES_GOLD = [
  { controle: "Unicité de customer_key dans dim_customers", attendu: "aucune ligne", obtenu: "0 ligne" },
  {
    controle: "Valeurs de gender après intégration CRM / ERP",
    attendu: "Féminin, Masculin, n/a",
    obtenu: "Féminin, Masculin, n/a",
  },
  { controle: "Unicité de product_key dans dim_products", attendu: "aucune ligne", obtenu: "0 ligne" },
  { controle: "Un seul enregistrement actif par product_number", attendu: "aucune ligne", obtenu: "0 ligne" },
  { controle: "Intégrité référentielle entre fact_sales et les dimensions", attendu: "aucune ligne", obtenu: "0 ligne" },
];

export type Requete = {
  id: string;
  titre: string;
  question: string;
  sql: string;
  colonnes: { nom: string; num?: boolean }[];
  lignes: (string | number)[][];
  lecture: string;
};

export const REQUETES: Requete[] = [
  {
    id: "indicateurs",
    titre: "Indicateurs clés",
    question: "Quel volume d'activité le modèle représente-t-il ?",
    sql: `SELECT 'Chiffre d''affaires total' AS measure_name, SUM(sales_amount) AS measure_value FROM gold.fact_sales
UNION ALL SELECT 'Quantité totale vendue', SUM(quantity) FROM gold.fact_sales
UNION ALL SELECT 'Prix de vente moyen', AVG(price) FROM gold.fact_sales
UNION ALL SELECT 'Nombre de commandes', COUNT(DISTINCT order_number) FROM gold.fact_sales
UNION ALL SELECT 'Nombre de produits', COUNT(product_key) FROM gold.dim_products
UNION ALL SELECT 'Nombre de clients', COUNT(customer_key) FROM gold.dim_customers
UNION ALL SELECT 'Nombre de clients ayant commandé', COUNT(DISTINCT customer_key) FROM gold.fact_sales;`,
    colonnes: [{ nom: "measure_name" }, { nom: "measure_value", num: true }],
    lignes: [
      ["Chiffre d'affaires total", 29356250],
      ["Quantité totale vendue", 60423],
      ["Prix de vente moyen", 486],
      ["Nombre de commandes", 27659],
      ["Nombre de produits", 295],
      ["Nombre de clients", 18484],
      ["Nombre de clients ayant commandé", 18484],
    ],
    lecture:
      "Les ventes couvrent 37 mois, du 29 décembre 2010 au 28 janvier 2014. Chaque client de la dimension a passé au moins une commande.",
  },
  {
    id: "categories",
    titre: "Contribution des catégories",
    question: "Quelle part du chiffre d'affaires chaque catégorie porte-t-elle ?",
    sql: `WITH category_sales AS (
    SELECT p.category, SUM(f.sales_amount) AS total_sales
    FROM gold.fact_sales f
    LEFT JOIN gold.dim_products p ON p.product_key = f.product_key
    GROUP BY p.category
)
SELECT
    category,
    total_sales,
    SUM(total_sales) OVER () AS overall_sales,
    CAST(CAST(total_sales AS FLOAT) * 100 / SUM(total_sales) OVER () AS DECIMAL(5, 2)) AS percentage_of_total
FROM category_sales
ORDER BY total_sales DESC;`,
    colonnes: [
      { nom: "category" },
      { nom: "total_sales", num: true },
      { nom: "overall_sales", num: true },
      { nom: "percentage_of_total", num: true },
    ],
    lignes: [
      ["Bikes", 28316272, 29356250, "96.46"],
      ["Accessories", 700262, 29356250, "2.39"],
      ["Clothing", 339716, 29356250, "1.16"],
    ],
    lecture: "Les vélos font 96,5 % du chiffre d'affaires : l'activité dépend presque entièrement d'une seule catégorie.",
  },
  {
    id: "segments",
    titre: "Segmentation des clients",
    question: "Comment les clients se répartissent-ils entre VIP, réguliers et nouveaux ?",
    sql: `SELECT
    customer_segment,
    COUNT(*)             AS total_customers,
    SUM(total_sales)     AS total_sales,
    AVG(avg_order_value) AS avg_order_value
FROM gold.report_customers
GROUP BY customer_segment
ORDER BY total_customers DESC;`,
    colonnes: [
      { nom: "customer_segment" },
      { nom: "total_customers", num: true },
      { nom: "total_sales", num: true },
      { nom: "avg_order_value", num: true },
    ],
    lignes: [
      ["Nouveau", 14629, 11086797, 601],
      ["Régulier", 2200, 7503991, 1682],
      ["VIP", 1653, 10760470, 2633],
    ],
    lecture:
      "Les 1 653 clients VIP (8,9 % des 18 482 clients de la vue) réalisent 36,7 % des ventes, avec un panier moyen plus de quatre fois supérieur à celui des nouveaux clients. VIP : au moins 12 mois d'historique et plus de 5 000 de ventes.",
  },
];

/**
 * Lignage des données, de chaque fichier source aux vues de reporting.
 * Relations tirées des scripts du dépôt (proc_load_bronze, proc_load_silver,
 * ddl_gold, ddl_gold_reports) ; volumes mesurés le 27 septembre 2026.
 * Les lignes sont ordonnées pour que les flux se croisent le moins possible.
 */
const TABLES = [
  { fichier: "crm/cust_info.csv", table: "crm_cust_info", bronze: 18493, silver: 18484 },
  { fichier: "erp/CUST_AZ12.csv", table: "erp_cust_az12", bronze: 18483, silver: 18483 },
  { fichier: "erp/LOC_A101.csv", table: "erp_loc_a101", bronze: 18484, silver: 18484 },
  { fichier: "crm/sales_details.csv", table: "crm_sales_details", bronze: 60398, silver: 60398 },
  { fichier: "crm/prd_info.csv", table: "crm_prd_info", bronze: 397, silver: 397 },
  { fichier: "erp/PX_CAT_G1V2.csv", table: "erp_px_cat_g1v2", bronze: 37, silver: 37 },
];

export const LIGNAGE = {
  colonnes: [
    {
      titre: "Sources",
      detail: "6 fichiers CSV",
      couleur: "var(--encre-2)",
      objets: TABLES.map((t) => ({ id: `src:${t.table}`, nom: t.fichier })),
    },
    {
      titre: "Bronze",
      couleur: "var(--bronze)",
      detail: `tables brutes · ${TABLES.reduce((s, t) => s + t.bronze, 0).toLocaleString("fr-FR")} lignes`,
      objets: TABLES.map((t) => ({ id: `bronze:${t.table}`, nom: t.table, lignes: t.bronze })),
    },
    {
      titre: "Silver",
      couleur: "var(--argent)",
      detail: "tables nettoyées",
      objets: TABLES.map((t) => ({ id: `silver:${t.table}`, nom: t.table, lignes: t.silver })),
    },
    {
      titre: "Gold",
      couleur: "var(--or)",
      detail: "vues · schéma en étoile",
      objets: [
        { id: "gold:dim_customers", nom: "dim_customers", lignes: 18484 },
        { id: "gold:fact_sales", nom: "fact_sales", lignes: 60398 },
        { id: "gold:dim_products", nom: "dim_products", lignes: 295 },
      ],
    },
    {
      titre: "Reporting",
      couleur: "var(--or)",
      detail: "vues gold agrégées",
      objets: [
        { id: "gold:report_customers", nom: "report_customers", lignes: 18482 },
        { id: "gold:report_products", nom: "report_products", lignes: 130 },
      ],
    },
  ],
  liens: [
    ...TABLES.flatMap((t) => [
      [`src:${t.table}`, `bronze:${t.table}`],
      [`bronze:${t.table}`, `silver:${t.table}`],
    ]),
    ["silver:crm_cust_info", "gold:dim_customers"],
    ["silver:erp_cust_az12", "gold:dim_customers"],
    ["silver:erp_loc_a101", "gold:dim_customers"],
    ["silver:crm_sales_details", "gold:fact_sales"],
    ["silver:crm_prd_info", "gold:dim_products"],
    ["silver:erp_px_cat_g1v2", "gold:dim_products"],
    ["gold:dim_customers", "gold:report_customers"],
    ["gold:fact_sales", "gold:report_customers"],
    ["gold:fact_sales", "gold:report_products"],
    ["gold:dim_products", "gold:report_products"],
  ] as [string, string][],
};
