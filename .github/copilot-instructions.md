# Copilot instructions for `vscode-battlestation`

## Build, test, and lint

Core commands:

- `npm run build` - production build; runs `npm run check-types` first, then bundles the extension and webview assets with `esbuild.js`
- `npm run watch` - esbuild watch mode for the extension bundle, webview bundles, and `src/style.scss`
- `npm run check-types` - TypeScript only
- `npm run lint` - ESLint for `src/**/*.ts`
- `npm run test:unit` - VS Code extension-host tests from `src/test/suite/*.test.ts`, excluding tests marked `Manual`
- `npm run test:ui` - Playwright E2E suite in `tests/*.spec.ts`; `playwright.config.ts` auto-starts `npm run test:ui-server`
- `npm run test:ui-server` - generate standalone test pages and serve the webview harness at `http://localhost:3000`
- `npm run test:ui-headed` - headed Playwright run for UI debugging

For normal validation, this repo expects `npm run test:unit`, `npm run test:ui`, and `npm run build`.

Run a single test:

- Playwright file: `npx playwright test tests/main-view.spec.ts`
- Playwright test case: `npx playwright test tests/main-view.spec.ts -g "play button dispatches executeCommand"`
- Unit suite or test by title: `npm run test:unit -- --grep "ConfigService"`
- There are also a few focused unit scripts wired in `package.json`: `npm run test:settings`, `npm run test:actions`, `npm run test:drag`, `npm run test:groups`

## High-level architecture

- `src/extension.ts` is the composition root. It wires `ConfigService`, `ActionExecutionService`, `RunStatusService`, `WorkflowExecutionService`, `JobSchedulerService`, and `JobLogService` into the main Battlestation sidebar, the Jobs sidebar, the Workflow Builder panel, and the Job Admin panel.
- The UI is split in two layers. Files in `src/views/` render HTML shells and inject initial data; files in `src/webview/` contain the interactive Lit apps that own DOM state and react to `postMessage` updates. `renderMainView()` is only the shell; `src/webview/mainView.ts` is the real main UI.
- `esbuild.js` bundles `src/extension.ts` to `dist/extension.js`, browser entrypoints in `src/webview/` to `media/*.js`, compiles `src/style.scss` to `media/output.css`, and copies Codicon assets into `media/`. If you add a new interactive webview surface, you usually need changes in both `src/views/` and `src/webview/`, plus a new `esbuild.js` entrypoint.
- `ConfigService` is the source of truth for workspace state. The current config file is `.vscode/battle.json`, or `battle.json` inside a custom directory selected in settings. It auto-migrates older `battle.config` locations, normalizes missing IDs, stores backups in `.vscode/battle.history.jsonl`, and watches discovered manifests so generated actions can stay in sync.
- Workflows and jobs are layered on top of actions. Workflows reference action IDs and run sequentially through `WorkflowExecutionService`. Jobs are scheduled by `JobSchedulerService` with cron or interval timers, can target actions, workflows, or provider sync, and persist run logs under `.vscode/battle.jobs`.

## Key conventions

- Prefer `vscode.workspace.fs` and `vscode.Uri` for workspace files. The codebase avoids Node `fs` for extension data paths so the extension keeps working in remote and web contexts.
- Generated actions should carry `cwd` and `workspace`; do not encode folder changes inside the command string. `ActionExecutionService` uses `cwd` for terminal execution and for resolving ambiguous VS Code tasks in monorepos or multi-root workspaces.
- Keep action, workflow, step, and job IDs stable. Workflows and scheduled jobs refer to those IDs, and `ConfigService.createAutoConfig()` intentionally reuses existing action IDs by matching on workflow keys instead of recreating everything from scratch.
- Some docs and UI strings still say `battle.config`, but the implementation now reads and writes `battle.json`. When they disagree, trust `src/services/configService.ts` and `src/types.ts`.
- Long-running user-visible operations use `vscode.window.withProgress(...)` from the view/provider layer rather than swapping the whole webview to a custom loading screen.
- Last-run status is session-only. `RunStatusService` pushes status updates to the main webview, and the UI stores those dots by action name rather than persisting them in config.
- Main-view UI state such as collapsed groups, collapsed subgroups, and remembered search is stored in the webview with `vscode.getState()` / `vscode.setState()`, not in `battle.json`.
- UI automation is built around the standalone Playwright harness, not the VS Code webview iframe. The harness exposes `window.__lastCommand` for `postMessage` assertions, toolbar/menu buttons that start hidden often need synthetic `MouseEvent` clicks, and layering checks use `document.elementFromPoint(...)`.
- Workflow execution intentionally excludes `vscode` and `launch` actions. The eligibility rules live in `src/utils/workflows.ts`.
