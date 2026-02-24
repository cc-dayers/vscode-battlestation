# Test Suite Documentation

## Overview

The test suite is divided into **unit tests** (testing individual functions/services) and **UI integration tests** (testing the actual webview interactions).

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only (Fast)
```bash
npm run test:unit
```

### UI Integration Tests (Manual Verification)
```bash
npm run test:ui
```

### Specific Test Suites
```bash
npm run test:settings    # Settings panel tests
npm run test:actions     # Action interaction tests
npm run test:drag        # Drag & drop tests
npm run test:groups      # Group management tests
```

## Test Categories

### Unit Tests ✅

These test the underlying services without opening the webview UI:

1. **configService.test.ts**
   - Config file reading/writing
   - NPM script scanning
   - Task detection
   - Launch config detection

2. **uiRenderer.test.ts**
   - HTML generation for main view
   - Initial data injection
   - Script/CSS URI handling

3. **settings.test.ts**
   - Settings view HTML generation
   - State injection

4. **colorRules.test.ts**
   - Color rule application
   - Workspace color assignment
   - Auto-color functionality

5. **configLifecycle.test.ts**
   - Config creation
   - Config deletion
   - Config regeneration
   - History tracking

6. **settingsPanel.test.ts**
   - VS Code configuration API
   - Settings persistence
   - Race condition prevention

7. **welcomeView.test.ts**
   - Welcome screen display logic
   - Config detection

### UI Integration Tests 🎯

These tests open the actual extension UI and require manual verification:

1. **settingsPanelUI.test.ts**
   - Opening settings panel
   - Cancel button functionality
   - Save Settings button functionality
   - **Manual Test**: 10-second window to test buttons

2. **actionUI.test.ts**
   - Opening panel and displaying actions
   - Toggle hidden items visibility
   - Search functionality
   - Add action flow
   - **Manual Test**: 45-second comprehensive workflow

3. **dragAndGroupUI.test.ts**
   - Drag and drop reordering
   - Action order persistence
   - Search interaction with drag handles
   - Group display and collapsing
   - Group editing
   - Action assignment to groups
   - **Manual Tests**: Drag & drop + Group management

## Why Manual Tests?

VS Code's webview architecture uses an isolated iframe that we cannot programmatically interact with from tests (no DOM access, no click simulation). Therefore, UI integration tests:

1. ✅ **Setup the state** (create configs, open panels)
2. ✅ **Verify commands work** (check that clicking toolbar buttons triggers the right code)
3. 🎯 **Require manual verification** (human clicks buttons and observes behavior)

### How Manual Tests Work

Manual tests:
- Open the extension UI
- Wait 5-45 seconds
- Print instructions to the console
- Allow you to interact with the UI
- Pass automatically (they're for observation, not assertion)

**To see manual tests in action:**
```bash
npm run test:ui
```

Then watch the test console for instructions on what to verify.

## Debug Console Messages

When running manual tests, open **DevTools Console** (`Help > Toggle Developer Tools`) to see:

```
[SettingsView] Save button clicked
[SettingsView] Saving settings...
[SettingsView] Save message sent
[ViewProvider] Received saveSettings message
[ViewProvider] saveSettings called, showingForm before: settings
[ViewProvider] showingForm set to false
[ViewProvider] All settings updated, calling refresh
```

These messages help diagnose where the message flow breaks if buttons don't work.

## Test Coverage

### Covered ✅
- Config file operations (create, read, write, delete)
- NPM/task/launch detection
- Settings persistence
- Color rules
- Config history
- HTML rendering
- Welcome view logic

### Requires Manual Verification 🎯
- **Settings panel buttons** (Cancel/Save)
- **Action execution** (clicking play button)
- **Add/edit action forms** (form submission)
- **Hide/show actions** (eye icon)
- **Drag and drop reordering** (grip handle interaction)
- **Search filtering** (typing in search box)
- **Group management** (collapse, edit, assign)

## Standalone Visual UI Testing (The AI Way)

To completely bypass the limitations of VS Code's webview test isolation and the need for manual clicking, we have built a **Standalone Visual UI Test Harness**. 

Instead of writing tests that wait for a user to click buttons `settingsPanelUI.test.ts`, you should verify all UI changes *agentically* by launching the views in a real browser context.

### Using the UI Test Harness
1. Start the local UI Server:
   ```bash
   node scripts/serve-ui.js
   ```
2. This runs a server at `http://localhost:3000` which serves the HTML/CSS/JS exactly as the extension does, but injects a mock `window.acquireVsCodeApi()` that renders `postMessage` calls as visible screen toasts.
3. Use your **browser subagent** tool to navigate to the localhost URL and physically click elements, read DOM states, and verify that actions behave appropriately!
4. **All UI modifications must be visually verified using this test harness before completion.**

## Continuous Integration

For CI/CD pipelines, run only the unit tests:
```bash
npm run test:unit
```

Manual UI tests should be run:
- Before releases
- After UI changes
- When fixing reported bugs
- During code reviews

## Test File Organization

```
src/test/suite/
├── configService.test.ts          # Unit: Config operations
├── colorRules.test.ts             # Unit: Color assignment
├── configLifecycle.test.ts        # Unit: Config lifecycle
├── settings.test.ts               # Unit: Settings HTML rendering
├── settingsPanel.test.ts          # Unit: Settings API
├── uiRenderer.test.ts             # Unit: Main view rendering
├── welcomeView.test.ts            # Integration: Welcome screen
├── settingsPanelUI.test.ts        # Manual: Settings panel UI
├── actionUI.test.ts               # Manual: Action interactions
└── dragAndGroupUI.test.ts         # Manual: Drag/drop & groups
```

## Writing New Tests

### Unit Test Template
```typescript
import * as assert from 'assert';
import { YourService } from '../../services/yourService';

suite('Your Feature Test Suite', () => {
    test('Should do something', async () => {
        const result = await yourService.doSomething();
        assert.strictEqual(result, expectedValue);
    });
});
```

### Manual UI Test Template
```typescript
test('Manual: Test feature X', async function () {
    this.timeout(30000);
    
    console.log('\\n=== MANUAL TEST: Feature X ===');
    await vscode.commands.executeCommand('battlestation.open');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Instructions for tester...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    assert.ok(true, 'Manual test completed');
});
```
