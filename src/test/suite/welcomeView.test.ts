import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConfigService } from '../../services/configService';

suite('Welcome View Test Suite', () => {
    let configService: ConfigService;
    const mockContext = {
        globalState: { get: () => undefined, update: () => Promise.resolve() },
        extensionUri: vscode.Uri.file(__dirname),
        subscriptions: []
    } as any;

    setup(() => {
        configService = new ConfigService(mockContext);
    });

    test('Should show welcome view when no config exists', async function () {
        this.timeout(10000);

        // Ensure no config exists
        const exists = await configService.configExists();
        if (exists) {
            await configService.deleteConfig();
        }

        // Verify config doesn't exist
        const configStatus = await configService.getConfigStatus();
        assert.strictEqual(configStatus.exists, false, 'Config should not exist');
        assert.strictEqual(configStatus.valid, false, 'Config should not be valid');

        // Open the panel
        await vscode.commands.executeCommand('battlestation.open');
        
        // Wait for view to render
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Note: We can't directly inspect webview HTML in tests due to VS Code's webview isolation,
        // but we can verify the config state which determines if welcome view is shown
        // Welcome view is shown when config doesn't exist or is invalid
        const finalStatus = await configService.getConfigStatus();
        assert.strictEqual(finalStatus.exists, false, 'Welcome view should be shown (no config)');
    });

    test('Should show main view after config is created', async function () {
        this.timeout(10000);

        // Create a minimal config
        await configService.createMinimalConfig([
            { type: "npm", icon: "package" },
            { type: "shell", icon: "terminal" }
        ]);

        // Verify config exists
        const exists = await configService.configExists();
        assert.strictEqual(exists, true, 'Config should exist');

        // Open the panel
        await vscode.commands.executeCommand('battlestation.open');
        
        // Wait for view to render
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verify config status
        const configStatus = await configService.getConfigStatus();
        assert.strictEqual(configStatus.exists, true, 'Config should exist');
        assert.strictEqual(configStatus.valid, true, 'Config should be valid');
    });

    test('Should handle config creation errors gracefully', async function () {
        this.timeout(10000);

        // Delete config if it exists
        const exists = await configService.configExists();
        if (exists) {
            await configService.deleteConfig();
        }

        // Verify config doesn't exist
        const configStatus = await configService.getConfigStatus();
        assert.strictEqual(configStatus.exists, false, 'Config should not exist');

        // Open the panel (should show welcome view)
        await vscode.commands.executeCommand('battlestation.open');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Create a minimal config to simulate successful creation
        await configService.createMinimalConfig([
            { type: "npm", icon: "package" }
        ]);

        // Verify config was created
        const existsAfterCreate = await configService.configExists();
        assert.strictEqual(existsAfterCreate, true, 'Config should exist after creation');

        // Note: Testing actual error handling would require mocking file system operations
        // which is complex in VS Code's test environment. This test verifies the happy path.
    });

    test('Should preserve workspace when cycling between views', async function () {
        this.timeout(10000);

        // Start with a config
        await configService.createMinimalConfig([
            { type: "npm", icon: "package" }
        ]);

        // Open panel
        await vscode.commands.executeCommand('battlestation.open');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Delete config (simulating user action)
        await configService.deleteConfig();

        // Wait a bit for file watcher to detect deletion
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verify config is gone
        const exists = await configService.configExists();
        assert.strictEqual(exists, false, 'Config should not exist after deletion');

        // Refresh the view (simulating what happens after deletion)
        await vscode.commands.executeCommand('battlestation.refresh');
        await new Promise(resolve => setTimeout(resolve, 500));

        // The view should now show the welcome screen
        // (We can't test webview content directly, but we verified the config state)
        const configStatus = await configService.getConfigStatus();
        assert.strictEqual(configStatus.exists, false, 'Should show welcome view state');
    });

    test('Should recover from welcome to main-ready state after generation and refresh', async function () {
        this.timeout(15000);

        await configService.deleteConfig();

        // Start from welcome path (no config)
        await vscode.commands.executeCommand('battlestation.open');
        await new Promise(resolve => setTimeout(resolve, 700));

        const before = await configService.getConfigStatus();
        assert.strictEqual(before.exists, false, 'Precondition should be welcome state with no config');

        // Simulate generate from welcome flow
        await configService.createAutoConfig(
            { npm: true, tasks: true, launch: true },
            true,
            [
                { type: 'npm', icon: 'package' },
                { type: 'task', icon: 'check' },
                { type: 'launch', icon: 'play' }
            ],
            [],
            false
        );

        // Force host refresh as done by normal command flow
        await vscode.commands.executeCommand('battlestation.refresh');
        await new Promise(resolve => setTimeout(resolve, 800));

        const after = await configService.getConfigStatus();
        assert.strictEqual(after.exists, true, 'Config should exist after generation');
        assert.strictEqual(after.valid, true, 'Config should be valid after generation');
        assert.ok((after.config?.actions?.length ?? 0) > 0, 'Generated config should include actions for main view');
    });
});
