import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The app has a single (light) theme, so there is no dark-scheme pass.

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const report = violations
    .map(
      (violation) =>
        `${violation.id} (${violation.impact}): ${violation.help}\n` +
        violation.nodes.map((node) => `  - ${node.target.join(" ")}`).join("\n")
    )
    .join("\n");
  expect(report, `${violations.length} axe violation(s)`).toBe("");
}

async function toHole(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Start Run" }).click();
  await expect(page.getByText("Hole 1 of 3")).toBeVisible();
}

async function toResultDialog(page: Page) {
  await toHole(page);
  await page.getByRole("button", { name: "Swing" }).click();
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
}

/** Plays shots and upgrade picks until `target` is on screen. */
async function playUntil(page: Page, target: "upgrade" | "complete") {
  const heading = page.getByRole("heading", {
    name: target === "upgrade" ? "Tune your bag before the next tee" : "Card signed. Score posted."
  });
  const upgrade = page.getByRole("heading", { name: "Tune your bag before the next tee" });
  const dialog = page.getByRole("dialog");
  const swing = page.getByRole("button", { name: /^(Swing|Putt)$/ });

  for (let step = 0; step < 300; step++) {
    if (await heading.isVisible()) return;
    if (await upgrade.isVisible()) {
      await page.getByRole("button", { name: /^(Stackable|Unique)/ }).first().click();
    } else if (await dialog.isVisible()) {
      await dialog.getByRole("button").click();
    } else if (await swing.isVisible()) {
      await swing.click();
    }
    await page.waitForTimeout(100);
  }
  throw new Error(`never reached the ${target} screen`);
}

test("home screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Practice Round" })).toBeVisible();
  await expectNoViolations(page);
});

test("hole screen", async ({ page }) => {
  await toHole(page);
  await expectNoViolations(page);
});

test("shot result dialog", async ({ page }) => {
  await toResultDialog(page);
  await expectNoViolations(page);
});

test("upgrade screen", async ({ page }) => {
  test.setTimeout(120_000);
  await toHole(page);
  await playUntil(page, "upgrade");
  await expectNoViolations(page);
});

test("run complete screen", async ({ page }) => {
  test.setTimeout(180_000);
  await toHole(page);
  await playUntil(page, "complete");
  await expectNoViolations(page);
});

test.describe("mobile viewport", () => {
  test.use({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });

  test("home screen", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Practice Round" })).toBeVisible();
    await expectNoViolations(page);
  });

  test("hole screen", async ({ page }) => {
    await toHole(page);
    await expectNoViolations(page);
  });

  test("shot result dialog", async ({ page }) => {
    await toResultDialog(page);
    await expectNoViolations(page);
  });
});
