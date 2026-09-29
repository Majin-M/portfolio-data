"use client";

// Accueil : l'interface du système, façon JARVIS. Chaque projet est un
// panneau holographique disposé en arc autour du visiteur, avec un vrai
// aperçu de ses données. On le survole, il s'avance ; on le choisit, il
// s'ouvre et mène à la page du projet.
//
// Tout ce qui s'affiche est réel : aperçus et volumes viennent des exports.
// Sur petit écran, les panneaux s'empilent à plat ; avec le mouvement réduit,
// rien ne bouge.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import { Logo } from "@/components/logos";
import { Medaille } from "@/components/medaille";
import { useMouvementReduit } from "@/components/mouvement";
import { ETAPES, type Projet } from "@/lib/projets";

const CYAN = "#8fdcee";

/**
 * Ce qu'une carte dit de son projet, en un coup d'œil : une illustration du
 * sujet, un chiffre clé et une phrase. Toutes les valeurs sont réelles.
 */
export type Apercu = {
  visuel: Visuel;
  chiffre: { valeur: string; legende: string };
  phrase: string;
  stack: string[];
};

export type Visuel =
  | { type: "courbe"; points: [number, number][]; debut: string; fin: string }
  | { type: "medailles"; volumes: [string, string, string] }
  | { type: "unites"; sur100: number }
  | { type: "stations" };

type ProjetAccueil = Pick<Projet, "id" | "numero" | "titre" | "href" | "statut" | "guide" | "etapes">;

function derniereEtape(p: ProjetAccueil) {
  let d = -1;
  ETAPES.forEach((e, i) => {
    if (p.etapes[e] !== null) d = i;
  });
  return d;
}

/** Coins d'instrument autour d'un panneau. */
function Coins() {
  const c = "absolute size-4 border-[#8fdcee]";
  return (
    <>
      <span aria-hidden className={`${c} -top-px -left-px border-t-2 border-l-2`} />
      <span aria-hidden className={`${c} -top-px -right-px border-t-2 border-r-2`} />
      <span aria-hidden className={`${c} -bottom-px -left-px border-b-2 border-l-2`} />
      <span aria-hidden className={`${c} -right-px -bottom-px border-r-2 border-b-2`} />
    </>
  );
}

/** L'illustration qui dit le sujet du projet. */
function Illustration({ visuel }: { visuel: Visuel }) {
  if (visuel.type === "courbe") {
    // Une seule courbe, du début à la fin, avec ses deux valeurs écrites.
    const pts = visuel.points;
    const [x0, x1] = [pts[0][0], pts[pts.length - 1][0]];
    const yMax = Math.max(...pts.map((p) => p[1]));
    const L = 260;
    const H = 110;
    const x = (a: number) => 8 + ((a - x0) / (x1 - x0)) * (L - 16);
    const y = (v: number) => 18 + (1 - v / yMax) * (H - 34);
    const d = pts.map(([a, v], i) => `${i ? "L" : "M"}${x(a).toFixed(1)},${y(v).toFixed(1)}`).join("");
    const [a0, v0] = pts[0];
    const [a1, v1] = pts[pts.length - 1];
    return (
      <svg viewBox={`0 0 ${L} ${H}`} className="block h-auto w-full" aria-hidden>
        <path d={`${d}L${x(a1)},${H - 14}L${x(a0)},${H - 14}Z`} fill={CYAN} fillOpacity=".08" />
        <path d={d} fill="none" stroke={CYAN} strokeWidth="2" strokeLinejoin="round" />
        <circle cx={x(a0)} cy={y(v0)} r="3.5" fill={CYAN} />
        <circle cx={x(a1)} cy={y(v1)} r="3.5" fill="var(--accent)" />
        <text x={x(a0) + 6} y={y(v0) - 8} fontSize="13" fill="#e8e5dc" fontFamily="var(--font-donnees)">
          {visuel.debut}
        </text>
        <text x={x(a1)} y={y(v1) - 10} textAnchor="end" fontSize="13" fill="#e8e5dc" fontFamily="var(--font-donnees)">
          {visuel.fin}
        </text>
        <text x={x(a0)} y={H - 1} fontSize="10" fill={`${CYAN}99`} fontFamily="var(--font-donnees)">
          {a0}
        </text>
        <text x={x(a1)} y={H - 1} textAnchor="end" fontSize="10" fill={`${CYAN}99`} fontFamily="var(--font-donnees)">
          {a1}
        </text>
      </svg>
    );
  }
  if (visuel.type === "medailles") {
    const metaux = [
      ["bronze", "I", "Bronze", 62],
      ["argent", "II", "Silver", 70],
      ["or", "III", "Gold", 80],
    ] as const;
    return (
      <div className="flex items-end justify-between gap-1">
        {metaux.map(([metal, numero, couche, taille], i) => (
          <div key={metal} className="flex flex-1 flex-col items-center">
            <Medaille metal={metal} numero={numero} inscription={couche} valeur="" taille={taille} />
            <span className="mt-1.5 font-donnees text-[0.65rem] text-[#e8e5dc]/80">{visuel.volumes[i]}</span>
          </div>
        ))}
      </div>
    );
  }
  if (visuel.type === "unites") {
    // 100 personnes : celles qui ont un compte bancaire sont allumées.
    return (
      <div className="grid grid-cols-20 gap-1.5 py-2" aria-hidden>
        {Array.from({ length: 100 }, (_, i) => (
          <span
            key={i}
            className="aspect-square rounded-full"
            style={{ background: i < visuel.sur100 ? "var(--accent)" : `${CYAN}2e` }}
          />
        ))}
      </div>
    );
  }
  // Stations autour du visiteur ; la moins chère est mise en évidence.
  const stations = [
    [58, 30],
    [190, 22],
    [226, 78],
    [40, 86],
  ];
  return (
    <svg viewBox="0 0 260 110" className="block h-auto w-full" aria-hidden>
      {[20, 55, 90].map((y) => (
        <line key={y} x1="0" y1={y} x2="260" y2={y} stroke={CYAN} strokeOpacity=".12" />
      ))}
      {[40, 110, 180, 240].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="110" stroke={CYAN} strokeOpacity=".12" />
      ))}
      <circle cx="120" cy="58" r="44" fill="none" stroke={CYAN} strokeOpacity=".4" strokeDasharray="3 4" />
      {stations.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill={`${CYAN}66`} />
      ))}
      <circle cx="150" cy="92" r="9" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
      <circle cx="150" cy="92" r="4.5" fill="var(--accent)" />
      <circle cx="120" cy="58" r="5" fill="#e8e5dc" />
      <text x="128" y="54" fontSize="11" fill="#e8e5dc" fontFamily="var(--font-donnees)">
        vous
      </text>
      <text x="163" y="96" fontSize="11" fill="#e8e5dc" fontFamily="var(--font-donnees)">
        la moins chère
      </text>
    </svg>
  );
}

/** Un panneau holographique : un projet, compris d'un coup d'œil. */
function Panneau({
  projet,
  apercu,
  index,
  total,
  allume,
  estompe,
  ouvert,
  onActiver,
  onOuvrir,
}: {
  projet: ProjetAccueil;
  apercu: Apercu;
  index: number;
  total: number;
  allume: boolean;
  estompe: boolean;
  ouvert: boolean;
  onActiver: () => void;
  onOuvrir: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  // Disposition en arc : les panneaux des bords se tournent vers le centre.
  const centre = (total - 1) / 2;
  const angle = (centre - index) * 14;
  const recul = Math.abs(index - centre) * 46;
  const enCours = projet.statut === "en cours";
  const etiquette = enCours ? "en cours" : projet.guide ? "projet guidé" : "";
  const d = derniereEtape(projet);

  const contenu = (
    <>
      <Coins />
      {/* Lignes de balayage de l'hologramme */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: `repeating-linear-gradient(to bottom, ${CYAN}0a 0 1px, transparent 1px 3px)` }}
      />
      <div className="relative flex h-full flex-col p-5">
        <p className="flex items-baseline justify-between font-donnees text-[0.65rem] tracking-[0.18em] uppercase">
          <span style={{ color: allume ? "var(--accent)" : CYAN }}>{projet.numero}</span>
          {etiquette && <span className="text-[#8fdcee]/70">{etiquette}</span>}
        </p>
        <h2 className="mt-2 font-texte text-2xl leading-tight text-[#e8e5dc]">{projet.titre}</h2>

        <div className="mt-5">
          <Illustration visuel={apercu.visuel} />
        </div>

        <p className="mt-5">
          <span className="block font-donnees text-2xl whitespace-nowrap text-[#e8e5dc]">{apercu.chiffre.valeur}</span>
          <span className="mt-0.5 block text-sm leading-tight text-[#e8e5dc]/70">{apercu.chiffre.legende}</span>
        </p>
        <p className="mt-2 text-[0.95rem] leading-snug text-[#e8e5dc]/85">{apercu.phrase}</p>

        <div className="mt-auto pt-5">
          {enCours && (
            <div className="mb-3 flex gap-1" role="img" aria-label={`${d + 1} étapes sur ${ETAPES.length} réalisées`}>
              {ETAPES.map((e, k) => (
                <span
                  key={e}
                  className="h-1.5 flex-1"
                  style={{ background: k <= d ? `${CYAN}99` : "transparent", border: `1px solid ${CYAN}55` }}
                />
              ))}
            </div>
          )}
          <ul className="flex flex-wrap gap-x-3 gap-y-1.5 font-donnees text-[0.7rem] text-[#e8e5dc]/85" aria-label="Outils">
            {apercu.stack.map((o) => (
              <li key={o} className="flex items-center gap-1.5">
                <Logo nom={o} className="size-3.5" />
                {o}
              </li>
            ))}
          </ul>
          <p
            className="mt-3 text-right font-donnees text-[0.7rem] tracking-[0.15em] uppercase"
            style={{ color: enCours ? `${CYAN}99` : "var(--accent)" }}
          >
            {enCours ? "À venir" : "Ouvrir"}
          </p>
        </div>
      </div>
    </>
  );

  const classes = `holo-panneau relative block h-full border bg-[#0b1418]/80 backdrop-blur-sm transition-[transform,opacity,border-color,box-shadow] duration-300 ${
    allume ? "border-[#8fdcee]/70" : "border-[#8fdcee]/25"
  }`;
  const style = {
    "--angle": `${angle}deg`,
    "--recul": `${-recul}px`,
    "--avance": allume ? "56px" : "0px",
    "--delai": `${350 + index * 180}ms`,
    opacity: estompe ? 0.45 : 1,
    boxShadow: allume ? `0 0 40px ${CYAN}33, inset 0 0 30px ${CYAN}14` : `inset 0 0 24px ${CYAN}0d`,
  } as CSSProperties;

  return (
    <li className={`holo-emplacement ${ouvert ? "holo-ouvert" : ""}`} style={style}>
      {projet.href ? (
        <Link
          href={projet.href}
          className={classes}
          onPointerEnter={onActiver}
          onFocus={onActiver}
          onClick={onOuvrir}
          aria-label={`${projet.numero} · ${projet.titre} : ${apercu.phrase} Ouvrir le projet.`}
        >
          {contenu}
        </Link>
      ) : (
        <div
          className={classes}
          role="group"
          onPointerEnter={onActiver}
          tabIndex={0}
          onFocus={onActiver}
          aria-label={`${projet.numero} · ${projet.titre} : ${apercu.phrase} En cours.`}
        >
          {contenu}
        </div>
      )}
    </li>
  );
}

export function SystemeAccueil({
  projets,
  apercus,
}: {
  projets: ProjetAccueil[];
  apercus: Record<string, Apercu>;
}) {
  const [actif, setActif] = useState<number | null>(null);
  const [ouverture, setOuverture] = useState<number | null>(null);
  const [inclinaison, setInclinaison] = useState({ x: 0, y: 0 });
  const scene = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const reduit = useMouvementReduit();

  // Les pages des projets sont préchargées : l'ouverture n'attend pas le réseau.
  useEffect(() => {
    projets.forEach((q) => q.href && router.prefetch(q.href));
  }, [projets, router]);

  function incliner(e: PointerEvent<HTMLDivElement>) {
    if (reduit || !scene.current) return;
    const r = scene.current.getBoundingClientRect();
    setInclinaison({ x: ((e.clientX - r.left) / r.width - 0.5) * 2, y: ((e.clientY - r.top) / r.height - 0.5) * 2 });
  }

  function ouvrir(i: number, href: string) {
    return (e: MouseEvent<HTMLAnchorElement>) => {
      if (reduit || e.metaKey || e.ctrlKey || e.shiftKey) return; // navigation normale
      e.preventDefault();
      setOuverture(i);
      // La navigation part tout de suite : l'accueil reste affiché, panneau en
      // cours d'ouverture, le temps que la page du projet soit prête.
      requestAnimationFrame(() => router.push(href));
    };
  }

  const p = ouverture !== null ? projets[ouverture] : null;

  return (
    <section aria-labelledby="projets" className="scene-sombre relative isolate overflow-hidden bg-[#0b0d0e] text-[#e8e5dc]">
      {/* Table holographique : un quadrillage qui fuit vers l'horizon */}
      <div aria-hidden className="holo-table pointer-events-none absolute inset-x-0 bottom-0 h-[55%]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse 60% 45% at 50% 62%, ${CYAN}14, transparent 70%)` }}
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 pt-8 pb-16 sm:px-8">
        <h2 id="projets" className="mb-6 font-donnees text-[0.75rem] tracking-[0.18em] text-[#8fdcee]/80 uppercase">
          Projets
        </h2>

        {/* Les panneaux, en arc sur grand écran */}
        <div
          ref={scene}
          className="holo-scene"
          onPointerMove={incliner}
          onPointerLeave={() => {
            setActif(null);
            setInclinaison({ x: 0, y: 0 });
          }}
        >
          <ol
            className="holo-arc grid gap-5 lg:grid-cols-4 lg:gap-4"
            style={{ "--incl-x": `${inclinaison.x * 5}deg`, "--incl-y": `${-inclinaison.y * 3}deg` } as CSSProperties}
          >
            {projets.map((q, i) => (
              <Panneau
                key={q.id}
                projet={q}
                apercu={apercus[q.id]}
                index={i}
                total={projets.length}
                allume={actif === i || ouverture === i}
                estompe={(actif !== null && actif !== i) || (ouverture !== null && ouverture !== i)}
                ouvert={ouverture === i}
                onActiver={() => setActif(i)}
                onOuvrir={q.href ? ouvrir(i, q.href) : () => {}}
              />
            ))}
          </ol>
        </div>
      </div>

      {/* Ouverture d'un projet : un chargement explicite, bref */}
      {p && (
        <div role="status" className="holo-chargement pointer-events-none absolute inset-x-0 bottom-10 mx-auto w-80 text-center">
          <p className="font-donnees text-[0.7rem] tracking-[0.18em] text-[#8fdcee] uppercase">
            Ouverture · {p.numero} {p.titre}
          </p>
          <span className="mt-2 block h-px bg-[#8fdcee]/20">
            <span className="holo-barre block h-px bg-[#8fdcee]" />
          </span>
        </div>
      )}
    </section>
  );
}
