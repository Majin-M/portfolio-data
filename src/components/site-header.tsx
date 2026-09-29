import Link from "next/link";
import { BoutonTheme } from "@/components/bouton-theme";
import { Conteneur } from "@/components/conteneur";
import { Logo } from "@/components/logos";
import { NavLien } from "@/components/nav-lien";
import { IDENTITE } from "@/contenu/competences";

export function SiteHeader() {
  return (
    // Le header reste immobile pendant les transitions entre pages.
    <header className="relative z-40 border-b border-trait" style={{ viewTransitionName: "site-header" }}>
      <Conteneur className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4">
        <Link href="/" transitionTypes={["remonter"]} className="label !text-encre hover:!text-accent">
          Marc Steven Mouthoud <span className="text-encre-3">/ data engineering</span>
        </Link>
        <nav aria-label="Navigation principale" className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <NavLien href="/projets">Projets</NavLien>
          <NavLien href="/a-propos">À propos</NavLien>
          {IDENTITE.liens
            .filter((l) => l.label === "GitHub" || l.label === "LinkedIn")
            .map((l) => (
              <a key={l.href} href={l.href} className="ui inline-flex items-center gap-1.5" rel="noopener" aria-label={l.label}>
                <Logo nom={l.label} className="size-4" />
                <span className="hidden sm:inline">{l.label}</span>
              </a>
            ))}
          <BoutonTheme />
        </nav>
      </Conteneur>
    </header>
  );
}
