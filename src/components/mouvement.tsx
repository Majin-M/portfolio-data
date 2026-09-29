"use client";

// Primitives de mouvement. Le CSS (globals.css) décrit les états ; ces
// composants ne font que poser data-visible quand l'élément entre dans
// l'écran. Sans JavaScript ou en mouvement réduit, tout reste dans son état
// final.

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode, type RefObject } from "react";
import { decimal, nombre, pourcent } from "@/lib/format";

const REQUETE_MOUVEMENT = "(prefers-reduced-motion: reduce)";

function abonnerMouvement(rappel: () => void) {
  const media = window.matchMedia(REQUETE_MOUVEMENT);
  media.addEventListener("change", rappel);
  return () => media.removeEventListener("change", rappel);
}

/** Vrai si la personne a demandé à réduire les animations. */
export function useMouvementReduit(): boolean {
  return useSyncExternalStore(
    abonnerMouvement,
    () => window.matchMedia(REQUETE_MOUVEMENT).matches,
    () => false,
  );
}

/** Devient vrai (une seule fois) quand l'élément entre dans l'écran. */
export function useVisible(ref: RefObject<Element | null>, marge = "0px 0px -12% 0px"): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || visible) return;
    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (entree.isIntersecting) {
          setVisible(true);
          observateur.disconnect();
        }
      },
      { rootMargin: marge },
    );
    observateur.observe(element);
    return () => observateur.disconnect();
  }, [ref, marge, visible]);
  return visible;
}

type PropsDeclencheur = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: "div" | "li" | "section";
  /** "revele" : apparition en fondu ; "dessin" : tracés et nœuds qui s'allument. */
  mode?: "revele" | "dessin";
  delai?: number;
  id?: string;
};

/** Pose data-visible sur son élément quand il entre dans l'écran. */
export function Declencheur({ children, className, style, as = "div", mode = "revele", delai = 0, id }: PropsDeclencheur) {
  // Balise HTML fixe (le type générique ElementType ne résiste pas aux éléments
  // ajoutés par React Three Fiber) ; la référence est typée comme une div.
  const Balise = as as "div";
  const ref = useRef<HTMLDivElement>(null);
  const visible = useVisible(ref);
  const attributs = mode === "revele" ? { "data-revele": "" } : { "data-dessin": "" };
  return (
    <Balise
      ref={ref}
      id={id}
      className={className}
      style={{ ...style, ...(delai ? { "--delai": `${delai}ms` } : {}) } as CSSProperties}
      data-visible={visible ? "" : undefined}
      {...attributs}
    >
      {children}
    </Balise>
  );
}

/** Apparition en fondu au défilement. */
export function Revele(props: Omit<PropsDeclencheur, "mode">) {
  return <Declencheur {...props} mode="revele" />;
}

type FormatCompteur = "nombre" | "pourcent" | "decimal";

function formater(valeur: number, format: FormatCompteur, decimales: number) {
  if (format === "pourcent") return pourcent(valeur, decimales);
  if (format === "decimal") return decimal(valeur, decimales);
  return nombre(Math.round(valeur));
}

/**
 * Nombre qui se décompte de 0 à sa valeur quand il entre dans l'écran.
 * Le HTML statique contient la valeur finale.
 */
export function Compteur({
  valeur,
  format = "nombre",
  decimales = 1,
  duree = 1600,
  delai = 0,
  className,
}: {
  valeur: number;
  format?: FormatCompteur;
  decimales?: number;
  duree?: number;
  delai?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useVisible(ref, "0px");
  const reduit = useMouvementReduit();
  const [courant, setCourant] = useState<number | null>(null);

  useEffect(() => {
    if (!visible || reduit) return;
    let image = 0;
    const debut = performance.now() + delai;
    const pas = (maintenant: number) => {
      const t = Math.min(1, Math.max(0, (maintenant - debut) / duree));
      const adouci = 1 - Math.pow(1 - t, 3);
      setCourant(valeur * adouci);
      if (t < 1) image = requestAnimationFrame(pas);
    };
    image = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(image);
  }, [visible, reduit, valeur, duree, delai]);

  return (
    <span ref={ref} className={className} data-compteur="" data-pret={reduit || courant !== null ? "" : undefined}>
      {formater(reduit ? valeur : (courant ?? valeur), format, decimales)}
    </span>
  );
}

/** Valeur numérique qui glisse vers sa cible (pour les révélations progressives). */
export function useValeurAnimee(cible: number, duree = 900): number {
  const reduit = useMouvementReduit();
  const [valeur, setValeur] = useState(cible);
  const depart = useRef(cible);

  useEffect(() => {
    if (reduit) {
      depart.current = cible;
      return;
    }
    const origine = depart.current;
    let image = 0;
    const debut = performance.now();
    const pas = (maintenant: number) => {
      const t = Math.min(1, (maintenant - debut) / duree);
      const adouci = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const v = origine + (cible - origine) * adouci;
      depart.current = v;
      setValeur(v);
      if (t < 1) image = requestAnimationFrame(pas);
    };
    image = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(image);
  }, [cible, duree, reduit]);

  return reduit ? cible : valeur;
}
