import * as assert from 'assert';
import { renderMainView, MainViewContext } from '../../views/mainView';
import { Config } from '../../types';

suite('UI Renderer Test Suite', () => {
    test('renderMainView injects initialData', () => {
        const mockConfig: Config = {
            actions: [
                { name: 'Test Action', command: 'echo test', type: 'shell' }
            ],
            groups: [],
            icons: []
        };

        const initialData = { ...mockConfig, someExtraData: true };

        const ctx: MainViewContext = {
            config: mockConfig,
            cspSource: 'default-src "none"',
            nonce: 'test-nonce',
            codiconStyles: '',
            showHidden: false,
            searchVisible: false,
            cssUri: 'style.css',
            initialData,
            // @ts-ignore
            scriptUri: 'mainView.js'
        };

        const html = renderMainView(ctx);

        assert.ok(html.includes('window.__INITIAL_DATA__'), 'Should contain initial data injection');
        assert.ok(html.includes('"someExtraData":true'), 'Should contain the injected data');
        assert.ok(html.includes('mainView.js'), 'Should contain script URI');
    });

    test('renderMainView respects searchVisible', () => {
        const mockConfig: Config = { actions: [], groups: [], icons: [] };
        const ctx: MainViewContext = {
            config: mockConfig,
            cspSource: 'default-src "none"',
            nonce: 'test-nonce',
            codiconStyles: '',
            showHidden: false,
            searchVisible: true, // Enable search
            cssUri: 'style.css',
            // @ts-ignore
            scriptUri: 'mainView.js'
        };

        const html = renderMainView(ctx);
        assert.ok(html.includes('"showSearch":true'), 'Initial data should have showSearch: true');
    });
});
