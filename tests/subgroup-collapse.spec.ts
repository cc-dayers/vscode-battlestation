import { test, expect } from '@playwright/test';

test.describe('Secondary Group Collapse', () => {
  async function sendUpdate(page, data) {
    await page.evaluate((payload) => {
      window.dispatchEvent(new MessageEvent('message', {
        data: {
          type: 'update',
          data: payload,
        },
      }));
    }, data);
  }

  test.beforeEach(async ({ page }) => {
    // Suppress test-server console noise
    page.on('console', () => {});
    page.on('pageerror', () => {});

    await page.goto('/');
    await page.waitForSelector('.lp-btn-wrapper');

    // Setup a custom state with secondary groups
    await sendUpdate(page, {
      actions: [
        { name: 'App A', command: 'npm run a', type: 'npm', group: 'Apps', workspace: 'Portal' },
        { name: 'App B', command: 'npm run b', type: 'npm', group: 'Apps', workspace: 'Admin' },
      ],
      groups: [
        { name: 'Apps', color: '#e06c75', secondaryGroupBy: 'workspace' },
      ],
      display: {
        showCommand: true,
        showGroup: true,
        hideIcon: 'eye-closed',
        playButtonBg: 'transparent',
        actionToolbar: ['hide', 'setColor', 'edit', 'delete'],
        secondaryGroupStyle: 'border',
      },
      runStatus: {},
    });
    await page.waitForTimeout(100);
  });

  test('clicking subgroup header collapses it', async ({ page }) => {
    // Both apps should be visible initially
    await expect(page.locator('.lp-btn-wrapper', { hasText: 'App A' })).toBeVisible();
    await expect(page.locator('.lp-btn-wrapper', { hasText: 'App B' })).toBeVisible();

    // Click "Portal" subgroup header
    await page.locator('.lp-subgroup-header', { hasText: 'Portal' }).click();
    await page.waitForTimeout(100);

    // App A should be hidden (not present in DOM or hidden by Lit), App B should remain visible
    await expect(page.locator('.lp-btn-wrapper', { hasText: 'App A' })).not.toBeVisible();
    await expect(page.locator('.lp-btn-wrapper', { hasText: 'App B' })).toBeVisible();
    
    // Check for collapsed class
    await expect(page.locator('.lp-subgroup').filter({ hasText: 'Portal' })).toHaveClass(/lp-subgroup--collapsed/);
    await expect(page.locator('.lp-subgroup-header', { hasText: 'Portal' })).toHaveAttribute('aria-expanded', 'false');
  });

  test('searching expands collapsed subgroups', async ({ page }) => {
    // Collapse Portal
    await page.locator('.lp-subgroup-header', { hasText: 'Portal' }).click();
    await page.waitForTimeout(100);
    await expect(page.locator('.lp-btn-wrapper', { hasText: 'App A' })).not.toBeVisible();

    // Open search and type "App A"
    await page.evaluate((d) => {
      window.dispatchEvent(new MessageEvent('message', { data: d }));
    }, { type: 'toggleSearch', visible: true });
    await page.waitForSelector('.lp-search-box');
    await page.fill('.lp-search-box', 'App A');
    await page.waitForTimeout(100);

    // App A should be visible now
    await expect(page.locator('.lp-btn-wrapper', { hasText: 'App A' })).toBeVisible();

    // Clear search
    await page.fill('.lp-search-box', '');
    await page.waitForTimeout(100);

    // App A should be hidden again because it was previously collapsed
    await expect(page.locator('.lp-btn-wrapper', { hasText: 'App A' })).not.toBeVisible();
  });

  test('workspace and type subgroup collapse states stay separate', async ({ page }) => {
    const portalHeader = page.locator('.lp-subgroup-header', { hasText: 'Portal' });
    await portalHeader.click();
    await page.waitForTimeout(100);
    await expect(page.locator('.lp-btn-wrapper', { hasText: 'App A' })).not.toBeVisible();
    await expect(portalHeader).toHaveAttribute('aria-expanded', 'false');

    await sendUpdate(page, {
      actions: [
        { name: 'App A', command: 'npm run a', type: 'npm', group: 'Apps', workspace: 'Portal' },
        { name: 'App B', command: 'npm run b', type: 'npm', group: 'Apps', workspace: 'Admin' },
      ],
      groups: [
        { name: 'Apps', color: '#e06c75', secondaryGroupBy: 'type' },
      ],
      display: {
        showCommand: true,
        showGroup: true,
        hideIcon: 'eye-closed',
        playButtonBg: 'transparent',
        actionToolbar: ['hide', 'setColor', 'edit', 'delete'],
        secondaryGroupStyle: 'border',
      },
      runStatus: {},
    });
    await page.waitForTimeout(100);

    const npmHeader = page.locator('.lp-subgroup-header', { hasText: 'npm' });
    await expect(npmHeader).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.lp-btn-wrapper', { hasText: 'App A' })).toBeVisible();

    await npmHeader.click();
    await page.waitForTimeout(100);
    await expect(page.locator('.lp-btn-wrapper', { hasText: 'App A' })).not.toBeVisible();
    await expect(npmHeader).toHaveAttribute('aria-expanded', 'false');

    await sendUpdate(page, {
      actions: [
        { name: 'App A', command: 'npm run a', type: 'npm', group: 'Apps', workspace: 'Portal' },
        { name: 'App B', command: 'npm run b', type: 'npm', group: 'Apps', workspace: 'Admin' },
      ],
      groups: [
        { name: 'Apps', color: '#e06c75', secondaryGroupBy: 'workspace' },
      ],
      display: {
        showCommand: true,
        showGroup: true,
        hideIcon: 'eye-closed',
        playButtonBg: 'transparent',
        actionToolbar: ['hide', 'setColor', 'edit', 'delete'],
        secondaryGroupStyle: 'border',
      },
      runStatus: {},
    });
    await page.waitForTimeout(100);

    await expect(page.locator('.lp-btn-wrapper', { hasText: 'App A' })).not.toBeVisible();
    await expect(page.locator('.lp-subgroup-header', { hasText: 'Portal' })).toHaveAttribute('aria-expanded', 'false');
  });

  test('subgroup header shows collapse state and uses only the drag handle for reordering affordance', async ({ page }) => {
    const header = page.locator('.lp-subgroup-header', { hasText: 'Portal' });
    const chevron = header.locator('.lp-group-chevron');
    const dragHandle = header.locator('.lp-group-drag-handle');

    await expect(chevron).toHaveCount(1);

    const expandedTransform = await chevron.evaluate((el) => getComputedStyle(el).transform);
    expect(expandedTransform).toBe('none');

    const headerDraggable = await header.evaluate((el) => el.getAttribute('draggable'));
    expect(headerDraggable).toBeNull();

    const handleDraggable = await dragHandle.evaluate((el) => el.getAttribute('draggable'));
    expect(handleDraggable).toBe('true');

    await header.click();
    await page.waitForTimeout(100);

    const collapsedTransform = await chevron.evaluate((el) => getComputedStyle(el).transform);
    expect(collapsedTransform).not.toBe('none');
    await expect(header).toHaveAttribute('aria-expanded', 'false');

    const spacing = await page.evaluate(() => {
      const handle = document.querySelector('.lp-subgroup-header .lp-group-drag-handle') as HTMLElement | null;
      if (!handle) return null;
      return getComputedStyle(handle).marginRight;
    });
    expect(spacing).toBe('2px');
  });
});
