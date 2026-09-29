import Link from "next/link";
import { Conteneur } from "@/components/conteneur";

export default function PageIntrouvable() {
  return (
    <Conteneur className="pt-16 sm:pt-24">
      <p className="label !text-accent">Erreur 404 · entrée absente de l&apos;archive</p>
      <h1 className="mt-6 font-texte text-5xl font-medium tracking-tight">Page introuvable</h1>
      <p className="mt-6 max-w-xl text-lg text-encre-2">Cette adresse ne correspond à aucune page du site.</p>
      <Link href="/" className="ui mt-10 inline-block !text-encre hover:!text-accent">
        Retour à l&apos;accueil
      </Link>
    </Conteneur>
  );
}
