# General AI Assistant & Copilot Guidelines

## Quality Gate (Required)

For any code change in this repository, the task is **not complete** until all three of the following succeed:

1. All Playwright E2E tests pass: `npm run test:ui`
2. All unit/integration tests pass: `npm run test:unit`
3. Production build succeeds: `npm run build`

## Testing Requirements

### Two test layers are mandatory

| Layer | Command | Files | Purpose |
|---|---|---|---|
| E2E / UI | `npm run test:ui` | `tests/*.spec.ts` | Real browser interactions via Playwright |
| Unit / integration | `npm run test:unit` | `src/test/suite/*.test.ts` | Extension host logic, config, HTML rendering |

Every new feature and every bug fix requires tests in **both** layers before it is done.

### Playwright specs

- Framework: `@playwright/test` (configured in `playwright.config.ts`)
- Server: `scripts/serve-ui.js` is auto-started by Playwright before tests run. Start it manually with `npm run test:ui-server` for interactive development.
- The mock `vscode` API writes every `postMessage` call to `window.__lastCommand` — assert on this to verify commands dispatched by the webview.
- Send messages to the webview with:
  ```js
  await page.evaluate(() =>
    window.dispatchEvent(new MessageEvent('message', { data: { command: '...', ... } }))
  );
  ```
- Trigger buttons that start at `opacity:0` (e.g. action toolbar buttons) using `element.dispatchEvent(new MouseEvent('click', ...))` inside `page.evaluate()` to avoid Playwright's actionability timeouts.
- Use `document.elementFromPoint(x, y)` assertions to verify CSS stacking/z-index correctness — not just presence in DOM, but visual dominance.

### Unit tests

- Use `@vscode/test-electron` / Mocha for extension host logic.
- Test HTML output of rendering functions, config service scanning, and architecture assertions.
- Do NOT try to click webview DOM elements from within the extension host test runner — use Playwright for that.

### What belongs where

| Concern | Playwright | Unit |
|---|---|---|
| Button dispatches correct command | ✓ | |
| Search filters the action list | ✓ | |
| Group collapse/expand toggles visibility | ✓ | |
| Menu panel is on top (z-index) | ✓ | |
| Config read/write round-trip | | ✓ |
| HTML rendering output | | ✓ |
| ConfigService scan methods | | ✓ |
