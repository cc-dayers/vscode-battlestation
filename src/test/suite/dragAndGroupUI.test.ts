import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConfigService } from '../../services/configService';

/**
 * Action Ordering & Group Persistence Tests
 *
 * Tests that action order and group definitions survive write/read round-trips —
 * the backend-side of drag-and-drop and group management.
 *
 * Actual drag-and-drop UI interaction and the add-group form are verified via
 * the UI test harness at localhost:3000.
 */
suite('Action Ordering & Group Persistence', () => {
    let configService: ConfigService;
    const mockContext = {
        globalState: { get: () => undefined, update: () => Promise.resolve() },
        extensionUri: vscode.Uri.file(__dirname),
        subscriptions: [],
        extensionPath: __dirname
    } as any;

    setup(async () => {
        configService = new ConfigService(mockContext);

        await configService.writeConfig({
            actions: [
                { name: 'First', command: 'echo "1"', type: 'shell' },
                { name: 'Second', command: 'echo "2"', type: 'shell' },
                { name: 'Third', command: 'echo "3"', type: 'shell' },
                { name: 'Fourth', command: 'echo "4"', type: 'shell' }
            ],
            groups: [],
            icons: []
        });
    });

    test('Action order is preserved through write/read', async function () {
        this.timeout(5000);

        const config = await configService.readConfig();
        assert.strictEqual(config.actions[0].name, 'First');
        assert.strictEqual(config.actions[1].name, 'Second');
        assert.strictEqual(config.actions[2].name, 'Third');
        assert.strictEqual(config.actions[3].name, 'Fourth');
    });

    test('Reordered actions persist correctly', async function () {
        this.timeout(5000);

        const config = await configService.readConfig();
        const reordered = [
            config.actions[0], // First
            config.actions[2], // Third
            config.actions[3], // Fourth
            config.actions[1]  // Second (moved to end)
        ];

        await configService.writeConfig({ ...config, actions: reordered });

        const updated = await configService.readConfig();
        assert.strictEqual(updated.actions[0].name, 'First');
        assert.strictEqual(updated.actions[1].name, 'Third');
        assert.strictEqual(updated.actions[2].name, 'Fourth');
        assert.strictEqual(updated.actions[3].name, 'Second');
    });

    test('Groups persist through write/read with all properties', async function () {
        this.timeout(5000);

        await configService.writeConfig({
            actions: [
                { name: 'Ungrouped', command: 'echo "1"', type: 'shell' },
                { name: 'Build Action', command: 'npm run build', type: 'npm', group: 'Build' },
                { name: 'Test Action', command: 'npm test', type: 'npm', group: 'Test' }
            ],
            groups: [
                { name: 'Build', icon: 'tools', color: '#00ff00' },
                { name: 'Test', icon: 'beaker', color: '#0000ff' }
            ],
            icons: []
        });

        const config = await configService.readConfig();

        assert.strictEqual(config.groups?.length, 2, 'Should have 2 groups');
        assert.strictEqual(config.groups![0].name, 'Build');
        assert.strictEqual(config.groups![0].icon, 'tools');
        assert.strictEqual(config.groups![0].color, '#00ff00');
        assert.strictEqual(config.groups![1].name, 'Test');
        assert.strictEqual(config.groups![1].icon, 'beaker');
        assert.strictEqual(config.groups![1].color, '#0000ff');

        // Verify group references on actions
        const buildAction = config.actions.find(a => a.name === 'Build Action');
        assert.ok(buildAction, 'Build Action must exist');
        assert.strictEqual(buildAction!.group, 'Build');
    });

    test('Adding a group to an existing config preserves actions', async function () {
        this.timeout(5000);

        const config = await configService.readConfig();
        assert.strictEqual(config.actions.length, 4, 'Precondition: 4 actions');

        // Add a group
        config.groups = [{ name: 'Dev', icon: 'code', color: '#ff0000' }];
        config.actions[0].group = 'Dev';
        await configService.writeConfig(config);

        const updated = await configService.readConfig();
        assert.strictEqual(updated.actions.length, 4, 'Action count must not change');
        assert.strictEqual(updated.groups?.length, 1, 'Should have 1 group');
        assert.strictEqual(updated.actions[0].group, 'Dev');
    });
});
