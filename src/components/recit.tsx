"use client";

// Récit défilant : le graphique reste à l'écran, le texte défile. L'étape qui
// passe au milieu de l'écran fixe jusqu'où la courbe est révélée et quels
// points sont mis en avant.

import { useEffect, useRef, useState } from "react";
import { Courbes, TableauSeries, type Annotation, type Repere, type SerieCourbe } from "@/components/graphiques/courbes";
import { Compteur } from "@/components/mouvement";

export type Chiffre = { valeur: number; format: "pourcent" | "nombre"; decimales?: number; legende: string };

export type EtapeRecit = {
  id: string;
  surtitre: string;
  chiffres: Chiffre[];
  texte: string;
  jusqua: number;
  reperes: Repere[];
};

type Props = {
  series: SerieCourbe[];
  format: "pourcent" | "nombre";
  description: string;
  annotations?: Annotation[];
  etapes: EtapeRecit[];
};

export function Recit({ series, format, description, annotations, etapes }: Props) {
  const [actif, setActif] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (e.isIntersecting) setActif(Number((e.target as HTMLElement).dataset.index));
        }
      },
      // Une étape devient active quand elle franchit le milieu de l'écran.
      { rootMargin: "-50% 0px -50% 0px" },
    );
    refs.current.forEach((el) => el && observateur.observe(el));
    return () => observateur.disconnect();
  }, []);

  const etape = etapes[actif];

  return (
    <div>
      <div className="relative lg:grid lg:grid-cols-12 lg:gap-12">
        {/* Petit écran : la colonne entière reste en haut de l'écran pendant que les étapes défilent.
            Grand écran : la colonne s'étire sur toute la hauteur du récit, et c'est le graphique qui reste fixé. */}
        <div className="sticky top-0 z-10 -mx-4 bg-fond/90 px-4 pt-4 pb-2 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:static lg:order-2 lg:col-span-7 lg:mx-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <div className="lg:sticky lg:top-[14vh]">
            <div className="h-[34vh] min-h-56 lg:h-[62vh]">
              <CourbesPleineHauteur
                series={series}
                format={format}
                description={description}
                annotations={annotations}
                jusqua={etape.jusqua}
                reperes={etape.reperes}
              />
            </div>
          </div>
        </div>

        <ol className="relative lg:order-1 lg:col-span-5">
          {etapes.map((e, i) => (
            <li
              key={e.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              data-index={i}
              className="flex min-h-[70vh] items-center py-10 lg:min-h-[88vh]"
            >
              {/* Étape inactive : couleur secondaire (contraste suffisant), pas de transparence */}
              <div className={`transition-colors duration-500 ${i === actif ? "" : "etape-inactive"}`}>
                <p className="label !text-accent">{e.surtitre}</p>
                <div className="mt-4 flex flex-wrap gap-x-10 gap-y-4">
                  {e.chiffres.map((c) => (
                    <div key={c.legende}>
                      <Compteur
                        valeur={c.valeur}
                        format={c.format}
                        decimales={c.decimales ?? 1}
                        className="block font-donnees text-5xl leading-none tracking-tight text-encre sm:text-6xl"
                      />
                      <span className="label mt-2 block">{c.legende}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-6 max-w-md text-xl leading-snug text-encre-2">{e.texte}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <TableauSeries series={series} format={format} />
    </div>
  );
}

/** Courbes qui occupent la hauteur de leur conteneur. */
function CourbesPleineHauteur(props: Omit<Parameters<typeof Courbes>[0], "hauteur">) {
  const ref = useRef<HTMLDivElement>(null);
  const [hauteur, setHauteur] = useState(360);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observateur = new ResizeObserver(([entree]) => setHauteur(Math.max(200, Math.round(entree.contentRect.height) - 34)));
    observateur.observe(element);
    return () => observateur.disconnect();
  }, []);
  return (
    <div ref={ref} className="h-full">
      <Courbes {...props} hauteur={hauteur} tableau={false} />
    </div>
  );
}
