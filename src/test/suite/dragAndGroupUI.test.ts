import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConfigService } from '../../services/configService';

suite('Drag and Drop UI Integration Test Suite', () => {
    let configService: ConfigService;
    const mockContext = {
        globalState: { get: () => undefined, update: () => Promise.resolve() },
        extensionUri: vscode.Uri.file(__dirname),
        subscriptions: [],
        extensionPath: __dirname
    } as any;

    setup(async () => {
        configService = new ConfigService(mockContext);

        // Create a config with ordered actions
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

    test('Should preserve action order in config', async function () {
        this.timeout(5000);

        const config = await configService.readConfig();
        assert.strictEqual(config.actions[0].name, 'First', 'First action should be in position 0');
        assert.strictEqual(config.actions[1].name, 'Second', 'Second action should be in position 1');
        assert.strictEqual(config.actions[2].name, 'Third', 'Third action should be in position 2');
        assert.strictEqual(config.actions[3].name, 'Fourth', 'Fourth action should be in position 3');
    });

    test('Should save reordered actions to config', async function () {
        this.timeout(5000);

        // Simulate reordering: move Second to the end
        const config = await configService.readConfig();
        const reordered = [
            config.actions[0], // First
            config.actions[2], // Third
            config.actions[3], // Fourth
            config.actions[1]  // Second (moved to end)
        ];

        await configService.writeConfig({
            ...config,
            actions: reordered
        });

        // Verify order persisted
        const updated = await configService.readConfig();
        assert.strictEqual(updated.actions[0].name, 'First');
        assert.strictEqual(updated.actions[1].name, 'Third');
        assert.strictEqual(updated.actions[2].name, 'Fourth');
        assert.strictEqual(updated.actions[3].name, 'Second');
    });

    suite('Group Management UI Integration Test Suite', () => {
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
                    { name: 'Ungrouped Action', command: 'echo "1"', type: 'shell' },
                    { name: 'Build Action', command: 'npm run build', type: 'npm', group: 'Build' },
                    { name: 'Test Action', command: 'npm test', type: 'npm', group: 'Test' }
                ],
                groups: [
                    { name: 'Build', icon: 'tools', color: '#00ff00' },
                    { name: 'Test', icon: 'beaker', color: '#0000ff' }
                ],
                icons: []
            });
        });

        test('Should have groups in config', async function () {
            this.timeout(5000);

            const config = await configService.readConfig();
            assert.strictEqual(config.groups?.length, 2, 'Should have 2 groups');
            assert.strictEqual(config.groups?.[0].name, 'Build');
            assert.strictEqual(config.groups?.[1].name, 'Test');
        });

        test('Should open add group form', async function () {
            this.timeout(10000);

            await vscode.commands.executeCommand('battlestation.open');
            await new Promise(resolve => setTimeout(resolve, 1000));

            // This command requires hasConfig context to be true
            await vscode.commands.executeCommand('battlestation.addGroup');
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log('Add group form opened - verify form is visible manually');
        });
    });
});
