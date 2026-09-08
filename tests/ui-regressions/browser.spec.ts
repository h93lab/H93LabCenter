import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
const owner = JSON.parse(readFileSync(".local/owner.json", "utf8"));
async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(owner.email);
  await page.getByLabel("Password", { exact: true }).fill(owner.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Workspace overview" }),
  ).toBeVisible();
}
test("mobile navigation keeps focus visible, traps drawer, names search and supports no-results", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => {
    const rect = document.activeElement!.getBoundingClientRect();
    return { left: rect.left, right: rect.right };
  });
  expect(focused.left).toBeGreaterThanOrEqual(0);
  expect(focused.right).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Open navigation" }).click();
  const drawer = page.getByRole("dialog", { name: "Workspace navigation" });
  await expect(drawer).toBeVisible();
  for (let i = 0; i < 25; i++) await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() =>
      document.querySelector(".sidebar")!.contains(document.activeElement),
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Search intelligence", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Search intelligence", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search ideas or pages" })
    .fill("no-match-ui-regression-4827");
  await expect(
    page.getByRole("heading", { name: "No matching ideas or pages" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Search intelligence", exact: true }),
  ).toBeFocused();
});
test("project routes retain document/version; readable differences and all devices fit 320 pixels", async ({
  page,
}) => {
  await login(page);
  await page.goto("/projects");
  await page
    .getByRole("link", { name: "FamilySync Pantry Manager", exact: true })
    .click();
  const root = new URL(page.url()).pathname.replace(/\/$/, "");
  await page.goto(root + "/versions");
  await expect(
    page.getByRole("tab", { name: "Versions", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page
    .getByRole("button", { name: "Compare documents", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName(
    /Blueprint changes/,
  );
  await expect(
    page.getByRole("heading", { name: "Structured entity changes" }),
  ).toBeVisible();
  const firstDiff = page.locator(".diff-file").first();
  if (!(await firstDiff.evaluate((el: HTMLDetailsElement) => el.open)))
    await firstDiff.locator("summary").click();
  await expect(page.locator(".unified-diff").first()).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "Documents", exact: true }).click();
  await page
    .getByRole("button", { name: "technical/DATA_MODEL.md", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("tab", { name: "Documents", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".markdown")).toContainText("DATA_MODEL");
  await page.getByRole("tab", { name: "Documents", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Requirements", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("tab", { name: "Requirements", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Prototype", exact: true }).click();
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const device of ["iphone", "android", "responsive"]) {
      await page.getByLabel("Device preview").selectOption(device);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
  await page
    .getByLabel("Screen state", { exact: true })
    .selectOption("offline");
  await expect(page.locator(".phone-frame")).toContainText("Return to default");
});

test("dashboard does not rank killed candidates above eligible ideas and search errors recover", async ({
  page,
}) => {
  await login(page);
  await page.route("**/api/overview", async (route) => {
    const empty = { items: [], count: 0 };
    await route.fulfill({
      json: {
        ok: true,
        data: {
          local_date: "2026-09-08",
          runs: empty,
          projects: empty,
          usage: empty,
          opportunities: empty,
          promotions: {
            items: [
              {
                promotion_date: "2026-09-08",
                promoted: false,
                no_promotion_reason: "No candidate met promotion thresholds.",
              },
            ],
          },
          ideas: {
            count: 2,
            items: [
              {
                id: "killed-fixture",
                title: "Killed fixture",
                wedge: "Historical candidate",
              },
              {
                id: "eligible-fixture",
                title: "Eligible fixture",
                wedge: "Needs validation",
              },
            ],
          },
          scores: {
            items: [
              { concept_id: "killed-fixture", overall_score: 99 },
              { concept_id: "eligible-fixture", overall_score: 60 },
            ],
          },
          recommendations: {
            items: [
              {
                concept_id: "killed-fixture",
                status: "KILLED",
                confidence_snapshot_id: "killed-confidence",
              },
              {
                concept_id: "eligible-fixture",
                status: "VALIDATE_FIRST",
                confidence_snapshot_id: "eligible-confidence",
                rationale: "Validate the source gap.",
                validation_priorities: ["Collect evidence for the wedge."],
              },
            ],
          },
          confidences: {
            items: [
              { id: "killed-confidence", confidence: 90 },
              { id: "eligible-confidence", confidence: 55 },
            ],
          },
          settings: {
            idea_of_day_min_score: 75,
            idea_of_day_min_confidence: 70,
          },
        },
      },
    });
  });
  await page.goto("/");
  const ranked = page.locator("section").filter({
    has: page.getByRole("heading", {
      name: "Strongest candidates",
      exact: true,
    }),
  });
  await expect(ranked).toContainText("Eligible fixture");
  await expect(ranked).not.toContainText("Killed fixture");
  await expect(page.locator(".best-candidate")).toContainText(
    "Collect evidence for the wedge.",
  );
  await expect(page.locator(".best-candidate")).toContainText(
    "score 75, confidence 70",
  );
  await page
    .getByRole("button", { name: "Search intelligence", exact: true })
    .click();
  await page.route("**/api/table/ideas?q=search-error-fixture", (route) =>
    route.fulfill({
      status: 503,
      json: { ok: false, error: { message: "Search temporarily unavailable" } },
    }),
  );
  await page
    .getByRole("textbox", { name: "Search ideas or pages" })
    .fill("search-error-fixture");
  await expect(page.getByRole("alert")).toContainText(
    "Search temporarily unavailable",
    { timeout: 15000 },
  );
  await page.unroute("**/api/table/ideas?q=search-error-fixture");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "No matching ideas or pages" }),
  ).toBeVisible();
});
test("decision comparison, sourced idea panels, import preview and keyboard tabs", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page);
  await page.goto("/ideas");
  await expect(
    page.getByLabel("Minimum confidence", { exact: true }),
  ).toBeVisible();
  const choices = page.getByRole("checkbox", { name: /^Compare / });
  await choices.nth(0).check();
  await choices.nth(1).check();
  await page.getByRole("button", { name: "Compare 2", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Compare ideas", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("table")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByLabel("Search ideas", { exact: true }).fill("FamilySync");
  await page
    .getByRole("link", { name: "FamilySync Pantry Manager", exact: true })
    .click();
  await expect(
    page.getByLabel("Assessment market", { exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Analysis", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Markets", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("heading", { name: "Market comparison", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Competition", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Sourced competitor comparison",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Validation", exact: true }).click();
  await page
    .getByRole("button", { name: "Record validation", exact: true })
    .click();
  await expect(
    page.getByLabel("Success criterion", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "User voice", exact: true }).click();
  await page
    .getByRole("button", { name: "Import reviews", exact: true })
    .click();
  await page.getByLabel("Format", { exact: true }).selectOption("json");
  await page.getByLabel("Review content", { exact: true }).fill(
    JSON.stringify([
      {
        external_id: "preview-fixture",
        text: "Preview fixture only; do not persist as real evidence",
        published_at: "2026-09-01T00:00:00Z",
        url: "https://example.com/review",
        app_id: "fixture",
      },
    ]),
  );
  await page.getByLabel("Source name", { exact: true }).fill("Preview fixture");
  await page
    .getByLabel("Source URL", { exact: true })
    .fill("https://example.com/reviews");
  await page.getByLabel("Market country code", { exact: true }).fill("US");
  await page
    .getByLabel("Sample collected at", { exact: true })
    .fill("2026-09-02T12:00");
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Preview import", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "1 reviews ready", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Refresh idea", exact: true }).click();
  await page.getByLabel("Maximum run spend (USD)", { exact: true }).fill("0");
  expect(
    await page
      .getByLabel("Maximum run spend (USD)", { exact: true })
      .evaluate((el: HTMLInputElement) => el.checkValidity()),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("tab", { name: "Evidence", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Source coverage", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".local/review-evidence-mobile.png",
    animations: "disabled",
  });
  expect(errors).toEqual([]);
});
