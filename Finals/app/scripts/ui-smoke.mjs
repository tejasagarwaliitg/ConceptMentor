import assert from "node:assert/strict";
import { chromium } from "playwright";

// Run against a running app: node /absolute/path/to/app/scripts/ui-smoke.mjs
// Override the URL with UI_BASE_URL. All profiles live in isolated browser contexts.
const baseUrl = process.env.UI_BASE_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch();
const profileKey = "kadi.profiles.v1";
const pageErrors = [];

async function assertNoOverflow(page) {
  const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  assert.equal(dimensions.document, dimensions.viewport, "Page must not overflow horizontally");
}

try {
  for (const width of [320, 390, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "A fresh page for your learning." }).waitFor();
    await assertNoOverflow(page);
    const submit = page.getByRole("button", { name: "Create my profile", exact: true });
    assert.equal(await submit.isDisabled(), true);

    const fields = await page.locator(".picker-field input").evaluateAll((inputs) => inputs.map((input) => ({
      labelled: input.labels.length > 0,
      border: parseFloat(getComputedStyle(input).borderTopWidth),
      height: input.getBoundingClientRect().height,
      fontSize: parseFloat(getComputedStyle(input).fontSize),
    })));
    assert.equal(fields.length, 3);
    for (const field of fields) {
      assert.equal(field.labelled, true, "Every field must have an associated label");
      assert.ok(field.border >= 1, "Inputs must have visible borders");
      assert.ok(field.height >= 44, "Inputs must have touch-friendly height");
      if (width <= 760) assert.ok(field.fontSize >= 16, "Mobile inputs must avoid focus zoom");
    }

    const name = page.getByRole("textbox", { name: "Profile name", exact: true });
    await name.fill("   ");
    assert.equal(await submit.isDisabled(), true, "Whitespace must not create a profile");
    const displayName = `Student ${width}`;
    await name.fill(`  ${displayName}  `);
    await page.getByRole("textbox", { name: "Class", exact: true }).fill("Class 11");
    await page.getByRole("textbox", { name: "Target exam", exact: true }).fill("JEE Main 2027");
    assert.equal(await submit.isEnabled(), true);
    await name.press("Enter");
    await page.locator(".student-welcome").getByRole("heading", { name: `Hi, ${displayName}.`, exact: true }).waitFor();
    await assertNoOverflow(page);

    await page.getByRole("button", { name: "Switch profile", exact: true }).click();
    await page.getByRole("heading", { name: "Welcome back." }).waitFor();
    const saved = page.locator(".picker-profile").filter({ hasText: displayName });
    assert.equal(await saved.count(), 1);
    assert.match(await saved.innerText(), /Class 11 · JEE Main 2027/);
    await saved.click();
    await page.locator(".student-welcome").getByRole("heading", { name: `Hi, ${displayName}.`, exact: true }).waitFor();
    await page.reload();
    await page.locator(".student-welcome").getByRole("heading", { name: `Hi, ${displayName}.`, exact: true }).waitFor();

    await page.getByRole("button", { name: "Switch profile", exact: true }).click();
    await page.getByRole("heading", { name: "A fresh page for your learning." }).waitFor();
    const beforeGuest = await page.evaluate((key) => localStorage.getItem(key), profileKey);
    await page.getByRole("button", { name: "Continue as guest", exact: true }).click();
    await page.locator(".student-welcome").getByRole("heading", { name: "Welcome. Make yourself at home.", exact: true }).waitFor();
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), profileKey), beforeGuest, "Guest entry must not modify saved profiles");
    await page.getByRole("button", { name: "Switch profile", exact: true }).click();
    await page.getByRole("button", { name: "Use demo account", exact: true }).click();
    await page.locator(".student-welcome").getByRole("heading", { name: "Hi, Aarav (demo).", exact: true }).waitFor();
    await page.locator(".student-welcome").getByText("Simulated data", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Switch profile", exact: true }).click();
    await page.getByRole("heading", { name: "Welcome back." }).waitFor();
    assert.equal(await page.locator(".picker-profile").count(), 2);
    await assertNoOverflow(page);
    await context.close();
    console.log(`PASS ${width}px: layout, form/Enter, saved profile, reload, guest isolation, demo`);
  }

  const context = await browser.newContext({ viewport: { width: 320, height: 900 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "A fresh page for your learning." }).waitFor();
  await page.keyboard.press("Tab");
  assert.equal(await page.getByRole("button", { name: "Use demo account", exact: true }).evaluate((button) => button === document.activeElement), true);
  await page.keyboard.press("Tab");
  assert.equal(await page.getByRole("textbox", { name: "Profile name", exact: true }).evaluate((input) => input === document.activeElement), true);
  const longName = "LongProfileName".repeat(5);
  await page.getByRole("textbox", { name: "Profile name", exact: true }).fill(longName);
  await page.getByRole("button", { name: "Create my profile", exact: true }).click();
  await page.locator(".student-welcome").waitFor();
  await page.getByRole("button", { name: "Switch profile", exact: true }).click();
  await page.getByRole("heading", { name: "Welcome back." }).waitFor();
  assert.match(await page.locator(".picker-profile").innerText(), new RegExp(longName));
  await assertNoOverflow(page);
  await context.close();
  assert.deepEqual(pageErrors, [], "No uncaught browser errors");
  console.log("PASS keyboard order, name-only creation, long profile name, zero browser errors");
} finally {
  await browser.close();
}