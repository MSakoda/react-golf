import { expect, test, type Page } from "@playwright/test";

/**
 * Plays whatever comes up until the run ends. Swing timing is random, so this
 * asserts on the shape of a round (screens reached, records posted), never on
 * exact scores.
 */
async function playRound(page: Page) {
  const complete = page.getByRole("heading", { name: "Card signed. Score posted." });
  const upgrade = page.getByRole("heading", { name: "Tune your bag before the next tee" });
  const dialog = page.getByRole("dialog");
  const swing = page.getByRole("button", { name: /^(Swing|Putt)$/ });

  for (let step = 0; step < 300; step++) {
    if (await complete.isVisible()) return;
    if (await upgrade.isVisible()) {
      await page.getByRole("button", { name: /^(Stackable|Unique)/ }).first().click();
    } else if (await dialog.isVisible()) {
      await dialog.getByRole("button").click();
    } else if (await swing.isVisible()) {
      await swing.click();
    }
    await page.waitForTimeout(100);
  }
  throw new Error("round did not finish within 300 steps");
}

test("home screen offers the three round lengths and an empty leaderboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Practice Round", level: 1 })).toBeVisible();
  for (const length of [3, 6, 9]) {
    await expect(page.getByRole("button", { name: `${length} Holes` })).toBeVisible();
  }
  await expect(page.getByText("No completed rounds yet")).toBeVisible();
});

test("starting a run shows the first hole with a live swing button", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start Run" }).click();
  await expect(page.getByText("Hole 1 of 3")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("yards left");
  await expect(page.getByRole("button", { name: /^(Swing|Putt)$/ })).toBeEnabled();
});

test("a swing locks the meter, then a result dialog advances the round", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start Run" }).click();
  await page.getByRole("button", { name: "Swing" }).click();
  await expect(page.getByRole("button", { name: "Ball in flight" })).toBeDisabled();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 5000 });
  await expect(dialog).toContainText("Shot result");
  await dialog.getByRole("button").click();
  await expect(dialog.getByText("Shot result")).toBeHidden();
});

test("a full 3-hole round posts to the leaderboard and survives a reload", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/");
  await page.getByLabel("Player name").fill("Ada");
  await page.getByRole("button", { name: "Start Run" }).click();

  await playRound(page);
  await expect(page.getByText("Run complete")).toBeVisible();

  await page.getByRole("button", { name: "Return home" }).click();
  await expect(page.getByText("Ada", { exact: true })).toBeVisible();
  await expect(page.getByText(/^\d+ strokes$/)).toBeVisible();

  await page.reload();
  await expect(page.getByText("Ada", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Player name")).toHaveValue("Ada");
});

test("choosing a longer round length changes the hole count", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "6 Holes" }).click();
  await page.getByRole("button", { name: "Start Run" }).click();
  await expect(page.getByText("Hole 1 of 6")).toBeVisible();
});
