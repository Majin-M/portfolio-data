import Link from "next/link";
import { Conteneur } from "@/components/conteneur";
import { GITHUB } from "@/lib/projets";

// Date de génération du site statique (au moment du `next build`).
const genereLe = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date());

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-trait">
      <Conteneur className="flex flex-col gap-3 py-8 sm:flex-row sm:items-baseline sm:justify-between">
        <p className="label max-w-xl normal-case tracking-normal">
          Site statique alimenté par les exports des pipelines. Aucun chiffre inventé : chaque valeur vient d&apos;une source
          citée ou d&apos;une exécution datée.
        </p>
        <p className="label shrink-0">
          Généré le {genereLe} ·{" "}
          <Link href="/mentions-legales" className="hover:text-encre">
            Mentions légales
          </Link>{" "}
          ·{" "}
          <a href={GITHUB} className="hover:text-encre" rel="noopener">
            GitHub ↗
          </a>
        </p>
      </Conteneur>
    </footer>
  );
}
