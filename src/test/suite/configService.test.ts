import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConfigService } from '../../services/configService';

suite('ConfigService Test Suite', () => {
    vscode.window.showInformationMessage('Start ConfigService tests.');

    test('scanNpmScripts should detect scripts from package.json', async () => {
        try {
            // ConfigService requires context, but we can pass casted null/mock for now if it only uses it for storage
            const mockContext = {
                globalState: { get: () => { }, update: () => { } },
                extensionUri: vscode.Uri.file(__dirname),
                subscriptions: []
            } as any;
            const configService = new ConfigService(mockContext);
            // We rely on the workspace opened by the test runner. 
            // Ideally we should open a fixture workspace.
            // For now, let's assume the current workspace has package.json (which it does)

            const scripts = await configService.scanNpmScripts();
            console.log('Detected scripts:', scripts.length);
            assert.ok(scripts.length > 0, 'Should find npm scripts');
            const watchScript = scripts.find(s => s.name === 'npm: watch');
            assert.ok(watchScript, 'Should find "watch" script');
            assert.ok(watchScript.cwd, 'Should have cwd set');
        } catch (e) {
            console.error('Test failed with error:', e);
            throw e;
        }
    });

    test('scanTasks should detect tasks from tasks.json', async () => {
        const mockContext = {
            globalState: { get: () => { }, update: () => { } },
            extensionUri: vscode.Uri.file(__dirname),
            subscriptions: []
        } as any;
        const configService = new ConfigService(mockContext);
        const tasks = await configService.scanTasks();
        // We expect at least one task if tasks.json exists and has tasks
        // In this project it does (watch)
        assert.ok(tasks.length > 0, 'Should find VS Code tasks');
        const watchTask = tasks.find(t => t.name === 'Task: watch');
        assert.ok(watchTask, 'Should find "watch" task');
    });

    test('scanTasks should respect task group field from tasks.json', async () => {
        const mockContext = {
            globalState: { get: () => { }, update: () => { } },
            extensionUri: vscode.Uri.file(__dirname),
            subscriptions: []
        } as any;
        const configService = new ConfigService(mockContext);
        const tasks = await configService.scanTasks();
        
        // The watch task has group: { kind: "build", isDefault: true }
        const watchTask = tasks.find(t => t.name === 'Task: watch');
        assert.ok(watchTask, 'Should find "watch" task');
        // Group from tasks.json should be in workspace field (secondary grouping)
        assert.strictEqual(watchTask.workspace, 'Build', 'Watch task should have Build in workspace field (secondary grouping)');
        // Type should still be task
        assert.strictEqual(watchTask.type, 'task', 'Watch task should have task type');
    });

    // launch.json might not exist or be populated in strictly test environ depending on how we launch
    // But let's try
    test('scanLaunchConfigs should return valid launch actions without throwing', async () => {
        const mockContext = {
            globalState: { get: () => { }, update: () => { } },
            extensionUri: vscode.Uri.file(__dirname),
            subscriptions: []
        } as any;
        const configService = new ConfigService(mockContext);
        const configs = await configService.scanLaunchConfigs();

        assert.ok(Array.isArray(configs), 'Should return an array');

        // If any configs are found, validate their structure
        for (const config of configs) {
            assert.ok(config.name, `Launch config missing name`);
            assert.strictEqual(config.type, 'launch',
                `Launch config "${config.name}" should have type "launch"`);
            assert.ok(config.command, `Launch config "${config.name}" missing command`);
        }

        // This workspace defines "Run Extension" in .vscode/launch.json
        const runExtension = configs.find(c => c.name === 'Launch: Run Extension');
        assert.ok(runExtension, 'Should detect "Run Extension" from launch.json');
    });

    test('openConfigFile should return false when config is missing', async () => {
        const mockContext = {
            globalState: { get: () => { }, update: () => { } },
            extensionUri: vscode.Uri.file(__dirname),
            subscriptions: []
        } as any;
        const configService = new ConfigService(mockContext);

        // Ensure no config exists before trying to open
        await configService.deleteConfig();
        const opened = await configService.openConfigFile();
        assert.strictEqual(opened, false, 'Should return false when no config file exists');
    });
});
