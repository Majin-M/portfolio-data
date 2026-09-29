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

  function basculer() {
    const racine = document.documentElement;
    const suivant: Theme = lireTheme() === "dark" ? "light" : "dark";
    if (suivant === "light") racine.dataset.theme = "light";
    else delete racine.dataset.theme;
    try {
      localStorage.setItem("theme", suivant);
    } catch {
      // Stockage indisponible (navigation privée) : le choix vaut pour la page.
    }
    abonnes.forEach((rappel) => rappel());
  }

  return (
    <button
      type="button"
      onClick={basculer}
      className="ui inline-flex items-center gap-2"
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
