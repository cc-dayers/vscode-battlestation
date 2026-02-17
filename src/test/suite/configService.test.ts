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

    // launch.json might not exist or be populated in strictly test environ depending on how we launch
    // But let's try
    test('scanLaunchConfigs should detect configurations', async () => {
        const mockContext = {
            globalState: { get: () => { }, update: () => { } },
            extensionUri: vscode.Uri.file(__dirname),
            subscriptions: []
        } as any;
        const configService = new ConfigService(mockContext);
        try {
            const configs = await configService.scanLaunchConfigs();
            // It's okay if 0, but it shouldn't throw
            assert.ok(Array.isArray(configs), 'Should return array');
        } catch (e) {
            assert.fail('scanLaunchConfigs threw error: ' + e);
        }
    });
});
