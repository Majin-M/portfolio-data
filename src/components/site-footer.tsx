import Link from "next/link";
import { Conteneur } from "@/components/conteneur";
import { Logo } from "@/components/logos";
import { GITHUB } from "@/lib/projets";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-trait">
      <Conteneur className="flex flex-col gap-3 py-8 sm:flex-row sm:items-baseline sm:justify-between">
        <p className="label max-w-xl normal-case tracking-normal">
          Site statique alimenté par les exports des pipelines. Aucun chiffre inventé : chaque valeur vient d&apos;une source
          citée ou d&apos;une exécution datée.
        </p>
        <p className="label flex shrink-0 items-center gap-2">
          <Link href="/mentions-legales" className="hover:text-encre">
            Mentions légales
          </Link>
          <span aria-hidden>·</span>
          <a href={GITHUB} className="inline-flex items-center gap-1.5 hover:text-encre" rel="noopener">
            <Logo nom="GitHub" className="size-3.5" />
            GitHub ↗
          </a>
        </p>
      </Conteneur>
    </footer>
  );
}
