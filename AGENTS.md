# AGENTS Directive

As an AI agent working on this project, you MUST strictly adhere to the following directives:

## 1. You Are Not Done Until Tests Pass

**CRITICAL DIRECTIVE**: In order for ANY item to be considered done, ALL tests (both unit and UI) HAVE to pass. Do not hand off any task until all tests pass with zero failures.

Every new feature and every bug fix requires **both** a unit/integration test **and** a Playwright E2E test before the task is considered complete. This is a hard requirement — do not hand off without them.

- **Unit tests** → `src/test/suite/*.test.ts` — run with `npm run test:unit`
- **Playwright E2E tests** → `tests/*.spec.ts` — run with `npm run test:ui`

Both suites must pass with zero failures before you claim the task is done.

## 2. Test Real User Interactions in Playwright

Do not assert on mocked DOM state. Use Playwright to simulate what a real user does:

- Click buttons by dispatching `MouseEvent` (use `dispatchEvent` for `opacity:0` triggers, `page.mouse.click(x, y)` for real coordinate tests).
- Verify `postMessage` command dispatches via `window.__lastCommand` (set by the mock vscode API in `serve-ui.js`).
- Use `document.elementFromPoint` to verify z-index stacking — not just that an element exists, but that it is actually on top.
- Assert that elements are visible, contain the right text, and are in the right position.

## 3. Check Your Work Before Claiming Completion

Before marking a task done:

1. Run `npm run test:ui` → all Playwright specs must pass.
2. Run `npm run test:unit` → all Mocha specs must pass.
3. Run `npm run build` → TypeScript must compile clean.

If any of the above fail, the task is not done. Fix the failures, then verify again.

## 4. Write Retroactive Tests for Existing Features

When you encounter untested existing functionality, add tests for it proactively — don't leave gaps. Use the following guide:

| Feature                                 | Test type  | Where                            |
| --------------------------------------- | ---------- | -------------------------------- |
| Config read/write round-trips           | Unit       | `src/test/suite/`                |
| HTML rendering output                   | Unit       | `src/test/suite/`                |
| Play button dispatches `executeCommand` | Playwright | `tests/main-view.spec.ts`        |
| Search filters actions                  | Playwright | `tests/main-view.spec.ts`        |
| Group collapse/expand                   | Playwright | `tests/main-view.spec.ts`        |
| Hide/show action                        | Playwright | `tests/main-view.spec.ts`        |
| Menu stacking / z-index                 | Playwright | `tests/menu-layering.spec.ts`    |
| Status indicator dots                   | Playwright | `tests/status-indicator.spec.ts` |

## 5. Aggressively Auto-Run Non-Destructive Commands
When running terminal commands, YOU MUST aggressively set \SafeToAutoRun: true\ for ALL non-destructive commands.
The user is relying on you to completely bypass the permission prompts for regular development workflows. Examples of commands that MUST auto-run:
- npm run build
- npm run test:ui
- npm run test:unit
- Get-Content, ls, git status, git diff
Only leave \SafeToAutoRun: false\ for potentially dangerous commands such as file deletion, dangerous git resets, or installing global packages.

