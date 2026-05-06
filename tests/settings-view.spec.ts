import { test, expect, type Page } from '@playwright/test';

test.describe('Settings View', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    page.on('console', () => {}); // suppress test-page noise
    page.on('pageerror', () => {});
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Shows Delete History button when config does not exist but history exists', async () => {
    await page.goto('/settings?configExists=false&backupCount=3');
    await page.waitForSelector('.lp-settings-view');

    const restoreBtn = page.locator('.lp-config-btn').filter({ hasText: 'Restore' });
    await expect(restoreBtn).toBeVisible();

    const deleteHistoryBtn = page.locator('.lp-config-btn').filter({ hasText: 'Delete History' });
    await expect(deleteHistoryBtn).toBeVisible();

    // Click Delete History
    await deleteHistoryBtn.click();

    // Confirm dialog should appear
    const confirmDialog = page.locator('.lp-config-confirm');
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog.locator('span', { hasText: 'Delete 3 history backups?' })).toBeVisible();

    // Click Delete in the confirm dialog
    const confirmDeleteBtn = confirmDialog.locator('.lp-config-btn').filter({ hasText: 'Delete History' });
    await confirmDeleteBtn.click();

    // Check that the "clearHistory" message is dispatched
    const msg = await page.evaluate(() => (window as any).__lastCommand);
    expect(msg).toEqual({ command: 'clearHistory' });
  });

  test('Shows correct delete logic when config exists', async () => {
    await page.goto('/settings?configExists=true&backupCount=3');
    await page.waitForSelector('.lp-settings-view');

    const deleteBtn = page.locator('.lp-config-btn').filter({ hasText: 'Delete' });
    await expect(deleteBtn).toBeVisible();

    await deleteBtn.click();

    // Confirm dialog should appear
    const confirmDialog = page.locator('.lp-config-confirm');
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog.locator('span', { hasText: 'Delete battle.json?' })).toBeVisible();

    // Verify "Also delete" checkbox
    const checkbox = confirmDialog.locator('input[type="checkbox"]#deleteHistoryAlso');
    await expect(checkbox).toBeVisible();
    await checkbox.check();

    // Click Delete in confirm dialog
    const confirmDeleteBtn = confirmDialog.locator('.lp-config-btn', { hasText: 'Delete' }).last();
    // In our implementation both the initial trigger and the confirmation button have the text "Delete"
    // .lp-config-confirm-actions > .lp-config-btn
    await confirmDialog.locator('.lp-config-confirm-actions').locator('.lp-config-btn').nth(0).click();

    const msg = await page.evaluate(() => (window as any).__lastCommand);
    expect(msg).toEqual({ command: 'deleteConfig', deleteHistory: true });
  });

  test('saves Remember Action Search setting', async () => {
    await page.goto('/settings?configExists=true&backupCount=3&rememberActionSearch=true');
    await page.waitForSelector('.lp-settings-view');

    const rememberSearchRow = page.locator('.lp-setting-row').filter({ hasText: 'Remember Action Search' });
    const checkbox = rememberSearchRow.locator('input[type="checkbox"]');
    await expect(checkbox).toBeChecked();

    await checkbox.evaluate((input) => {
      const checkboxInput = input as HTMLInputElement;
      checkboxInput.checked = false;
      checkboxInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await page.getByRole('button', { name: 'Save Settings' }).click();

    const msg = await page.evaluate(() => (window as any).__lastCommand);
    expect(msg.command).toBe('saveSettings');
    expect(msg.settings.rememberActionSearch).toBe(false);
  });
});
