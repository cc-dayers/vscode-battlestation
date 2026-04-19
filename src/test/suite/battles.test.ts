import * as assert from 'assert';
import { renderBattlesView } from '../../views/battlesView';
import { renderBattlesSettingsView } from '../../views/battlesSettingsView';
import { renderBattleTestView } from '../../views/battleTestView';
import type { BattleProvider, Battle, Config } from '../../types';

suite('Battles Feature Test Suite', () => {

    // --- renderBattlesView tests ---

    test('renderBattlesView injects initial data and script URI', () => {
        const html = renderBattlesView({
            cspSource: 'default-src "none"',
            nonce: 'test-nonce',
            codiconStyles: '',
            cssUri: 'style.css',
            scriptUri: 'battlesView.js',
            initialData: {
                providers: [
                    {
                        providerId: 'bb-prs',
                        providerName: 'Bitbucket PRs',
                        battles: [
                            { id: 'pr-1', title: 'Fix auth', status: 'active' }
                        ],
                        isLoading: false,
                    }
                ]
            }
        });

        assert.ok(html.includes('window.__BATTLES_INITIAL_DATA__'), 'Should contain battles initial data injection');
        assert.ok(html.includes('Bitbucket PRs'), 'Should serialize provider name');
        assert.ok(html.includes('Fix auth'), 'Should serialize battle title');
        assert.ok(html.includes('battlesView.js'), 'Should contain the Battles view script URI');
    });

    test('renderBattlesView handles empty providers gracefully', () => {
        const html = renderBattlesView({
            cspSource: 'default-src "none"',
            nonce: 'test-nonce',
            codiconStyles: '',
            initialData: { providers: [] }
        });

        assert.ok(html.includes('window.__BATTLES_INITIAL_DATA__'), 'Should contain data injection');
        assert.ok(html.includes('"providers":[]'), 'Should serialize empty array');
    });

    test('renderBattlesView handles missing initialData', () => {
        const html = renderBattlesView({
            cspSource: 'default-src "none"',
            nonce: 'test-nonce',
            codiconStyles: '',
        });

        assert.ok(html.includes('window.__BATTLES_INITIAL_DATA__'), 'Should contain data injection');
        assert.ok(html.includes('{}'), 'Should serialize empty object');
    });

    // --- renderBattlesSettingsView tests ---

    test('renderBattlesSettingsView injects settings data and script URI', () => {
        const html = renderBattlesSettingsView({
            cspSource: 'default-src "none"',
            nonce: 'test-nonce',
            codiconStyles: '',
            cssUri: 'style.css',
            scriptUri: 'battlesSettings.js',
            initialData: {
                providers: [
                    { id: 'bb-prs', name: 'Bitbucket PRs', command: 'bb-cli list --json', enabled: true },
                ],
                providerStates: [
                    {
                        providerId: 'bb-prs',
                        providerName: 'Bitbucket PRs',
                        battles: [],
                        isLoading: false,
                    },
                ],
            },
        });

        assert.ok(html.includes('window.__BATTLES_SETTINGS__'), 'Should contain settings data injection');
        assert.ok(html.includes('Bitbucket PRs'), 'Should serialize provider name');
        assert.ok(html.includes('battlesSettings.js'), 'Should contain the settings view script URI');
    });

    test('renderBattlesSettingsView handles empty providers', () => {
        const html = renderBattlesSettingsView({
            cspSource: 'default-src "none"',
            nonce: 'test-nonce',
            codiconStyles: '',
            initialData: { providers: [], providerStates: [] },
        });

        assert.ok(html.includes('window.__BATTLES_SETTINGS__'), 'Should contain settings data injection');
        assert.ok(html.includes('"providers":[]'), 'Should serialize empty providers');
    });

    // --- renderBattleTestView tests ---

    test('renderBattleTestView injects test data and script URI', () => {
        const html = renderBattleTestView({
            cspSource: 'default-src "none"',
            nonce: 'test-nonce',
            codiconStyles: '',
            scriptUri: 'battleTest.js',
            initialData: {
                provider: { id: 'bb', name: 'Bitbucket', command: 'bb-cli list' },
                stdout: '{"battles":[]}',
                stderr: '',
                exitCode: 0,
                duration: 100,
                parsedCount: 0,
                parseError: null,
            },
        });

        assert.ok(html.includes('window.__BATTLE_TEST_DATA__'), 'Should contain test data injection');
        assert.ok(html.includes('Bitbucket'), 'Should serialize provider name');
        assert.ok(html.includes('battleTest.js'), 'Should contain the test view script URI');
    });

    test('renderBattleTestView serializes error states', () => {
        const html = renderBattleTestView({
            cspSource: 'default-src "none"',
            nonce: 'test-nonce',
            codiconStyles: '',
            initialData: {
                provider: { id: 'broken', name: 'Broken', command: 'fake-cli' },
                stdout: '',
                stderr: 'command not found',
                exitCode: 127,
                duration: 15,
                parsedCount: null,
                parseError: null,
            },
        });

        assert.ok(html.includes('command not found'), 'Should serialize stderr');
        assert.ok(html.includes('"exitCode":127'), 'Should serialize exit code');
    });

    // --- Type system tests ---

    test('BattleProvider interface accepts all expected fields', () => {
        const provider: BattleProvider = {
            id: 'test-provider',
            name: 'Test Provider',
            command: 'echo "hello"',
            cwd: '/workspace',
            refreshInterval: 300,
            icon: 'terminal',
            color: '#ff0000',
            enabled: true,
        };

        assert.strictEqual(provider.id, 'test-provider');
        assert.strictEqual(provider.refreshInterval, 300);
        assert.strictEqual(provider.enabled, true);
    });

    test('Battle interface supports all status and priority values', () => {
        const battles: Battle[] = [
            { id: '1', title: 'Active', status: 'active', priority: 'critical' },
            { id: '2', title: 'Done', status: 'done', priority: 'high' },
            { id: '3', title: 'Blocked', status: 'blocked', priority: 'medium' },
            { id: '4', title: 'Dismissed', status: 'dismissed', priority: 'low' },
        ];

        assert.strictEqual(battles.length, 4);
        assert.strictEqual(battles[0].priority, 'critical');
        assert.strictEqual(battles[3].status, 'dismissed');
    });

    test('Battle interface supports optional fields', () => {
        const minimal: Battle = { id: 'min', title: 'Minimal', status: 'active' };
        assert.strictEqual(minimal.description, undefined);
        assert.strictEqual(minimal.url, undefined);
        assert.strictEqual(minimal.tags, undefined);
        assert.strictEqual(minimal.actions, undefined);
        assert.strictEqual(minimal.metadata, undefined);
        assert.strictEqual(minimal.priority, undefined);
    });

    test('Battle with actions supports url, shell, and vscode types', () => {
        const battle: Battle = {
            id: 'with-actions',
            title: 'Has Actions',
            status: 'active',
            actions: [
                { label: 'Open', type: 'url', value: 'https://example.com' },
                { label: 'Checkout', type: 'shell', value: 'git checkout main' },
                { label: 'Focus', type: 'vscode', value: 'workbench.action.focusSideBar' },
            ],
        };

        assert.strictEqual(battle.actions!.length, 3);
        assert.strictEqual(battle.actions![0].type, 'url');
        assert.strictEqual(battle.actions![1].type, 'shell');
        assert.strictEqual(battle.actions![2].type, 'vscode');
    });

    // --- Config integration ---

    test('Config interface accepts battleProviders field', () => {
        const config: Config = {
            actions: [{ name: 'Build', command: 'npm run build', type: 'npm' }],
            groups: [],
            battleProviders: [
                { id: 'bb', name: 'Bitbucket', command: 'bb-cli list --json' },
            ],
        };

        assert.strictEqual(config.battleProviders!.length, 1);
        assert.strictEqual(config.battleProviders![0].id, 'bb');
    });

    test('Config without battleProviders is valid', () => {
        const config: Config = {
            actions: [],
            groups: [],
        };

        assert.strictEqual(config.battleProviders, undefined);
    });
});
