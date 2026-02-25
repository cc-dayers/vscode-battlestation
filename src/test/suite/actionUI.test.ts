import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConfigService } from '../../services/configService';

/**
 * Action UI Integration Tests
 *
 * Tests that config write/read round-trips work for action CRUD operations
 * and that VS Code commands execute without throwing.
 *
 * NOTE: Webview DOM verification (button clicks, hide animation, search input)
 * is handled via the UI test harness at localhost:3000, NOT here.
 */
suite('Action Integration Test Suite', () => {
    let configService: ConfigService;
    const mockContext = {
        globalState: { get: () => undefined, update: () => Promise.resolve() },
        extensionUri: vscode.Uri.file(__dirname),
        subscriptions: [],
        extensionPath: __dirname
    } as any;

    const testActions = [
        { name: 'Test Action 1', command: 'echo "test1"', type: 'shell' },
        { name: 'Test Action 2', command: 'echo "test2"', type: 'shell' },
        { name: 'Hidden Action', command: 'echo "hidden"', type: 'shell', hidden: true }
    ];

    setup(async () => {
        configService = new ConfigService(mockContext);

        await configService.writeConfig({
            actions: testActions,
            groups: [
                { name: 'Test Group', icon: 'folder', color: '#ff0000' }
            ],
            icons: [
                { type: 'shell', icon: 'terminal' }
            ]
        });
    });

    test('writeConfig persists all actions with correct fields', async function () {
        this.timeout(10000);

        const config = await configService.readConfig();

        assert.strictEqual(config.actions.length, 3, 'Should have 3 actions');
        assert.strictEqual(config.actions[0].name, 'Test Action 1');
        assert.strictEqual(config.actions[0].command, 'echo "test1"');
        assert.strictEqual(config.actions[0].type, 'shell');
        assert.strictEqual(config.actions[2].name, 'Hidden Action');
        assert.strictEqual(config.actions[2].hidden, true, 'Third action should be hidden');
    });

    test('hidden flag is preserved through write/read round-trip', async function () {
        this.timeout(10000);

        // Read, modify hidden flag, write back, read again
        const config = await configService.readConfig();
        const target = config.actions.find(a => a.name === 'Test Action 1');
        assert.ok(target, 'Test Action 1 must exist');
        assert.strictEqual(target!.hidden, undefined, 'Should not be hidden initially');

        // Hide it
        target!.hidden = true;
        await configService.writeConfig(config);

        // Read back and verify
        const updated = await configService.readConfig();
        const hiddenAction = updated.actions.find(a => a.name === 'Test Action 1');
        assert.ok(hiddenAction, 'Test Action 1 must still exist after update');
        assert.strictEqual(hiddenAction!.hidden, true, 'Should be hidden after update');
    });

    test('deleting an action persists correctly', async function () {
        this.timeout(10000);

        const config = await configService.readConfig();
        assert.strictEqual(config.actions.length, 3, 'Precondition: 3 actions');

        // Remove the second action
        config.actions = config.actions.filter(a => a.name !== 'Test Action 2');
        await configService.writeConfig(config);

        const updated = await configService.readConfig();
        assert.strictEqual(updated.actions.length, 2, 'Should have 2 actions after delete');
        assert.ok(!updated.actions.find(a => a.name === 'Test Action 2'), 'Deleted action must be gone');
    });

    test('adding an action persists correctly', async function () {
        this.timeout(10000);

        const config = await configService.readConfig();
        config.actions.push({
            name: 'New Action',
            command: 'echo "new"',
            type: 'shell'
        });
        await configService.writeConfig(config);

        const updated = await configService.readConfig();
        assert.strictEqual(updated.actions.length, 4, 'Should have 4 actions after add');
        const newAction = updated.actions.find(a => a.name === 'New Action');
        assert.ok(newAction, 'New action must exist');
        assert.strictEqual(newAction!.command, 'echo "new"');
    });

    test('battlestation.open command executes without error', async function () {
        this.timeout(10000);

        // Smoke test: the command should not throw
        await vscode.commands.executeCommand('battlestation.open');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Verify config is still intact after opening
        const status = await configService.getConfigStatus();
        assert.strictEqual(status.exists, true, 'Config must still exist after opening panel');
        assert.strictEqual(status.valid, true, 'Config must still be valid after opening panel');
    });
});
