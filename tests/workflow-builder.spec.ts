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
