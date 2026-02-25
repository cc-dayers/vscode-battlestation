import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConfigService } from '../../services/configService';

/**
 * Welcome View → Config Generation Flow Tests
 *
 * These tests exercise the REAL config lifecycle that a user hits:
 *   no config → welcome state → generate config → config exists → valid status
 *
 * They test ConfigService directly (not the webview) because VS Code's test
 * host cannot inspect iframe DOM.  The webview rendering side is covered by
 * the generateConfigUI tests (HTML output) and the UI test harness (browser).
 */
suite('Welcome View / Config Generation Flow', () => {
    let configService: ConfigService;
    const mockContext = {
        globalState: { get: () => undefined, update: () => Promise.resolve() },
        extensionUri: vscode.Uri.file(__dirname),
        subscriptions: []
    } as any;

    setup(() => {
        configService = new ConfigService(mockContext);
    });

    /* ──────────────────────────────────────────────
     *  Welcome state (no config)
     * ────────────────────────────────────────────── */

    test('getConfigStatus reports exists:false when no config present', async function () {
        this.timeout(10000);

        // Ensure clean slate
        if (await configService.configExists()) {
            await configService.deleteConfig();
        }

        const status = await configService.getConfigStatus();

        assert.strictEqual(status.exists, false, 'Config should not exist');
        assert.strictEqual(status.valid, false, 'Config should not be valid');
        assert.strictEqual(status.config, undefined, 'Config object should be undefined');
    });

    test('configExists returns false when no config present', async function () {
        this.timeout(10000);

        if (await configService.configExists()) {
            await configService.deleteConfig();
        }

        const exists = await configService.configExists();
        assert.strictEqual(exists, false, 'configExists must return false after deletion');
    });

    /* ──────────────────────────────────────────────
     *  Config generation (the critical flow!)
     * ────────────────────────────────────────────── */

    test('createAutoConfig produces a file on disk with valid JSON and actions', async function () {
        this.timeout(15000);

        // Start from no-config state
        if (await configService.configExists()) {
            await configService.deleteConfig();
        }
        assert.strictEqual(await configService.configExists(), false, 'Precondition: no config');

        // Generate config — same call that handleCreateConfig makes
        await configService.createAutoConfig(
            { npm: true, tasks: true, launch: true },
            true,
            ConfigService.defaultIcons,
            [],
            false
        );

        // 1. File must now exist
        const exists = await configService.configExists();
        assert.strictEqual(exists, true, 'Config file must exist after createAutoConfig');

        // 2. getConfigStatus must report valid
        const status = await configService.getConfigStatus();
        assert.strictEqual(status.exists, true, 'Status should report exists');
        assert.strictEqual(status.valid, true, 'Status should report valid');
        assert.ok(status.config, 'Status should include parsed config');

        // 3. Config must have actions (we're in a real workspace with package.json)
        assert.ok(status.config!.actions.length > 0, 'Generated config must contain at least one action');

        // 4. Every action must have required fields
        for (const action of status.config!.actions) {
            assert.ok(action.name, `Action missing name: ${JSON.stringify(action)}`);
            assert.ok(action.command, `Action missing command: ${JSON.stringify(action)}`);
            assert.ok(action.type, `Action missing type: ${JSON.stringify(action)}`);
        }

        // 5. Config should be valid JSON when read back via readConfig
        const config = await configService.readConfig();
        assert.ok(Array.isArray(config.actions), 'readConfig().actions must be an array');
        assert.strictEqual(config.actions.length, status.config!.actions.length,
            'readConfig and getConfigStatus should agree on action count');
    });

    test('createAutoConfig with grouping produces groups that match actions', async function () {
        this.timeout(15000);

        if (await configService.configExists()) {
            await configService.deleteConfig();
        }

        await configService.createAutoConfig(
            { npm: true, tasks: true, launch: true },
            true, // groupByType enabled
            ConfigService.defaultIcons,
            [],
            false
        );

        const config = await configService.readConfig();

        // If there are groups, every grouped action must reference an existing group
        if (config.groups && config.groups.length > 0) {
            const groupNames = new Set(config.groups.map(g => g.name));
            for (const action of config.actions) {
                if (action.group) {
                    assert.ok(groupNames.has(action.group),
                        `Action "${action.name}" references group "${action.group}" which doesn't exist. Available: ${[...groupNames].join(', ')}`);
                }
            }
        }

        // Groups must have name and icon
        for (const group of (config.groups ?? [])) {
            assert.ok(group.name, 'Group missing name');
            assert.ok(group.icon, `Group "${group.name}" missing icon`);
        }
    });

    test('createMinimalConfig produces a file with valid structure', async function () {
        this.timeout(10000);

        if (await configService.configExists()) {
            await configService.deleteConfig();
        }

        await configService.createMinimalConfig([
            { type: 'npm', icon: 'package' },
            { type: 'shell', icon: 'terminal' }
        ]);

        const status = await configService.getConfigStatus();
        assert.strictEqual(status.exists, true, 'Minimal config must exist');
        assert.strictEqual(status.valid, true, 'Minimal config must be valid');
        assert.ok(status.config!.actions.length > 0, 'Minimal config must have actions');
        assert.ok(Array.isArray(status.config!.icons), 'Minimal config must have icons array');
    });

    /* ──────────────────────────────────────────────
     *  Post-generation state transitions
     * ────────────────────────────────────────────── */

    test('openConfigFile returns true after successful generation', async function () {
        this.timeout(10000);

        if (await configService.configExists()) {
            await configService.deleteConfig();
        }

        await configService.createAutoConfig(
            { npm: true, tasks: false, launch: false },
            false,
            ConfigService.defaultIcons,
            [],
            false
        );

        const opened = await configService.openConfigFile();
        assert.strictEqual(opened, true, 'openConfigFile must return true when config exists');
    });

    test('delete → generate → status cycle works without errors', async function () {
        this.timeout(15000);

        // Start: ensure config exists
        await configService.createMinimalConfig([{ type: 'npm', icon: 'package' }]);
        assert.strictEqual(await configService.configExists(), true, 'Setup: config exists');

        // Delete
        await configService.deleteConfig();
        const afterDelete = await configService.getConfigStatus();
        assert.strictEqual(afterDelete.exists, false, 'After delete: config gone');

        // Regenerate
        await configService.createAutoConfig(
            { npm: true, tasks: true, launch: true },
            true,
            ConfigService.defaultIcons,
            [],
            false
        );

        // Verify full round-trip
        const afterRegen = await configService.getConfigStatus();
        assert.strictEqual(afterRegen.exists, true, 'After regen: config exists');
        assert.strictEqual(afterRegen.valid, true, 'After regen: config valid');
        assert.ok(afterRegen.config!.actions.length > 0, 'After regen: has actions');
    });
});
