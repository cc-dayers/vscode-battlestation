import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Flyout Menu Architecture Test Suite', () => {
    const repoRoot = path.resolve(__dirname, '../../..');
    const webviewFile = path.join(repoRoot, 'src', 'webview', 'mainView.ts');
    const styleFile = path.join(repoRoot, 'src', 'style.scss');

    test('Webview uses shared flyout render and keyboard handlers', () => {
        const source = fs.readFileSync(webviewFile, 'utf8');

        assert.ok(source.includes('const renderFlyoutMenu = (config: FlyoutRenderConfig) => {'), 'Should define shared flyout render helper');
        assert.ok(source.includes('const handleFlyoutTriggerKeydown = (e: KeyboardEvent, config: FlyoutMenuKeyboardConfig) => {'), 'Should define shared trigger keyboard handler');
        assert.ok(source.includes('const handleFlyoutMenuKeydown = (e: KeyboardEvent, config: FlyoutMenuKeyboardConfig) => {'), 'Should define shared menu keyboard handler');
        assert.ok(source.includes('const getActionMenuKeyboardConfig = (item: Action): FlyoutMenuKeyboardConfig => ({'), 'Should define action flyout keyboard config factory');
        assert.ok(!source.includes('const getGroupMenuKeyboardConfig = (groupName: string): FlyoutMenuKeyboardConfig => ({'), 'Group header should not use flyout keyboard config after reverting to direct gear button');
    });

    test('Webview uses normalized lp-menu-* class names', () => {
        const source = fs.readFileSync(webviewFile, 'utf8');

        assert.ok(source.includes('lp-menu-container'), 'Should use lp-menu-container class');
        assert.ok(source.includes('lp-menu-trigger'), 'Should use lp-menu-trigger class');
        assert.ok(source.includes('lp-menu-panel'), 'Should use lp-menu-panel class');
        assert.ok(source.includes('lp-menu-item'), 'Should use lp-menu-item class');
        assert.ok(source.includes('lp-menu-divider'), 'Should use lp-menu-divider class');

        assert.ok(!source.includes('lp-action-menu-trigger'), 'Should not use old action trigger class in webview markup');
        assert.ok(!source.includes('lp-group-menu-trigger'), 'Should not use old group trigger class in webview markup');
        assert.ok(!source.includes('lp-action-flyout-item'), 'Should not use old action item class in webview markup');
        assert.ok(!source.includes('lp-group-flyout-item'), 'Should not use old group item class in webview markup');
    });

    test('Styles define normalized lp-menu-* classes', () => {
        const source = fs.readFileSync(styleFile, 'utf8');

        assert.ok(source.includes('.lp-menu-container--action'), 'Should style action menu container variant');
        assert.ok(source.includes('.lp-menu-container--group'), 'Should style group menu container variant');
        assert.ok(source.includes('.lp-menu-trigger--action'), 'Should style action trigger variant');
        assert.ok(source.includes('.lp-menu-trigger--group'), 'Should style group trigger variant');
        assert.ok(source.includes('.lp-menu-panel--action'), 'Should style action panel variant');
        assert.ok(source.includes('.lp-menu-item--action'), 'Should style action item variant');
        assert.ok(source.includes('.lp-menu-divider'), 'Should style shared divider class');

        // Verify we prevent unintended stacking context overlaps (Issue #123 / the z-index bug)
        const containerStart = source.indexOf('.lp-action-menu-container');
        if (containerStart !== -1) {
            const containerEnd = source.indexOf('}', containerStart);
            const containerBlock = source.substring(containerStart, containerEnd);
            assert.ok(!containerBlock.includes('transform'), 'Should not use transform for placement to avoid trapping z-index in a 3D stacking context');
            assert.ok(!containerBlock.includes('z-index'), 'Should not use local container z-index wrapper to avoid breaking relative z-index logic');
            assert.ok(containerBlock.includes('bottom: 0') && containerBlock.includes('display: flex'), 'Should use flex for vertical alignment to avoid stacking context');
        }
    });
});
