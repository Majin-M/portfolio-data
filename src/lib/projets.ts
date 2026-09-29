// Registre des projets : alimente l'accueil (matrice du flux) et la page Projets.
// Les mesures citées ici viennent des exports ou d'exécutions datées, jamais
// d'estimations.

export const GITHUB = "https://github.com/Majin-M";

export const ETAPES = ["Raw", "Ingest", "Transform", "Model", "Store", "Analyze"] as const;
export type Etape = (typeof ETAPES)[number];

export type Projet = {
  id: string;
  numero: string;
  titre: string;
  resume: string;
  competence: string;
  statut: "publié" | "en cours";
  guide?: string;
  href?: string;
  depot?: string;
  stack: string[];
  /** Ce que le projet met en œuvre à chaque étape du flux (null : pas encore). */
  etapes: Record<Etape, string | null>;
  /** Volumes réels affichés sur le chemin du flux (mesurés, jamais estimés). */
  volumes: Partial<Record<Etape, string>>;
};

export const PROJETS: Projet[] = [
  {
    id: "prenoms-de-france",
    numero: "01",
    titre: "Prénoms de France",
    resume: "126 ans de naissances : ingestion traçable, modèle en couches, 39 tests de qualité, séries publiées sur ce site.",
    competence: "Batch ETL, modélisation en couches, qualité des données",
    statut: "publié",
    href: "/projets/prenoms-de-france",
    depot: "https://github.com/Majin-M/prenoms_france",
    stack: ["Python", "DuckDB", "dbt", "GitHub Actions"],
    etapes: {
      Raw: "Parquet INSEE, 6,6 M lignes",
      Ingest: "ingest.py : sha256, schéma contrôlé",
      Transform: "dbt : staging typé",
      Model: "3 marts testés",
      Store: "DuckDB, fichier local",
      Analyze: "JSON → graphiques de ce site",
    },
    // Remplacés au build par les valeurs de metadata.json (voir volumesPrenoms).
    volumes: {},
  },
  {
    id: "entrepot-sql",
    numero: "02",
    titre: "Entrepôt de données SQL",
    resume: "Ventes issues d'un CRM et d'un ERP, consolidées en trois couches jusqu'à un schéma en étoile.",
    competence: "Architecture Medallion, modèle en étoile",
    statut: "publié",
    guide: "Projet guidé · Data With Baraa",
    href: "/projets/entrepot-sql",
    depot: "https://github.com/Majin-M/sql-data-warehouse-project",
    stack: ["SQL Server", "T-SQL", "draw.io"],
    etapes: {
      Raw: "6 CSV : CRM + ERP",
      Ingest: "BULK INSERT → bronze",
      Transform: "procédure silver",
      Model: "étoile gold : 2 dimensions, 1 fait",
      Store: "SQL Server Express",
      Analyze: "vues de reporting, requêtes",
    },
    // Exécution du 27 septembre 2026 (src/contenu/entrepot-sql.ts).
    volumes: {
      Raw: "6 fichiers",
      Ingest: "116 292 lignes",
      Model: "60 398 lignes de faits",
      Analyze: "3 requêtes publiées",
    },
  },
  {
    id: "inclusion-financiere",
    numero: "03",
    titre: "Inclusion financière",
    resume:
      "Qui possède un compte bancaire en Afrique de l'Est ? Analyse exploratoire, nettoyage et modèle de prédiction, évalué sans complaisance.",
    competence: "Analyse exploratoire, qualité des données, machine learning",
    statut: "publié",
    href: "/projets/inclusion-financiere",
    depot: "https://github.com/Majin-M/inclusion_financiere",
    stack: ["Python", "Pandas", "scikit-learn", "Streamlit"],
    etapes: {
      Raw: "CSV FinScope, 4 pays",
      Ingest: "pandas",
      Transform: "EDA : manquants, snake_case",
      Model: "Random Forest, 200 arbres",
      Store: "CSV nettoyé",
      Analyze: "application Streamlit",
    },
    // Mesuré le 28 septembre 2026 (src/contenu/inclusion-financiere.ts).
    volumes: {
      Raw: "23 524 réponses",
      Transform: "267 manquants traités",
      Model: "AUC 0,85",
    },
  },
  {
    id: "prix-carburants",
    numero: "04",
    titre: "Prix des carburants",
    resume:
      "Les prix de toutes les stations, chaque matin : un pipeline qui historise les changements de prix, et la station la moins chère autour de soi.",
    competence: "Ingestion quotidienne, historisation, géolocalisation",
    statut: "publié",
    href: "/projets/prix-carburants",
    depot: "https://github.com/Majin-M/Carburant",
    stack: ["Python", "DuckDB", "dbt", "GitHub Actions"],
    etapes: {
      Raw: "XML annuels officiels, ZIP archivés",
      Ingest: "ingest.py : flux, sha256, Parquet",
      Transform: "dbt : staging typé, heure de Paris",
      Model: "3 marts, 53 tests",
      Store: "Parquet + DuckDB",
      Analyze: "GitHub Pages → recherche de ce site",
    },
    // Complétés au build par les valeurs de metadata.json (voir volumesCarburant).
    volumes: { Raw: "9,5 M relevés" },
  },
];
