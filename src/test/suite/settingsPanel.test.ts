import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConfigService } from '../../services/configService';

suite('Settings Panel Integration Test Suite', () => {
    let configService: ConfigService;
    const mockContext = {
        globalState: { get: () => undefined, update: () => Promise.resolve() },
        extensionUri: vscode.Uri.file(__dirname),
        subscriptions: [],
        extensionPath: __dirname
    } as any;

    setup(async () => {
        configService = new ConfigService(mockContext);

        // Ensure we have a config file
        const exists = await configService.configExists();
        if (!exists) {
            await configService.createMinimalConfig([
                { type: "npm", icon: "package" },
                { type: "shell", icon: "terminal" }
            ]);
        }
    });

    test('Should save and retrieve display settings', async function () {
        this.timeout(5000);

        const config = vscode.workspace.getConfiguration('battlestation');

        // Save settings
        await config.update('display.showIcon', false, vscode.ConfigurationTarget.Workspace);
        await config.update('display.showType', false, vscode.ConfigurationTarget.Workspace);
        await config.update('display.showCommand', true, vscode.ConfigurationTarget.Workspace);
        await config.update('display.showGroup', true, vscode.ConfigurationTarget.Workspace);
        await config.update('display.hideIcon', 'trash', vscode.ConfigurationTarget.Workspace);

        // Wait for config to propagate
        await new Promise(resolve => setTimeout(resolve, 100));

        // Retrieve settings
        const updatedConfig = vscode.workspace.getConfiguration('battlestation');
        assert.strictEqual(updatedConfig.get('display.showIcon'), false, 'showIcon should be false');
        assert.strictEqual(updatedConfig.get('display.showType'), false, 'showType should be false');
        assert.strictEqual(updatedConfig.get('display.showCommand'), true, 'showCommand should be true');
        assert.strictEqual(updatedConfig.get('display.showGroup'), true, 'showGroup should be true');
        assert.strictEqual(updatedConfig.get('display.hideIcon'), 'trash', 'hideIcon should be trash');

        // Cleanup - reset to defaults
        await config.update('display.showIcon', true, vscode.ConfigurationTarget.Workspace);
        await config.update('display.showType', true, vscode.ConfigurationTarget.Workspace);
        await config.update('display.hideIcon', 'eye-closed', vscode.ConfigurationTarget.Workspace);
    });

    test('Multiple rapid config updates should not cause data loss', async function () {
        this.timeout(5000);

        const config = vscode.workspace.getConfiguration('battlestation');

        // Simulate rapid successive updates (like what happens when saving settings)
        const updates = [
            { key: 'display.showIcon', value: true },
            { key: 'display.showType', value: false },
            { key: 'display.showCommand', value: true },
            { key: 'display.showGroup', value: false },
            { key: 'display.hideIcon', value: 'x' }
        ];

        for (const update of updates) {
            await config.update(update.key, update.value, vscode.ConfigurationTarget.Workspace);
        }

        // Wait for all updates to complete
        await new Promise(resolve => setTimeout(resolve, 200));

        // Verify all updates persisted correctly
        const finalConfig = vscode.workspace.getConfiguration('battlestation');
        assert.strictEqual(finalConfig.get('display.showIcon'), true, 'showIcon should be true');
        assert.strictEqual(finalConfig.get('display.showType'), false, 'showType should be false');
        assert.strictEqual(finalConfig.get('display.showCommand'), true, 'showCommand should be true');
        assert.strictEqual(finalConfig.get('display.showGroup'), false, 'showGroup should be false');
        assert.strictEqual(finalConfig.get('display.hideIcon'), 'x', 'hideIcon should be x');

        // Cleanup
        await config.update('display.showType', true, vscode.ConfigurationTarget.Workspace);
        await config.update('display.showGroup', true, vscode.ConfigurationTarget.Workspace);
        await config.update('display.hideIcon', 'eye-closed', vscode.ConfigurationTarget.Workspace);
    });

    test('Hide icon options should be valid', async function () {
        this.timeout(3000);

        const config = vscode.workspace.getConfiguration('battlestation');
        const validOptions = ['eye-closed', 'x', 'trash', 'close', 'circle-slash'];

        for (const icon of validOptions) {
            await config.update('display.hideIcon', icon, vscode.ConfigurationTarget.Workspace);
            await new Promise(resolve => setTimeout(resolve, 50));

            const updatedConfig = vscode.workspace.getConfiguration('battlestation');
            assert.strictEqual(updatedConfig.get('display.hideIcon'), icon, `hideIcon ${icon} should be saved`);
        }

        // Reset to default
        await config.update('display.hideIcon', 'eye-closed', vscode.ConfigurationTarget.Workspace);
    });

    test('Config file operations should work with settings changes', async function () {
        this.timeout(5000);

        // Get current config
        const currentConfig = await configService.readConfig();
        const originalActionCount = currentConfig.actions.length;

        // Change a setting
        const config = vscode.workspace.getConfiguration('battlestation');
        await config.update('display.showIcon', false, vscode.ConfigurationTarget.Workspace);
        await new Promise(resolve => setTimeout(resolve, 100));

        // Config file should still exist and be valid
        const exists = await configService.configExists();
        assert.strictEqual(exists, true, 'Config file should still exist');

        const status = await configService.getConfigStatus();
        assert.strictEqual(status.valid, true, 'Config should still be valid');

        // Config content should be unchanged by settings change
        const newConfig = await configService.readConfig();
        assert.strictEqual(newConfig.actions.length, originalActionCount, 'Action count should be unchanged');

        // Cleanup
        await config.update('display.showIcon', true, vscode.ConfigurationTarget.Workspace);
    });

    test('Settings changes should not affect config history', async function () {
        this.timeout(5000);

        // Get initial history count
        const initialVersions = await configService.listConfigVersions();
        const initialCount = initialVersions.length;

        // Change settings multiple times
        const config = vscode.workspace.getConfiguration('battlestation');
        await config.update('display.showIcon', false, vscode.ConfigurationTarget.Workspace);
        await new Promise(resolve => setTimeout(resolve, 50));
        await config.update('display.showType', false, vscode.ConfigurationTarget.Workspace);
        await new Promise(resolve => setTimeout(resolve, 50));
        await config.update('display.showIcon', true, vscode.ConfigurationTarget.Workspace);
        await new Promise(resolve => setTimeout(resolve, 100));

        // History count should be unchanged (settings don't create config history)
        const finalVersions = await configService.listConfigVersions();
        assert.strictEqual(finalVersions.length, initialCount, 'History count should be unchanged by settings changes');

        // Cleanup
        await config.update('display.showType', true, vscode.ConfigurationTarget.Workspace);
    });
});
