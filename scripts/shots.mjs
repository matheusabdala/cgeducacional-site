import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = process.env.SHOT_OUT || "/tmp/shots";
mkdirSync(OUT, { recursive: true });

const base = process.env.SHOT_BASE || "http://localhost:3000";
// specs: "name:/path" ou "name:/path:dark"
const specs = (
  process.env.SHOT_PAGES ||
  "home:/,home-dark:/:dark,cursos:/cursos,cadastro:/cadastro,validar:/validar-certificado"
).split(",");

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

for (const spec of specs) {
  const [name, path, theme] = spec.split(":");
  const dark = theme === "dark";
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: dark ? "dark" : "light",
    deviceScaleFactor: 1,
  });
  await ctx.addInitScript((t) => {
    try {
      localStorage.setItem("theme", t);
    } catch {}
  }, dark ? "dark" : "light");
  const page = await ctx.newPage();
  try {
    await page.goto(base + path, { waitUntil: "networkidle", timeout: 60000 });
  } catch {
    await page.goto(base + path, { waitUntil: "domcontentloaded", timeout: 60000 });
  }
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log("shot:", name, "->", base + path, dark ? "(dark)" : "");
  await ctx.close();
}

await browser.close();
