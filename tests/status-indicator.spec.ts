/**
 * E2E tests for the Last-Run Status Indicator feature.
 *
 * Tests the full message pipeline:
 *   extension host sends postMessage({ command: 'statusUpdate', ... })
 *   → webview updates state.runStatus
 *   → Lit re-renders with status dot
 *
 * Tests share a single page because they test sequential state mutations
 * (each test builds on the DOM state left by the previous one).
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('Status Indicator', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    page.on('console', () => {}); // suppress test-page noise
    page.on('pageerror', () => {});
    await page.goto('/');
    await page.waitForSelector('.lp-btn-wrapper');
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. Fresh page — "Test Suite" has no dot (no runStatus entry)
  // ─────────────────────────────────────────────────────────────
  test('no dots shown before any statusUpdate message', async () => {
    const testSuiteBtn = page
      .locator('.lp-btn')
      .filter({ hasText: 'Test Suite' });
    await expect(testSuiteBtn.locator('.lp-status-dot')).toHaveCount(0);
  });

  // ─────────────────────────────────────────────────────────────
  // 2. exitCode:0 → green dot appears without reload
  // ─────────────────────────────────────────────────────────────
  test('exitCode:0 adds a green dot without page reload', async () => {
    const dotsBefore = await page.locator('.lp-status-dot').count();

    await page.evaluate(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            command: 'statusUpdate',
            name: 'Test Suite',
            exitCode: 0,
            timestamp: Date.now(),
          },
        })
      );
    });

    const dot = page
      .locator('.lp-btn')
      .filter({ hasText: 'Test Suite' })
      .locator('.lp-status-dot');

    await expect(dot).toBeVisible();
    await expect(dot).toHaveClass(/lp-status-ok/);
    await expect(dot).not.toHaveClass(/lp-status-fail/);
    await expect(dot).toHaveAttribute('title', /Exit 0/);
    expect(await page.locator('.lp-status-dot').count()).toBe(dotsBefore + 1);
  });

  // ─────────────────────────────────────────────────────────────
  // 3. exitCode:1 → same dot turns red (no new dot added)
  // ─────────────────────────────────────────────────────────────
  test('exitCode:1 turns the dot red without adding a new dot', async () => {
    const dotsBefore = await page.locator('.lp-status-dot').count();

    await page.evaluate(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            command: 'statusUpdate',
            name: 'Test Suite',
            exitCode: 1,
            timestamp: Date.now(),
          },
        })
      );
    });

    const dot = page
      .locator('.lp-btn')
      .filter({ hasText: 'Test Suite' })
      .locator('.lp-status-dot');

    await expect(dot).toHaveClass(/lp-status-fail/);
    await expect(dot).not.toHaveClass(/lp-status-ok/);
    await expect(dot).toHaveAttribute('title', /Exit 1/);
    expect(await page.locator('.lp-status-dot').count()).toBe(dotsBefore);
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Updating one action does not affect others
  // ─────────────────────────────────────────────────────────────
  test('statusUpdate for one action does not affect other actions', async () => {
    const buildDot = page
      .locator('.lp-btn')
      .filter({ hasText: 'Build Tool' })
      .locator('.lp-status-dot');

    await expect(buildDot).toHaveClass(/lp-status-ok/);
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Dots survive a full data update (panel refresh)
  // ─────────────────────────────────────────────────────────────
  test('runStatus survives a full "update" postMessage', async () => {
    await page.evaluate(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'update',
            data: {
              actions: [
                { name: 'Build Tool', command: 'npm run build', type: 'npm' },
                { name: 'Deploy Script', command: 'bash ./deploy.sh', type: 'shell' },
                { name: 'Test Suite', command: 'npm test', type: 'npm' },
              ],
              groups: [],
              runStatus: {
                'Test Suite': { exitCode: 1, timestamp: Date.now() - 3000 },
              },
            },
          },
        })
      );
    });

    const dot = page
      .locator('.lp-btn')
      .filter({ hasText: 'Test Suite' })
      .locator('.lp-status-dot');

    await expect(dot).toBeVisible();
    await expect(dot).toHaveClass(/lp-status-fail/);
  });
});
