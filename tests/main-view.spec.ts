/**
 * E2E tests for core Main View interactions.
 *
 * Coverage:
 *  - All actions render on initial load
 *  - Group headers render
 *  - Play button dispatches executeCommand
 *  - Hide button dispatches hideAction
 *  - Search filters by action name and group name
 *  - Search shows no-results state when no match
 *  - Clearing search restores full list
 *  - Group collapse/expand toggles row visibility
 *  - showHidden controls visibility of hidden actions
 */

import { test, expect, type Page } from '@playwright/test';

// ── Helpers ───────────────────────────────────────────────────

async function sendMessage(page: Page, data: object) {
  await page.evaluate((d) => {
    window.dispatchEvent(new MessageEvent('message', { data: d }));
  }, data);
}

/** Show the search box (it starts hidden; make it visible via message). */
async function openSearch(page: Page) {
  await sendMessage(page, { type: 'toggleSearch', visible: true });
  await page.waitForSelector('.lp-search-box');
}

/** Synthetic-click a button inside an action row's toolbar.
 *  Needed because toolbar buttons start at opacity:0 (hover only). */
async function clickToolbarBtn(page: Page, actionName: string, selector: string) {
  await page.evaluate(
    ({ name, sel }) => {
      const rows = Array.from(document.querySelectorAll<HTMLElement>('.lp-btn-wrapper'));
      const row = rows.find((r) => r.textContent?.includes(name));
      if (!row) throw new Error(`Row "${name}" not found`);
      const btn = row.querySelector<HTMLElement>(sel);
      if (!btn) throw new Error(`No "${sel}" in row "${name}"`);
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    },
    { name: actionName, sel: selector }
  );
}

// ── Tests ─────────────────────────────────────────────────────

test.describe('Main View', () => {
  test.beforeEach(async ({ page }) => {
    // Suppress test-server console noise
    page.on('console', () => {});
    page.on('pageerror', () => {});

    await page.goto('/main');
    await page.waitForSelector('.lp-btn-wrapper');
    await page.waitForTimeout(100); // let Lit finish any async renders
  });

  // ─────────────────────────────────────────────────────────────
  // Rendering
  // ─────────────────────────────────────────────────────────────

  test('renders all six actions from initial data', async ({ page }) => {
    // Initial data has showHidden:true, so the hidden action is included
    await expect(page.locator('.lp-btn-wrapper')).toHaveCount(6);

    const names = [
      'Build Tool',
      'Deploy Script',
      'Test Suite',
      'Hidden Action',
      'Launch Reports',
      'Launch All',
    ];
    for (const name of names) {
      await expect(
        page.locator('.lp-btn-wrapper').filter({ hasText: name }),
        `Expected "${name}" to render`
      ).toHaveCount(1);
    }
  });

  test('renders group headers for Build and Launch', async ({ page }) => {
    await expect(page.locator('summary.lp-group-header', { hasText: 'Build' })).toHaveCount(1);
    await expect(page.locator('summary.lp-group-header', { hasText: 'Launch' })).toHaveCount(1);
  });

  test('hidden action row has lp-hidden-item class', async ({ page }) => {
    const hiddenRow = page.locator('.lp-btn-wrapper.lp-hidden-item');
    await expect(hiddenRow).toHaveCount(1);
    await expect(hiddenRow).toContainText('Hidden Action');
  });

  test('workflow section stays hidden until the experimental flag is enabled', async ({ page }) => {
    await sendMessage(page, {
      type: 'update',
      data: {
        workflowSummaries: [
          {
            id: 'workflow-release',
            name: 'Release Train',
            stepCount: 2,
            valid: true,
            invalidReasons: [],
          },
        ],
        experimentalFeatures: {
          workflows: false,
        },
      },
    });

    await expect(page.locator('.lp-workflow-section')).toHaveCount(0);

    await sendMessage(page, {
      type: 'update',
      data: {
        workflowSummaries: [
          {
            id: 'workflow-release',
            name: 'Release Train',
            stepCount: 2,
            valid: true,
            invalidReasons: [],
          },
        ],
        experimentalFeatures: {
          workflows: true,
        },
      },
    });

    await expect(page.locator('.lp-workflow-section')).toHaveCount(1);
    await expect(page.locator('.lp-workflow-card')).toContainText('Release Train');
  });

  // ─────────────────────────────────────────────────────────────
  // Play button
  // ─────────────────────────────────────────────────────────────

  test('play button dispatches executeCommand with correct item', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__lastCommand = null;
    });

    await page
      .locator('.lp-btn-wrapper')
      .filter({ hasText: 'Build Tool' })
      .locator('.lp-play-btn')
      .click();

    const cmd = await page.evaluate(() => (window as any).__lastCommand);
    expect(cmd?.command).toBe('executeCommand');
    expect(cmd?.item?.name).toBe('Build Tool');
    expect(cmd?.item?.command).toBe('npm run build');
  });

  test('play button for a different action dispatches the right item', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__lastCommand = null;
    });

    await page
      .locator('.lp-btn-wrapper')
      .filter({ hasText: 'Launch All' })
      .locator('.lp-play-btn')
      .click();

    const cmd = await page.evaluate(() => (window as any).__lastCommand);
    expect(cmd?.command).toBe('executeCommand');
    expect(cmd?.item?.name).toBe('Launch All');
  });

  // ─────────────────────────────────────────────────────────────
  // Hide / show action
  // ─────────────────────────────────────────────────────────────

  test('hide button dispatches hideAction for that action', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__lastCommand = null;
    });

    await clickToolbarBtn(page, 'Build Tool', '[title="Hide"]');
    await page.waitForTimeout(50);

    const cmd = await page.evaluate(() => (window as any).__lastCommand);
    expect(cmd?.command).toBe('hideAction');
    expect(cmd?.item?.name).toBe('Build Tool');
  });

  test('show button on a hidden action dispatches hideAction (toggle)', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__lastCommand = null;
    });

    // "Hidden Action" is already hidden — its toolbar button shows "Show"
    await clickToolbarBtn(page, 'Hidden Action', '[title="Show"]');
    await page.waitForTimeout(50);

    const cmd = await page.evaluate(() => (window as any).__lastCommand);
    expect(cmd?.command).toBe('hideAction');
    expect(cmd?.item?.name).toBe('Hidden Action');
    expect(cmd?.item?.hidden).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────
  // Search
  // ─────────────────────────────────────────────────────────────

  test('search filters actions by name', async ({ page }) => {
    await openSearch(page);
    await page.fill('.lp-search-box', 'script');
    await page.waitForTimeout(50);

    // Only "Deploy Script" matches — others in "Build" group don't contain "script"
    await expect(page.locator('.lp-btn-wrapper')).toHaveCount(1);
    await expect(page.locator('.lp-btn-wrapper').first()).toContainText('Deploy Script');
  });

  test('search filters actions by group name', async ({ page }) => {
    await openSearch(page);
    // "Build" group name: matches Build Tool, Deploy Script, Test Suite (via group field)
    await page.fill('.lp-search-box', 'build');
    await page.waitForTimeout(50);

    // "Build Tool" (name), + "Deploy Script" and "Test Suite" (group "Build")
    await expect(page.locator('.lp-btn-wrapper')).toHaveCount(3);
  });

  test('search shows no-results state when nothing matches', async ({ page }) => {
    await openSearch(page);
    await page.fill('.lp-search-box', 'xyzzy_no_match_123');
    await page.waitForTimeout(50);

    await expect(page.locator('.lp-btn-wrapper')).toHaveCount(0);
    await expect(page.locator('.lp-no-results')).toBeVisible();
    await expect(page.locator('.lp-no-results')).toContainText('No results for');
  });

  test('clearing search restores all actions', async ({ page }) => {
    await openSearch(page);
    await page.fill('.lp-search-box', 'script');
    await page.waitForTimeout(50);
    await expect(page.locator('.lp-btn-wrapper')).toHaveCount(1);

    // Clear the search
    await page.fill('.lp-search-box', '');
    await page.waitForTimeout(50);
    await expect(page.locator('.lp-btn-wrapper')).toHaveCount(6);
  });

  test('searching automatically expands collapsed groups', async ({ page }) => {
    // Manually collapse the "Build" group first
    await page.locator('summary.lp-group-header', { hasText: 'Build' }).click();
    await page.waitForTimeout(100);

    // Verify it is collapsed (actions are hidden)
    await expect(page.locator('.lp-btn-wrapper').filter({ hasText: 'Build Tool' })).not.toBeVisible();

    // Now search for an item in the collapsed group
    await openSearch(page);
    await page.fill('.lp-search-box', 'build tool');
    await page.waitForTimeout(50);

    // The group should automatically expand and the item should be visible
    await expect(page.locator('.lp-btn-wrapper').filter({ hasText: 'Build Tool' })).toBeVisible();

    // Clearing the search should return the group to its previously collapsed state
    await page.fill('.lp-search-box', '');
    await page.waitForTimeout(50);
    await expect(page.locator('.lp-btn-wrapper').filter({ hasText: 'Build Tool' })).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // Group collapse / expand
  // ─────────────────────────────────────────────────────────────

  test('clicking group header collapses the group and hides its actions', async ({
    page,
  }) => {
    // Build group is open by default — all three actions are visible
    const buildToolRow = page
      .locator('.lp-btn-wrapper')
      .filter({ hasText: 'Build Tool' });
    await expect(buildToolRow).toBeVisible();

    // Click the Build group header to collapse it
    await page.locator('summary.lp-group-header', { hasText: 'Build' }).click();
    await page.waitForTimeout(100);

    // Build Tool is now inside a closed <details> → not visible
    await expect(buildToolRow).not.toBeVisible();
    // Actions in Launch group are unaffected
    await expect(
      page.locator('.lp-btn-wrapper').filter({ hasText: 'Launch All' })
    ).toBeVisible();
  });

  test('clicking collapsed group header expands it and shows its actions', async ({
    page,
  }) => {
    // First collapse
    await page.locator('summary.lp-group-header', { hasText: 'Build' }).click();
    await page.waitForTimeout(100);
    await expect(
      page.locator('.lp-btn-wrapper').filter({ hasText: 'Build Tool' })
    ).not.toBeVisible();

    // Now re-expand
    await page.locator('summary.lp-group-header', { hasText: 'Build' }).click();
    await page.waitForTimeout(100);
    await expect(
      page.locator('.lp-btn-wrapper').filter({ hasText: 'Build Tool' })
    ).toBeVisible();
  });

  test('collapseAllGroups message collapses every group', async ({ page }) => {
    await sendMessage(page, { type: 'collapseAllGroups' });
    await page.waitForTimeout(100);

    // Both groups collapsed — actions inside them not visible
    await expect(
      page.locator('.lp-btn-wrapper').filter({ hasText: 'Build Tool' })
    ).not.toBeVisible();
    await expect(
      page.locator('.lp-btn-wrapper').filter({ hasText: 'Launch All' })
    ).not.toBeVisible();
  });

  test('expandAllGroups message expands every group', async ({ page }) => {
    // Collapse first
    await sendMessage(page, { type: 'collapseAllGroups' });
    await page.waitForTimeout(100);

    // Then expand all
    await sendMessage(page, { type: 'expandAllGroups' });
    await page.waitForTimeout(100);

    await expect(
      page.locator('.lp-btn-wrapper').filter({ hasText: 'Build Tool' })
    ).toBeVisible();
    await expect(
      page.locator('.lp-btn-wrapper').filter({ hasText: 'Launch All' })
    ).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // Show hidden
  // ─────────────────────────────────────────────────────────────

  test('setting showHidden:false hides hidden actions', async ({ page }) => {
    // Initially showHidden:true — "Hidden Action" is visible
    await expect(
      page.locator('.lp-btn-wrapper').filter({ hasText: 'Hidden Action' })
    ).toHaveCount(1);

    // Send update with showHidden:false
    await sendMessage(page, {
      type: 'update',
      data: {
        actions: [
          { name: 'Build Tool', command: 'npm run build', type: 'npm', group: 'Build' },
          { name: 'Deploy Script', command: 'bash ./deploy.sh', type: 'shell', group: 'Build' },
          { name: 'Test Suite', command: 'npm test', type: 'npm', group: 'Build' },
          { name: 'Hidden Action', command: 'echo hidden', type: 'shell', hidden: true },
          { name: 'Launch Reports', command: 'npm run reports', type: 'npm', group: 'Launch' },
          { name: 'Launch All', command: 'npm run all', type: 'npm', group: 'Launch' },
        ],
        groups: [
          { name: 'Build', icon: 'package', color: '#4a90d9' },
          { name: 'Launch', icon: 'rocket' },
        ],
        showHidden: false,
        runStatus: {},
      },
    });
    await page.waitForTimeout(100);

    await expect(
      page.locator('.lp-btn-wrapper').filter({ hasText: 'Hidden Action' })
    ).toHaveCount(0);
    await expect(page.locator('.lp-btn-wrapper')).toHaveCount(5);
  });

  test('setting showHidden:true reveals hidden actions', async ({ page }) => {
    // Start with showHidden:false
    await sendMessage(page, {
      type: 'update',
      data: {
        actions: [
          { name: 'Build Tool', command: 'npm run build', type: 'npm', group: 'Build' },
          { name: 'Hidden Action', command: 'echo hidden', type: 'shell', hidden: true },
        ],
        groups: [{ name: 'Build' }],
        showHidden: false,
        runStatus: {},
      },
    });
    await page.waitForTimeout(50);
    await expect(
      page.locator('.lp-btn-wrapper').filter({ hasText: 'Hidden Action' })
    ).toHaveCount(0);

    // Now reveal
    await sendMessage(page, {
      type: 'update',
      data: {
        actions: [
          { name: 'Build Tool', command: 'npm run build', type: 'npm', group: 'Build' },
          { name: 'Hidden Action', command: 'echo hidden', type: 'shell', hidden: true },
        ],
        groups: [{ name: 'Build' }],
        showHidden: true,
        runStatus: {},
      },
    });
    await page.waitForTimeout(50);
    await expect(
      page.locator('.lp-btn-wrapper').filter({ hasText: 'Hidden Action' })
    ).toHaveCount(1);
  });

  // ─────────────────────────────────────────────────────────────
  // Search: bulk assign results to group
  // ─────────────────────────────────────────────────────────────

  test('assign-to-group button is hidden when no search query is active', async ({ page }) => {
    await openSearch(page);
    // No query typed yet — button should not exist
    await expect(page.locator('#searchAssignBtn')).toHaveCount(0);
  });

  test('assign-to-group button is hidden when search has no results', async ({ page }) => {
    await openSearch(page);
    await page.fill('.lp-search-box', 'xyzzy_no_match_123');
    await page.waitForTimeout(50);
    // Zero results: button should not appear
    await expect(page.locator('#searchAssignBtn')).toHaveCount(0);
  });

  test('assign-to-group button appears when search returns results and groups exist', async ({ page }) => {
    await openSearch(page);
    await page.fill('.lp-search-box', 'build');
    await page.waitForTimeout(50);
    // Results found and groups exist in initial data => button should be visible
    await expect(page.locator('#searchAssignBtn')).toBeVisible();
  });

  test('clicking assign-to-group button opens group picker dropdown', async ({ page }) => {
    await openSearch(page);
    await page.fill('.lp-search-box', 'build');
    await page.waitForTimeout(50);

    await page.locator('#searchAssignBtn').click();
    await page.waitForTimeout(50);

    // Picker should appear
    await expect(page.locator('.lp-search-assign-picker')).toBeVisible();
    // Should list the groups from initial data: Build, Launch
    await expect(page.locator('.lp-search-assign-picker-item')).toHaveCount(2);
    await expect(page.locator('.lp-search-assign-picker-item').first()).toContainText('Build');
    await expect(page.locator('.lp-search-assign-picker-item').last()).toContainText('Launch');
  });

  test('clicking a group in picker dispatches bulkAssignGroup with visible actions', async ({ page }) => {
    await page.evaluate(() => { (window as any).__lastCommand = null; });

    await openSearch(page);
    await page.fill('.lp-search-box', 'script');
    await page.waitForTimeout(50);

    // "Deploy Script" should be the only result
    await expect(page.locator('.lp-btn-wrapper')).toHaveCount(1);

    await page.locator('#searchAssignBtn').click();
    await page.waitForTimeout(50);

    // Click "Launch" group in picker
    await page.locator('.lp-search-assign-picker-item', { hasText: 'Launch' }).click();
    await page.waitForTimeout(50);

    const cmd = await page.evaluate(() => (window as any).__lastCommand);
    expect(cmd?.command).toBe('bulkAssignGroup');
    expect(cmd?.groupName).toBe('Launch');
    expect(cmd?.items).toHaveLength(1);
    expect(cmd?.items[0].name).toBe('Deploy Script');
  });

  test('picker closes after assigning to a group', async ({ page }) => {
    await openSearch(page);
    await page.fill('.lp-search-box', 'script');
    await page.waitForTimeout(50);

    await page.locator('#searchAssignBtn').click();
    await page.waitForTimeout(50);
    await expect(page.locator('.lp-search-assign-picker')).toBeVisible();

    await page.locator('.lp-search-assign-picker-item').first().click();
    await page.waitForTimeout(50);
    // Picker should close
    await expect(page.locator('.lp-search-assign-picker')).toHaveCount(0);
  });

  test('picker closes when clicking outside', async ({ page }) => {
    await openSearch(page);
    await page.fill('.lp-search-box', 'build');
    await page.waitForTimeout(50);

    await page.locator('#searchAssignBtn').click();
    await page.waitForTimeout(50);
    await expect(page.locator('.lp-search-assign-picker')).toBeVisible();

    // Click somewhere outside the picker
    await page.locator('.lp-grid').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(50);
    await expect(page.locator('.lp-search-assign-picker')).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Secondary group border color
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Secondary group border color', () => {
  /**
   * Regression test: when `secondaryGroupStyle === "border"`, the CSS variable
   * `--lp-subgroup-border-color` must be set to the parent group's color.
   *
   * The previous bug: the variable was only set when actions had `workspaceColor`
   * on them. Without that field the border fell back to the grey widget border,
   * making all bordered secondary groups look identical regardless of group color.
   */
  test('bordered secondary group uses the parent group color for its border', async ({ page }) => {
    page.on('console', () => {});
    page.on('pageerror', () => {});

    await page.goto('/main');
    await page.waitForSelector('.lp-btn-wrapper');

    // Send an update that creates a group with secondaryGroupBy + a known group color,
    // but WITHOUT workspaceColor on the actions (the common case that was broken).
    await page.evaluate(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: {
          type: 'update',
          data: {
            actions: [
              { name: 'Action A', command: 'npm run a', type: 'npm', group: 'Deploy', workspace: 'Alpha' },
              { name: 'Action B', command: 'npm run b', type: 'npm', group: 'Deploy', workspace: 'Beta' },
            ],
            groups: [
              { name: 'Deploy', color: '#e06c75', secondaryGroupBy: 'workspace' },
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
          },
        },
      }));
    });

    await page.waitForTimeout(100);

    // The bordered subgroup wrapper must exist
    const subgroup = page.locator('.lp-subgroup--bordered').first();
    await expect(subgroup).toBeVisible();

    // Read the computed --lp-subgroup-border-color CSS variable from the element's
    // inline style. It must NOT be empty (empty = the fix is missing).
    const borderColorVar = await subgroup.evaluate((el) => {
      return (el as HTMLElement).style.getPropertyValue('--lp-subgroup-border-color').trim();
    });

    expect(borderColorVar, 'Expected --lp-subgroup-border-color to be set from group.color, but it was empty').not.toBe('');

    // The value should reference the parent group color (#e06c75) in some form
    // (via color-mix wrapping). We check it contains the hex string.
    expect(borderColorVar).toContain('#e06c75');
  });

  test('bordered secondary group with workspaceColor uses the workspace color for its border', async ({ page }) => {
    page.on('console', () => {});
    page.on('pageerror', () => {});

    await page.goto('/main');
    await page.waitForSelector('.lp-btn-wrapper');

    await page.evaluate(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: {
          type: 'update',
          data: {
            actions: [
              { name: 'Action A', command: 'npm run a', type: 'npm', group: 'Deploy', workspace: 'Alpha', workspaceColor: '#61afef' },
              { name: 'Action B', command: 'npm run b', type: 'npm', group: 'Deploy', workspace: 'Alpha' },
            ],
            groups: [
              { name: 'Deploy', color: '#e06c75', secondaryGroupBy: 'workspace' },
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
          },
        },
      }));
    });

    await page.waitForTimeout(100);

    const subgroup = page.locator('.lp-subgroup--bordered').first();
    await expect(subgroup).toBeVisible();

    const borderColorVar = await subgroup.evaluate((el) => {
      return (el as HTMLElement).style.getPropertyValue('--lp-subgroup-border-color').trim();
    });

    // Workspace color (#61afef) takes priority over group color (#e06c75)
    expect(borderColorVar).toContain('#61afef');
  });

  test('non-bordered secondary group does not set the border color CSS variable', async ({ page }) => {
    page.on('console', () => {});
    page.on('pageerror', () => {});

    await page.goto('/main');
    await page.waitForSelector('.lp-btn-wrapper');

    await page.evaluate(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: {
          type: 'update',
          data: {
            actions: [
              { name: 'Action A', command: 'npm run a', type: 'npm', group: 'Deploy', workspace: 'Alpha' },
            ],
            groups: [
              { name: 'Deploy', color: '#e06c75', secondaryGroupBy: 'workspace' },
            ],
            display: {
              showCommand: true,
              showGroup: true,
              hideIcon: 'eye-closed',
              playButtonBg: 'transparent',
              actionToolbar: ['hide', 'setColor', 'edit', 'delete'],
              secondaryGroupStyle: 'badge',
            },
            runStatus: {},
          },
        },
      }));
    });

    await page.waitForTimeout(100);

    // In badge mode the subgroup wrapper must NOT have the --bordered class
    const subgroup = page.locator('.lp-subgroup').first();
    await expect(subgroup).toBeVisible();
    await expect(subgroup).not.toHaveClass('lp-subgroup--bordered');

    const borderColorVar = await subgroup.evaluate((el) => {
      return (el as HTMLElement).style.getPropertyValue('--lp-subgroup-border-color').trim();
    });
    expect(borderColorVar).toBe('');
  });
});


