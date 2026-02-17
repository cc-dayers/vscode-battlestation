const fs = require('fs');

function stripJsonComments(jsonStr) {
    let result = '';
    let i = 0;
    const len = jsonStr.length;
    let inString = false;

    while (i < len) {
        const char = jsonStr[i];
        const nextChar = jsonStr[i + 1];

        if (inString) {
            result += char;
            if (char === '\\' && i + 1 < len) {
                result += jsonStr[++i]; // Skip escaped char
            } else if (char === '"') {
                inString = false;
            }
        } else {
            if (char === '"') {
                inString = true;
                result += char;
            } else if (char === '/' && nextChar === '/') {
                // Single line comment
                i += 2;
                while (i < len && jsonStr[i] !== '\n') i++;
                continue; // Skip the newline too if you want, or keep it
            } else if (char === '/' && nextChar === '*') {
                // Multi line comment
                i += 2;
                while (i + 1 < len && !(jsonStr[i] === '*' && jsonStr[i + 1] === '/')) i++;
                i++; // Skip last '/'
            } else {
                result += char;
            }
        }
        i++;
    }
    return result;
}

// Test cases
const tests = [
    {
        name: "Standard JSON",
        input: '{"key": "value"}',
        expected: '{"key": "value"}'
    },
    {
        name: "Single line comment",
        input: '{"key": "value"} // comment',
        expected: '{"key": "value"} '
    },
    {
        name: "Multi line comment",
        input: '{"key": /* comment */ "value"}',
        expected: '{"key":  "value"}'
    },
    {
        name: "URL with http://",
        input: '{"url": "http://example.com"}',
        expected: '{"url": "http://example.com"}'
    },
    {
        name: "URL with https://",
        input: '{"url": "https://example.com"}',
        expected: '{"url": "https://example.com"}'
    },
    {
        name: "String with // inside",
        input: '{"text": "This is // not a comment"}',
        expected: '{"text": "This is // not a comment"}'
    },
    {
        name: "String with /* inside",
        input: '{"text": "This is /* not a comment */"}',
        expected: '{"text": "This is /* not a comment */"}'
    },
    {
        name: "Escaped quotes",
        input: '{"text": "This is \\"quoted\\" text"}',
        expected: '{"text": "This is \\"quoted\\" text"}'
    }
];

let failed = 0;
tests.forEach(test => {
    const actual = stripJsonComments(test.input);
    // Simple normalization for whitespace
    const normalizedActual = actual.replace(/\s+/g, '').trim();
    const normalizedExpected = test.expected.replace(/\s+/g, '').trim();

    if (normalizedActual !== normalizedExpected) {
        console.error(`FAILED: ${test.name}`);
        console.error(`Note: actual: ${actual}`);
        console.error(`      expect: ${test.expected}`);
        failed++;
    } else {
        console.log(`PASSED: ${test.name}`);
    }
});

if (failed === 0) {
    console.log("All tests passed!");
} else {
    console.error(`${failed} tests failed.`);
    process.exit(1);
}
