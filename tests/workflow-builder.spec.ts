import { test, expect } from '@playwright/test';

test.describe('Workflow Builder', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', () => {});
    page.on('pageerror', () => {});

    await page.goto('/workflow-builder');
    await page.waitForSelector('.wf-shell');
    await page.waitForTimeout(100);
  });

  test('renders saved workflows and active steps', async ({ page }) => {
    await expect(page.locator('.wf-rail-item')).toHaveCount(2);
    await expect(page.locator('.wf-name-input')).toHaveValue('Release Train');
    await expect(page.locator('.wf-steps .wf-card .wf-card-title', { hasText: 'Build Project' })).toBeVisible();
    await expect(page.locator('.wf-steps .wf-card .wf-card-title', { hasText: 'Run Tests' })).toBeVisible();
  });

  test('shows guidance and current workflow limitations', async ({ page }) => {
    await expect(page.locator('.wf-guide')).toContainText('Sequential only');
    await expect(page.locator('.wf-guide')).toContainText('No branching, conditions, loops, or freeform graph editing yet.');
    await expect(page.locator('.wf-guide')).toContainText('VS Code commands and launch configs are excluded.');
  });

  test('catalog copy explains the eligible action subset', async ({ page }) => {
    await expect(page.locator('.wf-catalog .wf-section-copy')).toContainText('Showing 4 of 5 actions');
    await expect(page.locator('.wf-card--catalog')).toHaveCount(4);
    await expect(page.locator('.wf-card--catalog', { hasText: 'Compile Task' })).toBeVisible();
    await expect(page.locator('.wf-card--catalog', { hasText: 'Open Problems' })).toHaveCount(0);
  });

  test('renders the active workflow as connected step nodes', async ({ page }) => {
    await expect(page.locator('.wf-step-node')).toHaveCount(2);
    await expect(page.locator('.wf-step-line')).toHaveCount(1);
    await expect(page.locator('.wf-step-terminal')).toContainText('End');
  });

  test('new workflow button dispatches createWorkflow', async ({ page }) => {
    await page.evaluate(() => { (window as any).__lastCommand = null; });
    await page.locator('.wf-primary-btn', { hasText: 'New' }).click();
    const command = await page.evaluate(() => (window as any).__lastCommand);
    expect(command?.command).toBe('createWorkflow');
  });

  test('adding a catalog action dispatches addWorkflowStep for the active workflow', async ({ page }) => {
    await page.evaluate(() => { (window as any).__lastCommand = null; });
    await page.locator('.wf-card--catalog', { hasText: 'Deploy App' }).locator('.wf-primary-btn').click();
    const command = await page.evaluate(() => (window as any).__lastCommand);
    expect(command?.command).toBe('addWorkflowStep');
    expect(command?.workflowId).toBe('workflow-release');
    expect(command?.actionId).toBe('action-deploy');
  });

  test('task actions appear in the catalog and can be added to a workflow', async ({ page }) => {
    await page.evaluate(() => { (window as any).__lastCommand = null; });
    await page.locator('.wf-card--catalog', { hasText: 'Compile Task' }).locator('.wf-primary-btn').click();
    const command = await page.evaluate(() => (window as any).__lastCommand);
    expect(command?.command).toBe('addWorkflowStep');
    expect(command?.workflowId).toBe('workflow-release');
    expect(command?.actionId).toBe('action-task');
  });

  test('catalog refreshes when updated actions arrive from the extension host', async ({ page }) => {
    await expect(page.locator('.wf-card--catalog')).toHaveCount(4);

    await page.evaluate(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: {
          type: 'update',
          data: {
            actions: [
              { id: 'action-build', name: 'Build Project', command: 'npm run build', type: 'npm', group: 'Build' },
              { id: 'action-test', name: 'Run Tests', command: 'npm test', type: 'npm', group: 'Test' },
              { id: 'action-deploy', name: 'Deploy App', command: 'npm run deploy', type: 'npm', group: 'Release' },
              { id: 'action-sync', name: 'Synced Action', command: 'echo synced', type: 'shell', group: 'Utility' },
            ],
            eligibleActionCount: 4,
            totalActionCount: 6,
            workflows: [
              {
                id: 'workflow-release',
                name: 'Release Train',
                stepCount: 2,
                valid: true,
                invalidReasons: [],
                steps: [
                  { id: 'step-build', actionId: 'action-build', continueOnError: false, valid: true, action: { id: 'action-build', name: 'Build Project', command: 'npm run build', type: 'npm', group: 'Build' } },
                  { id: 'step-test', actionId: 'action-test', continueOnError: true, valid: true, action: { id: 'action-test', name: 'Run Tests', command: 'npm test', type: 'npm', group: 'Test' } },
                ],
              },
              {
                id: 'workflow-invalid',
                name: 'Broken Chain',
                stepCount: 1,
                valid: false,
                invalidReasons: ['Referenced action no longer exists.'],
                steps: [
                  { id: 'step-missing', actionId: 'missing-action', continueOnError: false, valid: false, reason: 'Referenced action no longer exists.' },
                ],
              },
            ],
            activeWorkflowId: 'workflow-release',
          },
        },
      }));
    });

    await expect(page.locator('.wf-card--catalog')).toHaveCount(4);
    await expect(page.locator('.wf-card--catalog', { hasText: 'Synced Action' })).toBeVisible();
    await expect(page.locator('.wf-catalog .wf-section-copy')).toContainText('Showing 4 of 6 actions');
  });

  test('catalog search matches the side-panel algorithm by group name', async ({ page }) => {
    await page.locator('.wf-search').fill('release');
    await expect(page.locator('.wf-card--catalog')).toHaveCount(1);
    await expect(page.locator('.wf-card--catalog').first()).toContainText('Deploy App');
  });

  test('delete workflow uses inline confirmation instead of window.confirm', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    await page.evaluate(() => {
      window.confirm = () => {
        throw new Error('window.confirm should not be called by workflow deletion');
      };
      (window as any).__lastCommand = null;
    });

    await page.locator('.wf-danger-btn', { hasText: 'Delete' }).click();

    const confirmPanel = page.locator('.wf-inline-confirm');
    await expect(confirmPanel).toBeVisible();
    await expect(confirmPanel).toContainText('Delete this workflow?');
    await expect(confirmPanel).toContainText('This removes the saved chain and its step list.');

    const commandBeforeConfirm = await page.evaluate(() => (window as any).__lastCommand);
    expect(commandBeforeConfirm).toBeNull();

    await confirmPanel.locator('.wf-danger-btn', { hasText: 'Delete workflow' }).click();

    const command = await page.evaluate(() => (window as any).__lastCommand);
    expect(command?.command).toBe('deleteWorkflow');
    expect(command?.workflowId).toBe('workflow-release');
    expect(pageErrors).toEqual([]);
  });

  test('renaming a workflow dispatches renameWorkflow', async ({ page }) => {
    await page.evaluate(() => { (window as any).__lastCommand = null; });
    await page.locator('.wf-name-input').fill('Nightly Release');
    await page.locator('.wf-name-input').dispatchEvent('change');
    const command = await page.evaluate(() => (window as any).__lastCommand);
    expect(command?.command).toBe('renameWorkflow');
    expect(command?.workflowId).toBe('workflow-release');
    expect(command?.name).toBe('Nightly Release');
  });

  test('moving and removing steps dispatch the expected messages', async ({ page }) => {
    await page.evaluate(() => { (window as any).__lastCommand = null; });
    await page.locator('.wf-card', { hasText: 'Build Project' }).locator('[title="Move down"]').click();
    let command = await page.evaluate(() => (window as any).__lastCommand);
    expect(command?.command).toBe('moveWorkflowStep');
    expect(command?.direction).toBe('down');
    expect(command?.stepId).toBe('step-build');

    await page.locator('.wf-card', { hasText: 'Run Tests' }).locator('[title="Remove step"]').click();
    command = await page.evaluate(() => (window as any).__lastCommand);
    expect(command?.command).toBe('removeWorkflowStep');
    expect(command?.stepId).toBe('step-test');
  });

  test('continue-on-error checkbox dispatches the workflow step toggle message', async ({ page }) => {
    await page.evaluate(() => { (window as any).__lastCommand = null; });
    const checkbox = page.locator('.wf-card', { hasText: 'Build Project' }).locator('input[type="checkbox"]');
    await checkbox.check();
    const command = await page.evaluate(() => (window as any).__lastCommand);
    expect(command?.command).toBe('setWorkflowStepContinueOnError');
    expect(command?.workflowId).toBe('workflow-release');
    expect(command?.stepId).toBe('step-build');
    expect(command?.continueOnError).toBe(true);
  });

  test('run button dispatches runWorkflow for a valid workflow', async ({ page }) => {
    await page.evaluate(() => { (window as any).__lastCommand = null; });
    await page.locator('.wf-secondary-btn', { hasText: 'Run' }).click();
    const command = await page.evaluate(() => (window as any).__lastCommand);
    expect(command?.command).toBe('runWorkflow');
    expect(command?.workflowId).toBe('workflow-release');
  });

  test('invalid workflow shows an alert and blocks the run button', async ({ page }) => {
    await page.locator('.wf-rail-item', { hasText: 'Broken Chain' }).click();
    await expect(page.locator('.wf-alert')).toContainText('Referenced action no longer exists.');
    await expect(page.locator('.wf-secondary-btn', { hasText: 'Run' })).toBeDisabled();
  });
});
