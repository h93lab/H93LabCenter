import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const owner = JSON.parse(readFileSync(".local/owner.json", "utf8"));
test("owner workspace, data routes, versioned documents, prototype and responsive themes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Welcome to your lab" }),
  ).toBeVisible();
  await page.getByLabel("Email address").fill(owner.email);
  await page.getByLabel("Password", { exact: true }).fill(owner.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Workspace overview" }),
  ).toBeVisible();
  for (const [path, title] of [
    ["/opportunities", "Market opportunities"],
    ["/ideas", "Ideas library"],
    ["/projects", "Projects"],
    ["/research/runs", "Research runs"],
    ["/research/jobs", "Job monitor"],
    ["/settings/research", "Workspace settings"],
    ["/ai", "AI & model settings"],
  ]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
  }
  await page.goto("/projects");
  const project = page.getByRole("link", {
    name: "FamilySync Pantry Manager",
    exact: true,
  });
  await expect(project).toBeVisible();
  await project.click();
  await expect(
    page.getByRole("heading", {
      name: "FamilySync Pantry Manager",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Documents", exact: true }).click();
  await expect(page.locator(".markdown")).toContainText("README");
  await page
    .getByRole("button", { name: "technical/DATA_MODEL.md", exact: true })
    .click();
  await expect(page.locator(".markdown")).toContainText("DATA_MODEL");
  await page.getByRole("tab", { name: "Prototype", exact: true }).click();
  await expect(page.getByLabel("Screen", { exact: true })).toBeVisible();
  await page.getByLabel("Screen", { exact: true }).selectOption("SCR-002");
  await expect(page.locator(".phone-frame")).toContainText("Add");
  await page
    .getByLabel("Screen state", { exact: true })
    .selectOption("offline");
  await expect(page.locator(".phone-frame")).toContainText("Return to default");
  await page
    .getByRole("button", { name: "Return to default", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Workspace overview" }),
  ).toBeVisible();
  const before = await page.locator("html").getAttribute("class");
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  expect(await page.locator("html").getAttribute("class")).not.toBe(before);
  const theme = await page.locator("html").getAttribute("class");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Workspace overview" }),
  ).toBeVisible();
  expect(await page.locator("html").getAttribute("class")).toBe(theme);
  expect(errors).toEqual([]);
});

test("account settings are responsive and validate email and password changes", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(owner.email);
  await page.getByLabel("Password", { exact: true }).fill(owner.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Workspace overview" }),
  ).toBeVisible();

  await page.goto("/settings/account");
  await expect(
    page.getByRole("heading", { name: "Email address", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Password", exact: true }),
  ).toBeVisible();

  await page.getByLabel("New email address").fill(owner.email.toUpperCase());
  await page
    .getByLabel("Current password", { exact: true })
    .first()
    .fill(owner.password);
  await page.getByRole("button", { name: "Update email" }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Enter a different email address.",
  );

  const passwordForm = page.locator("form").filter({
    has: page.getByRole("button", { name: "Update password" }),
  });
  await passwordForm
    .getByLabel("Current password", { exact: true })
    .fill(owner.password);
  await passwordForm
    .getByLabel("New password", { exact: true })
    .fill("a-secure-new-password");
  await passwordForm
    .getByLabel("Confirm new password", { exact: true })
    .fill("a-different-password");
  await passwordForm.getByRole("button", { name: "Update password" }).click();
  await expect(passwordForm.getByRole("alert")).toHaveText(
    "The new passwords do not match.",
  );

  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
