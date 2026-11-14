"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { Courbes, type SerieCourbe } from "@/components/graphiques/courbes";
import { nombre } from "@/lib/format";
import { initiale, sansAccents, type FichierSeries, type Sexe } from "@/lib/prenoms-commun";

type Totaux = Record<number, Record<Sexe, number>>;

type Props = {
  /** Naissances recensées par année et par sexe : dénominateur des parts. */
  totaux: Totaux;
  premiere: number;
  derniere: number;
  /** Prénom affiché au chargement, et sa série (préparée au build). */
  prenomInitial: string;
  seriesInitiales: FichierSeries;
  exemples: string[];
};

type Entree = { cle: string; norme: string; total: number };
/** Toutes les orthographes qui ne diffèrent que par les accents, ou celle affichée seule. */
type Graphies = "toutes" | "exacte";

const LIBELLES: Record<Sexe, string> = { F: "Filles", M: "Garçons" };
const COULEURS: Record<Sexe, string> = { F: "var(--serie-f)", M: "var(--serie-m)" };

function totalNaissances(series: FichierSeries[string]): number {
  return (Object.values(series) as [number, number][][]).reduce((s, points) => s + points.reduce((t, [, n]) => t + n, 0), 0);
}

/**
 * Additionne les séries de plusieurs orthographes, année par année. L'INSEE compte
 * chaque orthographe à part, et son codage des accents change en 1999 puis en
 * 2010-2012 : LÉA perd un tiers de ses naissances en 2010 au profit de LEA, alors
 * que le total des deux ne bouge pas.
 */
function additionner(liste: FichierSeries[string][]): FichierSeries[string] {
  const somme: FichierSeries[string] = {};
  for (const sexe of ["F", "M"] as Sexe[]) {
    const parAnnee = new Map<number, number>();
    for (const series of liste) for (const [a, n] of series[sexe] ?? []) parAnnee.set(a, (parAnnee.get(a) ?? 0) + n);
    if (parAnnee.size > 0) somme[sexe] = [...parAnnee.entries()].sort((x, y) => x[0] - y[0]);
  }
  return somme;
}

export function RecherchePrenom({ totaux, premiere, derniere, prenomInitial, seriesInitiales, exemples }: Props) {
  // Fichiers d'initiale complets, chargés à la demande.
  const [fichiers, setFichiers] = useState<Record<string, FichierSeries>>({});
  const [saisie, setSaisie] = useState("");
  const [prenom, setPrenom] = useState(prenomInitial);
  const [mode, setMode] = useState<"effectifs" | "part">("effectifs");
  const [graphies, setGraphies] = useState<Graphies>("toutes");
  const [chargement, setChargement] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const enCours = useRef(new Map<string, Promise<FichierSeries | null>>());
  const derniereDemande = useRef(0);

  function charger(lettre: string): Promise<FichierSeries | null> {
    const deja = enCours.current.get(lettre);
    if (deja) return deja;
    setChargement(lettre);
    const promesse = fetch(`/data/prenoms/series/${lettre}.json`)
      .then((reponse) => {
        if (!reponse.ok) throw new Error(String(reponse.status));
        return reponse.json() as Promise<FichierSeries>;
      })
      .then((donnees) => {
        setFichiers((f) => ({ ...f, [lettre]: donnees }));
        return donnees;
      })
      .catch(() => {
        enCours.current.delete(lettre);
        setMessage("Le fichier de données n'a pas pu être chargé. Réessayez dans un instant.");
        return null;
      })
      .finally(() => setChargement((c) => (c === lettre ? null : c)));
    enCours.current.set(lettre, promesse);
    return promesse;
  }

  const cleSaisie = saisie.trim().toLocaleUpperCase("fr-FR");
  const lettreSaisie = cleSaisie ? initiale(cleSaisie) : null;

  // Index de l'initiale saisie, trié du prénom le plus donné au moins donné.
  const index = useMemo<Entree[]>(() => {
    const fichier = lettreSaisie ? fichiers[lettreSaisie] : undefined;
    if (!fichier) return [];
    return Object.entries(fichier)
      .map(([cle, series]) => ({ cle, norme: sansAccents(cle), total: totalNaissances(series) }))
      .sort((a, b) => b.total - a.total);
  }, [fichiers, lettreSaisie]);

  const suggestions = useMemo(() => {
    if (!cleSaisie) return [];
    const debut = sansAccents(cleSaisie);
    return index.filter((e) => e.norme.startsWith(debut) && e.cle !== prenom).slice(0, 6);
  }, [index, cleSaisie, prenom]);

  async function afficher(texte: string, graphiesVoulues: Graphies = "toutes") {
    const cle = texte.trim().toLocaleUpperCase("fr-FR");
    if (!cle) return;
    const lettre = initiale(cle);
    if (!/[A-Z]/.test(lettre)) {
      setMessage("Un prénom du fichier commence toujours par une lettre.");
      return;
    }
    const demande = ++derniereDemande.current;
    setMessage(null);
    const fichier = await charger(lettre);
    if (!fichier || demande !== derniereDemande.current) return;

    // Saisie avec accents : l'orthographe exacte d'abord. Saisie sans accent
    // (« lea ») : l'orthographe la plus donnée (LÉA), les autres restent proposées.
    const norme = sansAccents(cle);
    // Une orthographe choisie dans la liste est affichée telle quelle, même sans accent.
    if (fichier[cle] && (cle !== norme || graphiesVoulues === "exacte")) {
      setPrenom(cle);
      setGraphies(graphiesVoulues);
      setSaisie("");
      return;
    }
    const variantes = Object.keys(fichier)
      .filter((k) => sansAccents(k) === norme)
      .sort((a, b) => totalNaissances(fichier[b]) - totalNaissances(fichier[a]));
    if (variantes.length > 0) {
      setPrenom(variantes[0]);
      setGraphies(graphiesVoulues);
      setSaisie("");
      return;
    }
    setMessage(
      `« ${cle} » n'apparaît pas dans le fichier : aucune année ne compte assez de naissances pour que l'INSEE le publie.`,
    );
  }

  function soumettre(evenement: FormEvent) {
    evenement.preventDefault();
    void afficher(saisie);
  }

  // Le prénom initial et ses autres orthographes sont servis par le build ; les autres viennent du cache.
  const lettreAffichee = initiale(prenom);
  const fichierAffiche = fichiers[lettreAffichee] ?? seriesInitiales;
  const variantes = useMemo(() => {
    const norme = sansAccents(prenom);
    return Object.keys(fichierAffiche)
      .filter((k) => k !== prenom && sansAccents(k) === norme)
      .map((k) => ({ cle: k, total: totalNaissances(fichierAffiche[k]) }))
      .sort((a, b) => b.total - a.total);
  }, [fichierAffiche, prenom]);
  const additionne = graphies === "toutes" && variantes.length > 0;
  const seriesPrenom = useMemo(
    () =>
      additionne
        ? additionner([fichierAffiche[prenom] ?? {}, ...variantes.map((v) => fichierAffiche[v.cle])])
        : (fichierAffiche[prenom] ?? {}),
    [additionne, fichierAffiche, prenom, variantes],
  );

  const sexes = (["F", "M"] as Sexe[]).filter((s) => seriesPrenom[s]);
  const annees = Array.from({ length: derniere - premiere + 1 }, (_, k) => premiere + k);

  const courbes: SerieCourbe[] = sexes.map((sexe) => {
    const publiees = new Map(seriesPrenom[sexe]);
    return {
      id: sexe,
      label: LIBELLES[sexe],
      couleur: COULEURS[sexe],
      points: annees.map((a) => {
        const n = publiees.get(a) ?? 0;
        return [a, mode === "part" ? n / totaux[a][sexe] : n] as [number, number];
      }),
      absences: annees.filter((a) => !publiees.has(a)),
    };
  });

  const resume = sexes.map((sexe) => {
    const points = seriesPrenom[sexe] ?? [];
    const pic = points.reduce((m, p) => (p[1] > m[1] ? p : m), points[0]);
    return {
      sexe,
      total: points.reduce((t, [, n]) => t + n, 0),
      pic,
      publiees: points.length,
    };
  });

  return (
    <div>
      <form onSubmit={soumettre} className="flex flex-col gap-3 sm:flex-row sm:items-end" role="search">
        <div className="flex-1">
          <label htmlFor="prenom" className="ui block">
            Tape un prénom
          </label>
          <input
            id="prenom"
            type="search"
            value={saisie}
            onChange={(e) => {
              const valeur = e.target.value;
              setSaisie(valeur);
              setMessage(null);
              const cle = valeur.trim().toLocaleUpperCase("fr-FR");
              if (cle && /[A-Z]/.test(initiale(cle))) void charger(initiale(cle));
            }}
            placeholder="ton prénom"
            autoComplete="off"
            spellCheck={false}
            className="mt-1 w-full border-0 border-b-2 border-trait-fort bg-transparent py-2 font-donnees text-3xl tracking-wide text-encre uppercase placeholder:text-encre-3 focus:border-accent focus:outline-none focus-visible:outline-none sm:text-4xl"
          />
        </div>
        <button type="submit" className="ui presse shrink-0 border border-trait-fort px-5 py-3 text-encre hover:border-accent">
          Afficher
        </button>
      </form>

      <div className="mt-3 min-h-6" aria-live="polite">
        {message ? (
          <p className="text-sm text-encre-2">{message}</p>
        ) : suggestions.length > 0 ? (
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="ui text-sm text-encre-3">Suggestions</span>
            {suggestions.map((s) => (
              <button
                key={s.cle}
                type="button"
                onClick={() => void afficher(s.cle)}
                className="font-donnees text-sm text-encre-2 underline decoration-trait-fort underline-offset-4 hover:text-encre hover:decoration-accent"
              >
                {s.cle}
              </button>
            ))}
          </p>
        ) : (
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="ui text-sm text-encre-3">Exemples</span>
            {exemples.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => void afficher(e)}
                className="font-donnees text-sm text-encre-2 underline decoration-trait-fort underline-offset-4 hover:text-encre hover:decoration-accent"
              >
                {e}
              </button>
            ))}
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div aria-live="polite">
          <p className="font-donnees text-2xl text-encre sm:text-3xl">{prenom}</p>
          {additionne && (
            <p className="mt-1 font-donnees text-xs text-encre-3">
              + {variantes.map((v) => v.cle).join(", ")} : toutes les orthographes additionnées
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
        {variantes.length > 0 && (
          <div role="group" aria-label="Orthographes" className="flex border border-trait-fort font-donnees text-xs">
            {(
              [
                ["toutes", "Toutes les orthographes"],
                ["exacte", "Cette orthographe seule"],
              ] as const
            ).map(([valeur, libelle]) => (
              <button
                key={valeur}
                type="button"
                aria-pressed={graphies === valeur}
                onClick={() => setGraphies(valeur)}
                className={`px-3 py-2 font-texte text-sm ${graphies === valeur ? "bg-encre text-fond" : "text-encre-2 hover:text-encre"}`}
              >
                {libelle}
              </button>
            ))}
          </div>
        )}
        <div role="group" aria-label="Unité" className="flex border border-trait-fort font-donnees text-xs">
          {(
            [
              ["effectifs", "Naissances"],
              ["part", "Part des naissances"],
            ] as const
          ).map(([valeur, libelle]) => (
            <button
              key={valeur}
              type="button"
              aria-pressed={mode === valeur}
              onClick={() => setMode(valeur)}
              className={`px-3 py-2 font-texte text-sm ${mode === valeur ? "bg-encre text-fond" : "text-encre-2 hover:text-encre"}`}
            >
              {libelle}
            </button>
          ))}
        </div>
        </div>
      </div>

      <div className="mt-4">
        <Courbes
          series={courbes}
          format={mode === "part" ? "pourcent" : "nombre"}
          hauteur={340}
          attente={chargement !== null && chargement === lettreSaisie}
          cle={`${prenom}-${mode}-${additionne}`}
          description={`${mode === "part" ? "Part des naissances" : "Naissances"} de ${prenom}${additionne ? ", toutes orthographes additionnées," : ""} par année, ${premiere}-${derniere}`}
          annotations={[{ x: 1946, label: "1946 · exhaustivité garantie", court: "1946" }]}
        />
      </div>

      <ul className="mt-6 grid gap-x-8 gap-y-3 border-t border-trait pt-4 sm:grid-cols-2">
        {resume.map((r) => (
          <li key={r.sexe} className="flex gap-3">
            <span
              aria-hidden
              className="mt-2 inline-block h-0.5 w-4 shrink-0 rounded-full"
              style={{ background: COULEURS[r.sexe] }}
            />
            <div>
              <p className="label">{LIBELLES[r.sexe]}</p>
              <p className="font-donnees text-sm text-encre-2">
                <span className="text-encre">{nombre(r.total)}</span> naissances publiées · pic en {r.pic[0]} ({nombre(r.pic[1])})
                · publié {r.publiees} années sur {derniere - premiere + 1}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {variantes.length > 0 && (
        <p className="mt-4 max-w-3xl text-sm text-encre-2">
          {additionne ? "Orthographes additionnées : " : "Autre orthographe dans le fichier : "}
          {additionne && (
            <>
              <span className="font-donnees text-encre">{prenom}</span> ({nombre(totalNaissances(fichierAffiche[prenom] ?? {}))}{" "}
              naissances),{" "}
            </>
          )}
          {variantes.map((v, i) => (
            <span key={v.cle}>
              {i > 0 && ", "}
              <button
                type="button"
                onClick={() => void afficher(v.cle, "exacte")}
                className="font-donnees text-encre underline decoration-trait-fort underline-offset-4 hover:decoration-accent"
              >
                {v.cle}
              </button>{" "}
              ({nombre(v.total)} naissances)
            </span>
          ))}
          . L&apos;INSEE compte chaque orthographe à part, et sa saisie des accents a changé en 1999 puis en 2010-2012 : seule,
          une orthographe peut perdre ou gagner des naissances sans que les parents aient changé de choix.
        </p>
      )}
    </div>
  );
}
