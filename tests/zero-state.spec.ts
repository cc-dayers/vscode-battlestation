import { test, expect, type Page } from '@playwright/test';

test.describe('Zero State Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to empty state by having NO initial data
    page.on('console', (msg) => {
        if (msg.type() === 'error') console.error('BROWSER ERROR:', msg.text());
    });
    page.on('pageerror', (err) => {
        console.error('BROWSER PAGE ERROR:', err.message);
    });

    await page.goto('/main');
    
    // Injected mock data with empty actions to trigger welcome screen
    await page.evaluate(() => {
        (window as any).__INITIAL_DATA__ = {
            actions: [],
            groups: [],
            display: {
                showIcon: true,
                showType: true,
                showCommand: true,
                showGroup: true,
                hideIcon: 'eye-closed',
                playButtonBg: 'transparent',
                actionToolbar: ['hide', 'setColor', 'edit', 'delete'],
                secondaryGroupStyle: 'border'
            },
            iconMap: {}
        };
        // Re-dispatch messages to force a fresh render with empty data
        window.dispatchEvent(new MessageEvent('message', {
            data: {
                type: 'update',
                data: (window as any).__INITIAL_DATA__
            }
        }));
    });

    await page.waitForSelector('.lp-empty-state');
  });

  test('Auto-detect button in welcome screen triggers showGenerateConfig', async ({ page }) => {
    const btn = page.locator('.lp-empty-primary');
    await expect(btn).toContainText('Auto-detect');
    
    // Setup command capture
    await page.evaluate(() => {
        (window as any).__lastCommand = null;
    });

    await btn.click();
    
    // Check if it's "Detecting..." now (immediate feedback)
    await expect(btn).toContainText('Detecting...');
    await expect(page.locator('.codicon-loading')).toBeVisible();

    // Verify command sent to extension
    const cmd = await page.evaluate(() => (window as any).__lastCommand);
    expect(cmd).toEqual({ command: 'showGenerateConfig' });
  });

  test('Search button in title bar works even from empty state', async ({ page }) => {
    // Title bar buttons work via postMessage coming in
    // This tests if the script initialized its listener despite empty data
    await page.evaluate(() => {
        window.dispatchEvent(new MessageEvent('message', {
            data: { type: 'toggleSearch', visible: true }
        }));
    });

    // Wait for search box to appear
    await expect(page.locator('.lp-search-box')).toBeVisible();
    
    // Toggle back off
    await page.evaluate(() => {
        window.dispatchEvent(new MessageEvent('message', {
            data: { type: 'toggleSearch', visible: false }
        }));
    });
    await expect(page.locator('.lp-search-box')).not.toBeVisible();
  });
});
