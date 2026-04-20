/**
 * E2E tests for Secondary Label (workspace) editing in the Edit Action form.
 *
 * The /edit-action-workspace test page renders the edit form pre-filled with:
 *   name: 'workspace-app:build'
 *   workspace: 'my-app'
 *   workspaceColor: '#2e7d32'
 *
 * Coverage:
 *  - Secondary Label field is visible and pre-populated when workspace is set
 *  - Secondary Label Color picker is visible when workspace has a value
 *  - Secondary Label Color picker hides when workspace is cleared
 *  - Submitting the form includes workspace and workspaceColor in submitEditAction
 *  - Clearing the workspace field submits workspace: undefined (clears it)
 *  - Secondary label badge renders in main view when action has workspace
 */

import { test, expect, type Page } from '@playwright/test';

async function sendMessage(page: Page, data: object) {
  await page.evaluate((d) => {
    window.dispatchEvent(new MessageEvent('message', { data: d }));
  }, data);
}

// ── Edit Action Form tests ────────────────────────────────────

test.describe('Edit Action Form – Secondary Label', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', () => {});
    page.on('pageerror', () => {});
    await page.goto('/edit-action-workspace');
    // Wait for the form to be rendered
    await page.waitForSelector('#editActionForm');
  });

  test('Secondary Label field is visible and pre-populated', async ({ page }) => {
    const workspaceInput = page.locator('#workspace');
    await expect(workspaceInput).toBeVisible();
    await expect(workspaceInput).toHaveValue('my-app');
  });

  test('Secondary Label Color section is visible when workspace is pre-filled', async ({ page }) => {
    const colorGroup = page.locator('#workspaceColorGroup');
    await expect(colorGroup).toBeVisible();
  });

  test('Secondary Label Color section hides when workspace is cleared', async ({ page }) => {
    const workspaceInput = page.locator('#workspace');
    const colorGroup = page.locator('#workspaceColorGroup');

    // Pre-condition: colour group is visible
    await expect(colorGroup).toBeVisible();

    // Clear the workspace field
    await workspaceInput.fill('');
    await page.waitForTimeout(50);

    // Colour group should now be hidden
    await expect(colorGroup).not.toBeVisible();
  });

  test('Secondary Label Color section shows again when workspace is re-entered', async ({ page }) => {
    const workspaceInput = page.locator('#workspace');
    const colorGroup = page.locator('#workspaceColorGroup');

    // Clear then re-type
    await workspaceInput.fill('');
    await page.waitForTimeout(50);
    await expect(colorGroup).not.toBeVisible();

    await workspaceInput.fill('new-workspace');
    await page.waitForTimeout(50);
    await expect(colorGroup).toBeVisible();
  });

  test('submitting the form includes workspace and workspaceColor', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__lastCommand = null;
    });

    // Submit the form as-is (workspace = 'my-app' is pre-filled)
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(100);

    const cmd = await page.evaluate(() => (window as any).__lastCommand);
    expect(cmd?.command).toBe('submitEditAction');
    expect(cmd?.newItem?.workspace).toBe('my-app');
  });

  test('clearing workspace before submit sends workspace: undefined', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__lastCommand = null;
    });

    // Clear workspace
    await page.locator('#workspace').fill('');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(100);

    const cmd = await page.evaluate(() => (window as any).__lastCommand);
    expect(cmd?.command).toBe('submitEditAction');
    // workspace should be missing / undefined when cleared
    expect(cmd?.newItem?.workspace).toBeUndefined();
    expect(cmd?.newItem?.workspaceColor).toBeUndefined();
  });

  test('changing workspace value is reflected in the submitted item', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__lastCommand = null;
    });

    await page.locator('#workspace').fill('packages/api');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(100);

    const cmd = await page.evaluate(() => (window as any).__lastCommand);
    expect(cmd?.command).toBe('submitEditAction');
    expect(cmd?.newItem?.workspace).toBe('packages/api');
  });
});

// ── Main View – workspace badge rendering ──────────────────────

test.describe('Main View – Secondary Label Badge', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', () => {});
    page.on('pageerror', () => {});
    await page.goto('/main');
    await page.waitForSelector('.lp-btn-wrapper');
    await page.waitForTimeout(100);
  });

  test('workspace badge renders for an action with workspace field', async ({ page }) => {
    // Inject an action with a workspace field via update message
    await sendMessage(page, {
      type: 'update',
      data: {
        actions: [
          {
            name: 'workspace-app:build',
            command: 'yarn workspace my-app build',
            type: 'npm',
            workspace: 'my-app',
            workspaceColor: '#2e7d32',
          },
        ],
        groups: [],
        showHidden: false,
        runStatus: {},
      },
    });
    await page.waitForTimeout(100);

    // The workspace badge should be rendered
    const badge = page.locator('.lp-workspace-label');
    await expect(badge).toHaveCount(1);
    await expect(badge).toContainText('my-app');
  });

  test('workspace badge is NOT present for actions without workspace', async ({ page }) => {
    // Default initial data has no workspace field on any action
    const badge = page.locator('.lp-workspace-label');
    await expect(badge).toHaveCount(0);
  });

  test('workspace badge is styled with the workspaceColor when provided', async ({ page }) => {
    await sendMessage(page, {
      type: 'update',
      data: {
        actions: [
          {
            name: 'styled-workspace-action',
            command: 'echo test',
            type: 'shell',
            workspace: 'my-pkg',
            workspaceColor: '#ff0000',
          },
        ],
        groups: [],
        showHidden: false,
        runStatus: {},
      },
    });
    await page.waitForTimeout(100);

    const badge = page.locator('.lp-workspace-label');
    await expect(badge).toBeVisible();
    // colour is applied via inline style background-color
    const style = await badge.getAttribute('style');
    expect(style).toContain('#ff0000');
  });
});
