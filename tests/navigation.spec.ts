import { test, expect, type Page } from '@playwright/test';

test.describe('Global Navigation Accessibility', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    page.on('console', () => {}); // suppress test-page noise
    page.on('pageerror', () => {});
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('mouse button 3 (Back) sends cancelForm command', async () => {
    // Navigate to settings (or any view)
    await page.goto('/settings');
    await page.waitForSelector('.lp-settings-view');

    // Simulate mouse back button press
    await page.evaluate(() => {
      // Create and dispatch a mouseup event with button: 3
      const event = new MouseEvent('mouseup', {
        button: 3,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);
    });

    const msg = await page.evaluate(() => (window as any).__lastCommand);
    expect(msg).toEqual({ command: 'cancelForm' });
  });

  test('Alt+Left arrow sends cancelForm command', async () => {
    await page.goto('/settings');
    await page.waitForSelector('.lp-settings-view');

    // Make sure we get standard layout event capture
    await page.evaluate(() => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        altKey: !isMac,
        metaKey: isMac,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);
    });

    const msg = await page.evaluate(() => (window as any).__lastCommand);
    expect(msg).toEqual({ command: 'cancelForm' });
  });
});
