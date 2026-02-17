function stripJsonComments(jsonStr) {
    // Current implementation
    return jsonStr.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

const problemJson = `{
    "$schema": "https://json.schemastore.org/tasks",
    "version": "2.0.0",
    "tasks": []
}`;

console.log("Original:", problemJson);
const stripped = stripJsonComments(problemJson);
console.log("Stripped:", stripped);

try {
    JSON.parse(stripped);
    console.log("✅ Parsed successfully");
} catch (e) {
    console.error("❌ Parse failed:", e.message);
    if (stripped.includes('"https:')) {
        console.log("Confirmed: https:// was treated as a comment");
    }
}
