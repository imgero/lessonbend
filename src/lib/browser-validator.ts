import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
import { SHELL_V6 } from "@/lib/trusted-shell-v6";

export async function validateInBrowser(html: string, artifactId: string) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 900, height: 640 } });
    const consoleErrors: string[] = [];
    const outboundRequests: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => consoleErrors.push(error.message));
    await page.route("**/*", async (route) => {
      const url = route.request().url();
      if (url === "about:blank" || url.startsWith("data:")) return route.continue();
      outboundRequests.push(url); await route.abort();
    });
    await page.setContent(html, { waitUntil: "load" });
    const visible = await page.evaluate(() => {
      const main = document.querySelector("main, [role=main], #app, #lesson") ?? document.body;
      const text = (main.textContent ?? "").trim().length;
      const controls = main.querySelectorAll("button, input, [role=button], [tabindex]").length;
      const bounds = main.getBoundingClientRect();
      return { text, controls, area: bounds.width * bounds.height, shellVersion: document.documentElement.dataset.lessonbendShell ?? null, circles: main.querySelectorAll("svg[data-lb-model='fraction-circle']").length };
    });
    const artifactDir = join(process.cwd(), "artifacts");
    await mkdir(artifactDir, { recursive: true });
    const screenshotPath = join(artifactDir, `${artifactId}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const moduleMatch = html.match(/const m=(\{[\s\S]*?\});let step=/);
    const stepCount = moduleMatch ? JSON.parse(moduleMatch[1]).steps.length : 0;
    const stepScreenshots: string[] = [];
    const emptySteps: number[] = [];
    for (let index = 0; index < stepCount; index++) {
      const stepVisible = await page.evaluate((nextStep) => {
        // Trusted shell exposes these lexical bindings to subsequent classic-script evaluation.
        const scope = globalThis as any;
        scope.eval(`step=${nextStep};render()`);
        const region = document.querySelector("#stage") ?? document.body;
        const text = (region.textContent ?? "").trim().length;
        const controls = region.querySelectorAll("button, input, [role=button], [tabindex]").length;
        return { text, controls };
      }, index);
      if (stepVisible.text < 12 || stepVisible.controls < 1) emptySteps.push(index + 1);
      const path = join(artifactDir, `${artifactId}-step-${index + 1}.png`);
      await page.screenshot({ path, fullPage: true });
      stepScreenshots.push(path);
    }
    const blank = visible.text < 40 || visible.controls < 1 || visible.area < 10_000;
    const staleShell = visible.shellVersion !== SHELL_V6;
    const requiresFractionCircle = /"kind":"(?:shade|build|match|find-mistake)"/.test(html);
    const missingCircle = requiresFractionCircle && visible.circles < 1;
    return { passed: consoleErrors.length === 0 && outboundRequests.length === 0 && !blank && !staleShell && !missingCircle && emptySteps.length === 0, consoleErrors, outboundRequests, visible, blank, staleShell, missingCircle, emptySteps, screenshotPath, stepScreenshots };
  } finally { await browser.close(); }
}
