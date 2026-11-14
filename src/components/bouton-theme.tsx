"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

// Sombre par défaut ; clair seulement s'il a été choisi (data-theme="light").
function lireTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

const abonnes = new Set<() => void>();

function abonner(rappel: () => void) {
  abonnes.add(rappel);
  return () => {
    abonnes.delete(rappel);
  };
}

export function BoutonTheme() {
  const theme = useSyncExternalStore(abonner, lireTheme, () => null);

  function appliquer(suivant: Theme) {
    const racine = document.documentElement;
    if (suivant === "light") racine.dataset.theme = "light";
    else delete racine.dataset.theme;
    try {
      localStorage.setItem("theme", suivant);
    } catch {
      // Stockage indisponible (navigation privée) : le choix vaut pour la page.
    }
    abonnes.forEach((rappel) => rappel());
  }

  function basculer() {
    const suivant: Theme = lireTheme() === "dark" ? "light" : "dark";
    // Passer du noir au crème d'un coup éblouit : un fondu adoucit le saut de
    // luminosité. Sans View Transitions ou en mouvement réduit, bascule directe.
    if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      appliquer(suivant);
      return;
    }
    document.startViewTransition({ update: () => appliquer(suivant), types: ["theme"] });
  }

  return (
    <button
      type="button"
      onClick={basculer}
      className="ui presse inline-flex items-center gap-2"
      aria-label={theme === "light" ? "Passer au thème sombre" : "Passer au thème clair"}
    >
      <span
        aria-hidden
        className="inline-block size-2.5 rounded-full border border-encre-3"
        style={{ background: theme === "light" ? "transparent" : "var(--encre-3)" }}
      />
      {theme === "light" ? "Clair" : "Sombre"}
    </button>
  );
}
