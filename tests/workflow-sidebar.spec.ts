import { test, expect, type Page } from '@playwright/test';

async function sendMessage(page: Page, data: object) {
  await page.evaluate((payload) => {
    window.dispatchEvent(new MessageEvent('message', { data: payload }));
  }, data);
}

test.describe('Workflow Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', () => {});
    page.on('pageerror', () => {});

    await page.goto('/');
    await page.waitForSelector('.lp-btn-wrapper');

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
            steps: [],
          },
          {
            id: 'workflow-invalid',
            name: 'Broken Chain',
            stepCount: 1,
            valid: false,
            invalidReasons: ['Referenced action no longer exists.'],
            steps: [],
          },
        ],
      },
    });
    await page.waitForTimeout(100);
  });

  test('renders workflow cards above the action grid', async ({ page }) => {
    await expect(page.locator('.lp-workflow-section')).toBeVisible();
    await expect(page.locator('.lp-workflow-card')).toHaveCount(2);
    await expect(page.locator('.lp-workflow-card', { hasText: 'Release Train' })).toContainText('2 steps');
  });

  test('edit workflow button dispatches openWorkflowBuilder with the workflow id', async ({ page }) => {
    await page.evaluate(() => { (window as any).__lastCommand = null; });
    await page.locator('.lp-workflow-card', { hasText: 'Release Train' }).locator('[title="Edit workflow"]').click();
    const command = await page.evaluate(() => (window as any).__lastCommand);
    expect(command?.command).toBe('openWorkflowBuilder');
    expect(command?.workflowId).toBe('workflow-release');
  });

  test('run workflow button dispatches runWorkflow for valid workflows', async ({ page }) => {
    await page.evaluate(() => { (window as any).__lastCommand = null; });
    await page.locator('.lp-workflow-card', { hasText: 'Release Train' }).locator('[title="Run workflow"]').click();
    const command = await page.evaluate(() => (window as any).__lastCommand);
    expect(command?.command).toBe('runWorkflow');
    expect(command?.workflowId).toBe('workflow-release');
  });

  test('invalid workflows show a badge and disable the run button', async ({ page }) => {
    const invalidCard = page.locator('.lp-workflow-card', { hasText: 'Broken Chain' });
    await expect(invalidCard.locator('.lp-workflow-badge')).toContainText('Invalid');
    await expect(invalidCard.locator('[title="Run workflow"]')).toBeDisabled();
  });
});
