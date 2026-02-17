import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
    files: 'src/test/suite/**/*.test.ts',
    version: 'stable',
    workspaceFolder: '.',
    mocha: {
        ui: 'tdd',
        timeout: 20000,
        require: ['ts-node/register']
    }
});
