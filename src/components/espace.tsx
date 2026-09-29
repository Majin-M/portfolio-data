import { ViewTransition, type ReactNode } from "react";

/**
 * Un « espace » du site (une page). Les liens marqués « plonger » y font
 * entrer en zoomant ; les liens « remonter » en font sortir. Les autres
 * navigations ne sont pas animées.
 */
export function Espace({ children }: { children: ReactNode }) {
  const types = { plonger: "plonger", remonter: "remonter", default: "none" };
  return (
    <ViewTransition enter={types} exit={types} default="none">
      {children}
    </ViewTransition>
  );
}
