// Image de partage (Open Graph) : ce qu'affiche un lien vers le site sur
// LinkedIn ou dans une messagerie. Générée au build, aux couleurs du site.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { IDENTITE } from "@/contenu/competences";

export const alt = `${IDENTITE.nom}, ${IDENTITE.titre}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Export statique : l'image est écrite une fois, au build.
export const dynamic = "force-static";

const FOND = "#0b0d0e";
const ENCRE = "#e8e5dc";
const ENCRE_2 = "#a9a69c";
const ACCENT = "#d4703f";

export default async function Image() {
  const photo = IDENTITE.photo
    ? `data:image/jpeg;base64,${await readFile(path.join(process.cwd(), "public", IDENTITE.photo), "base64")}`
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: "0 88px",
          background: FOND,
          color: ENCRE,
          borderBottom: `12px solid ${ACCENT}`,
        }}
      >
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element -- rendu par ImageResponse, pas par le navigateur
          <img src={photo} alt="" width={220} height={220} style={{ objectFit: "cover", filter: "grayscale(1)" }} />
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: ACCENT }}>{IDENTITE.titre}</div>
          <div style={{ marginTop: 16, fontSize: 64, lineHeight: 1.05, letterSpacing: -1.5, fontWeight: 600 }}>{IDENTITE.nom}</div>
          <div style={{ marginTop: 28, fontSize: 34, color: ENCRE_2 }}>{IDENTITE.phrase}</div>
        </div>
      </div>
    ),
    size,
  );
}
