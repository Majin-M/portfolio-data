// Formats français : espace fine insécable pour les milliers, virgule décimale.

const entier = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

export function nombre(n: number): string {
  return entier.format(n);
}

export function decimal(n: number, decimales = 1): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(n);
}

/** 0.4525 -> « 45,3 % ». */
export function pourcent(part: number, decimales = 1): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(part);
}

/** Nombre de décimales utiles pour afficher une part avec ~3 chiffres significatifs. */
export function decimalesPourPart(part: number): number {
  const pc = Math.abs(part) * 100;
  if (pc === 0 || pc >= 10) return 1;
  if (pc >= 1) return 2;
  return Math.min(4, 2 - Math.floor(Math.log10(pc)));
}

export function date(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(iso));
}
