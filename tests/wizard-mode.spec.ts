import { test, expect, type Page } from '@playwright/test';

test.describe('Add Action Wizard', () => {
  test.beforeEach(async ({ page }) => {
    // Ignore console errors from the page
    page.on('console', () => {});
    page.on('pageerror', () => {});
    await page.goto('/add-wizard');
    await page.waitForSelector('#addWizardForm');
  });

  test('Step 1 renders correctly and requires input', async ({ page }) => {
    await expect(page.locator('#step1')).toHaveClass(/active/);
    await expect(page.locator('#step2')).not.toHaveClass(/active/);

    // Clicking next without input should show error
    await page.locator('#nextBtn').click();
    const error = page.locator('#jsonError');
    await expect(error).toBeVisible();
    await expect(error).toContainText('Please enter an Action Name or paste JSON to import');
  });

  test('Entering name navigates to Step 2 and back', async ({ page }) => {
    await page.locator('#wizardName').fill('My New Action');
    await expect(page.locator('#nextBtn')).toHaveText('Next');
    await page.locator('#nextBtn').click();

    // Now on step 2
    await expect(page.locator('#step2')).toHaveClass(/active/);
    await expect(page.locator('#step1')).not.toHaveClass(/active/);
    await expect(page.locator('#displayWizardName')).toContainText('My New Action');

    // Go back to step 1
    await page.locator('#backBtn').click();
    await expect(page.locator('#step1')).toHaveClass(/active/);
    await expect(page.locator('#step2')).not.toHaveClass(/active/);
  });

  test('Submits single action from Step 2', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__lastCommand = null;
    });

    await page.locator('#wizardName').fill('My Single Action');
    await page.locator('#nextBtn').click();

    await page.locator('#command').fill('echo "hello world"');
    
    // Choose shell from dropdown
    await page.locator('#type').selectOption('shell');

    await page.locator('#submitBtn').click();
    await page.waitForTimeout(100);

    const cmd = await page.evaluate(() => (window as any).__lastCommand);
    expect(cmd?.command).toBe('submitNewAction');
    expect(cmd?.item?.name).toBe('My Single Action');
    expect(cmd?.item?.command).toBe('echo "hello world"');
    expect(cmd?.item?.type).toBe('shell');
  });

  test('Validates invalid JSON on Step 1', async ({ page }) => {
    await page.locator('#toggleRawJson').check();
    await expect(page.locator('#jsonImportGroup')).toBeVisible();
    await page.locator('#jsonImport').fill('{[invalid json');
    await expect(page.locator('#nextBtn')).toHaveText('Import JSON');
    
    await page.locator('#nextBtn').click();
    const error = page.locator('#jsonError');
    await expect(error).toBeVisible();
    await expect(error).toContainText('Invalid JSON:');
  });

  test('Validates missing required fields in JSON', async ({ page }) => {
    await page.locator('#toggleRawJson').check();
    const badJson = JSON.stringify([{ type: "shell" }]);
    await page.locator('#jsonImport').fill(badJson);
    await page.locator('#nextBtn').click();

    const error = page.locator('#jsonError');
    await expect(error).toBeVisible();
    await expect(error).toContainText("Each imported action must have at least a 'name' and 'command'");
  });

  test('Submits bulk JSON array from Step 1 directly', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__lastCommand = null;
    });

    await page.locator('#toggleRawJson').check();
    const validJson = JSON.stringify([
      { name: "First Action", type: "npm", command: "npm run start" },
      { name: "Second Action", type: "shell", command: "echo yes" }
    ]);
    await page.locator('#jsonImport').fill(validJson);
    await page.locator('#nextBtn').click();
    await page.waitForTimeout(100);

    const cmd = await page.evaluate(() => (window as any).__lastCommand);
    expect(cmd?.command).toBe('submitBulkActions');
    expect(cmd?.items).toHaveLength(2);
    expect(cmd?.items[0].name).toBe('First Action');
    expect(cmd?.items[1].command).toBe('echo yes');
  });

  test('Submits single JSON object from Step 1 directly', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__lastCommand = null;
    });

    await page.locator('#toggleRawJson').check();
    const validJson = JSON.stringify(
      { name: "Object Action", type: "npm", command: "npm test" }
    );
    await page.locator('#jsonImport').fill(validJson);
    await page.locator('#nextBtn').click();
    await page.waitForTimeout(100);

    const cmd = await page.evaluate(() => (window as any).__lastCommand);
    expect(cmd?.command).toBe('submitBulkActions');
    expect(cmd?.items).toHaveLength(1);
    expect(cmd?.items[0].name).toBe('Object Action');
  });
});
