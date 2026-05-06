import { test, expect, type Page } from '@playwright/test';

async function sendMessage(page: Page, data: object) {
  await page.evaluate((payload) => {
    window.dispatchEvent(new MessageEvent('message', { data: payload }));
  }, data);
}

function sampleJob() {
  return {
    jobId: 'action-1',
    sourceKind: 'action',
    name: 'Build Project',
    schedule: '0 0 * * *',
    scheduleKind: 'cron',
    intervalSeconds: 0,
    enabled: true,
    paused: false,
    valid: true,
    status: 'scheduled',
    targetKind: 'action',
    targetLabel: 'build',
    providerId: '',
    nextRunAt: Date.now() + 300_000,
  };
}

test.describe('Jobs View', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', () => {});
    page.on('pageerror', () => {});

    await page.goto('/jobs');
    await page.waitForSelector('.jobs-shell');
  });

  test('toolbar only exposes the background activity control', async ({ page }) => {
    await expect(page.getByTestId('jobs-toggle-background-activity-button')).toHaveCount(1);
    await expect(page.getByTestId('jobs-agent-activity-button')).toHaveCount(0);
  });

  test('updates from empty state to an action job card', async ({ page }) => {
    await sendMessage(page, {
      type: 'update',
      data: { jobs: [] },
    });

    await expect(page.locator('.jobs-empty')).toContainText('No jobs match the current search.');

    await sendMessage(page, {
      type: 'update',
      data: { jobs: [sampleJob()] },
    });

    await expect(page.locator('.jobs-card')).toHaveCount(1);
    await expect(page.locator('.jobs-card__title')).toContainText('Build Project');
    await expect(page.locator('[data-testid="job-kind-badge"]')).toContainText('Job');
  });

  test('Run Now dispatches runJobNow for action jobs after a runtime update', async ({ page }) => {
    await sendMessage(page, {
      type: 'update',
      data: { jobs: [sampleJob()] },
    });

    await page.evaluate(() => {
      (window as any).__lastCommand = null;
    });

    await page.locator('.jobs-btn', { hasText: 'Run Now' }).click();

    const command = await page.evaluate(() => (window as any).__lastCommand);
    expect(command).toEqual(
      expect.objectContaining({
        command: 'runJobNow',
        jobId: 'action-1',
      })
    );
  });

  test('background controls dispatch runtime commands', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__lastCommand = null;
    });
    
    await page.getByTestId('jobs-toggle-background-activity-button').click();
    let command = await page.evaluate(() => (window as any).__lastCommand);
    expect(command?.command).toBe('pauseBackgroundActivity');

    await sendMessage(page, {
      type: 'update',
      data: {
        jobs: [sampleJob()],
        backgroundActivityPaused: true,
      },
    });

    await page.evaluate(() => {
      (window as any).__lastCommand = null;
    });
    await page.getByTestId('jobs-toggle-background-activity-button').click();
    command = await page.evaluate(() => (window as any).__lastCommand);
    expect(command?.command).toBe('resumeBackgroundActivity');
  });
});
