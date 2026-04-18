import { test, expect, type Page } from '@playwright/test';

async function sendMessage(page: Page, data: object) {
  await page.evaluate((payload) => {
    window.dispatchEvent(new MessageEvent('message', { data: payload }));
  }, data);
}

test.describe('Battles View', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', () => {});
    page.on('pageerror', () => {});

    await page.goto('/battles');
    await page.waitForSelector('.battles-shell');
  });

  test('renders provider sections from initial data', async ({ page }) => {
    await expect(page.locator('.battles-provider')).toHaveCount(3);
    await expect(page.locator('.battles-provider__name', { hasText: 'Bitbucket PRs' })).toBeVisible();
    await expect(page.locator('.battles-provider__name', { hasText: 'GitHub Issues' })).toBeVisible();
    await expect(page.locator('.battles-provider__name', { hasText: 'Broken Provider' })).toBeVisible();
  });

  test('renders battle cards inside a provider', async ({ page }) => {
    const bbProvider = page.locator('.battles-provider[data-provider-id="bb-prs"]');
    await expect(bbProvider.locator('.battles-card')).toHaveCount(3);
    await expect(bbProvider.locator('.battles-card__title', { hasText: 'Fix auth flow' })).toBeVisible();
    await expect(bbProvider.locator('.battles-card__title', { hasText: 'Update CI pipeline' })).toBeVisible();
    await expect(bbProvider.locator('.battles-card__title', { hasText: 'Bump dependencies' })).toBeVisible();
  });

  test('shows priority badges on battle cards', async ({ page }) => {
    const highBadge = page.locator('.battles-card[data-battle-id="pr-123"] .battles-priority--high');
    await expect(highBadge).toBeVisible();
    await expect(highBadge).toContainText('HIGH');

    const medBadge = page.locator('.battles-card[data-battle-id="pr-456"] .battles-priority--medium');
    await expect(medBadge).toBeVisible();
    await expect(medBadge).toContainText('MEDIUM');

    const lowBadge = page.locator('.battles-card[data-battle-id="pr-789"] .battles-priority--low');
    await expect(lowBadge).toBeVisible();
    await expect(lowBadge).toContainText('LOW');
  });

  test('sorts battles by priority (high before medium before low)', async ({ page }) => {
    const bbProvider = page.locator('.battles-provider[data-provider-id="bb-prs"]');
    const titles = await bbProvider.locator('.battles-card__title').allTextContents();
    expect(titles).toEqual(['Fix auth flow', 'Update CI pipeline', 'Bump dependencies']);
  });

  test('shows tags on battle cards', async ({ page }) => {
    const card = page.locator('.battles-card[data-battle-id="pr-123"]');
    await expect(card.locator('.battles-tag', { hasText: 'review' })).toBeVisible();
    await expect(card.locator('.battles-tag', { hasText: 'auth' })).toBeVisible();
  });

  test('shows description on battle cards', async ({ page }) => {
    const card = page.locator('.battles-card[data-battle-id="pr-123"]');
    await expect(card.locator('.battles-card__desc')).toContainText('PR #123 needs your review');
  });

  test('shows empty state for provider with no battles', async ({ page }) => {
    const ghProvider = page.locator('.battles-provider[data-provider-id="gh-issues"]');
    await expect(ghProvider.locator('.battles-empty')).toContainText('All clear');
  });

  test('shows error state for a broken provider', async ({ page }) => {
    const errorProvider = page.locator('.battles-provider[data-provider-id="error-provider"]');
    await expect(errorProvider.locator('.battles-provider__error')).toContainText('Command not found');
  });

  test('search filters battles across providers', async ({ page }) => {
    await page.fill('.battles-search', 'auth');
    // Only "Fix auth flow" has "auth" in title or tags
    const bbProvider = page.locator('.battles-provider[data-provider-id="bb-prs"]');
    await expect(bbProvider.locator('.battles-card')).toHaveCount(1);
    await expect(bbProvider.locator('.battles-card__title')).toContainText('Fix auth flow');
  });

  test('collapse and expand provider sections', async ({ page }) => {
    const bbHeader = page.locator('.battles-provider[data-provider-id="bb-prs"] .battles-provider__header');
    const bbList = page.locator('.battles-provider[data-provider-id="bb-prs"] .battles-provider__list');

    // Initially expanded
    await expect(bbList).toBeVisible();

    // Click to collapse
    await bbHeader.click();
    await expect(bbList).toHaveCount(0);

    // Click to expand
    await bbHeader.click();
    await expect(bbList).toBeVisible();
  });

  test('Open button dispatches openBattleUrl', async ({ page }) => {
    await page.evaluate(() => { (window as any).__lastCommand = null; });
    const openBtn = page.locator('.battles-card[data-battle-id="pr-123"] .battles-btn', { hasText: 'Open' });
    await openBtn.click();
    const command = await page.evaluate(() => (window as any).__lastCommand);
    expect(command?.command).toBe('openBattleUrl');
    expect(command?.url).toContain('bitbucket.org');
  });

  test('custom action button dispatches battleAction', async ({ page }) => {
    await page.evaluate(() => { (window as any).__lastCommand = null; });
    const checkoutBtn = page.locator('.battles-card[data-battle-id="pr-123"] .battles-btn', { hasText: 'Checkout' });
    await checkoutBtn.click();
    const command = await page.evaluate(() => (window as any).__lastCommand);
    expect(command?.command).toBe('battleAction');
    expect(command?.actionType).toBe('shell');
    expect(command?.actionValue).toContain('git checkout');
  });

  test('dismiss button dispatches dismissBattle', async ({ page }) => {
    await page.evaluate(() => { (window as any).__lastCommand = null; });
    const dismissBtn = page.locator('.battles-card[data-battle-id="pr-123"] .battles-btn--dismiss');
    await dismissBtn.click();
    const command = await page.evaluate(() => (window as any).__lastCommand);
    expect(command?.command).toBe('dismissBattle');
    expect(command?.battleId).toBe('pr-123');
    expect(command?.providerId).toBe('bb-prs');
  });

  test('refresh button per provider dispatches refreshProvider', async ({ page }) => {
    await page.evaluate(() => { (window as any).__lastCommand = null; });
    const refreshBtn = page.locator('.battles-provider[data-provider-id="bb-prs"] .battles-btn--icon[title="Refresh"]');
    await refreshBtn.click();
    const command = await page.evaluate(() => (window as any).__lastCommand);
    expect(command?.command).toBe('refreshProvider');
    expect(command?.providerId).toBe('bb-prs');
  });

  test('updates render from host postMessage', async ({ page }) => {
    await sendMessage(page, {
      type: 'update',
      data: {
        providers: [
          {
            providerId: 'bb-prs',
            providerName: 'Bitbucket PRs',
            providerIcon: 'git-pull-request',
            battles: [
              {
                id: 'pr-999',
                title: 'New battle from update',
                status: 'active',
                priority: 'critical',
              }
            ],
            lastRefreshedAt: Date.now(),
            isLoading: false,
          }
        ]
      }
    });

    await expect(page.locator('.battles-provider')).toHaveCount(1);
    await expect(page.locator('.battles-card__title', { hasText: 'New battle from update' })).toBeVisible();
    await expect(page.locator('.battles-priority--critical')).toContainText('CRITICAL');
  });

  test('provider count shows active battle count', async ({ page }) => {
    const bbCount = page.locator('.battles-provider[data-provider-id="bb-prs"] .battles-provider__count');
    await expect(bbCount).toContainText('(3)');

    const ghCount = page.locator('.battles-provider[data-provider-id="gh-issues"] .battles-provider__count');
    await expect(ghCount).toContainText('(0)');
  });
});

test.describe('Battles View — Zero State', () => {
  test('shows zero state when no providers configured', async ({ page }) => {
    page.on('console', () => {});
    page.on('pageerror', () => {});

    // Navigate and inject empty provider data
    await page.goto('/battles');
    await page.waitForSelector('.battles-shell');

    await sendMessage(page, {
      type: 'update',
      data: { providers: [] }
    });

    await expect(page.locator('.battles-zero')).toBeVisible();
    await expect(page.locator('.battles-zero__title')).toContainText('No Battle Providers');
  });

  test('Add Provider button dispatches addBattleProvider in zero state', async ({ page }) => {
    page.on('console', () => {});
    page.on('pageerror', () => {});

    await page.goto('/battles');
    await page.waitForSelector('.battles-shell');

    await sendMessage(page, {
      type: 'update',
      data: { providers: [] }
    });

    await page.evaluate(() => { (window as any).__lastCommand = null; });
    await page.locator('.battles-zero .battles-btn', { hasText: 'Add Provider' }).click();
    const command = await page.evaluate(() => (window as any).__lastCommand);
    expect(command?.command).toBe('addBattleProvider');
  });
});
