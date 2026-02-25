import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
    files: [
        'src/test/suite/configLifecycle.test.ts',
        'src/test/suite/generateConfigUI.test.ts',
        'src/test/suite/configService.test.ts',
        'src/test/suite/colorRules.test.ts',
        'src/test/suite/welcomeView.test.ts',
        'src/test/suite/uiRenderer.test.ts',
        'src/test/suite/settingsPanelUI.test.ts',
        'src/test/suite/settingsPanel.test.ts',
        'src/test/suite/settings.test.ts',
        'src/test/suite/flyoutMenuArchitecture.test.ts',
        'src/test/suite/dragAndGroupUI.test.ts',
        'src/test/suite/actionUI.test.ts',
    ],
    version: 'stable',
    workspaceFolder: '.',
    launchArgs: [
        '--disable-workspace-trust'
    ],
    useInstallation: {
        fromPath: process.env.VSCODE_PATH
    },
    mocha: {
        ui: 'tdd',
        timeout: 20000,
        require: ['ts-node/register']
    },
    platform: 'desktop'
});
