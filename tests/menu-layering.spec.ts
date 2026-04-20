/**
 * E2E tests for menu layering and hidden-item opacity.
 *
 *  1. Ellipsis flyout panel is topmost at its visual coordinates
 *     (not occluded by sibling rows painted later in DOM order — z-index regression test)
 *  2. Clicking a menu item at its real screen coordinates dispatches the right command
 *     (a broken z-index would route the click to the row behind the panel)
 *  3. A hidden action row restores full opacity when its flyout is open
 *     (opacity:0.5 from lp-hidden-item must not bleed into the popup)
 */

import { test, expect, type Page } from '@playwright/test';

// ── Helper ────────────────────────────────────────────────────
/** Open the flyout menu for a named action row via a synthetic JS click.
 *  We can't use Playwright's built-in .click() here because the trigger
 *  button starts at opacity:0 and Playwright's actionability check rejects it. */
async function openMenuFor(page: Page, actionName: string) {
  await page.evaluate((name) => {
    const rows = Array.from(document.querySelectorAll<HTMLElement>('.lp-btn-wrapper'));
    const row = rows.find((r) => r.textContent?.includes(name));
    if (!row) throw new Error(`Row "${name}" not found`);
    const trigger = row.querySelector<HTMLElement>('.lp-menu-trigger--action');
    if (!trigger) throw new Error(`No .lp-menu-trigger--action in row "${name}"`);
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }, actionName);
  await page.waitForSelector('.lp-menu-panel--action');
}

test.describe('Menu Layering', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    page.on('console', () => {});
    page.on('pageerror', () => {});
    await page.goto('/main');
    await page.waitForSelector('.lp-btn-wrapper');
    await page.waitForTimeout(200); // let Lit finish async renders
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. Flyout panel must be the topmost element at its visual coords
  // ─────────────────────────────────────────────────────────────
  test('flyout panel is topmost at its visual coordinates', async () => {
    await openMenuFor(page, 'Build Tool');

    const menuCheck = await page.evaluate(() => {
      const panel = document.querySelector('.lp-menu-panel--action');
      const item = panel?.querySelector('.lp-menu-item--action');
      if (!panel || !item) return { error: 'No menu panel or item found' };

      const box = item.getBoundingClientRect();
      const cx = Math.round(box.left + box.width / 2);
      const cy = Math.round(box.top + box.height / 2);
      const el = document.elementFromPoint(cx, cy);
      return {
        isInsideMenuPanel: !!el?.closest('.lp-menu-panel--action'),
        topElementTag: el?.tagName,
        topElementClasses:
          typeof el?.className === 'string' ? el.className : '(SVGAnimatedString)',
      };
    });

    expect(menuCheck.error).toBeUndefined();
    expect(
      menuCheck.isInsideMenuPanel,
      `Expected menu panel item to be topmost, got: ${menuCheck.topElementTag} "${menuCheck.topElementClasses}"`
    ).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Clicking a menu item at real screen coords dispatches the right command
  // ─────────────────────────────────────────────────────────────
  test('clicking "Assign to Launch" at screen coords dispatches assignGroup', async () => {
    // Re-open if the panel was already closed
    const isOpen = await page.evaluate(
      () => !!document.querySelector('.lp-menu-panel--action')
    );
    if (!isOpen) await openMenuFor(page, 'Build Tool');

    await page.evaluate(() => {
      (window as any).__lastCommand = null;
    });

    // Get coords of the "Assign to Launch" button, then click via mouse —
    // if z-index is broken the click lands on the row behind and no command fires.
    const coords = await page.evaluate(() => {
      const panel = document.querySelector('.lp-menu-panel--action');
      const btn = Array.from(panel?.querySelectorAll('button') ?? []).find(
        (b) => b.textContent?.includes('Assign to Launch')
      );
      if (!btn) return null;
      const box = btn.getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    });

    expect(coords).not.toBeNull();
    if (coords) await page.mouse.click(coords.x, coords.y);

    await page.waitForTimeout(50);

    const cmd = await page.evaluate(() => (window as any).__lastCommand);
    expect(cmd?.command).toBe('assignGroup');
    expect(cmd?.groupName).toBe('Launch');
    expect(cmd?.item?.name).toBe('Build Tool');
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Hidden item restores to full opacity when its flyout is open
  // ─────────────────────────────────────────────────────────────
  test('hidden action row has opacity:1 when its flyout is open', async () => {
    const hiddenRow = page.locator('.lp-btn-wrapper.lp-hidden-item').first();
    await expect(hiddenRow).toHaveCount(1);

    // Baseline: no hover, no menu → dimmed
    const baseOpacity = await hiddenRow.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).opacity)
    );
    expect(baseOpacity).toBeLessThan(1);

    await openMenuFor(page, 'Hidden Action');

    // Wrapper must carry lp-menu-open class
    await expect(hiddenRow).toHaveClass(/lp-menu-open/);

    // Wrapper opacity must be 1
    const openOpacity = await hiddenRow.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).opacity)
    );
    expect(openOpacity).toBe(1);

    // The flyout panel itself must also be fully opaque
    const panelOpacity = await page.evaluate(() => {
      const panel = document.querySelector('.lp-menu-panel--action');
      return panel ? parseFloat(window.getComputedStyle(panel).opacity) : null;
    });
    expect(panelOpacity).toBe(1);
  });
});
