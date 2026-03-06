# Battlestation — Improvement Plan

> **For AI agents**: Each feature is a self-contained section. Work top-to-bottom within a section.
> Each section states: what exists today, exactly what to build, which files to touch, and acceptance criteria.
> Never modify compiled output in `media/` directly — always edit TypeScript source and run `npm run build`.
> Run `npm run check-types` after every TypeScript change to verify correctness.
> Use `npm run test:ui-server` (localhost:3000) to visually verify webview changes.

---

## Performance Mandate

**Performance is a first-class constraint, not an afterthought. Every feature must comply.**

### Hard Rules — Never Violate These

- **Zero new npm dependencies** unless the alternative is >50 lines of custom code AND the package is tiny (<5KB minified+gzipped). Check bundle impact with `esbuild --analyze` before adding anything.
- **No full webview reload for partial updates.** If only data changes (e.g. a status dot updates), send a targeted `postMessage` to the webview instead of re-rendering the entire HTML shell. Full HTML replacement (`webview.html = ...`) is only acceptable when the entire view structure changes (switching between main view and a form).
- **No synchronous file I/O.** All file operations go through `vscode.workspace.fs` (async). Never use Node's synchronous `fs.*Sync` methods.
- **No blocking the extension host main thread.** Expensive work (tool detection, file scanning) must use `child_process.execFile` with a timeout, never `execSync`.
- **Cap all buffers.** Any feature that accumulates data (output capture, history reads) must enforce a hard upper limit and discard excess. Document the limit inline.
- **Debounce UI-triggered refreshes.** The existing 100ms debounce in `refresh()` must be preserved. Do not add new direct calls to `refresh()` in hot paths (e.g. inside loops or event listeners that fire frequently).

### Bundle Size Rules

- The main webview bundles (`media/mainView.js`, `media/settingsView.js`) are built by esbuild with tree-shaking. Keep new client-side code in files that esbuild can tree-shake — avoid side-effectful module-level code.
- New utility files added to `src/webviews/` are included in the webview bundle. Keep them lean. No classes where a function will do. No abstractions for single use cases.
- New utility files added to `src/` (extension host side) are included in `dist/extension.js`. Same rules apply.
- After implementing all features, run `npm run build` and check that `dist/extension.js` and `media/mainView.js` have not grown by more than ~15KB each. If they have, profile and trim.

### Rendering Performance Rules

- **Lit reactive properties over full re-render.** When updating existing Lit components, prefer updating a `@property()` or `@state()` field rather than reconstructing the component or its template from scratch.
- **Avoid layout thrash.** Do not read and write DOM layout properties (offsetHeight, getBoundingClientRect) in the same synchronous frame.
- **CSS over JS for animations.** Use CSS transitions/animations, not JS `setInterval`/`requestAnimationFrame`, for visual state changes (e.g. status dot appearing).
- **`content-visibility: auto`** on scrollable list containers to skip rendering off-screen action cards. Add this to the main action list CSS if the list can grow large.

### Network / Process Rules

- **Tool detection commands must run in parallel** (via `Promise.all`), not sequentially. Each must have a 3-second timeout. Total detection time must not exceed ~3.5 seconds wall clock.
- **Child process output must be capped** at 64KB before the process exits. Use `stream.destroy()` to kill stdout/stderr once the cap is hit.
- **Never spawn a child process on every keystroke or scroll event.** Child process spawning is only permitted in response to explicit user actions (button click, command execution).

---

## Dependency Map

```
Feature 1 (Config Validation)      — no deps, do first
Feature 2 (Parametric Commands)    — no deps
Feature 3 (Last-Run Status)        — no deps
Feature 4 (Config History UI)      — no deps
Feature 5 (Command Output)         — no deps
Feature 6 (Fuzzy Search)           — no deps
Feature 7 (Command Chaining)       — depends on Feature 2 (Action schema extended)
Feature 8 (Per-Workspace Settings) — no deps
Feature 9 (Action Keybindings)     — no deps
Feature 10 (Smart Tool Detection)  — no deps
```

Work on Features 1–6, 8–10 in any order or in parallel.
Feature 7 must come after Feature 2.

---

## Key Architecture Facts

- **Extension host** (TypeScript): `src/extension.ts`, `src/view.ts`, `src/types.ts`, `src/services/`
- **Webview UI** (Lit web components): `src/webviews/` (source), compiled to `media/mainView.js` and `media/settingsView.js`
- **View HTML shells** (string templates): `src/views/` — these inject `window.__INITIAL_DATA__` into the webview
- **Config file**: `.vscode/battle.config` (JSON), schema defined in `src/types.ts → Config`
- **Message bus**: webview → host via `vscode.postMessage()`; host → webview via `webview.postMessage()`
- **Message router**: `src/view.ts → handleMessage()`
- **Config read/write**: always go through `ConfigService` in `src/services/configService.ts`
- **Build**: `npm run build` (production), `npm run watch` (dev)

---

## Feature 1 — Inline Config Validation & Error State

### Current State
When `battle.config` contains invalid JSON or a schema violation, the panel renders empty with no explanation. Users have no way to know what is wrong or how to fix it.

### Goal
Show a clear, actionable error state in the panel when the config fails to load, including the parse error message and a button to open the config file.

### Performance Notes
- The error view is a tiny static HTML string — no JS bundle change needed, no Lit component.
- Do not trigger a new file read to show the error; reuse the error already captured in the failed `readConfig()` call.
- No polling or retry loop. Error clears only when the user explicitly refreshes or the FileSystemWatcher detects a file change.

### Implementation Steps

**1. Extend ConfigService to surface parse errors**

File: `src/services/configService.ts`

- Change `readConfig()` return type from `Promise<Config | undefined>` to `Promise<{ config: Config } | { error: string } | undefined>`.
- Wrap JSON.parse in a try/catch; on failure return `{ error: e.message }` instead of returning undefined.
- Callers that destructure the result need to be updated (see step 2).

**2. Update view.ts to pass error state to webview**

File: `src/view.ts`

- In `refresh()`, after calling `configService.readConfig()`, check if result has an `error` key.
- If error: call `renderErrorView(errorMessage)` instead of `renderMainView()`.
- Set the webview HTML to the error view output. This is a full HTML replacement — acceptable because the view structure is genuinely different.

**3. Create error view renderer**

File: `src/views/errorView.ts` (new file)

```typescript
export function renderErrorView(error: string, nonce: string, codiconCss: string): string
```

- Use the existing `layout()` template from `src/templates/layout.ts`.
- Render a centered card with:
  - Icon: `$(error)` codicon
  - Heading: "Config Error"
  - Code block showing the raw error string (truncated to 300 chars — enforce in the renderer, not the caller)
  - Primary button: "Open battle.config" — posts `{ command: 'openConfigFile' }`
  - Secondary button: "Refresh" — posts `{ command: 'refresh' }`
- **No JavaScript bundle needed.** Use inline `onclick="acquireVsCodeApi().postMessage(...)"` pattern consistent with other simple views in this codebase. Do not import Lit for this view.

**4. Handle openConfigFile message**

File: `src/view.ts → handleMessage()`

- Add case `'openConfigFile'`: call `vscode.window.showTextDocument(configService.getConfigUri())`.
- `configService.getConfigUri()` already exists as a private helper; make it public.

**5. Export new view**

File: `src/views/index.ts` — add `renderErrorView` to exports.

### Files Changed
- `src/services/configService.ts`
- `src/view.ts`
- `src/views/errorView.ts` (new)
- `src/views/index.ts`

### Acceptance Criteria
- [x] Manually break `battle.config` with invalid JSON → panel shows error card with parse message
- [x] "Open battle.config" button opens the file in the editor
- [x] Fix the JSON → file watcher triggers → panel shows actions normally (no manual refresh needed)
- [x] Error view adds zero bytes to `media/mainView.js` (it is server-rendered HTML only)
- [x] `npm run check-types` passes

---

## Feature 2 — Parametric Commands (Input Prompts)

### Current State
Commands are static strings. Users cannot pass runtime arguments to a command without editing the config file.

### Goal
Actions can declare named input variables. When executed, VS Code's `showInputBox` (or `showQuickPick` for enum vars) prompts the user for each variable before the command runs. Variables are interpolated into the command string.

### Syntax
In `battle.config`, an action may include a `params` array:

```json
{
  "name": "Deploy to env",
  "command": "npm run deploy -- --env=${ENV} --tag=${TAG}",
  "type": "npm",
  "params": [
    { "name": "ENV", "prompt": "Target environment", "options": ["staging", "production"] },
    { "name": "TAG", "prompt": "Docker image tag", "default": "latest" }
  ]
}
```

- If `options` is present → `showQuickPick`
- If `options` is absent → `showInputBox` with optional `default`
- Variables are interpolated with simple `String.prototype.replaceAll`: `${VAR_NAME}` → user input

### Performance Notes
- Param resolution happens entirely on the extension host, zero webview round-trips.
- `showInputBox` and `showQuickPick` are native VS Code UI — no bundle cost.
- The `params` array is stored in config and passed to the webview as part of `window.__INITIAL_DATA__`. This adds a small amount of JSON to the initial data payload. For typical param counts (<10 per action) this is negligible.
- Do not add a param validation library. Simple length/existence checks inline are sufficient.

### Implementation Steps

**1. Extend the Action type**

File: `src/types.ts`

```typescript
export interface ActionParam {
  name: string;       // Variable name used in command string, e.g. "ENV"
  prompt: string;     // Label shown in VS Code input box
  default?: string;   // Pre-filled default value
  options?: string[]; // If present, show QuickPick instead of InputBox
}

// Add to Action interface:
params?: ActionParam[];
```

**2. Implement param resolution in executeCommand**

File: `src/view.ts → executeCommand()`

- Before executing, check if `action.params` is non-empty.
- For each param in order:
  - If `param.options` exists: `await vscode.window.showQuickPick(param.options, { title: param.prompt })`
  - Else: `await vscode.window.showInputBox({ prompt: param.prompt, value: param.default })`
  - If user cancels (returns `undefined`), abort immediately — no terminal opened, no error message.
- After all params collected, interpolate:
  ```typescript
  let cmd = action.command;
  for (const [param, value] of resolvedParams) {
    cmd = cmd.replaceAll('${' + param.name + '}', value);
  }
  ```
- Pass interpolated `cmd` to the existing terminal execution path.

**3. Expose params in Add/Edit Action forms**

File: `src/views/addItemForm.ts` and `src/views/editItemForm.ts`

- Add a "Parameters" section rendered as a simple HTML table (no Lit needed — these are server-rendered forms).
- Each existing param row: Name input, Prompt input, Default input, Options input (comma-separated string), Remove button.
- "Add parameter" button: appends a new empty row via a small inline `<script>` block (no framework — keep it under 20 lines of vanilla JS).
- Serialize params on form submit: collect rows into JSON array, include in submitted message as `params` field.
- When editing, pre-populate rows from `action.params` passed via `window.__INITIAL_DATA__`.

**4. Update message handlers**

File: `src/view.ts → handleMessage()`

- `submitNewAction` and `submitEditAction` already pass `message.item` through to config write.
- `Action` now includes `params?` — no structural changes needed. Verify the form sends the `params` field.

### Files Changed
- `src/types.ts`
- `src/view.ts`
- `src/views/addItemForm.ts`
- `src/views/editItemForm.ts`

### Acceptance Criteria
- [ ] Action with no `params` executes exactly as before (zero regression)
- [ ] Action with `params` shows input prompts in sequence before running
- [ ] Cancelling any prompt aborts execution (no terminal opened)
- [ ] `options` param shows QuickPick; param without options shows InputBox
- [ ] Add/Edit forms show and persist params configuration
- [ ] `media/mainView.js` bundle size does not increase (params UI is server-rendered HTML)
- [ ] `npm run check-types` passes

---

## Feature 3 — Last-Run Status Indicator

### Current State
After running a command, the panel gives no feedback. Users must switch to the terminal to check if it succeeded.

### Goal
Each action button shows a small status dot (success/failure) and a timestamp from its last execution. Status persists for the session (in-memory only — never written to disk).

### Design
- Status dot: 8px circle, absolutely positioned top-right of each action card.
- Colors: `--vscode-testing-iconPassed` (green) for exit 0, `--vscode-testing-iconFailed` (red) for non-zero, no dot for never run.
- Tooltip on hover: "Last run: 2m ago — Exit 0" or "Last run: 5s ago — Exit 1"
- Status dots update via targeted `postMessage` — **no full HTML refresh**.

### Performance Notes
- **Critical**: Do NOT call `refresh()` when a terminal closes. That replaces the entire webview HTML and causes a visible flash. Instead, send a targeted `postMessage({ command: 'statusUpdate', name, exitCode, timestamp })` and let the Lit component update a single reactive property.
- The `runStatus` map lives on the extension host. It is also serialized into `window.__INITIAL_DATA__` on full refreshes so dots persist across soft refreshes.
- Timestamp formatting (`"2m ago"`) is computed client-side in the Lit component — no round-trip needed.
- `onDidCloseTerminal` fires once per terminal close — register and dispose the listener correctly to avoid listener accumulation.

### Implementation Steps

**1. Add in-memory run-status store to view.ts**

File: `src/view.ts`

```typescript
// In class BattlestationViewProvider:
private runStatus = new Map<string, { exitCode: number; timestamp: number }>();
// Key: action.name — assumed unique within a config
```

**2. Capture exit code and send targeted postMessage**

File: `src/view.ts → executeCommand()`

- Create a named terminal: `vscode.window.createTerminal({ name: action.name })`.
- Register a one-time listener on `vscode.window.onDidCloseTerminal`:
  ```typescript
  const disposable = vscode.window.onDidCloseTerminal(t => {
    if (t !== terminal) { return; }
    disposable.dispose();
    const exitCode = t.exitStatus?.code ?? -1;
    this.runStatus.set(action.name, { exitCode, timestamp: Date.now() });
    // Targeted update — NO refresh() call
    void this.view?.webview.postMessage({
      command: 'statusUpdate',
      name: action.name,
      exitCode,
      timestamp: Date.now(),
    });
  });
  this.disposables.push(disposable);
  ```

**3. Pass run status in initial data**

File: `src/views/mainView.ts`

- Add `runStatus: Record<string, { exitCode: number; timestamp: number }>` to the params of `renderMainView()`.
- Include it in `window.__INITIAL_DATA__` serialization.

File: `src/view.ts → refresh()`

- Pass `Object.fromEntries(this.runStatus)` when calling `renderMainView()`.

**4. Render and reactively update status dot in Lit action card**

In the Lit action card component (`src/webviews/`):

- Add a `@state() runStatus` property initialized from `window.__INITIAL_DATA__.runStatus`.
- Listen for `window.addEventListener('message', ...)` at the top-level component; on `statusUpdate`, update `this.runStatus` map and trigger re-render.
- Render dot in action card template:
  ```html
  <span class="status-dot ${cls}" title="${tooltip}"></span>
  ```
- CSS only — no JS animation. Use `transition: background-color 0.2s ease` for color change.
- `cls`: `status-ok` (exit 0) | `status-fail` (exit ≠ 0) — no dot rendered if no entry in map.
- `tooltip`: computed in a getter — format relative time using simple arithmetic (no date library).

### Files Changed
- `src/view.ts`
- `src/views/mainView.ts`
- Lit action card component in `src/webviews/`

### Acceptance Criteria
- [ ] No status dot shown for actions never run
- [ ] Green dot appears after terminal closes with exit 0 — no panel flash/reload
- [ ] Red dot appears after terminal closes with exit ≠ 0
- [ ] Tooltip shows relative time and exit code
- [ ] Full panel refresh (e.g. user clicks Refresh button) preserves dots for completed actions
- [ ] Multiple terminals closing in quick succession do not cause multiple refresh cycles
- [ ] `npm run check-types` passes

---

## Feature 4 — Config History UI

### Current State
Config history is saved as `.vscode/battle.history.jsonl` on every write, but there is no UI to view or browse it. Restore is only accessible via a hidden quick-pick modal.

### Goal
Add a "History" button to the panel title bar that opens a history list inside the panel. The list shows saved snapshots with timestamps, labels, and a "Restore" button per entry.

### Performance Notes
- History file can grow indefinitely. **Cap reads at the last 50 entries** — read the file, split lines, take the last 50, discard the rest. Do not load the entire file into memory if it is large.
- The history view is server-rendered HTML (no Lit bundle cost). Keep it that way — it's a read-only list.
- Do not re-read the history file on every render. Read once when the user opens the history view, cache in a local variable for the duration of that view session. Cache is invalidated when the user navigates away.
- History entries contain full config snapshots which can be large. Only send entry metadata (timestamp, label, action count) to the webview — not the full config objects. Fetch the specific config only when "Restore" is clicked.

### Implementation Steps

**1. Register a new VS Code command**

File: `src/extension.ts`

- Register command `battlestation.openHistory`.
- Command handler calls `viewProvider.showHistory()` (new public method).

**2. Add command to package.json**

File: `package.json`

```json
{
  "command": "battlestation.openHistory",
  "title": "Battlestation: Config History",
  "icon": "$(history)"
}
```

Add to `menus → view/title`:
```json
{
  "command": "battlestation.openHistory",
  "when": "view == battlestation.view && battlestation.hasConfig",
  "group": "navigation@3"
}
```

**3. Add showHistory() to view.ts**

File: `src/view.ts`

```typescript
public async showHistory(): Promise<void> {
  this.showingForm = "history"; // add "history" to FormState union type
  await this.refresh();
}
```

**4. Add getHistory() to ConfigService — with 50-entry cap**

File: `src/services/configService.ts`

```typescript
export interface HistoryMeta {
  timestamp: number;
  label: string;
  actionCount: number;
}

public async getHistory(): Promise<HistoryMeta[]>
```

- Read `.vscode/battle.history.jsonl` via `vscode.workspace.fs.readFile`.
- Split by newline. Take **last 50 lines** only (slice from end). Parse each line as JSON.
- For each entry, return only `{ timestamp, label, actionCount: entry.config.actions.length }`.
- Skip blank lines and malformed JSON lines silently.
- Return `[]` if file doesn't exist.

**5. Create history view renderer**

File: `src/views/historyView.ts` (new file)

```typescript
export function renderHistoryView(
  entries: HistoryMeta[],
  nonce: string,
  codiconCss: string
): string
```

- Use existing `layout()` template.
- Header: "Config History" with a back `←` button posting `{ command: 'cancelForm' }`.
- Entries shown newest-first (reverse the array).
- Per entry row: formatted date, label, "N actions", Restore button posting `{ command: 'restoreHistoryEntry', timestamp: entry.timestamp }`.
- Empty state: simple `<p>No history yet.</p>`.
- No JavaScript framework — pure HTML string. Keep the inline script to <15 lines if needed at all.

**6. Handle restoreHistoryEntry — fetch full entry on demand**

File: `src/services/configService.ts` — add:

```typescript
public async getHistoryEntryByTimestamp(timestamp: number): Promise<Config | undefined>
```

- Re-read the JSONL file (or read last 50 lines again).
- Find the line whose parsed `timestamp` matches.
- Return `entry.config` or `undefined` if not found.

File: `src/view.ts → handleMessage()`

- Add case `'restoreHistoryEntry'`:
  - Call `configService.getHistoryEntryByTimestamp(message.timestamp)`.
  - If found: call existing restore logic with that config. Navigate back to main view.
  - If not found: show error toast "History entry not found."

**7. Update refresh() routing**

File: `src/view.ts → refresh()`

- Add branch: `if (this.showingForm === 'history')` → fetch history meta, call `renderHistoryView()`.

### Files Changed
- `src/extension.ts`
- `src/view.ts`
- `src/views/historyView.ts` (new)
- `src/views/index.ts`
- `src/services/configService.ts`
- `package.json`

### Acceptance Criteria
- [ ] History button appears in panel title bar when config exists
- [ ] Clicking it renders the history list (newest first)
- [ ] Each entry shows formatted timestamp, label, and action count
- [ ] At most 50 entries shown regardless of history file size
- [ ] "Restore" button restores that snapshot and returns to main view
- [ ] Empty state shown when no history exists
- [ ] Back button returns to main view
- [ ] History view adds zero bytes to `media/mainView.js`
- [ ] `npm run check-types` passes

---

## Feature 5 — Inline Command Output Panel

### Current State
All command output goes to a VS Code terminal. Users must switch focus away from the panel to see results.

### Goal
Add an optional inline output area at the bottom of the Battlestation panel that captures and displays stdout/stderr from the last-run command. Opt-in via a VS Code setting. Only applies to `shell` and `npm` type commands.

### Performance Notes
- **Output is capped at 64KB.** Once the cap is hit, stop accumulating and append a truncation notice. Use `stream.destroy()` to stop reading from stdout/stderr.
- **Stream in chunks — never buffer full output before rendering.** Send `postMessage({ command: 'outputChunk', chunk })` as each chunk arrives. The webview appends to the `<pre>` incrementally.
- **ANSI stripping is done on the extension host**, not the webview — avoids sending garbage characters over the message bridge.
- The output `<pre>` uses `overflow-y: auto; max-height: 200px` — CSS scroll, not a virtualized list. 64KB of text in a `<pre>` is well within browser rendering limits.
- `child_process.spawn` is used only when the setting is enabled. When the setting is off, the existing terminal code path is completely unchanged.

### Implementation Steps

**1. Add VS Code setting**

File: `package.json → contributes.configuration.properties`

```json
"battlestation.display.showInlineOutput": {
  "type": "boolean",
  "default": false,
  "description": "Show command output inline in the Battlestation panel (shell and npm types only)"
}
```

**2. ANSI stripping utility**

File: `src/utils/stripAnsi.ts` (new)

```typescript
// Covers SGR, cursor movement, and erase sequences — no external dep
const ANSI_PATTERN = /\x1B\[[0-9;]*[A-Za-z]|\x1B\][^\x07]*\x07/g;
export function stripAnsi(str: string): string {
  return str.replace(ANSI_PATTERN, '');
}
```

**3. Streaming spawn in executeCommand**

File: `src/view.ts → executeCommand()`

```typescript
import { spawn } from 'child_process';
import { stripAnsi } from './utils/stripAnsi';

const MAX_OUTPUT_BYTES = 64 * 1024; // 64KB
```

- When `showInlineOutput` is true AND `action.type` is `'shell'` or `'npm'`:
  - Spawn the command (same command string as currently sent to terminal).
  - Accumulate byte count. On each `stdout`/`stderr` `'data'` event:
    - Strip ANSI from the chunk string.
    - If `accumulatedBytes + chunk.length > MAX_OUTPUT_BYTES`: truncate chunk to fit, post final chunk + `'\n[output truncated]'`, call `proc.stdout.destroy()` and `proc.stderr.destroy()`.
    - Else: post `{ command: 'outputChunk', chunk: strippedChunk }` via `this.view?.webview.postMessage(...)`.
  - On process `'close'` event: post `{ command: 'outputDone', exitCode }`.
  - Update `this.runStatus` on close (same as Feature 3).
- When `showInlineOutput` is false OR type is not shell/npm: use existing terminal code path unchanged.

**4. Render streaming output panel in Lit main view**

In the Lit main view component (`src/webviews/`):

- Add `@state() outputLines: string = ''` and `@state() outputVisible: boolean`.
- `outputVisible` is true when `showInlineOutput` setting is true.
- Message listener additions:
  - `'outputChunk'`: append chunk to `this.outputLines`
  - `'outputDone'`: update exit code display
- Template addition at bottom of main view:
  ```html
  ${this.outputVisible ? html`
    <div class="output-panel">
      <div class="output-header">
        <span>${this.outputActionName}</span>
        <span class="exit-badge ${this.exitCode === 0 ? 'ok' : 'fail'}">Exit ${this.exitCode}</span>
        <button @click=${this.clearOutput}>✕</button>
      </div>
      <pre class="output-body">${this.outputLines}</pre>
    </div>
  ` : nothing}
  ```
- CSS: `output-panel` has `border-top: 1px solid var(--vscode-panel-border); max-height: 200px`. `output-body` has `overflow-y: auto; white-space: pre-wrap; word-break: break-all; font-family: var(--vscode-editor-font-family); font-size: 12px`.

### Files Changed
- `package.json`
- `src/view.ts`
- `src/utils/stripAnsi.ts` (new)
- Lit main view component in `src/webviews/`

### Acceptance Criteria
- [ ] Setting off (default) → zero change to existing terminal behavior
- [ ] Setting on → shell/npm commands stream output into panel in real time
- [ ] Output stops accumulating at 64KB; truncation notice appended
- [ ] ANSI codes stripped — no garbage characters visible
- [ ] Exit code badge shown green (0) or red (non-zero)
- [ ] Dismiss button clears output panel
- [ ] vscode/task/launch types still open terminal (no regression)
- [ ] `npm run check-types` passes

---

## Feature 6 — Fuzzy Search

### Current State
Search filters actions by exact substring match on the action name. Typos or partial words yield no results.

### Goal
Replace substring match with fuzzy/ranked matching. Actions whose names closely match the query score higher and appear first. Matched characters are highlighted.

### Performance Notes
- **No external fuzzy library.** The implementation must be a single pure function, <40 lines, with no imports.
- **Filter and sort only on input change**, not on every render. Use Lit's `@state()` + computed getter pattern — calculate filtered+sorted results once per query change, not on every property update.
- **Debounce the search input** at 80ms to avoid running the scorer on every keystroke. Use a simple `setTimeout`/`clearTimeout` — no lodash, no rxjs.
- The scorer runs on the extension-host-provided action list already in memory (`window.__INITIAL_DATA__`). No IPC needed.
- For configs with <500 actions (the realistic ceiling), the O(n·m) scorer is fast enough to run synchronously on the main thread without a Web Worker.

### Implementation Steps

**1. Implement fuzzy scorer — zero dependencies**

File: `src/webviews/utils/fuzzy.ts` (new)

```typescript
/**
 * Returns { score, indices } if query fuzzy-matches target, null otherwise.
 * score > 0 means match. Higher = better.
 * indices: positions in `target` where query chars were matched (for highlight).
 */
export function fuzzyMatch(
  query: string,
  target: string
): { score: number; indices: number[] } | null {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  const indices: number[] = [];
  let ti = 0, score = 0, consecutive = 0;

  for (let qi = 0; qi < q.length; qi++) {
    let found = false;
    while (ti < t.length) {
      if (t[ti] === q[qi]) {
        score += 10 + consecutive * 5;         // consecutive bonus
        if (ti === 0 || t[ti - 1] === ' ') score += 15; // word-start bonus
        consecutive++;
        indices.push(ti++);
        found = true;
        break;
      }
      consecutive = 0;
      ti++;
    }
    if (!found) { return null; }
  }

  if (t.startsWith(q)) { score += 50; } // exact prefix bonus
  return { score, indices };
}
```

**2. Replace filter logic in Lit search component**

In the search/filter logic of the Lit component (`src/webviews/`):

- Replace `action.name.toLowerCase().includes(query)` with `fuzzyMatch(query, action.name)`.
- Sort matching results by score descending.
- Store match indices alongside each result for highlight rendering.
- Debounce: wrap the filter call with 80ms debounce using `clearTimeout`/`setTimeout`.

**3. Highlight matched characters**

In the action card name rendering, when search is active and indices are present:

```typescript
function highlight(text: string, indices: number[]): TemplateResult {
  const set = new Set(indices);
  return html`${[...text].map((ch, i) =>
    set.has(i) ? html`<mark>${ch}</mark>` : ch
  )}`;
}
```

CSS: `mark { background: transparent; color: var(--vscode-list-highlightForeground); font-weight: bold; }` — matches VS Code's own search highlight style.

**4. Also score against type and command fields**

Compute scores for `action.type` and `action.command`, weight them:
```typescript
const nameMatch  = fuzzyMatch(query, action.name);
const typeMatch  = fuzzyMatch(query, action.type);
const cmdMatch   = fuzzyMatch(query, action.command);
const total = (nameMatch?.score ?? 0) * 3
            + (typeMatch?.score ?? 0)
            + (cmdMatch?.score  ?? 0);
```

Only show the action if `total > 0`. Use `nameMatch?.indices` for highlighting (name is primary).

### Files Changed
- `src/webviews/utils/fuzzy.ts` (new)
- Lit main view search component in `src/webviews/`

### Acceptance Criteria
- [ ] Typing "bld" matches "Build" action
- [ ] Results sorted by relevance (exact prefix first)
- [ ] Matched characters highlighted using VS Code highlight color
- [ ] Empty query shows all actions (existing behavior preserved)
- [ ] No external package added to `package.json`
- [ ] Search debounced — no visible lag while typing
- [ ] `npm run check-types` passes

---

## Feature 7 — Command Chaining / Sequences

> **Depends on Feature 2** (Action schema extended with `params`). Complete Feature 2 first.

### Current State
No way to run multiple actions in sequence from a single button.

### Goal
A new action type `"sequence"` references other actions by name and runs them in order. Each shell/npm step awaits completion before the next starts. vscode/task/launch steps fire and continue.

### Config Example

```json
{
  "name": "Full Deploy",
  "type": "sequence",
  "command": "",
  "steps": ["Build App", "Run Tests", "Deploy to staging"]
}
```

### Performance Notes
- Sequence execution is entirely on the extension host — no webview round-trips during execution.
- Shell/npm steps in a sequence use `child_process.spawn` (wrapped in a Promise) for awaitable execution. This is the same infrastructure built in Feature 5. If Feature 5 is done first, reuse `spawnAsync()` helper. If not, implement it here and note that Feature 5 should reuse it.
- Do not open a separate terminal per step. Open one terminal, send steps sequentially using `&&` chaining if all steps are shell/npm. If the sequence mixes types, open a terminal only for shell/npm steps and use VS Code APIs for others.
- The step list in the action card subtitle is computed from config data already in memory — no extra IPC.

### Implementation Steps

**1. Add `spawnAsync` helper (or reuse from Feature 5)**

File: `src/utils/spawnAsync.ts` (new, or already exists from Feature 5)

```typescript
import { spawn, SpawnOptions } from 'child_process';

export function spawnAsync(
  cmd: string,
  args: string[],
  opts: SpawnOptions
): Promise<{ exitCode: number }> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, opts);
    proc.on('close', (code) => resolve({ exitCode: code ?? 1 }));
    proc.on('error', () => resolve({ exitCode: 1 }));
  });
}
```

**2. Extend types**

File: `src/types.ts`

```typescript
// Add to Action interface:
steps?: string[]; // type "sequence" only: ordered list of action names to run
```

**3. Implement sequence execution in executeCommand**

File: `src/view.ts → executeCommand()`

- Add top-level guard: `if (action.type === 'sequence')` → call `executeSequence(action, config)`.

New private method `executeSequence(action: Action, config: Config)`:
- Resolve each step name to an Action from config. If any name is missing, show error toast listing the missing name(s) and abort.
- For each resolved step action:
  - If type is `shell` or `npm`: `await spawnAsync(...)`. If exit code ≠ 0, show error notification `"Sequence stopped: '${step.name}' failed (exit ${code})"` and return.
  - If type is `vscode`/`task`/`launch`: execute via existing path (fire and continue).
- On completion of all steps: show info toast `"Sequence complete: ${action.name}"`.

**4. Add sequence type to action forms**

File: `src/views/addItemForm.ts` and `src/views/editItemForm.ts`

- When type dropdown changes to `"sequence"`, swap the Command input for a Steps section.
- Steps section: a `<select multiple>` populated from `window.__INITIAL_DATA__.config.actions` names (filtered to exclude the current action and other sequences to prevent cycles).
- On submit: serialize selected option values as the `steps` array.

**5. Add sequence icon to defaultIcons**

File: `src/view.ts`

```typescript
{ type: "sequence", icon: "list-ordered" }
```

**6. Display step count in action card**

In Lit action card: when `action.type === 'sequence'` and `action.steps`:
```html
<span class="step-count">${action.steps.length} steps: ${action.steps.join(', ')}</span>
```
CSS: `font-size: 11px; color: var(--vscode-descriptionForeground);`

### Files Changed
- `src/types.ts`
- `src/view.ts`
- `src/utils/spawnAsync.ts` (new, or reuse from Feature 5)
- `src/views/addItemForm.ts`
- `src/views/editItemForm.ts`
- Lit action card component in `src/webviews/`

### Acceptance Criteria
- [ ] Sequence action runs steps in declared order
- [ ] Step failure stops the sequence with a clear notification naming the failed step
- [ ] Missing step name validated before execution starts — aborts with error toast
- [ ] vscode/task/launch steps in a sequence fire and do not block the next step
- [ ] Add/Edit form shows step picker when type is "sequence", hides command input
- [ ] Sequence action card shows step count and step names
- [ ] `npm run check-types` passes

---

## Feature 8 — Per-Workspace Display Settings

### Current State
All `battlestation.display.*` settings are VS Code workspace settings that apply globally. Users cannot have different display configs per project.

### Goal
Allow display settings to be overridden in `battle.config` under a `display` key. Config-level settings take precedence field-by-field over VS Code settings.

### Config Example

```json
{
  "actions": [...],
  "display": {
    "showIcon": true,
    "showType": false,
    "showCommand": false
  }
}
```

### Performance Notes
- This is a pure data merge on the extension host — zero runtime cost.
- The merged settings object is already passed to `renderMainView()`. This feature only changes where the values come from, not the data flow.
- No additional file reads — `config.display` is read as part of the existing `readConfig()` call.

### Implementation Steps

**1. Add display override to Config type**

File: `src/types.ts`

```typescript
export interface DisplayOverrides {
  showIcon?: boolean;
  showType?: boolean;
  showCommand?: boolean;
  showGroup?: boolean;
}

// Add to Config interface:
display?: DisplayOverrides;
```

**2. Merge settings in view.ts**

File: `src/view.ts`

In the method that reads VS Code configuration and builds the settings object passed to `renderMainView()`:

```typescript
const vsSettings = vscode.workspace.getConfiguration('battlestation.display');
const merged = {
  showIcon:    config.display?.showIcon    ?? vsSettings.get<boolean>('showIcon', false),
  showType:    config.display?.showType    ?? vsSettings.get<boolean>('showType', true),
  showCommand: config.display?.showCommand ?? vsSettings.get<boolean>('showCommand', true),
  showGroup:   config.display?.showGroup   ?? vsSettings.get<boolean>('showGroup', true),
};
```

Pass `merged` as the settings argument to `renderMainView()`.

**3. Surface in Settings view**

File: `src/views/settingsView.ts` (or wherever settings panel intro text lives)

Add a short note: `"Display settings can also be overridden per-project via the <code>display</code> key in battle.config."`

### Files Changed
- `src/types.ts`
- `src/view.ts`
- `src/views/settingsView.ts`

### Acceptance Criteria
- [ ] Config with no `display` key → VS Code settings apply (zero regression)
- [ ] `display.showIcon: true` in config → icons shown even if VS Code setting is false
- [ ] Partial overrides work (only the keys present in `display` override, others use VS Code settings)
- [ ] No additional file reads triggered by this feature
- [ ] `npm run check-types` passes

---

## Feature 9 — Action Keybindings

### Current State
No way to trigger a specific action via keyboard shortcut without clicking the panel.

### Goal
Actions can declare an optional `keybinding` field. The extension registers a dynamic VS Code command (`battlestation.action.<slug>`) per such action at config load time. The action card shows a "Copy command ID" button so users can wire it into their own `keybindings.json`.

> **Constraint**: VS Code does not support programmatic runtime keybinding registration. The extension registers the _command_ dynamically; the user binds the key once via VS Code's keybindings UI. This is the same pattern used by multi-cursor and snippet extensions.

### Performance Notes
- Command registration is O(n) where n = actions with `keybinding` set. Typically <10. Negligible cost.
- Dispose old commands before registering new ones on every config reload. Use a `Map<string, vscode.Disposable>` keyed by slug to track and diff efficiently.
- The slug function must be pure and deterministic: same name always produces same slug. Use `name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')`.
- Do not write any files (no `.vscode/` file changes) — file writes introduce I/O cost and git noise.

### Implementation Steps

**1. Add keybinding field to Action type**

File: `src/types.ts`

```typescript
// Add to Action interface:
keybinding?: string; // User-declared keybinding hint, e.g. "ctrl+shift+b"
```

**2. Add slugify utility**

File: `src/utils/slugify.ts` (new)

```typescript
export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
```

**3. Implement syncActionCommands in view.ts**

File: `src/view.ts`

```typescript
private actionCommands = new Map<string, vscode.Disposable>();

private syncActionCommands(actions: Action[]): void {
  const newSlugs = new Set(
    actions.filter(a => a.keybinding).map(a => slugify(a.name))
  );

  // Dispose commands no longer in config
  for (const [slug, disposable] of this.actionCommands) {
    if (!newSlugs.has(slug)) {
      disposable.dispose();
      this.actionCommands.delete(slug);
    }
  }

  // Register new commands
  for (const action of actions) {
    if (!action.keybinding) { continue; }
    const slug = slugify(action.name);
    if (this.actionCommands.has(slug)) { continue; } // already registered
    const disposable = vscode.commands.registerCommand(
      `battlestation.action.${slug}`,
      () => void this.executeCommand(action)
    );
    this.actionCommands.set(slug, disposable);
    this.disposables.push(disposable);
  }
}
```

Call `syncActionCommands(config.actions)` after each successful `readConfig()` in `refresh()`.

**4. Add keybinding field to Add/Edit Action forms**

File: `src/views/addItemForm.ts` and `src/views/editItemForm.ts`

- Add optional "Keybinding (hint)" text input below the Type field.
- Placeholder: `e.g. ctrl+shift+b`
- Small help text: "Sets a command ID you can bind in VS Code's keybindings.json."
- Include in submitted `item` object as `keybinding`.

**5. Display command ID badge on action card**

In Lit action card component: when `action.keybinding` is set:

```html
<div class="keybinding-row">
  <kbd>${action.keybinding}</kbd>
  <button class="copy-btn" @click=${() => this.copyCommandId(action.name)}
    title="Copy command ID">$(copy)</button>
</div>
```

`copyCommandId`: posts `{ command: 'copyToClipboard', text: 'battlestation.action.' + slugify(action.name) }`.

File: `src/view.ts → handleMessage()`:
- Add case `'copyToClipboard'`: `vscode.env.clipboard.writeText(message.text)` then show brief toast "Copied!".

### Files Changed
- `src/types.ts`
- `src/view.ts`
- `src/utils/slugify.ts` (new)
- `src/views/addItemForm.ts`
- `src/views/editItemForm.ts`
- Lit action card component in `src/webviews/`

### Acceptance Criteria
- [ ] Action with `keybinding` set → `battlestation.action.<slug>` command registered and callable from Command Palette
- [ ] Executing the command runs the action correctly
- [ ] Action card shows `<kbd>ctrl+shift+b</kbd>` badge when keybinding is set
- [ ] "Copy command ID" copies `battlestation.action.<slug>` to clipboard with toast confirmation
- [ ] Removing `keybinding` from config → command unregistered on next config load
- [ ] No `.vscode/` files written
- [ ] `npm run check-types` passes

---

## Feature 10 — Smart Tool Detection (Command-Based)

### Current State
`ToolDetectionService` detects tools by file existence only (e.g., `Dockerfile` → Docker available). Produces false positives when files exist but tools aren't installed.

### Goal
Add parallel, timeout-bounded command-based detection as a secondary pass. Show confirmed tool versions in the Generate Config wizard.

### Performance Notes
- **All tool checks must run in parallel** via `Promise.all`. Total wall-clock time must not exceed ~3.5 seconds. Each individual check has a 3-second timeout.
- Use `child_process.execFile` (not `exec`) — avoids shell spawning overhead and is safer against argument injection.
- **Parse only the first line of output** — do not buffer the entire stdout. Destroy the stdout stream immediately after reading the first newline.
- Tool detection only runs when the user opens the Generate Config wizard or clicks "Redetect". It does NOT run on extension activation or config load.
- Cache detection results for the duration of the Generate Config session. If the user clicks "Redetect", clear the cache and re-run.

### Implementation Steps

**1. Define version commands and add detectToolVersions()**

File: `src/services/toolDetectionService.ts`

```typescript
import { execFile } from 'child_process';

const VERSION_COMMANDS: Array<{ tool: string; bin: string; args: string[] }> = [
  { tool: 'docker',  bin: 'docker',  args: ['--version'] },
  { tool: 'python',  bin: 'python',  args: ['--version'] },
  { tool: 'node',    bin: 'node',    args: ['--version'] },
  { tool: 'go',      bin: 'go',      args: ['version']   },
  { tool: 'rust',    bin: 'rustc',   args: ['--version'] },
  { tool: 'git',     bin: 'git',     args: ['--version'] },
];

// Parse first semver-like token from a version string
function parseVersion(output: string): string | null {
  const match = output.match(/\d+\.\d+[\.\d]*/);
  return match ? match[0] : null;
}

function checkToolVersion(bin: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    const proc = execFile(bin, args, { timeout: 3000 }, (err, stdout) => {
      if (err) { resolve(null); return; }
      resolve(parseVersion(stdout.split('\n')[0]));
    });
    // Ensure process is killed on timeout
    proc.on('error', () => resolve(null));
  });
}

public async detectToolVersions(): Promise<Record<string, string | null>> {
  const results = await Promise.all(
    VERSION_COMMANDS.map(({ tool, bin, args }) =>
      checkToolVersion(bin, args).then(v => [tool, v] as const)
    )
  );
  return Object.fromEntries(results);
}
```

**2. Run detection in parallel with file-based detection**

File: `src/view.ts → handleShowGenerateConfig()`

```typescript
const [filePresence, versions] = await Promise.all([
  this.toolDetectionService.detectToolPresence(), // existing method
  this.toolDetectionService.detectToolVersions(), // new
]);

const detectedTools: Record<string, { present: boolean; version?: string }> = {};
for (const tool of Object.keys(filePresence)) {
  detectedTools[tool] = {
    present: filePresence[tool],
    version: versions[tool] ?? undefined,
  };
}
```

Pass `detectedTools` to `renderGenerateConfigView()`.

**3. Display versions in Generate Config view**

File: `src/views/generateConfigView.ts`

For each tool chip/card:
- `present: true, version: "24.0.7"` → show "Docker 24.0.7" with checkmark
- `present: true, version: null` → show "Docker (not in PATH)" with warning icon `$(warning)`
- `present: false` → do not show (same as before)

**4. Redetect refreshes both detection passes**

`handleRedetectTools` already calls `handleShowGenerateConfig`. Since `handleShowGenerateConfig` now runs both passes in parallel, no additional change needed.

### Files Changed
- `src/services/toolDetectionService.ts`
- `src/view.ts`
- `src/views/generateConfigView.ts`

### Acceptance Criteria
- [ ] Generate Config wizard shows version string next to each confirmed tool (e.g. "Node 20.11.0")
- [ ] Tool with file but without CLI shows warning indicator, not checkmark
- [ ] All tool checks run in parallel — total detection time <3.5 seconds
- [ ] Individual check timeout is 3 seconds — hung process does not block UI
- [ ] "Redetect" re-runs both file-based and command-based detection
- [ ] Tool detection does NOT run on extension activation
- [ ] `npm run check-types` passes

---

## Build & Perf Verification Checklist (Run After All Features)

```bash
npm run check-types     # 0 errors required
npm run lint            # 0 warnings required
npm run build           # dist/ and media/ build clean

# Bundle size check — compare to baseline before starting work:
# media/mainView.js   baseline: ~95KB   target: <110KB
# media/settingsView.js baseline: ~88KB  target: <95KB
# dist/extension.js  check for unexpected growth

npm run test:ui-server  # Visual check at localhost:3000
# F5 → Extension Development Host for full E2E smoke test
```

### Regression Smoke Test
After all features, verify these existing behaviors are unchanged:

- [ ] Opening panel with no config → Generate Config wizard shown
- [ ] Drag and drop reordering still works
- [ ] Group collapse/expand still works
- [ ] Hide/show hidden actions still works
- [ ] Existing shell/npm/vscode/task/launch commands still execute correctly
- [ ] Config file watcher still triggers refresh on external file edit

## Version Bump

After all features are implemented and verified:

```bash
npm run release:minor   # Bumps 0.1.4 → 0.2.0
```

Create `CHANGELOG.md` documenting all 10 features under `## [0.2.0]`.
