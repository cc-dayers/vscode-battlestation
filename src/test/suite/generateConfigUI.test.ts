import * as assert from 'assert';
import { renderGenerateConfigView, GenerateConfigContext, EnhancedModeContext } from '../../views/generateConfigView';

suite('Generate Config UI Test Suite', () => {
    test('Should render core generation checkboxes checked by default', () => {
        const ctx: GenerateConfigContext = {
            cspSource: 'default-src "none"',
            nonce: 'test-nonce',
            codiconStyles: '',
            hasNpm: false,
            hasTasks: true,
            hasLaunch: false,
            showWelcome: false
        };

        const html = renderGenerateConfigView(ctx);

        assert.ok(
            /id="npmCheck"[^>]*checked/.test(html),
            'npm source checkbox should be checked by default even when npm is not detected'
        );
        assert.ok(
            /id="tasksCheck"[^>]*checked/.test(html),
            'tasks source checkbox should be checked by default'
        );
        assert.ok(
            /id="launchCheck"[^>]*checked/.test(html),
            'launch source checkbox should be checked by default even when launch is not detected'
        );
    });

    test('Should not ignore enhanced sources when generating', () => {
        const enhancedMode: EnhancedModeContext = {
            hasDocker: true,
            hasDockerCompose: true,
            hasPython: true,
            hasGo: true,
            hasRust: false,
            hasMakefile: false,
            hasGradle: false,
            hasMaven: false,
            hasCMake: false,
            hasGit: true
        };

        const ctx: GenerateConfigContext = {
            cspSource: 'default-src "none"',
            nonce: 'test-nonce',
            codiconStyles: '',
            hasNpm: true,
            hasTasks: true,
            hasLaunch: true,
            showWelcome: false,
            enhancedMode
        };

        const html = renderGenerateConfigView(ctx);

        assert.ok(html.includes('id="dockerCheck"'), 'Should render docker checkbox');
        assert.ok(html.includes('id="pythonCheck"'), 'Should render python checkbox');
        assert.ok(html.includes('id="gitCheck"'), 'Should render git checkbox');

        // Regression test: the collectSources function should not accept an optionsVisible argument 
        // that previously caused it to override the selected boxes with just npm, tasks, launch
        assert.ok(!html.includes('function collectSources(optionsVisible)'), 'collectSources should not take optionsVisible to avoid ignoring detected tools');
        assert.ok(html.includes('function collectSources()'), 'collectSources should take no arguments');

        // When options are collapsed, core sources should still default to enabled
        assert.ok(
            html.includes('const effectiveSources = optionsVisible') &&
            html.includes('npm: true, tasks: true, launch: true'),
            'Collapsed mode should default npm/tasks/launch to enabled'
        );

        // Ensure that dockerCheck is being read in the script
        assert.ok(html.includes('if (dockerCheck) sources.docker = dockerCheck.checked;'), 'Script should read docker checkbox value');
    });

    test('Should render correctly without enhanced mode context', () => {
        const ctx: GenerateConfigContext = {
            cspSource: 'default-src "none"',
            nonce: 'test-nonce',
            codiconStyles: '',
            hasNpm: true,
            hasTasks: true,
            hasLaunch: true,
            showWelcome: true
        };

        const html = renderGenerateConfigView(ctx);

        // Enhanced section should not be present
        assert.ok(!html.includes('Enhanced Mode (Advanced Options)'), 'Enhanced Mode section should be hidden when context is missing');
        assert.ok(!html.includes('id="dockerCheck"'), 'Docker checkbox should not be rendered');
    });

    test('Should include generation loading lifecycle hooks', () => {
        const ctx: GenerateConfigContext = {
            cspSource: 'default-src "none"',
            nonce: 'test-nonce',
            codiconStyles: '',
            hasNpm: true,
            hasTasks: true,
            hasLaunch: true,
            showWelcome: true
        };

        const html = renderGenerateConfigView(ctx);

        assert.ok(html.includes('id="generationOverlay"'), 'Should render generation overlay');
        assert.ok(html.includes("message?.type === 'configGenerationStarted'"), 'Should handle generation started message');
        assert.ok(html.includes("message?.type === 'configGenerationComplete'"), 'Should handle generation complete message');
        assert.ok(html.includes('setGenerationLoading(true);'), 'Should enable generation loading when creating config');
    });
});
