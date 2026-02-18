const { execSync } = require('child_process');
const { version } = require('../package.json');

function run(command) {
    console.log(`> ${command}`);
    try {
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Command failed: ${command}`);
        process.exit(1);
    }
}

console.log(`🚀 Preparing to tag release v${version}...`);

try {
    // 1. Stage package files
    // We add package-lock.json too in case npm version updated it
    run('git add package.json package-lock.json');

    // 2. Commit if there are changes
    try {
        // Check if there are staged changes to commit
        execSync('git diff --cached --quiet');
        console.log('No changes to commit.');
    } catch (e) {
        // git diff --cached --quiet returns 1 if there are changes
        run(`git commit -m "chore: bump version to v${version}"`);
    }

    // 3. Tag
    // Check if tag already exists
    try {
        execSync(`git rev-parse "v${version}"`, { stdio: 'ignore' });
        console.log(`Tag v${version} already exists.`);
    } catch (e) {
        run(`git tag v${version}`);
    }

    // 4. Push
    run('git push');
    run('git push --tags');

    console.log(`\n✅ Release v${version} pushed successfully!`);
} catch (error) {
    console.error('\n❌ Release script failed:', error.message);
    process.exit(1);
}
