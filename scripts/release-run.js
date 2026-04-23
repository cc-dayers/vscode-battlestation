const { execSync } = require('child_process');

const validKinds = new Set(['patch', 'minor', 'major']);
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const kind = args.find((arg) => !arg.startsWith('--'));

if (!kind || !validKinds.has(kind)) {
    console.error('Usage: node scripts/release-run.js <patch|minor|major> [--dry-run]');
    process.exit(1);
}

const steps = [
    { label: 'Run Playwright UI tests', command: 'npm run test:ui' },
    { label: 'Run unit and integration tests', command: 'npm run test:unit' },
    { label: 'Build production bundle', command: 'npm run build' },
    { label: `Bump ${kind} version`, command: `npm run release:${kind}` },
    { label: 'Commit, tag, and push release', command: 'npm run release:tag' },
];

function run(command) {
    if (dryRun) {
        console.log(`[dry-run] ${command}`);
        return;
    }

    console.log(`> ${command}`);
    execSync(command, { stdio: 'inherit' });
}

try {
    console.log(`Starting ${kind} release workflow${dryRun ? ' (dry run)' : ''}...`);

    for (const step of steps) {
        console.log(`\n==> ${step.label}`);
        run(step.command);
    }

    console.log(`\nRelease workflow ${dryRun ? 'validated' : 'completed'} successfully.`);
} catch (error) {
    console.error(`\nRelease workflow failed: ${error.message}`);
    process.exit(1);
}