// Tests du site dans un vrai navigateur : erreurs console, requêtes en échec,
// navigation, interactions, variantes (mobile, thème clair, mouvement réduit,
// sans JavaScript) et accessibilité (axe-core).
//
// Utilisation (le site doit tourner) :
//   npm run dev                                   puis  npm run test:site
//   npm run build && npm run apercu               puis  npm run test:site -- http://localhost:3000
//
// Navigateur : Microsoft Edge installé (NAVIGATEUR=chrome pour Google Chrome).
// Code de sortie 1 s'il reste un problème.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { chromium } from "playwright-core";

const require = createRequire(import.meta.url);

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
// L'overlay de développement de Next n'existe qu'avec `next dev`.
const DEV = !process.env.PRODUCTION;
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf-8");
const PAGES = ["/", "/projets/", "/projets/prenoms-de-france/", "/projets/entrepot-sql/", "/projets/inclusion-financiere/", "/projets/prix-carburants/", "/a-propos/"];
// Prix des carburants publiés chaque matin sur GitHub Pages. S'ils ne répondent pas
// (Pages pas encore activé, réseau), la page se rabat sur sa copie locale : l'échec
// de cette seule requête n'est pas un problème, le test des interactions vérifie le repli.
const DONNEES_EN_LIGNE = "majin-m.github.io/Carburant/";
// Messages connus et sans conséquence :
// - THREE.Clock : avertissement interne de React Three Fiber ;
// - préchargement de police « inutilisé » : Next réinsère ses balises de
//   préchargement à chaque navigation alors que la police est déjà chargée.
const IGNORES = [
  /THREE\.Clock/,
  /preloaded using link preload but not used/,
  /Download the React DevTools/,
  /\[HMR\]/,
  /\[Fast Refresh\]/,
];

const browser = await chromium.launch({ channel: process.env.NAVIGATEUR ?? "msedge", headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const problemes = [];
const noter = (test, detail) => problemes.push({ test, detail });
async function essayer(test, etape, fn) {
  try {
    await fn();
  } catch (e) {
    noter(test, `échec : ${etape} · ${String(e.message ?? e).split(String.fromCharCode(10))[0].slice(0, 200)}`);
  }
}

async function ouvrir(options = {}, clair = false) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options });
  if (clair) await ctx.addInitScript(() => localStorage.setItem("theme", "light"));
  const page = await ctx.newPage();
  page.journal = [];
  page.on("console", (m) => {
    if (!["error", "warning"].includes(m.type())) return;
    const t = m.text();
    if (!IGNORES.some((r) => r.test(t))) page.journal.push(`[${m.type()}] ${t.slice(0, 400)}`);
  });
  page.on("pageerror", (e) => page.journal.push(`[exception] ${String(e).slice(0, 400)}`));
  page.on("response", (r) => {
    if (r.status() >= 400 && !r.url().includes("nexiste") && !r.url().includes(DONNEES_EN_LIGNE)) page.journal.push(`[http ${r.status()}] ${r.url()}`);
  });
  page.on("requestfailed", (r) => {
    const f = r.failure()?.errorText ?? "";
    if (!f.includes("ERR_ABORTED") && !r.url().includes(DONNEES_EN_LIGNE)) page.journal.push(`[échec requête] ${r.url()} ${f}`);
  });
  return { ctx, page };
}

async function badgeNext(page) {
  if (!DEV) return null;
  return page.evaluate(() => {
    const racine = document.querySelector("nextjs-portal")?.shadowRoot;
    if (!racine) return null;
    const texte = racine.textContent ?? "";
    const m = texte.match(/(\d+)\s*Issues?/i);
    return m ? m[0] : null;
  });
}

async function vider(page, test) {
  const badge = await badgeNext(page);
  if (badge) noter(test, `overlay Next : ${badge}`);
  for (const l of page.journal) noter(test, l);
  page.journal.length = 0;
}

// 1. Chaque page : chargement, erreurs, accessibilité, débordement
for (const [nom, options, clair] of [
  ["desktop", {}, false],
  ["mobile", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, false],
  ["clair", {}, true],
  ["mouvement réduit", { reducedMotion: "reduce" }, false],
]) {
  const { ctx, page } = await ouvrir(options, clair);
  for (const chemin of PAGES) {
    const test = `${nom} ${chemin}`;
    await page.goto(BASE + chemin, { waitUntil: "networkidle", timeout: 180000 });
    await page.waitForTimeout(2500);
    const debord = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (debord > 0) noter(test, `débordement horizontal de ${debord}px`);
    const h1 = await page.locator("h1").evaluateAll((l) => l.filter((h) => h.offsetParent !== null).length);
    if (h1 !== 1) noter(test, `${h1} titres h1 visibles`);
    if (nom === "desktop" || nom === "clair") {
      await page.addScriptTag({ content: axeSource });
      const res = await page.evaluate(async () => {
        const r = await axe.run(document, { resultTypes: ["violations"] });
        return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, cible: v.nodes[0]?.target?.join(" "), resume: v.nodes[0]?.failureSummary?.split("\n")[1] }));
      });
      for (const v of res) noter(test, `[a11y ${v.impact}] ${v.id} ×${v.n} · ${v.cible} · ${v.resume ?? ""}`);
    }
    await vider(page, test);
  }
  await ctx.close();
}

// 2. Navigation complète : liens, retour, avance
{
  const { ctx, page } = await ouvrir();
  const test = "navigation";
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 180000 });
  // [sélecteur du lien, chemin attendu après le clic]
  const etapes = [
    ['header a[href^="/projets"]', /^\/projets\/?$/],
    ['main a[href^="/projets/prenoms-de-france"]', /prenoms-de-france/],
    ['header a[href^="/a-propos"]', /a-propos/],
    ['header a[href^="/projets"]', /^\/projets\/?$/],
    ['main a[href^="/projets/entrepot-sql"]', /entrepot-sql/],
    ['main a[href^="/projets"]:not([href*="-"])', /^\/projets\/?$/],
    ['header a[href="/"]', /^\/$/],
  ];
  for (const [selecteur, attendu] of etapes) {
    await essayer(test, `clic ${selecteur}`, async () => {
      await page.locator(selecteur).first().click({ timeout: 25000 });
      await page.waitForURL((u) => attendu.test(u.pathname), { timeout: 20000 });
      await page.waitForTimeout(1200);
    });
  }
  await page.goBack();
  await page.waitForTimeout(1500);
  await page.goBack();
  await page.waitForTimeout(1500);
  await page.goForward();
  await page.waitForTimeout(1500);
  await vider(page, test);
  await ctx.close();
}

// 3. Interactions
{
  const { ctx, page } = await ouvrir();
  // Accueil : sélecteur de flux et plongeon
  let test = "accueil · interactions";
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 180000 });
  await page.waitForTimeout(2500);
  // Chaque panneau projet reçoit le survol (les panneaux sont en 3D)
  for (const numero of ["01", "02", "03", "04"]) {
    await essayer(test, `survol du panneau ${numero}`, async () => {
      const panneau = page.locator(`[aria-label^='${numero} ·']`).first();
      const b = await panneau.boundingBox();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await page.waitForTimeout(400);
      const recu = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest("[aria-label]")?.getAttribute("aria-label") ?? "", [b.x + b.width / 2, b.y + b.height / 2]);
      if (!recu.startsWith(numero)) noter(test, `le panneau ${numero} ne reçoit pas le pointeur (${recu || "rien"})`);
    });
  }
  // Ouvrir un projet depuis son panneau
  await essayer(test, "ouverture du panneau 01", async () => {
    const b = await page.locator("a[aria-label^='01 ·']").boundingBox();
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    await page.waitForURL((u) => /prenoms-de-france/.test(u.pathname), { timeout: 30000 });
  });
  await vider(page, test);

  // Thème : bascule et persistance
  test = "thème";
  await page.goto(BASE + "/a-propos/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /thème clair/ }).click();
  const apres = await page.evaluate(() => document.documentElement.dataset.theme);
  if (apres !== "light") noter(test, "le bouton n'applique pas le thème clair");
  await page.reload({ waitUntil: "networkidle" });
  if ((await page.evaluate(() => document.documentElement.dataset.theme)) !== "light") noter(test, "thème clair perdu au rechargement");
  await page.getByRole("button", { name: /thème sombre/ }).click();
  await vider(page, test);

  // Prénoms : recherche, variantes, unités, survols, dépliables
  test = "prénoms · interactions";
  await page.goto(BASE + "/projets/prenoms-de-france/", { waitUntil: "networkidle" });
  const affiche = () => page.locator("p.font-donnees.text-2xl").first().innerText();
  const cas = [
    ["lea", "LÉA"],
    ["élodie", "ÉLODIE"],
    ["Dominique", "DOMINIQUE"],
    ["jean-pierre", "JEAN-PIERRE"],
    ["A'LIA", "A'LIA"],
  ];
  for (const [saisie, attendu] of cas) {
    await page.fill("#prenom", saisie);
    await page.press("#prenom", "Enter");
    await page.waitForTimeout(1200);
    const a = await affiche();
    if (a !== attendu) noter(test, `« ${saisie} » affiche ${a}, attendu ${attendu}`);
  }
  await page.fill("#prenom", "zzqx");
  await page.press("#prenom", "Enter");
  await page.waitForTimeout(800);
  if (!(await page.getByText("n'apparaît pas dans le fichier").count())) noter(test, "pas de message pour un prénom absent");
  await page.fill("#prenom", "   ");
  await page.press("#prenom", "Enter");
  await page.fill("#prenom", "1234");
  await page.press("#prenom", "Enter");
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Part des naissances" }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Naissances", exact: true }).click();
  // Survol du paysage et des courbes
  const paysage = page.locator("svg[aria-label^='Paysage']");
  await paysage.scrollIntoViewIfNeeded();
  const bp = await paysage.boundingBox();
  for (const f of [0.2, 0.5, 0.8]) await page.mouse.move(bp.x + bp.width * f, bp.y + bp.height * f);
  for (const zone of await page.locator("svg rect[tabindex='0']").all()) {
    await zone.scrollIntoViewIfNeeded();
    const b = await zone.boundingBox();
    if (b) await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await zone.focus();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Home");
    await page.keyboard.press("End");
  }
  // Récit : parcourir les étapes
  for (const e of await page.locator("ol li[data-index]").all()) {
    await e.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(700);
  }
  // Tous les dépliables et tableaux
  for (const d of await page.locator("details").all()) await d.evaluate((el) => (el.open = true));
  await page.waitForTimeout(500);
  await vider(page, test);

  // SQL : lignage, requêtes
  test = "sql · interactions";
  await page.goto(BASE + "/projets/entrepot-sql/", { waitUntil: "networkidle" });
  const lignage = page.locator("svg[aria-label^='Lignage']");
  await lignage.scrollIntoViewIfNeeded();
  for (const t of ["dim_customers", "fact_sales", "crm/prd_info.csv", "report_products"]) {
    await essayer(test, `survol ${t}`, async () => {
      await lignage.locator("text", { hasText: t }).first().hover({ timeout: 25000 });
      await page.waitForTimeout(300);
    });
  }
  for (const d of await page.locator("details").all()) await d.evaluate((el) => (el.open = true));
  await page.waitForTimeout(500);
  await vider(page, test);
  await ctx.close();
}

// 3 bis. Carburants : recherche, repli des données, géolocalisation simulée à Lyon
{
  const { ctx, page } = await ouvrir({ permissions: ["geolocation"], geolocation: { latitude: 45.764, longitude: 4.8357 } });
  // Les messages de la console sur l'échec de GitHub Pages font partie du repli prévu.
  page.on("console", () => {
    page.journal = page.journal.filter((l) => !l.includes(DONNEES_EN_LIGNE) && !/Failed to load resource|CORS/.test(l));
  });
  const test = "carburants · interactions";
  await page.goto(BASE + "/projets/prix-carburants/", { waitUntil: "networkidle", timeout: 180000 });
  const titre = async () => (await page.locator("#resultats-titre").textContent()) ?? "";
  const lignes = () => page.locator("ol li:has(a[href*='openstreetmap'])").count();
  // Rien n'est classé avant la première recherche
  if (await lignes()) noter(test, "des stations sont affichées avant toute recherche");
  // Ville, code postal, lieu introuvable
  for (const [saisie, attendu] of [["Bordeaux", "Bordeaux"], ["67000", "67000"], ["saint-étienne", "Saint-Étienne"]]) {
    await essayer(test, `recherche ${saisie}`, async () => {
      await page.fill("#lieu", saisie);
      await page.press("#lieu", "Enter");
      await page.waitForFunction((a) => document.querySelector("#resultats-titre")?.textContent?.includes(a), attendu, { timeout: 30000 });
      if (!(await lignes())) noter(test, `« ${saisie} » : aucune station classée`);
    });
  }
  const source = await page.getByText(/publiés ce matin par le pipeline|copie faite au build du site/).count();
  if (!source) noter(test, "la source des prix chargés n'est pas indiquée");
  await page.fill("#lieu", "zzqx");
  await page.press("#lieu", "Enter");
  await page.waitForTimeout(800);
  if (!(await page.getByText("Aucune station trouvée").count())) noter(test, "pas de message pour un lieu introuvable");
  // Carburant, rayon, prix anciens
  await page.getByRole("button", { name: "E85" }).click();
  await page.getByRole("button", { name: "20 km" }).click();
  await page.getByLabel(/Inclure les prix de plus de/).check();
  await page.waitForTimeout(500);
  if (!(await titre()).startsWith("E85 · à moins de 20 km")) noter(test, `titre inattendu après changement : ${await titre()}`);
  // Géolocalisation (simulée à Lyon)
  await essayer(test, "me localiser", async () => {
    await page.getByRole("button", { name: "Me localiser" }).click();
    await page.waitForFunction(() => document.querySelector("#resultats-titre")?.textContent?.includes("votre position"), null, { timeout: 30000 });
  });
  // Carte des prix : un clic au centre de la France place la recherche sur ce point
  await essayer(test, "clic sur la carte", async () => {
    const carte = page.locator(".carte-prix svg");
    await carte.scrollIntoViewIfNeeded();
    const boite = await carte.boundingBox();
    await page.mouse.click(boite.x + boite.width * 0.55, boite.y + boite.height * 0.55);
    await page.waitForFunction(() => document.querySelector("#resultats-titre")?.textContent?.includes("ce point, près de"), null, { timeout: 30000 });
    if (!(await lignes())) noter(test, "clic sur la carte : aucune station classée");
  });
  for (const d of await page.locator("details").all()) await d.evaluate((el) => (el.open = true));
  await page.waitForTimeout(500);
  await vider(page, test);
  await ctx.close();
}

// 3 ter. Fiche de compétences : onglets à la souris et au clavier, détail au survol
{
  const { ctx, page } = await ouvrir();
  const test = "fiche · onglets";
  await page.goto(BASE + "/a-propos/", { waitUntil: "networkidle", timeout: 180000 });
  const visibles = () => page.locator(".fiche-panneau:visible").count();
  if ((await visibles()) !== 1) noter(test, `${await visibles()} panneaux visibles au chargement`);
  await essayer(test, "clavier", async () => {
    await page.getByRole("tab", { name: "Profil" }).focus();
    await page.keyboard.press("ArrowRight");
    if ((await page.getByRole("tab", { name: "Outils" }).getAttribute("aria-selected")) !== "true") noter(test, "flèche droite : Outils non sélectionné");
    await page.keyboard.press("End");
    if (!(await page.locator("#panneau-parcours").isVisible())) noter(test, "Fin : Parcours non affiché");
    await page.keyboard.press("Home");
    if (!(await page.locator("#panneau-profil").isVisible())) noter(test, "Début : Profil non affiché");
  });
  await essayer(test, "détail d'un outil", async () => {
    await page.getByRole("tab", { name: "Outils" }).click();
    await page.getByRole("button", { name: "dbt dans Prix des carburants" }).hover();
    await page.getByText(/53 tests/).first().waitFor({ timeout: 5000 });
  });
  for (const nom of ["Langages", "Projets", "Parcours"]) await page.getByRole("tab", { name: nom }).click();
  await vider(page, test);
  await ctx.close();
}

// 4. Sans JavaScript : le contenu reste lisible
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  for (const chemin of PAGES) {
    await page.goto(BASE + chemin, { waitUntil: "domcontentloaded", timeout: 180000 });
    const cache = await page.evaluate(
      () => [...document.querySelectorAll("[data-compteur], [data-revele]")].filter((e) => getComputedStyle(e).visibility === "hidden" || getComputedStyle(e).opacity === "0").length,
    );
    if (cache) noter(`sans JS ${chemin}`, `${cache} éléments restent masqués`);
  }
  await ctx.close();
}

await browser.close();
console.log(`\n${BASE} · ${problemes.length} problème(s)\n`);
const groupes = {};
for (const p of problemes) (groupes[p.test] ??= []).push(p.detail);
for (const [t, d] of Object.entries(groupes)) {
  console.log(`■ ${t}`);
  for (const x of [...new Set(d)]) console.log(`   ${x}`);
}
process.exit(problemes.length ? 1 : 0);
