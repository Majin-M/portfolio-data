"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLien({ href, children }: { href: string; children: ReactNode }) {
  const chemin = usePathname();
  const actif = chemin === href || chemin === `${href}/` || chemin.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className={`ui ${actif ? "!text-encre underline decoration-accent decoration-1 underline-offset-[6px]" : ""}`}
    >
      {children}
    </Link>
  );
}
