// Médaille d'une couche Medallion : bronze, argent (silver) ou or (gold).
// Disque métallique, crénelage sur la tranche, inscription gravée en arc,
// chiffre romain au centre. Un reflet balaie la pièce à son apparition.

import { useId, type CSSProperties } from "react";

export type Metal = "bronze" | "argent" | "or";

// Teintes fixes : une médaille garde son métal dans les deux thèmes.
const METAUX: Record<Metal, { clair: string; base: string; sombre: string; grave: string }> = {
  bronze: { clair: "#f3b67c", base: "#cd7f32", sombre: "#6e3f14", grave: "#43260a" },
  argent: { clair: "#ffffff", base: "#c7ccd1", sombre: "#6f777f", grave: "#353b42" },
  or: { clair: "#fff0b0", base: "#e0b44c", sombre: "#7c5710", grave: "#453005" },
};

export function Medaille({
  metal,
  numero,
  inscription,
  valeur,
  taille = 180,
  delai = 0,
}: {
  metal: Metal;
  numero: string;
  inscription: string;
  valeur: string;
  taille?: number;
  delai?: number;
}) {
  const id = useId().replace(/:/g, "");
  const m = METAUX[metal];
  const crans = Array.from({ length: 96 }, (_, i) => (i * 360) / 96);

  return (
    <svg
      viewBox="0 0 200 200"
      width={taille}
      height={taille}
      className="medaille block max-w-full"
      style={{ "--delai": `${delai}ms`, filter: `drop-shadow(0 0 ${metal === "or" ? 22 : 12}px ${m.base}55)` } as CSSProperties}
      role="img"
      aria-label={`${inscription} : ${valeur}`}
    >
      <defs>
        <linearGradient id={`${id}-tranche`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={m.clair} />
          <stop offset="0.35" stopColor={m.base} />
          <stop offset="0.6" stopColor={m.sombre} />
          <stop offset="0.82" stopColor={m.base} />
          <stop offset="1" stopColor={m.clair} />
        </linearGradient>
        <radialGradient id={`${id}-face`} cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor={m.clair} />
          <stop offset="0.45" stopColor={m.base} />
          <stop offset="1" stopColor={m.sombre} />
        </radialGradient>
        <linearGradient id={`${id}-reflet`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-disque`}>
          <circle cx="100" cy="100" r="96" />
        </clipPath>
        <path id={`${id}-arc`} d="M 34,104 A 66,66 0 0 1 166,104" />
      </defs>

      {/* Tranche crénelée */}
      <circle cx="100" cy="100" r="96" fill={`url(#${id}-tranche)`} />
      {crans.map((a) => (
        <line
          key={a}
          x1="100"
          y1="5"
          x2="100"
          y2="11"
          stroke={m.sombre}
          strokeOpacity="0.5"
          strokeWidth="1"
          transform={`rotate(${a} 100 100)`}
        />
      ))}

      {/* Face */}
      <circle cx="100" cy="100" r="85" fill={`url(#${id}-face)`} stroke={m.sombre} strokeWidth="1.5" />
      <circle cx="100" cy="100" r="77" fill="none" stroke={m.clair} strokeOpacity="0.55" />
      <circle cx="100" cy="100" r="75" fill="none" stroke={m.sombre} strokeOpacity="0.5" />

      {/* Gravure : un liseré clair décalé donne le relief */}
      <text fontFamily="var(--font-donnees)" fontSize="10.5" letterSpacing="2.4" fill={m.grave}>
        <textPath href={`#${id}-arc`} startOffset="50%" textAnchor="middle">
          {inscription.toUpperCase()}
        </textPath>
      </text>
      <text
        x="100"
        y="124"
        dy="1"
        textAnchor="middle"
        fontFamily="var(--font-texte)"
        fontSize="58"
        fontWeight="500"
        fill={m.clair}
        fillOpacity="0.6"
      >
        {numero}
      </text>
      <text x="100" y="124" textAnchor="middle" fontFamily="var(--font-texte)" fontSize="58" fontWeight="500" fill={m.grave}>
        {numero}
      </text>
      <text x="100" y="152" textAnchor="middle" fontFamily="var(--font-donnees)" fontSize="11" fill={m.grave}>
        {valeur}
      </text>

      {/* Reflet */}
      <g clipPath={`url(#${id}-disque)`}>
        <polygon className="reflet" points="40,-10 80,-10 20,210 -20,210" fill={`url(#${id}-reflet)`} />
      </g>
    </svg>
  );
}
