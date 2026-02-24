import * as assert from 'assert';
import { renderGenerateConfigView, GenerateConfigContext, EnhancedModeContext } from '../../views/generateConfigView';

suite('Generate Config UI Test Suite', () => {
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

        // Ensure "optionsVisible" is not used to override or ignore checkboxes
        assert.ok(!html.includes('} else {\n            // Default to all basic sources enabled if options hidden\n            sources.npm = true;'), 'Should not contain the fallback logic that ignores enhanced tools');

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
