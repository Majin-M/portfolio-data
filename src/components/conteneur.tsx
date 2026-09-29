import type { ReactNode } from "react";

/** Largeur de page commune : une seule gouttière latérale pour tout le site. */
export function Conteneur({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}
