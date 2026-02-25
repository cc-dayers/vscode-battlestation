import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConfigService } from '../../services/configService';

/**
 * Color Rules Test Suite
 *
 * Tests auto-coloring, workspace color assignment, and colorRules config.
 * Uses assert.fail() instead of silent `if (x)` guards so tests genuinely
 * fail when preconditions aren't met, rather than silently passing.
 */
suite('Color Rules Test Suite', () => {
    let configService: ConfigService;

    setup(async () => {
        configService = new ConfigService();
    });

    teardown(async () => {
        const config = vscode.workspace.getConfiguration('battlestation');
        await config.update('display.enableAutoActionColors', undefined, vscode.ConfigurationTarget.Global);
        await config.update('colorRules', undefined, vscode.ConfigurationTarget.Global);
        await config.update('workspaceColors', undefined, vscode.ConfigurationTarget.Global);
    });

    test('scanNpmScripts returns actions from current workspace', async function () {
        this.timeout(10000);

        const actions = await configService.scanNpmScripts();

        // This workspace has a package.json — we MUST find scripts
        assert.ok(actions.length > 0,
            'scanNpmScripts must find scripts in this workspace (has package.json)');

        // Every npm action must have required fields
        for (const action of actions) {
            assert.ok(action.name, `Action missing name`);
            assert.ok(action.command, `Action "${action.name}" missing command`);
            assert.strictEqual(action.type, 'npm', `Action "${action.name}" should be type npm`);
        }
    });

    test('Auto colors disabled by default — no workspaceColor on actions', async function () {
        this.timeout(10000);

        const config = vscode.workspace.getConfiguration('battlestation');
        await config.update('display.enableAutoActionColors', false, vscode.ConfigurationTarget.Global);

        const actions = await configService.scanNpmScripts();
        assert.ok(actions.length > 0, 'Precondition: must have npm scripts');

        // When auto-color is disabled, no action should have workspaceColor
        for (const action of actions) {
            assert.strictEqual(action.workspaceColor, undefined,
                `Action "${action.name}" should not have workspaceColor when auto-color is off`);
        }
    });

    test('Apply Color Rules with wildcard pattern', async function () {
        this.timeout(10000);

        const config = vscode.workspace.getConfiguration('battlestation');
        await config.update('display.enableAutoActionColors', false, vscode.ConfigurationTarget.Global);
        await config.update('colorRules', [
            { namePattern: '*', color: '#123456' }
        ], vscode.ConfigurationTarget.Global);

        const actions = await configService.scanNpmScripts();
        assert.ok(actions.length > 0, 'Precondition: must have npm scripts');

        // All actions should have the wildcard color applied
        for (const action of actions) {
            assert.strictEqual(action.backgroundColor, '#123456',
                `Action "${action.name}" should have color #123456 from wildcard rule`);
        }
    });

    test('Default icon mappings include all standard types', () => {
        const standardTypes = ['shell', 'npm', 'vscode', 'task', 'launch'];
        for (const type of standardTypes) {
            const mapping = ConfigService.defaultIcons.find(i => i.type === type);
            assert.ok(mapping, `defaultIcons must include mapping for type "${type}"`);
            assert.ok(mapping!.icon, `Icon for type "${type}" must not be empty`);
        }
    });
});
