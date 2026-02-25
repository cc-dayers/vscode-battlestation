import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConfigService } from '../../services/configService';
import type { Config } from '../../types';

suite('Config Lifecycle Test Suite', () => {
    let configService: ConfigService;
    const mockContext = {
        globalState: { get: () => undefined, update: () => Promise.resolve() },
        extensionUri: vscode.Uri.file(__dirname),
        subscriptions: []
    } as any;

    setup(() => {
        configService = new ConfigService(mockContext);
    });

    test('Should handle delete -> generate config lifecycle', async function () {
        this.timeout(10000); // Increase timeout for async operations

        // Step 1: Ensure config exists by creating one
        const initialExists = await configService.configExists();
        if (!initialExists) {
            await configService.createMinimalConfig([
                { type: "npm", icon: "package" },
                { type: "shell", icon: "terminal" }
            ]);
        }

        // Verify config exists
        const existsAfterCreate = await configService.configExists();
        assert.strictEqual(existsAfterCreate, true, 'Config should exist after creation');

        // Step 2: Delete the config
        const deleteResult = await configService.deleteConfig();
        assert.strictEqual(deleteResult.deleted, true, 'Config deletion should succeed');
        assert.ok(deleteResult.location, 'Delete result should include location');

        // Verify config no longer exists
        const existsAfterDelete = await configService.configExists();
        assert.strictEqual(existsAfterDelete, false, 'Config should not exist after deletion');

        // Step 3: Generate a new config
        await configService.createAutoConfig(
            { npm: true, tasks: true, launch: true },
            true, // enable grouping
            [
                { type: "npm", icon: "package" },
                { type: "task", icon: "check" },
                { type: "launch", icon: "play" }
            ],
            [], // no enhanced actions
            false // no coloring
        );

        // Step 4: Verify config was created
        const existsAfterGenerate = await configService.configExists();
        assert.strictEqual(existsAfterGenerate, true, 'Config should exist after generation');

        // Step 5: Read and verify config content
        const config: Config = await configService.readConfig();
        assert.ok(config, 'Should be able to read generated config');
        assert.ok(Array.isArray(config.actions), 'Config should have actions array');
        assert.ok(config.actions.length > 0, 'Config should have at least one action');

        // Verify at least some basic structure is present
        const hasName = config.actions.every(a => typeof a.name === 'string');
        const hasCommand = config.actions.every(a => typeof a.command === 'string');
        const hasType = config.actions.every(a => typeof a.type === 'string');
        
        assert.strictEqual(hasName, true, 'All actions should have a name');
        assert.strictEqual(hasCommand, true, 'All actions should have a command');
        assert.strictEqual(hasType, true, 'All actions should have a type');
    });

    test('Should create minimal config when none exists', async function () {
        this.timeout(5000);

        // Ensure no config exists
        const exists = await configService.configExists();
        if (exists) {
            await configService.deleteConfig();
        }

        // Create minimal config
        await configService.createMinimalConfig([
            { type: "npm", icon: "package" },
            { type: "shell", icon: "terminal" }
        ]);

        // Verify it was created
        const existsAfterCreate = await configService.configExists();
        assert.strictEqual(existsAfterCreate, true, 'Config should exist after creation');

        // Read and verify structure
        const config = await configService.readConfig();
        assert.ok(config, 'Should be able to read config');
        assert.ok(Array.isArray(config.actions), 'Config should have actions array');
    });

    test('Should detect config file location', async function () {
        this.timeout(5000);

        // Create a config if it doesn't exist
        const exists = await configService.configExists();
        if (!exists) {
            await configService.createMinimalConfig([{ type: "npm", icon: "package" }]);
        }

        // Get config status
        const status = await configService.getConfigStatus();
        assert.strictEqual(status.exists, true, 'Status should show config exists');
        assert.strictEqual(status.valid, true, 'Status should show config is valid');
        assert.ok(status.config, 'Status should include config object');
    });

    test('Should preserve custom actions when regenerating', async function () {
        this.timeout(10000);

        // Create initial config
        const initialConfig: Config = {
            actions: [
                { name: "Custom Action", command: "echo custom", type: "shell" },
                { name: "npm: build", command: "npm run build", type: "npm" }
            ],
            icons: [{ type: "shell", icon: "terminal" }]
        };

        await configService.writeConfig(initialConfig);

        // Regenerate config with auto-detection
        await configService.createAutoConfig(
            { npm: true, tasks: false, launch: false },
            false,
            [{ type: "npm", icon: "package" }],
            [],
            false
        );

        // Read the regenerated config
        const regeneratedConfig = await configService.readConfig();

        // Verify custom action is preserved
        const customAction = regeneratedConfig.actions.find(a => a.name === "Custom Action");
        assert.ok(customAction, 'Custom action should be preserved during regeneration');
        assert.strictEqual(customAction.command, "echo custom", 'Custom action command should be unchanged');
    });

    test('Should handle config history', async function () {
        this.timeout(5000);

        // Create initial config
        const config1: Config = {
            actions: [{ name: "Action 1", command: "cmd1", type: "shell" }],
            icons: []
        };
        await configService.writeConfig(config1);

        // Wait a bit to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 100));

        // Update config (this should create a history entry)
        const config2: Config = {
            actions: [
                { name: "Action 1", command: "cmd1", type: "shell" },
                { name: "Action 2", command: "cmd2", type: "shell" }
            ],
            icons: []
        };
        await configService.writeConfig(config2);

        // Check history
        const versions = await configService.listConfigVersions();
        assert.ok(versions.length > 0, 'Should have at least one history entry');
    });

    test('Should immediately report valid status with generated actions after auto-generate', async function () {
        this.timeout(10000);

        await configService.deleteConfig();

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

        const status = await configService.getConfigStatus();
        assert.strictEqual(status.exists, true, 'Generated config should exist immediately');
        assert.strictEqual(status.valid, true, 'Generated config should be valid immediately');
        assert.ok(status.config, 'Generated status should include config payload');
        assert.ok((status.config?.actions?.length ?? 0) > 0, 'Generated config should include actions immediately');
    });

    test('Should preserve task groups from tasks.json during auto-config generation', async function () {
        this.timeout(10000);

        // Delete existing config if any
        await configService.deleteConfig();

        // Generate config with tasks enabled
        await configService.createAutoConfig(
            { npm: false, tasks: true, launch: false },
            true, // enable grouping
            [{ type: 'task', icon: 'check' }],
            [],
            true // enable coloring
        );

        // Read generated config
        const config = await configService.readConfig();
        assert.ok(config, 'Should be able to read generated config');

        // Find watch task
        const watchTask = config.actions.find(a => a.name === 'Task: watch');
        assert.ok(watchTask, 'Should find watch task');
        
        // Primary group should be "VS Code Tasks"
        assert.strictEqual(watchTask.group, 'VS Code Tasks', 'Task should have VS Code Tasks as primary group');
        
        // Secondary group (Build) should be in workspace field
        assert.strictEqual(watchTask.workspace, 'Build', 'Task group from tasks.json should be in workspace field (secondary grouping)');

        // Verify that VS Code Tasks group exists in groups array
        const tasksGroup = config.groups?.find(g => g.name === 'VS Code Tasks');
        assert.ok(tasksGroup, 'VS Code Tasks group should be created');
        
        // Verify that Build secondary group exists
        assert.ok(config.secondaryGroups, 'Config should have secondaryGroups');
        assert.ok(config.secondaryGroups['Build'], 'Build should be in secondaryGroups');
    });

    test('Should not overwrite existing task groups when groupByType is enabled', async function () {
        this.timeout(10000);

        await configService.deleteConfig();

        // Generate config with both npm and tasks
        await configService.createAutoConfig(
            { npm: true, tasks: true, launch: false },
            true, // groupByType enabled
            [
                { type: 'npm', icon: 'package' },
                { type: 'task', icon: 'check' }
            ],
            [],
            true // enable coloring
        );

        const config = await configService.readConfig();
        assert.ok(config, 'Should be able to read generated config');

        // Task should have VS Code Tasks as primary group
        const watchTask = config.actions.find(a => a.name === 'Task: watch');
        if (watchTask) {
            assert.strictEqual(watchTask.group, 'VS Code Tasks', 'Task should have VS Code Tasks as primary group');
            assert.strictEqual(watchTask.workspace, 'Build', 'Task should have Build as secondary group (in workspace field)');
        }

        // NPM actions should have NPM Scripts as primary group
        const npmAction = config.actions.find(a => a.name.startsWith('npm:'));
        if (npmAction) {
            assert.strictEqual(npmAction.group, 'NPM Scripts', 'NPM action should have NPM Scripts as primary group');
        }
        
        // Verify both primary groups exist
        assert.ok(config.groups?.find(g => g.name === 'VS Code Tasks'), 'VS Code Tasks group should exist');
        assert.ok(config.groups?.find(g => g.name === 'NPM Scripts'), 'NPM Scripts group should exist');
    });

    test('Should allow opening config file immediately after generation', async function () {
        this.timeout(10000);

        await configService.deleteConfig();

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

        const exists = await configService.configExists();
        assert.strictEqual(exists, true, 'Generated config should exist');

        const opened = await configService.openConfigFile();
        assert.strictEqual(opened, true, 'Generated config should be openable immediately');
    });
});
