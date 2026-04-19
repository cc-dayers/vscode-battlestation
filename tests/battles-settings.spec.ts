import { test, expect, type Page } from "@playwright/test";

test.describe("Battles Settings View", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto("http://localhost:3000/battles-settings");
    await page.waitForSelector(".bs-settings-shell");
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("renders all three provider cards", async () => {
    const cards = page.locator(".bs-provider-card");
    await expect(cards).toHaveCount(3);
  });

  test("shows provider names", async () => {
    await expect(page.locator(".bs-provider-card__name").first()).toHaveText("Bitbucket PRs");
    await expect(page.locator(".bs-provider-card__name").nth(1)).toHaveText("GitHub Issues");
    await expect(page.locator(".bs-provider-card__name").nth(2)).toHaveText("Disabled Provider");
  });

  test("shows provider commands", async () => {
    await expect(page.locator(".bs-provider-card__command").first()).toContainText("bb-cli battles list --json");
  });

  test("disabled provider card has disabled styling", async () => {
    const disabledCard = page.locator('.bs-provider-card--disabled');
    await expect(disabledCard).toHaveCount(1);
  });

  test("toggle switch is checked for enabled providers", async () => {
    const firstToggle = page.locator('.bs-toggle input').first();
    await expect(firstToggle).toBeChecked();
  });

  test("toggle switch is unchecked for disabled provider", async () => {
    const lastToggle = page.locator('.bs-toggle input').last();
    await expect(lastToggle).not.toBeChecked();
  });

  test("shows battle count in meta", async () => {
    const metaItems = page.locator('.bs-provider-card').first().locator('.bs-meta-item');
    await expect(metaItems.first()).toContainText("3 battles");
  });

  test("shows refresh interval in meta", async () => {
    const metaItems = page.locator('.bs-provider-card').first().locator('.bs-meta-item');
    await expect(metaItems.nth(2)).toContainText("300s");
  });

  test("shows error state for provider with lastError", async () => {
    const errorCard = page.locator('.bs-provider-card').nth(2);
    const error = errorCard.locator('.bs-provider-card__error');
    await expect(error).toContainText("Provider is disabled");
  });

  test("Test button dispatches testProvider command", async () => {
    await page.locator('.bs-provider-card').first().locator('.bs-btn', { hasText: 'Test' }).click();
    const cmd = await page.evaluate(() => (window as any).__lastCommand);
    expect(cmd).toEqual(
      expect.objectContaining({ command: "testProvider", providerId: "bb-prs" })
    );
  });

  test("Refresh button dispatches refreshProvider command", async () => {
    await page.locator('.bs-provider-card').first().locator('.bs-btn', { hasText: 'Refresh' }).click();
    const cmd = await page.evaluate(() => (window as any).__lastCommand);
    expect(cmd).toEqual(
      expect.objectContaining({ command: "refreshProvider", providerId: "bb-prs" })
    );
  });

  test("Remove button dispatches removeProvider command", async () => {
    await page.locator('.bs-provider-card').first().locator('.bs-btn', { hasText: 'Remove' }).click();
    const cmd = await page.evaluate(() => (window as any).__lastCommand);
    expect(cmd).toEqual(
      expect.objectContaining({ command: "removeProvider", providerId: "bb-prs" })
    );
  });

  test("back button dispatches showBattles command", async () => {
    await page.locator('.bs-back-btn').click();
    const cmd = await page.evaluate(() => (window as any).__lastCommand);
    expect(cmd).toEqual(expect.objectContaining({ command: "showBattles" }));
  });

  test("Add Provider button dispatches addBattleProvider command", async () => {
    await page.locator('.bs-btn', { hasText: 'Add Provider' }).click();
    const cmd = await page.evaluate(() => (window as any).__lastCommand);
    expect(cmd).toEqual(expect.objectContaining({ command: "addBattleProvider" }));
  });

  test("toggle dispatches toggleProvider command", async () => {
    // The checkbox input is hidden (display:none) inside the toggle switch,
    // so we toggle it via evaluate rather than Playwright's .uncheck()
    await page.evaluate(() => {
      const input = document.querySelector('.bs-toggle input') as HTMLInputElement;
      input.checked = false;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const cmd = await page.evaluate(() => (window as any).__lastCommand);
    expect(cmd).toEqual(
      expect.objectContaining({
        command: "toggleProvider",
        providerId: "bb-prs",
        enabled: false,
      })
    );
  });
});

test.describe("Battles Settings - Empty State", () => {
  test("shows empty state when no providers configured", async ({ page }) => {
    await page.goto("http://localhost:3000/battles-settings");
    await page.waitForSelector(".bs-settings-shell");

    // Inject empty state
    await page.evaluate(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "update", data: { providers: [], providerStates: [] } },
        })
      );
    });

    await expect(page.locator(".bs-empty__title")).toHaveText("No Providers Configured");
    await expect(page.locator(".bs-provider-card")).toHaveCount(0);
  });
});
