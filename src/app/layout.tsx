import type { Metadata } from "next";
import { IBM_Plex_Mono, Newsreader } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

// Polices provisoires : changer ici suffit (variables --police-texte et
// --police-donnees, reprises par --font-texte et --font-donnees).
const texte = Newsreader({
  variable: "--police-texte",
  subsets: ["latin"],
  axes: ["opsz"],
});

const donnees = IBM_Plex_Mono({
  variable: "--police-donnees",
  subsets: ["latin"],
  // Une seule graisse : chaque fichier de police est préchargé sur toutes les pages.
  weight: ["400"],
});

export const metadata: Metadata = {
  title: {
    default: "Marc Steven Mouthoud · Data engineering",
    template: "%s · Marc Steven Mouthoud",
  },
  description:
    "Des données brutes à l'information : pipelines, modèles de données et contrôles qualité, présentés avec ce qu'ils produisent.",
};

// Avant le premier rendu : signale que JavaScript est actif (les animations
// partent d'un état masqué) et applique le thème clair s'il a été choisi.
const scriptInitial = `(function(){var r=document.documentElement;r.dataset.js="";try{if(localStorage.getItem("theme")==="light")r.dataset.theme="light"}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${texte.variable} ${donnees.variable} antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptInitial }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#contenu"
          className="ui sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-fond focus:p-2"
        >
          Aller au contenu
        </a>
        <SiteHeader />
        <main id="contenu" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
