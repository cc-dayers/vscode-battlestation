import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Style Compatibility Test Suite', () => {
    test('webview stylesheet avoids unsupported color-mix diagnostics', () => {
        const repoRoot = path.resolve(__dirname, '../../..');
        const stylePath = path.join(repoRoot, 'src', 'style.scss');
        const source = fs.readFileSync(stylePath, 'utf8');

        assert.ok(!source.includes('color-mix('), 'Stylesheet should not use color-mix()');
        assert.ok(source.includes('-webkit-user-select: none;'), 'Stylesheet should include webkit user-select prefixes');
    });
});