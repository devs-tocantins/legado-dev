import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = "https://legado.dev";
const EMAIL = "claude.design.qa@legado.dev";
const PASSWORD = "SenhaForte!2026x";

const outputDir = path.resolve(process.cwd(), "design-reference/screenshots");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "desktop", width: 1440, height: 900 },
];

const routes = [
  { slug: "01-trilhas", path: "/pt-BR/trilhas" },
  {
    slug: "02-trilha-detalhe",
    path: "/pt-BR/trilhas/2c22ea26-5b0a-4678-9753-fe10d3c1d585",
  },
  { slug: "03-voluntariado", path: "/pt-BR/voluntariado" },
  { slug: "04-eventos", path: "/pt-BR/eventos" },
  { slug: "05-eventos-mine", path: "/pt-BR/eventos/mine" },
  { slug: "06-leaderboard", path: "/pt-BR/leaderboard" },
  { slug: "07-cursos", path: "/pt-BR/cursos" },
  { slug: "08-profile", path: "/pt-BR/profile" },
  { slug: "09-submissions", path: "/pt-BR/submissions" },
  { slug: "10-submissions-new", path: "/pt-BR/submissions/new" },
  { slug: "11-historico", path: "/pt-BR/historico" },
];

async function main() {
  const browser = await chromium.launch({ headless: true });

  console.log("Logging in...");
  const loginContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const loginPage = await loginContext.newPage();

  try {
    await loginPage.goto(`${BASE_URL}/pt-BR/sign-in`, {
      waitUntil: "networkidle",
    });

    // Fill login details
    await loginPage.fill('input[type="email"], input[name="email"]', EMAIL);
    await loginPage.fill(
      'input[type="password"], input[name="password"]',
      PASSWORD
    );

    // Click submit
    await Promise.all([
      loginPage.waitForNavigation({ timeout: 15000 }).catch(() => {}),
      loginPage.click('button[type="submit"], button:has-text("Entrar")'),
    ]);

    await loginPage.waitForTimeout(3000);
    console.log("Login attempt completed. Current URL:", loginPage.url());
  } catch (err) {
    console.error("Login error:", err.message);
  }

  // Save auth state
  const storageStatePath = path.join(outputDir, "..", "storageState.json");
  await loginContext.storageState({ path: storageStatePath });
  await loginContext.close();

  const failedRoutes = [];
  const successCount = [];

  for (const vp of viewports) {
    console.log(
      `\n--- Capturing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`
    );
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      storageState: fs.existsSync(storageStatePath)
        ? storageStatePath
        : undefined,
      userAgent:
        vp.name === "mobile"
          ? "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
          : undefined,
    });

    const page = await context.newPage();

    for (const route of routes) {
      const fileName = `${route.slug}-${vp.name}.png`;
      const filePath = path.join(outputDir, fileName);
      const url = `${BASE_URL}${route.path}`;

      console.log(`Navigating to [${vp.name}] ${url}...`);
      try {
        const response = await page.goto(url, {
          waitUntil: "networkidle",
          timeout: 20000,
        });
        if (response && response.status() >= 400) {
          console.warn(
            `[WARNING] Route ${route.path} returned status ${response.status()}`
          );
          failedRoutes.push({
            route: route.path,
            viewport: vp.name,
            reason: `HTTP ${response.status()}`,
          });
        } else {
          await page.waitForTimeout(2000); // Allow animations/dynamic data to render
          await page.screenshot({ path: filePath, fullPage: true });
          console.log(`  -> Saved ${fileName}`);
          successCount.push(fileName);
        }
      } catch (err) {
        console.error(
          `[ERROR] Failed to capture ${route.path} on ${vp.name}: ${err.message}`
        );
        failedRoutes.push({
          route: route.path,
          viewport: vp.name,
          reason: err.message,
        });
      }
    }

    await context.close();
  }

  await browser.close();

  console.log("\n======================================");
  console.log("CAPTURE COMPLETE");
  console.log(`Successfully generated: ${successCount.length} screenshots`);
  if (failedRoutes.length > 0) {
    console.log("Failed routes:", failedRoutes);
  }
  console.log("Files in directory:", fs.readdirSync(outputDir));
  console.log("Output Directory:", outputDir);
  console.log("======================================");
}

main().catch(console.error);
