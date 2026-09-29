// La fiche de compétences, calculée à partir de preuves.
//
// Chaque usage est un outil employé dans un projet publié, avec ce qu'il y fait
// et le lien qui le prouve. Le radar, les barres et la matrice sont calculés à
// partir de cette liste (src/lib/competences.ts) : aucun niveau auto-évalué.
//
// Usages relevés le 28 septembre 2026 dans les dépôts locaux (prenoms_france,
// Carburant, sql-data-warehouse-project, inclusion_financiere). Parcours et
// certifications : CV de septembre 2026 (publié dans public/cv/).

export const ETAPES_METIER = [
  { id: "ingestion", nom: "Ingestion" },
  { id: "transformation", nom: "Transformation" },
  { id: "modelisation", nom: "Modélisation" },
  { id: "qualite", nom: "Qualité" },
  { id: "orchestration", nom: "Orchestration" },
  { id: "restitution", nom: "Restitution" },
] as const;

export type Etape = (typeof ETAPES_METIER)[number]["id"];

/**
 * production : l'outil tourne dans un pipeline planifié ;
 * projet : il est utilisé dans un projet publié ;
 * apprentissage : ni l'un ni l'autre, pour l'instant.
 */
export type Statut = "production" | "projet" | "apprentissage";

export const REGLES_STATUT: Record<Statut, string> = {
  production: "tourne dans un pipeline planifié",
  projet: "utilisé dans un projet publié",
  apprentissage: "en cours d'apprentissage, sans projet publié",
};

export type Usage = {
  outil: string;
  /** Identifiant du projet dans le registre (src/lib/projets.ts). */
  projet: string;
  etapes: Etape[];
  usage: string;
  preuve: string;
  statut: Exclude<Statut, "apprentissage">;
};

const P = "https://github.com/Majin-M/prenoms_france/blob/main";
const C = "https://github.com/Majin-M/Carburant/blob/main";
const E = "https://github.com/Majin-M/sql-data-warehouse-project/blob/main";
const I = "https://github.com/Majin-M/inclusion_financiere/blob/main";

export const USAGES: Usage[] = [
  // 01 · Prénoms de France : pipeline complet à chaque push, pas de planification
  {
    outil: "Python",
    projet: "prenoms-de-france",
    etapes: ["ingestion", "restitution"],
    usage: "télécharge le fichier de l'INSEE et contrôle son empreinte sha256, puis écrit les JSON lus par ce site",
    preuve: `${P}/ingest.py`,
    statut: "projet",
  },
  {
    outil: "SQL",
    projet: "prenoms-de-france",
    etapes: ["transformation"],
    usage: "modèles dbt : parts par année et par sexe avec des fonctions de fenêtre",
    preuve: `${P}/dbt/models/marts/mart_diversite_prenoms_par_annee.sql`,
    statut: "projet",
  },
  {
    outil: "dbt",
    projet: "prenoms-de-france",
    etapes: ["transformation", "qualite"],
    usage: "1 modèle de staging, 3 marts, 39 tests dont 11 tests singuliers",
    preuve: `${P}/dbt`,
    statut: "projet",
  },
  {
    outil: "DuckDB",
    projet: "prenoms-de-france",
    etapes: ["modelisation"],
    usage: "entrepôt local en couches raw, staging et marts, sur 6,6 millions de lignes",
    preuve: `${P}/dbt`,
    statut: "projet",
  },
  {
    outil: "GitHub Actions",
    projet: "prenoms-de-france",
    etapes: ["orchestration"],
    usage: "le pipeline complet à chaque push : ingestion, dbt build, export",
    preuve: `${P}/.github/workflows/pipeline.yml`,
    statut: "projet",
  },

  // 04 · Prix des carburants : planifié chaque matin, donc « production »
  {
    outil: "Python",
    projet: "prix-carburants",
    etapes: ["ingestion", "restitution"],
    usage: "ZIP officiel contrôlé, XML en ISO-8859-1 lu en flux (iterparse), écrit en Parquet ; export des JSON publiés",
    preuve: `${C}/ingest.py`,
    statut: "production",
  },
  {
    outil: "SQL",
    projet: "prix-carburants",
    etapes: ["transformation"],
    usage: "QUALIFY et LAG pour ne garder que les vrais changements de prix",
    preuve: `${C}/dbt/models/marts/mart_changements_prix.sql`,
    statut: "production",
  },
  {
    outil: "dbt",
    projet: "prix-carburants",
    etapes: ["transformation", "qualite"],
    usage: "2 modèles de staging, 3 marts, 53 tests ; chacun des 18 tests singuliers vu en échec sur un défaut injecté",
    preuve: `${C}/dbt`,
    statut: "production",
  },
  {
    outil: "DuckDB",
    projet: "prix-carburants",
    etapes: ["modelisation"],
    usage: "vues sur le Parquet brut, puis staging et marts : historique des changements de prix",
    preuve: `${C}/dbt`,
    statut: "production",
  },
  {
    outil: "Parquet",
    projet: "prix-carburants",
    etapes: ["ingestion"],
    usage: "couche raw fidèle, en texte, un fichier par année",
    preuve: `${C}/ingest.py`,
    statut: "production",
  },
  {
    outil: "GitHub Actions",
    projet: "prix-carburants",
    etapes: ["orchestration"],
    usage: "chaque matin à 5 h UTC : téléchargement, dbt build, publication seulement si tous les tests passent",
    preuve: `${C}/.github/workflows/pipeline.yml`,
    statut: "production",
  },
  {
    outil: "GitHub Pages",
    projet: "prix-carburants",
    etapes: ["restitution"],
    usage: "sert les prix du matin, lus par la recherche de station de ce site",
    preuve: "https://majin-m.github.io/Carburant/metadata.json",
    statut: "production",
  },

  // 02 · Entrepôt de données SQL (projet guidé)
  {
    outil: "SQL Server",
    projet: "entrepot-sql",
    etapes: ["modelisation"],
    usage: "trois schémas bronze, silver et gold ; schéma en étoile pour l'analyse",
    preuve: `${E}/scripts/gold/ddl_gold.sql`,
    statut: "projet",
  },
  {
    outil: "SQL",
    projet: "entrepot-sql",
    etapes: ["ingestion", "transformation", "qualite", "restitution"],
    usage: "procédures T-SQL (BULK INSERT, nettoyage silver), contrôles de qualité, analyses avec LAG",
    preuve: `${E}/scripts/silver/proc_load_silver.sql`,
    statut: "projet",
  },

  // 03 · Inclusion financière
  {
    outil: "Python",
    projet: "inclusion-financiere",
    etapes: ["transformation"],
    usage: "préparation des données et entraînement du modèle",
    preuve: `${I}/src/model.py`,
    statut: "projet",
  },
  {
    outil: "pandas",
    projet: "inclusion-financiere",
    etapes: ["transformation"],
    usage: "nettoyage : médiane pour les nombres, catégorie Unknown, colonnes en snake_case",
    preuve: `${I}/src/data_processing.py`,
    statut: "projet",
  },
  {
    outil: "scikit-learn",
    projet: "inclusion-financiere",
    etapes: [],
    usage: "Random Forest de 200 arbres, servi par l'application de prédiction",
    preuve: `${I}/src/model.py`,
    statut: "projet",
  },
  {
    outil: "Streamlit",
    projet: "inclusion-financiere",
    etapes: ["restitution"],
    usage: "application de prédiction, utilisable sans connaissance technique",
    preuve: `${I}/app.py`,
    statut: "projet",
  },
  {
    outil: "Jupyter",
    projet: "inclusion-financiere",
    etapes: [],
    usage: "analyse exploratoire : valeurs manquantes, doublons, distributions",
    preuve: `${I}/notebooks/EDA.ipynb`,
    statut: "projet",
  },
];

/**
 * Outils employés hors des projets data, dans une application web publiée.
 * Affichés à part dans l'onglet Outils : ils ne comptent ni dans le radar ni
 * dans la matrice, qui décrivent le métier de data engineer.
 */
export const OUTILS_HORS_DATA: { outil: string; usage: string; preuve: string; projet: { nom: string; href: string } }[] = [
  {
    outil: "Docker",
    usage:
      "Docker Compose : nginx en point d'entrée, API Symfony (PHP-FPM) et application React construites par leur Dockerfile, MySQL 8 et tâches planifiées, déployés sur un VPS derrière un reverse proxy",
    preuve: "https://github.com/Majin-M/Volo/blob/master/docker-compose.yml",
    projet: { nom: "Volo", href: "https://github.com/Majin-M/Volo" },
  },
];

/** Outils étudiés sans projet publié : affichés en contour, sans remplissage. */
export const APPRENTISSAGE = ["Airflow", "Spark", "Databricks", "Kafka", "Snowflake"];

/** Langages : dans quels projets, pour quoi faire, dans quel contexte. */
export const LANGAGES: {
  nom: string;
  contexte: string;
  pourQuoi: string;
  depots: { nom: string; href: string }[];
}[] = [
  {
    nom: "SQL",
    contexte: "data",
    pourQuoi: "modèles dbt, fonctions de fenêtre, QUALIFY ; procédures T-SQL et BULK INSERT ; contrôles de qualité",
    depots: [
      { nom: "Prénoms de France", href: "/projets/prenoms-de-france" },
      { nom: "Entrepôt de données SQL", href: "/projets/entrepot-sql" },
      { nom: "Prix des carburants", href: "/projets/prix-carburants" },
    ],
  },
  {
    nom: "Python",
    contexte: "data",
    pourQuoi: "ingestion (téléchargement contrôlé, XML en flux, Parquet), exports JSON, pandas et scikit-learn",
    depots: [
      { nom: "Prénoms de France", href: "/projets/prenoms-de-france" },
      { nom: "Inclusion financière", href: "/projets/inclusion-financiere" },
      { nom: "Prix des carburants", href: "/projets/prix-carburants" },
    ],
  },
  {
    nom: "TypeScript et JavaScript",
    contexte: "développement web",
    pourQuoi: "ce portfolio (Next.js, React, d3, tests Playwright) ; une application météo",
    depots: [
      { nom: "Ce portfolio", href: "https://github.com/Majin-M/portfolio" },
      { nom: "WeatherApp", href: "https://github.com/Majin-M/WeatherApp" },
    ],
  },
  {
    nom: "PHP",
    contexte: "développement web",
    pourQuoi:
      "applications Symfony (blog, boutique en ligne Volo avec son application React, conteneurisée avec Docker) et un trombinoscope, pendant la formation de concepteur développeur",
    depots: [
      { nom: "Volo", href: "https://github.com/Majin-M/Volo" },
      { nom: "Blog Symfony", href: "https://github.com/Majin-M/theestallionblog" },
      { nom: "Trombinoscope", href: "https://github.com/Majin-M/trombinoscope" },
    ],
  },
];

export const IDENTITE = {
  nom: "Marc Steven Mouthoud",
  titre: "Data Engineer",
  phrase: "Pipelines fiables, testés et documentés.",
  /** Photo dans public/ (par exemple "/photo.jpg") ; sans photo, les initiales. */
  photo: "/photo.jpg" as string | null,
  initiales: "MSM",
  liens: [
    { label: "GitHub", href: "https://github.com/Majin-M" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/stewmthd/" },
    { label: "CV (PDF)", href: "/cv/Marc-Steven-Mouthoud-CV.pdf" },
  ],
};

export const CERTIFICATIONS = [
  {
    organisme: "Scholia",
    intitule: "Titre professionnel Concepteur Développeur d'Applications",
    detail: "RNCP 37873 · niveau 6 (bac+3) · résultat attendu",
    annee: "2026",
    couvre: "applications sécurisées en couches, déploiement dans une démarche DevOps",
  },
  {
    organisme: "GOMYCODE",
    intitule: "The Data Science Bootcamp",
    detail: "8 mois, Dakar",
    annee: "2024",
    couvre: "SQL, modélisation OLAP, Python, pandas, analyse exploratoire, machine learning",
  },
  {
    organisme: "Dakar Institute of Technology",
    intitule: "Data Manager Certificate",
    detail: "reconnu par le ministère de la Formation professionnelle du Sénégal",
    annee: "2023",
    couvre: "SQL, ETL, web scraping et API, data warehouse sur Google Cloud",
  },
];

export type Jalon = {
  debut: string;
  fin?: string;
  type: "formation" | "expérience" | "projet";
  titre: string;
  lieu: string;
  detail: string;
  href?: string;
};

/** Du développement d'applications à la data, dans l'ordre. */
export const PARCOURS: Jalon[] = [
  {
    debut: "2019",
    fin: "2022",
    type: "formation",
    titre: "Bachelor Informatique de gestion, génie logiciel",
    lieu: "Institut Africain de Management, Dakar",
    detail: "algorithmique, systèmes, réseaux, SQL Server, MERISE, développement web",
  },
  {
    debut: "2023",
    type: "formation",
    titre: "Data Manager Certificate",
    lieu: "Dakar Institute of Technology",
    detail: "ETL, web scraping, data warehouse sur Google Cloud",
  },
  {
    debut: "2023",
    fin: "2024",
    type: "formation",
    titre: "The Data Science Bootcamp",
    lieu: "GOMYCODE, Dakar",
    detail: "SQL, entreposage OLAP, pandas, machine learning",
  },
  {
    debut: "2024",
    fin: "2025",
    type: "expérience",
    titre: "Data Manager, cabinet d'avocats PENA",
    lieu: "Pointe-Noire, Congo",
    detail: "base SQL Server alimentée depuis Excel (Python, BULK INSERT), tableaux de bord Tableau, dictionnaire de données",
  },
  {
    debut: "2025",
    fin: "2026",
    type: "formation",
    titre: "Titre professionnel Concepteur Développeur d'Applications",
    lieu: "Scholia, Thiais",
    detail: "RNCP 37873, niveau 6, résultat attendu : applications Symfony et JavaScript, démarche DevOps",
  },
  {
    debut: "2026",
    type: "projet",
    titre: "Inclusion financière",
    lieu: "projet publié",
    detail: "données d'enquête, nettoyage et modèle de prédiction",
    href: "/projets/inclusion-financiere",
  },
  {
    debut: "2026",
    type: "projet",
    titre: "Entrepôt de données SQL",
    lieu: "projet guidé",
    detail: "architecture Medallion sous SQL Server",
    href: "/projets/entrepot-sql",
  },
  {
    debut: "2026",
    type: "projet",
    titre: "Prénoms de France",
    lieu: "projet publié",
    detail: "pipeline batch, dbt et DuckDB, 39 tests",
    href: "/projets/prenoms-de-france",
  },
  {
    debut: "2026",
    type: "projet",
    titre: "Prix des carburants",
    lieu: "pipeline quotidien en production",
    detail: "ingestion chaque matin, historisation, 53 tests",
    href: "/projets/prix-carburants",
  },
  {
    debut: "2026",
    fin: "2028",
    type: "formation",
    titre: "Master Data Engineering & Cloud Computing",
    lieu: "Aivancity, en alternance",
    detail: "RNCP 37763, niveau 7 : architectures Big Data, cloud AWS et Azure",
  },
];
