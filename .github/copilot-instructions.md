# General AI Assistant & Copilot Guidelines

## Quality Gate (Required)
For any code change in this repository, completion requires both of the following to succeed before handing off:
1. Run the full test suite and ensure all tests pass.
2. Run a production build and ensure it succeeds.

Recommended commands:
```bash
npm test
npm run build
```

## AI UI Testing Paradigm
This extension utilizes a **Visual UI Test Harness** to verify webviews. Because VS Code's extension test host blocks programmatic iframe DOM manipulation, you **MUST NOT** try to click via `vscode-test` or create manual prompt tests that simply `console.log` instructions.

Whenever you add or modify a UI feature in the webviews (React/Lit components):
1. **Never mock the DOM** inside the extension host tests.
2. **Start the local UI test server** (which mocks the `vscode` API and hosts the raw views) by running:
   ```bash
   node scripts/serve-ui.js
   ```
3. **Use the `browser_subagent`** to navigate to `http://localhost:3000`.
4. Command the browser agent to physically click, verify, and validate the UI visually and via DOM inspection.
5. All UI tasks must be verified this way before completing the task. No passive tests!
