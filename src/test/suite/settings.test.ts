import * as assert from 'assert';
import { renderSettingsView, SettingsViewContext } from '../../views/settingsView';

suite('Settings View Test Suite', () => {
    test('renderSettingsView generates correct initial structure', () => {
        const ctx: SettingsViewContext = {
            cspSource: "default-src 'none'",
            nonce: "test-nonce",
            codiconStyles: "",
            showIcon: true,
            showType: false,
            showCommand: true,
            showGroup: true,
            hideIcon: "trash",
            backupCount: 5,
            configExists: true,
            usedIcons: ['check', 'play'],
            settingsScriptUri: 'settingsView.js',
            cssUri: 'style.css'
        };

        const html = renderSettingsView(ctx);

        // Check for state injection
        assert.ok(html.includes('window.__SETTINGS__'), 'Should inject initial settings');
        assert.ok(html.includes('"showIcon":true'), 'Should inject correct showIcon value');
        assert.ok(html.includes('"hideIcon":"trash"'), 'Should inject correct hideIcon value');

        // Check for script loading
        assert.ok(html.includes('src="settingsView.js"'), 'Should load the settings script');

        // Check for CSS loading
        assert.ok(html.includes('href="style.css"'), 'Should load the CSS');
    });

    test('renderSettingsView handles missing optional props', () => {
        const ctx: SettingsViewContext = {
            cspSource: "default-src 'none'",
            nonce: "test-nonce",
            codiconStyles: "",
            showIcon: false,
            showType: true,
            showCommand: false,
            showGroup: false,
            hideIcon: "eye-closed",
            backupCount: 0,
            configExists: false,
            usedIcons: [],
            settingsScriptUri: 'settingsView.js'
            // cssUri missing
        };

        const html = renderSettingsView(ctx);
        assert.ok(html.includes('window.__SETTINGS__'), 'Should still inject settings');
        assert.ok(!html.includes('href="undefined"'), 'Should not render undefined CSS link');
    });
});
