import { test, expect } from '@playwright/test';

test.describe('Generate Config View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/generate-config');
    await page.waitForSelector('#showOptionsCheck');
  });

  test('show generation options reveals advanced controls without browser errors', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    await expect(page.locator('#optionsContainer')).not.toBeVisible();
    await page.locator('#showOptionsCheck').check();
    await expect(page.locator('#optionsContainer')).toBeVisible();
    await expect(page.locator('#groupCheck')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('checkbox changes whether custom generation options are used', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__lastCommand = null;
    });

    await page.locator('#createBtn').click();

    const defaultCmd = await page.evaluate(() => (window as any).__lastCommand);
    expect(defaultCmd).toEqual({
      command: 'createConfig',
      sources: {
        npm: true,
        tasks: true,
        launch: true,
        docker: true,
        make: true,
        rust: true,
        go: true
      },
      enableGrouping: true,
      enableColoring: true,
      autoOpen: false,
      deepScan: false,
      secondaryGroupBy: 'auto'
    });

    await page.evaluate(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'configGenerationComplete' }
      }));
      (window as any).__lastCommand = null;
    });

    await page.locator('#showOptionsCheck').check();
    await page.locator('#launchCheck').uncheck();
    await page.locator('#colorCheck').uncheck();
    await page.locator('#autoOpenCheck').check();
    await page.locator('#deepScanCheck').check();
    await page.locator('#secondaryGroupBySelect').selectOption('workspace');
    await page.locator('#createBtn').click();

    const customCmd = await page.evaluate(() => (window as any).__lastCommand);
    expect(customCmd).toEqual({
      command: 'createConfig',
      sources: {
        npm: true,
        tasks: true,
        launch: false,
        docker: true,
        make: true,
        rust: true,
        go: true
      },
      enableGrouping: true,
      enableColoring: false,
      autoOpen: true,
      deepScan: true,
      secondaryGroupBy: 'workspace'
    });
  });
});
