const fs = require('fs');
const path = require('path');

// Mock strippedJsonComments function from ConfigService
function stripJsonComments(jsonStr) {
    return jsonStr.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

async function checkTasks() {
    const tasksPath = path.join(process.cwd(), '.vscode', 'tasks.json');
    console.log(`Checking: ${tasksPath}`);

    if (!fs.existsSync(tasksPath)) {
        console.error('tasks.json not found!');
        return;
    }

    const content = fs.readFileSync(tasksPath, 'utf8');
    console.log(`Content length: ${content.length}`);
    console.log('--- Content Start ---');
    console.log(content);
    console.log('--- Content End ---');

    try {
        const stripped = stripJsonComments(content);
        const json = JSON.parse(stripped);
        const tasks = json.tasks || [];
        console.log(`Found ${tasks.length} tasks in JSON`);

        const actions = [];
        tasks.forEach((t, index) => {
            console.log(`Task [${index}]:`, JSON.stringify(t));
            const label = t.label || t.script || t.command;
            console.log(`  -> Detected label fallback: "${label}"`);

            if (label) {
                actions.push({ name: `Task: ${label}` });
            } else {
                console.log('  -> SKIPPED (no label/script/command)');
            }
        });

        console.log(`Total valid actions extracted: ${actions.length}`);
    } catch (e) {
        console.error('Error parsing JSON:', e);
    }
}

checkTasks();
