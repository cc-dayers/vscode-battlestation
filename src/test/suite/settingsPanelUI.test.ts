import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConfigService } from '../../services/configService';

/**
 * Settings Panel Integration Tests
 *
 * Tests that VS Code Configuration API round-trips work and that
 * commands don't throw. Actual settings panel UI (checkboxes, save/cancel)
 * is verified via the UI test harness.
 */
suite('Settings Panel Integration Test Suite', () => {
    let configService: ConfigService;
    const mockContext = {
        globalState: { get: () => undefined, update: () => Promise.resolve() },
        extensionUri: vscode.Uri.file(__dirname),
        subscriptions: [],
        extensionPath: __dirname
    } as any;

    // Track original values for cleanup
    let originalShowCommand: boolean | undefined;
    let originalRememberActionSearch: boolean | undefined;

    setup(async () => {
        configService = new ConfigService(mockContext);

        const exists = await configService.configExists();
        if (!exists) {
            await configService.createMinimalConfig([
                { type: "npm", icon: "package" },
                { type: "shell", icon: "terminal" }
            ]);
        }

        originalShowCommand = vscode.workspace.getConfiguration('battlestation').get<boolean>('display.showCommand');
        originalRememberActionSearch = vscode.workspace.getConfiguration('battlestation').get<boolean>('display.rememberActionSearch');
    });

    teardown(async () => {
        // Restore original setting value
        const config = vscode.workspace.getConfiguration('battlestation');
        await config.update('display.showCommand', originalShowCommand, vscode.ConfigurationTarget.Global);
        await config.update('display.rememberActionSearch', originalRememberActionSearch, vscode.ConfigurationTarget.Global);
    });

    test('battlestation.open and battlestation.openSettings execute without error', async function () {
        this.timeout(10000);

        // These commands must not throw
        await vscode.commands.executeCommand('battlestation.open');
        await new Promise(resolve => setTimeout(resolve, 500));

        await vscode.commands.executeCommand('battlestation.openSettings');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Verify config is still intact (commands didn't corrupt it)
        const status = await configService.getConfigStatus();
        assert.strictEqual(status.exists, true, 'Config must survive opening settings');
        assert.strictEqual(status.valid, true, 'Config must remain valid after opening settings');
    });

    test('display.showCommand setting round-trips through Configuration API', async function () {
        this.timeout(10000);

        const config = vscode.workspace.getConfiguration('battlestation');
        const initial = config.get<boolean>('display.showCommand');

        // Toggle
        await config.update('display.showCommand', !initial, vscode.ConfigurationTarget.Global);
        await new Promise(resolve => setTimeout(resolve, 300));

        const toggled = vscode.workspace.getConfiguration('battlestation').get<boolean>('display.showCommand');
        assert.strictEqual(toggled, !initial, 'Setting value should be toggled');

        // Toggle back
        await config.update('display.showCommand', initial, vscode.ConfigurationTarget.Global);
        await new Promise(resolve => setTimeout(resolve, 300));

        const restored = vscode.workspace.getConfiguration('battlestation').get<boolean>('display.showCommand');
        assert.strictEqual(restored, initial, 'Setting value should be restored');
    });

    test('display.rememberActionSearch setting round-trips through Configuration API', async function () {
        this.timeout(10000);

        const config = vscode.workspace.getConfiguration('battlestation');
        const initial = config.get<boolean>('display.rememberActionSearch', true);

        await config.update('display.rememberActionSearch', !initial, vscode.ConfigurationTarget.Global);
        await new Promise(resolve => setTimeout(resolve, 300));

        const toggled = vscode.workspace.getConfiguration('battlestation').get<boolean>('display.rememberActionSearch');
        assert.strictEqual(toggled, !initial, 'Remember search setting value should be toggled');

        await config.update('display.rememberActionSearch', initial, vscode.ConfigurationTarget.Global);
        await new Promise(resolve => setTimeout(resolve, 300));

        const restored = vscode.workspace.getConfiguration('battlestation').get<boolean>('display.rememberActionSearch');
        assert.strictEqual(restored, initial, 'Remember search setting value should be restored');
    });

    test('changing settings does not mutate battle.json config', async function () {
        this.timeout(10000);

        const configBefore = await configService.readConfig();
        const actionCountBefore = configBefore.actions.length;

        // Change a display setting
        await vscode.workspace.getConfiguration('battlestation')
            .update('display.showCommand', true, vscode.ConfigurationTarget.Global);
        await new Promise(resolve => setTimeout(resolve, 300));

        const configAfter = await configService.readConfig();
        assert.strictEqual(configAfter.actions.length, actionCountBefore,
            'Changing display settings must not alter action count in battle.json');
    });
});
