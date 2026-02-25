import * as path from 'path';
// @ts-ignore
import Mocha from 'mocha';
import { glob } from 'glob';

export function run(): Promise<void> {
    // Create the mocha test
    const mocha = new Mocha({
        ui: 'tdd',
        color: true
    });

    const testsRoot = path.resolve(__dirname, '..');

    return new Promise((c, e) => {
        glob('**/**.test.js', { cwd: testsRoot }).then((files) => {
            const priorityOrder = [
                'suite/configLifecycle.test.js',
                'suite/configGeneration.test.js',
                'suite/generateConfigUI.test.js',
                'suite/configService.test.js',
            ];

            const rank = (file: string) => {
                const index = priorityOrder.indexOf(file);
                return index === -1 ? Number.MAX_SAFE_INTEGER : index;
            };

            const orderedFiles = [...files].sort((a, b) => {
                const rankA = rank(a);
                const rankB = rank(b);
                if (rankA !== rankB) {
                    return rankA - rankB;
                }
                return a.localeCompare(b);
            });

            // Add files to the test suite
            orderedFiles.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

            try {
                // Run the mocha test
                mocha.run(failures => {
                    if (failures > 0) {
                        e(new Error(`${failures} tests failed.`));
                    } else {
                        c();
                    }
                });
            } catch (err) {
                console.error(err);
                e(err);
            }
        }).catch(e);
    });
}
