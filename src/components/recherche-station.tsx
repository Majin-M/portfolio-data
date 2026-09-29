"use client";

// « La moins chère autour de moi », en deux temps : on donne un lieu (ville,
// code postal, position ou point de la carte), puis les stations s'affichent,
// la moins chère en tête. Rien n'est classé avant la première recherche.
//
// Les prix viennent de GitHub Pages, publiés chaque matin par le pipeline
// Carburant, et sont chargés au premier usage. La position reste dans le
// navigateur : les distances sont calculées ici, rien n'est envoyé.

import { useEffect, useEffectEvent, useRef, useState, type FormEvent } from "react";
import { useMouvementReduit } from "@/components/mouvement";
import {
  CARBURANTS,
  JOURS_PRIX_RECENT,
  URL_DONNEES_EN_LIGNE,
  URL_DONNEES_LOCALES,
  classer,
  dateReleve,
  distanceKm,
  euros,
  joliNom,
  jourDonnees,
  lireStations,
  trouverLieu,
  type FichierPrix,
  type Lieu,
  type Resultat,
  type Station,
} from "@/lib/carburant-commun";
import { EVENEMENT_LIEU } from "@/lib/carte-carburant";
import { decimal, nombre } from "@/lib/format";

const RAYONS = [5, 10, 20] as const;
const ORDRE_CARBURANTS = [1, 5, 6, 2, 3, 4];
const AFFICHES = 10;
/** Durée minimale de l'état « recherche » : le passage de la question au résultat se voit. */
const RECHERCHE_MS = 450;

type Donnees = { stations: Station[]; referenceAt: string; source: "en ligne" | "copie du site" };

type Props = {
  carburantInitial: number;
  rayonInitial: number;
  referenceInitiale: string;
  exemples: string[];
};

const itineraire = (s: Station) =>
  `https://www.openstreetmap.org/?mlat=${s.latitude}&mlon=${s.longitude}#map=17/${s.latitude}/${s.longitude}`;

export function RechercheStation({ carburantInitial, rayonInitial, referenceInitiale, exemples }: Props) {
  const [donnees, setDonnees] = useState<Donnees | null>(null);
  const [lieu, setLieu] = useState<Lieu | null>(null);
  const [carburant, setCarburant] = useState(carburantInitial);
  const [rayon, setRayon] = useState(rayonInitial);
  const [inclureAnciens, setInclureAnciens] = useState(false);
  const [saisie, setSaisie] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [enRecherche, setEnRecherche] = useState<string | null>(null);
  const enCours = useRef<Promise<Donnees | null> | null>(null);
  const zoneResultats = useRef<HTMLDivElement>(null);
  const reduit = useMouvementReduit();

  /** Les prix du matin sur GitHub Pages ; à défaut, la copie faite au build du site. */
  function charger(): Promise<Donnees | null> {
    if (donnees) return Promise.resolve(donnees);
    if (enCours.current) return enCours.current;
    const lire = async (url: string, source: Donnees["source"]) => {
      const reponse = await fetch(url, { cache: "no-cache" });
      if (!reponse.ok) throw new Error(String(reponse.status));
      const fichier = (await reponse.json()) as FichierPrix;
      return { stations: lireStations(fichier), referenceAt: fichier.reference_at, source };
    };
    enCours.current = lire(URL_DONNEES_EN_LIGNE, "en ligne")
      .catch(() => lire(URL_DONNEES_LOCALES, "copie du site"))
      .then((d) => {
        setDonnees(d);
        return d;
      })
      .catch(() => {
        enCours.current = null;
        setMessage("Les prix n'ont pas pu être chargés. Réessayez dans un instant.");
        return null;
      });
    return enCours.current;
  }

  /** Affiche l'état « recherche » le temps de charger les prix, puis place le lieu trouvé. */
  async function rechercher(libelle: string, trouver: (d: Donnees) => Lieu | null) {
    setMessage(null);
    setEnRecherche(libelle);
    const [d] = await Promise.all([charger(), new Promise((r) => setTimeout(r, RECHERCHE_MS))]);
    setEnRecherche(null);
    if (!d) return;
    const trouve = trouver(d);
    if (trouve) setLieu(trouve);
  }

  function chercher(texte: string) {
    const t = texte.trim();
    if (!t) return;
    void rechercher(t, (d) => {
      const trouve = trouverLieu(d.stations, t);
      if (!trouve) setMessage(`Aucune station trouvée pour « ${t} ». Essayez un nom de ville ou un code postal à 5 chiffres.`);
      else setSaisie("");
      return trouve;
    });
  }

  function soumettre(evenement: FormEvent) {
    evenement.preventDefault();
    chercher(saisie);
  }

  function localiser() {
    setMessage(null);
    if (!("geolocation" in navigator)) {
      setMessage("Ce navigateur ne donne pas accès à la position. Tapez une ville ou un code postal.");
      return;
    }
    setEnRecherche("votre position");
    void charger();
    navigator.geolocation.getCurrentPosition(
      (position) =>
        void rechercher("votre position", () => ({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          libelle: "votre position",
        })),
      () => {
        setEnRecherche(null);
        setMessage("Position refusée ou indisponible. Tapez une ville ou un code postal.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  }

  // Un clic sur la carte des prix place la recherche sur ce point, nommé
  // d'après la station la plus proche.
  const surPointCarte = useEffectEvent((point: { latitude: number; longitude: number }) => {
    void rechercher("ce point de la carte", (d) => {
      if (!d.stations.length) return { ...point, libelle: "ce point de la carte" };
      const proche = d.stations.reduce((a, b) =>
        distanceKm(point.latitude, point.longitude, b.latitude, b.longitude) <
        distanceKm(point.latitude, point.longitude, a.latitude, a.longitude)
          ? b
          : a,
      );
      return { ...point, libelle: `ce point, près de ${joliNom(proche.ville)}` };
    });
  });
  useEffect(() => {
    const ecouter = (e: Event) => surPointCarte((e as CustomEvent<{ latitude: number; longitude: number }>).detail);
    window.addEventListener(EVENEMENT_LIEU, ecouter);
    return () => window.removeEventListener(EVENEMENT_LIEU, ecouter);
  }, []);

  // Recherche lancée ou résultat arrivé : la zone des résultats vient à l'écran si elle n'y est pas.
  const amener = useEffectEvent(() => {
    const zone = zoneResultats.current;
    if (!zone) return;
    const { top } = zone.getBoundingClientRect();
    if (top < 0 || top > window.innerHeight * 0.6) {
      zone.scrollIntoView({ behavior: reduit ? "auto" : "smooth", block: "start" });
    }
  });
  useEffect(() => {
    if (enRecherche || lieu) amener();
  }, [enRecherche, lieu]);

  const classement = donnees && lieu ? classer(donnees.stations, lieu, carburant, rayon, inclureAnciens) : null;
  const nomCarburant = CARBURANTS[carburant];
  const premier = classement?.resultats.find((r) => r.recent);
  const suivants = classement ? classement.resultats.filter((r) => r !== premier).slice(0, AFFICHES - 1) : [];
  const referenceAt = donnees?.referenceAt ?? referenceInitiale;
  const pluriel = (n: number) => (n > 1 ? "s" : "");

  return (
    <div>
      {/* 1. La question */}
      <div className="border border-trait-fort bg-fond-2/40 p-5 sm:p-7">
        <form onSubmit={soumettre} role="search">
          <label htmlFor="lieu" className="text-lg text-encre">
            Où voulez-vous faire le plein ?
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 border border-trait-fort bg-fond focus-within:border-accent">
              <input
                id="lieu"
                type="search"
                value={saisie}
                onChange={(e) => {
                  setSaisie(e.target.value);
                  setMessage(null);
                }}
                onFocus={() => void charger()}
                placeholder="Ville ou code postal"
                autoComplete="off"
                spellCheck={false}
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-lg text-encre placeholder:text-encre-3 focus:outline-none"
              />
              <button type="submit" className="ui shrink-0 bg-accent px-5 font-medium !text-fond hover:opacity-90">
                Chercher
              </button>
            </div>
            <button
              type="button"
              onClick={localiser}
              className="ui inline-flex shrink-0 items-center justify-center gap-2 border border-trait-fort px-5 py-3 !text-encre hover:border-accent"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <circle cx="12" cy="12" r="7" />
                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
              Me localiser
            </button>
          </div>
        </form>

        <div className="mt-3 min-h-6" aria-live="polite">
          {message ? (
            <p className="text-sm text-encre">{message}</p>
          ) : (
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-sm text-encre-3">Par exemple</span>
              {exemples.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => chercher(e)}
                  className="text-sm text-encre-2 underline decoration-trait-fort underline-offset-4 hover:text-encre hover:decoration-accent"
                >
                  {e}
                </button>
              ))}
            </p>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-trait pt-5">
          <Choix
            nom="Carburant"
            options={ORDRE_CARBURANTS.map((id) => ({ valeur: id, label: CARBURANTS[id] }))}
            actif={carburant}
            choisir={setCarburant}
          />
          <Choix nom="Rayon" options={RAYONS.map((r) => ({ valeur: r, label: `${r} km` }))} actif={rayon} choisir={setRayon} />
        </div>
      </div>

      {/* 2. La réponse */}
      <div ref={zoneResultats} className="mt-8 scroll-mt-6" aria-live="polite" aria-busy={enRecherche !== null}>
        {enRecherche ? (
          <div className="border border-trait-fort p-8" role="status">
            <p className="text-lg text-encre">Recherche des stations autour de {enRecherche}…</p>
            <span className="mt-4 block h-px overflow-hidden bg-trait">
              <span className="recherche-barre block h-px w-1/3 bg-accent" />
            </span>
          </div>
        ) : !lieu || !classement ? (
          <div className="flex items-center gap-4 border border-dashed border-trait-fort p-8 text-encre-3">
            <svg viewBox="0 0 24 24" className="size-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
              <circle cx="12" cy="9.5" r="2.5" />
            </svg>
            <p>Les stations les moins chères autour du lieu choisi s&apos;afficheront ici.</p>
          </div>
        ) : (
          <div key={`${lieu.latitude},${lieu.longitude}`} className="resultats-apparition">
            <h3 id="resultats-titre" className="font-texte text-2xl leading-tight text-encre sm:text-3xl">
              {nomCarburant} · à moins de {rayon} km de {lieu.libelle}
            </h3>
            <p className="mt-1 text-sm text-encre-3">
              {nombre(classement.resultats.length)} station{pluriel(classement.resultats.length)} classée
              {pluriel(classement.resultats.length)}, de la moins chère à la plus chère
            </p>

            <div className="mt-6 grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-5">
                {premier ? (
                  <div className="border-2 border-accent p-6">
                    <p className="label !text-accent">La moins chère</p>
                    <p className="mt-3 font-donnees text-6xl leading-none tracking-tight text-encre">{euros(premier.prix.prix)}</p>
                    <p className="mt-4 text-lg leading-snug text-encre">{joliNom(premier.station.adresse)}</p>
                    <p className="text-encre-2">{joliNom(premier.station.ville)}</p>
                    <p className="mt-2 font-donnees text-sm text-encre-2">
                      à {decimal(premier.distance, 1)} km · relevé le {dateReleve(premier.prix.maj)}
                    </p>
                    <a
                      href={itineraire(premier.station)}
                      className="ui mt-5 inline-block border border-trait-fort px-4 py-2 !text-encre hover:border-accent"
                      rel="noopener"
                    >
                      Voir sur la carte ↗
                    </a>
                  </div>
                ) : (
                  <p className="border border-trait-fort p-6 text-encre-2">
                    Aucun prix de {nomCarburant} de moins de {JOURS_PRIX_RECENT} jours dans ce rayon. Élargissez le rayon ou
                    incluez les prix plus anciens.
                  </p>
                )}
                <Carte lieu={lieu} rayon={rayon} resultats={classement.resultats.slice(0, AFFICHES)} />
              </div>

              <div className="lg:col-span-7">
                {suivants.length > 0 && (
                  <>
                    <p className="label">Les suivantes</p>
                    <ol className="mt-2 border-t border-trait">
                      {suivants.map((r, i) => (
                        <LigneStation key={r.station.id} rang={i + 2} resultat={r} />
                      ))}
                    </ol>
                  </>
                )}
                <p className="mt-4 text-sm leading-relaxed text-encre-3">
                  {!inclureAnciens &&
                    classement.anciens > 0 &&
                    `${nombre(classement.anciens)} station${pluriel(classement.anciens)} avec un prix de plus de ${JOURS_PRIX_RECENT} jours, non classée${pluriel(classement.anciens)}. `}
                  {classement.suspects > 0 &&
                    `${nombre(classement.suspects)} prix suspect${pluriel(classement.suspects)} écarté${pluriel(classement.suspects)} (au niveau de l'essence).`}
                </p>
                <label className="mt-3 flex items-center gap-2 text-sm text-encre-2">
                  <input
                    type="checkbox"
                    checked={inclureAnciens}
                    onChange={(e) => setInclureAnciens(e.target.checked)}
                    className="size-4 accent-[var(--accent)]"
                  />
                  Inclure les prix de plus de {JOURS_PRIX_RECENT} jours
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="mt-8 text-sm leading-relaxed text-encre-3">
        Prix du {jourDonnees(referenceAt)}
        {donnees
          ? donnees.source === "en ligne"
            ? ", publiés ce matin par le pipeline sur GitHub Pages."
            : ", copie faite au build du site (les prix publiés sur GitHub Pages n'ont pas répondu)."
          : " ; les prix du matin se chargent à la première recherche."}{" "}
        Votre position reste dans votre navigateur : les distances, à vol d&apos;oiseau, sont calculées ici.
      </p>
    </div>
  );
}

/** Un groupe de boutons à choix unique (carburant, rayon). */
function Choix<T extends number>({
  nom,
  options,
  actif,
  choisir,
}: {
  nom: string;
  options: { valeur: T; label: string }[];
  actif: T;
  choisir: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-encre-2">{nom}</span>
      <div role="group" aria-label={nom} className="flex flex-wrap border border-trait-fort">
        {options.map((o) => (
          <button
            key={o.valeur}
            type="button"
            aria-pressed={actif === o.valeur}
            onClick={() => choisir(o.valeur)}
            className={`px-3 py-1.5 font-donnees text-sm ${actif === o.valeur ? "bg-encre text-fond" : "text-encre-2 hover:text-encre"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function LigneStation({ rang, resultat }: { rang: number; resultat: Resultat }) {
  const { station, prix, distance, recent } = resultat;
  return (
    <li className={`grid grid-cols-[2rem_1fr_auto] items-baseline gap-x-4 border-b border-trait py-3 ${recent ? "" : "opacity-55"}`}>
      <span className="font-donnees text-sm text-encre-3">{String(rang).padStart(2, "0")}</span>
      <span className="min-w-0">
        <span className="block truncate text-encre">
          {joliNom(station.adresse)}
          {station.autoroute && <span className="ml-2 font-donnees text-xs text-encre-3">autoroute</span>}
        </span>
        <span className="block font-donnees text-xs text-encre-2">
          {joliNom(station.ville)} · {decimal(distance, 1)} km ·{" "}
          {recent ? `relevé le ${dateReleve(prix.maj)}` : `prix vieux de ${prix.ageJours} jours`} ·{" "}
          <a href={itineraire(station)} className="underline decoration-trait-fort underline-offset-2 hover:decoration-accent" rel="noopener">
            carte<span className="sr-only"> de la station {joliNom(station.adresse)}</span> ↗
          </a>
        </span>
      </span>
      <span className="font-donnees text-lg text-encre tabular-nums">{euros(prix.prix)}</span>
    </li>
  );
}

/**
 * Les stations classées autour du lieu, à l'échelle : un cercle pour le rayon,
 * la moins chère en couleur d'accent. Projection locale (équirectangulaire),
 * exacte à quelques mètres près à cette échelle.
 */
function Carte({ lieu, rayon, resultats }: { lieu: Lieu; rayon: number; resultats: Resultat[] }) {
  const L = 400;
  const H = 280;
  const echelle = (H / 2 - 16) / rayon;
  const cosLat = Math.cos((lieu.latitude * Math.PI) / 180);
  const x = (lon: number) => L / 2 + (lon - lieu.longitude) * 111.32 * cosLat * echelle;
  const y = (lat: number) => H / 2 - (lat - lieu.latitude) * 110.57 * echelle;
  const premier = resultats.find((r) => r.recent);
  const autres = resultats.filter((r) => r !== premier);
  return (
    <svg
      viewBox={`0 0 ${L} ${H}`}
      className="mt-8 block h-auto w-full"
      role="img"
      aria-label={`Carte des ${resultats.length} stations classées dans un rayon de ${rayon} km autour de ${lieu.libelle}${premier ? ` ; la moins chère est à ${decimal(premier.distance, 1)} km` : ""}`}
    >
      <circle cx={L / 2} cy={H / 2} r={rayon * echelle} fill="var(--fond-2)" stroke="var(--trait-fort)" strokeDasharray="3 4" />
      {autres.map((r) => (
        <circle
          key={r.station.id}
          cx={x(r.station.longitude)}
          cy={y(r.station.latitude)}
          r="3.5"
          fill={r.recent ? "var(--encre-2)" : "none"}
          stroke="var(--encre-2)"
          strokeOpacity={r.recent ? 0 : 0.7}
        />
      ))}
      {premier && (
        <g>
          <circle cx={x(premier.station.longitude)} cy={y(premier.station.latitude)} r="10" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
          <circle cx={x(premier.station.longitude)} cy={y(premier.station.latitude)} r="5" fill="var(--accent)" />
        </g>
      )}
      <circle cx={L / 2} cy={H / 2} r="4.5" fill="var(--encre)" />
      <text x={L / 2 + 9} y={H / 2 - 7} fontSize="12" fill="var(--encre)" fontFamily="var(--font-donnees)">
        {lieu.libelle}
      </text>
      <text x={L / 2} y={H - 2} textAnchor="middle" fontSize="11" fill="var(--encre-3)" fontFamily="var(--font-donnees)">
        {rayon} km
      </text>
    </svg>
  );
}
