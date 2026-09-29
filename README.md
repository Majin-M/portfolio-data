# Portfolio data engineering

Site statique (Next.js, TypeScript, Tailwind CSS) qui présente mes projets de data engineering : le système construit (sources, pipeline, modèle de données, qualité) et ce qu'il produit.

## Lancer le site

```powershell
npm install
npm run dev        # http://localhost:3000
```

```powershell
npm run build      # site statique dans out/
npm run apercu     # sert out/ en local
```

## Tests

`npm run test:site` ouvre le site dans Microsoft Edge (sans fenêtre) et vérifie, sur chaque page :

- les erreurs de la console, les exceptions et les requêtes en échec, y compris l'overlay d'erreurs de `next dev` ;
- le rendu en desktop, en mobile, en thème clair, en mouvement réduit et sans JavaScript ;
- la navigation (liens, retour, avance) et les interactions : recherche de prénoms, survols, lignage, dépliables, bascule de thème, panneaux de l'accueil, recherche de stations (ville, code postal, géolocalisation simulée, clic sur la carte) ;
- l'accessibilité, avec axe-core.

```powershell
npm run dev                          # dans un terminal
npm run test:site                    # dans un autre

npm run build; npm run apercu        # version de production (port 3000)
$env:PRODUCTION=1; npm run test:site
```

Le script s'arrête avec le code 1 s'il reste un problème. `npm run lint` et `npx tsc --noEmit` complètent la vérification.

## Pages

| Page | Contenu |
|---|---|
| `/` | Accueil : un panneau holographique par projet (aperçu de ses données, volumes, avancement), en arc et en 3D CSS ; il s'ouvre au clic |
| `/projets` | Liste des projets, avec un aperçu tiré des données |
| `/projets/prenoms-de-france` | Ouverture sur le paysage des 34 prénoms arrivés en tête, récit défilant sur le top 10, recherche d'un prénom, pipeline animé et sections dépliables |
| `/projets/entrepot-sql` | Projet guidé (variante « système ») : les couches en médailles bronze, argent, or ; lignage coloré par couche ; chiffres clés ; schéma en étoile |
| `/projets/inclusion-financiere` | Taux de bancarisation par pays, emploi et éducation ; le piège de la précision ; l'identifiant retiré des variables, avant / après ; schémas d'architecture et de flux |
| `/projets/prix-carburants` | La recherche d'abord : un lieu (ville, code postal, position), puis les stations les moins chères autour ; ensuite la carte des prix en 2.5D (un clic lance la recherche sur ce point), le récit du pipeline et sous le capot |
| `/a-propos` | Présentation et contact |

## Données

Les graphiques du projet Prénoms lisent les exports JSON du dépôt [prenoms_france](https://github.com/Majin-M/prenoms_france), copiés dans `public/data/prenoms/`. Après une nouvelle exécution du pipeline (une fois par an, à chaque édition de l'INSEE) :

```powershell
npm run donnees:prenoms                       # depuis ../prenoms_france/exports
npm run donnees:prenoms -- D:\autre\chemin    # ou un autre dossier
```

Les petits fichiers (`diversite.json`, `ecart_regions.json`, `metadata.json`) sont lus au build ; les séries par initiale (`series/<INITIALE>.json`) sont chargées par le navigateur à la demande.

Les prix des carburants viennent du dépôt [Carburant](https://github.com/Majin-M/Carburant). La page lit au build la copie de `public/data/carburant/` (carte, médianes) ; dans le navigateur, la recherche charge les prix publiés chaque matin sur GitHub Pages, et se rabat sur la copie si le fichier ne répond pas. Pour rafraîchir la copie :

```powershell
npm run donnees:carburant                     # depuis ../Carburant/exports
```

Sur Vercel, `npm run build` commence par [telecharger-donnees-carburant.mjs](scripts/telecharger-donnees-carburant.mjs), qui remplace cette copie par les prix publiés ce matin sur GitHub Pages (la copie reste en secours si la page ne répond pas). Le pipeline Carburant relance ce build chaque matin, par un deploy hook, une fois les prix publiés.

Les résultats de l'entrepôt SQL sont recopiés dans [src/contenu/entrepot-sql.ts](src/contenu/entrepot-sql.ts), avec leur date d'exécution : pour les mettre à jour, relancer les requêtes du dépôt sur la base et recopier les résultats.

## Structure

```text
src/
├── app/                      # Pages (App Router)
├── components/
│   ├── graphiques/courbes.tsx   # Courbes annuelles : tracé animé, révélation progressive, réticule, clavier, vue tableau
│   ├── graphiques/paysage.tsx   # Paysage de données (une crête par prénom arrivé en tête)
│   ├── graphiques/carte-prix.tsx  # Carte des prix des carburants en 2.5D, calculée au build
│   ├── accueil/systeme.tsx      # Accueil : panneaux holographiques
│   ├── recherche-station.tsx    # « La moins chère autour de vous »
│   ├── lignage-sql.tsx          # Lignage de l'entrepôt SQL, survol amont / aval
│   ├── recit.tsx                # Récit défilant : graphique fixé, étapes qui défilent
│   ├── mouvement.tsx            # Apparitions au défilement, compteurs, mouvement réduit
│   ├── recherche-prenom.tsx     # « Tape ton prénom »
│   ├── edition.tsx              # Ouverture, chapitres, chiffres en grand, figures, sections dépliables
│   └── …
├── contenu/                  # Contenu et mesures datées des projets sans export (entrepôt SQL, inclusion, carburants)
└── lib/                      # Formats français, lecture des exports, projection de la carte, registre des projets
scripts/
├── copier-donnees-prenoms.mjs
├── copier-donnees-carburant.mjs
└── corriger-export-windows.mjs   # Contourne un défaut de l'export statique de Next sous Windows
```

## Mouvement

Le site est pensé comme un système qu'on traverse : les panneaux de l'accueil se matérialisent, la carte des carburants se dresse, les pages projet se lisent en trois temps (ouverture, récit défilant, sous le capot), et les liens « entrer dans le projet » plongent vers la page avec une transition (`<ViewTransition>` de React).

Les animations sont décrites en CSS ([src/app/globals.css](src/app/globals.css)) et déclenchées par deux attributs :

- `data-js` sur `<html>`, posé par le script du `<head>` : sans JavaScript, tout s'affiche dans son état final ;
- `data-visible`, posé par [src/components/mouvement.tsx](src/components/mouvement.tsx) quand un élément entre dans l'écran.

Avec `prefers-reduced-motion`, les états finaux s'affichent sans animation ni particules. Les compteurs partent de leur valeur réelle dans le HTML statique : aucun chiffre n'est affiché faux, même avant le chargement du JavaScript.

## Choix de conception

- **Typographies** : Roboto pour le texte, IBM Plex Mono pour les données et les repères. Changer de police se fait dans [src/app/layout.tsx](src/app/layout.tsx) (variables `--police-texte` et `--police-donnees`).
- **Couleurs** : thème sombre par défaut (fond `#0B0D0E`, texte `#E8E5DC`, accent terre cuite `#D4703F`) ; thème clair sur demande (fond crème `#F3EFE6`, accent `#A9522A`). Toutes les couleurs sont des variables CSS dans [src/app/globals.css](src/app/globals.css).
- **Graphiques** : composants React en SVG avec d3 (échelles et tracés), plutôt qu'Observable Plot, pour contrôler le survol, le clavier, les animations et les deux thèmes. Les couleurs des séries ont été validées pour le daltonisme et le contraste sur les deux fonds.
- **Accueil** : panneaux holographiques en 3D CSS ([src/components/accueil/systeme.tsx](src/components/accueil/systeme.tsx)), sans WebGL : le texte reste net et accessible, et les panneaux s'empilent à plat sur mobile.
- **Projet entrepôt SQL** : chaque couche prend la couleur de sa médaille (`--bronze`, `--argent`, `--or`), et l'or sert d'accent à toute la page.

## Déploiement

`next build` produit un site entièrement statique (`output: "export"`) dans `out/`. Il est prévu pour Vercel, relié à ce dépôt : chaque push sur `main` le reconstruit.

Réglages Vercel : préréglage **Next.js**, commande `npm run build`, rien d'autre à changer. Le script `corriger-export-windows.mjs` ne corrige rien sous Linux et laisse l'export tel quel. Les données sont versionnées dans `public/data/` : le build n'a pas besoin des dépôts des pipelines.
