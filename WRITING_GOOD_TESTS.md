# Writing Good Tests - Guidelines

## The Problem with the Original Manual Tests

### ❌ BAD: Tests That Always Pass
```typescript
test('Manual test', async function () {
    console.log('Click the Cancel button...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    assert.ok(true, 'Manual test completed'); // ALWAYS PASSES!
});
```

**Why this is terrible:**
- ✅ Shows as "passing" even when the feature is completely broken
- 📝 It's just documentation disguised as a test
- 🚫 Provides zero verification
- 😞 Gives false confidence that everything works

### ✅ GOOD: Tests That Verify and Fail

```typescript
test('Manual: Cancel button verification', async function () {
    // 1. Set up the test scenario
    await vscode.commands.executeCommand('battlestation.openSettings');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2. Provide clear instructions
    console.log('Click the Cancel button in the settings panel');
    console.log('It should return you to the main view');
    
    // 3. PROMPT THE USER FOR CONFIRMATION
    const cancelWorks = await vscode.window.showQuickPick(
        ['✅ Yes - Cancel button worked', '❌ No - Cancel button did NOT work'],
        { 
            placeHolder: 'Did the Cancel button return you to the main view?',
            ignoreFocusOut: true 
        }
    );
    
    // 4. FAIL THE TEST IF IT DIDN'T WORK
    if (!cancelWorks || cancelWorks.startsWith('❌')) {
        assert.fail('Cancel button does not work - test FAILED');
    }
    
    console.log('✅ Cancel button verification PASSED');
});
```

**Why this is better:**
- ✅ Test **FAILS** when the feature is broken
- 🔍 User must actively confirm the feature works
- 📊 Test results accurately reflect reality
- 🎯 Forces fixing broken features before release

## Core Principles for Good Tests

### 1. **Tests Must Be Able to Fail**
If a test can never fail, it's not a test—it's documentation.

**Bad:**
```typescript
assert.ok(true, 'Test completed');  // Meaningless
```

**Good:**
```typescript
assert.strictEqual(config.actions.length, 3, 'Should have 3 actions');
assert.ok(cancelWorks, 'Cancel button must work');
```

### 2. **Separate Automated vs Manual Tests**

**Automated Tests** - Fast, reliable, no human interaction:
```typescript
test('Config should save actions', async function () {
    const config = { actions: [{ name: 'Test', command: 'echo test', type: 'shell' }] };
    await configService.writeConfig(config);
    const readBack = await configService.readConfig();
    assert.strictEqual(readBack.actions[0].name, 'Test');
});
```

**Manual Tests** - Interactive verification with user confirmation:
```typescript
test('Manual: Settings Save button', async function () {
    await openSettingsPanel();
    const result = await vscode.window.showQuickPick([
        '✅ Yes - Save worked',
        '❌ No - Save broken'
    ], { placeHolder: 'Did Save button work?', ignoreFocusOut: true });
    
    if (!result || result.startsWith('❌')) {
        assert.fail('Save button broken - test FAILED');
    }
});
```

### 3. **Manual Tests Must Prompt for Verification**

Don't just show instructions and wait—**ask the user** if it worked:

**Bad:**
```typescript
console.log('Drag an item...');
await new Promise(resolve => setTimeout(resolve, 10000));
// No verification! Test always passes!
```

**Good:**
```typescript
console.log('Drag an item and watch for blue line indicator');
const dragWorked = await vscode.window.showQuickPick(
    ['✅ Yes - Blue line appeared', '❌ No - No visual feedback'],
    { placeHolder: 'Did drag show blue line?', ignoreFocusOut: true }
);
if (!dragWorked || dragWorked.startsWith('❌')) {
    assert.fail('Drag visual feedback missing - FAILED');
}
```

### 4. **Test One Thing at a Time**

Break complex workflows into smaller verification steps:

**Bad:**
```typescript
test('Test everything', async function () {
    // Open panel, test drag, test groups, test settings...
    // If something fails, you don't know what
});
```

**Good:**
```typescript
test('Manual: Drag visual feedback', async function () {
    // Just test drag visual feedback
    const result = await promptUserVerification('Did blue line appear?');
    assert.ok(result, 'Drag visual feedback failed');
});

test('Manual: Drag persistence', async function () {
    // Test that order persists
    const result = await promptUserVerification('Did order persist after refresh?');
    assert.ok(result, 'Drag persistence failed');
});
```

### 5. **Use Descriptive Failure Messages**

When a test fails, the message should tell you **exactly** what's broken:

**Bad:**
```typescript
assert.ok(result, 'Test failed');  // Useless
```

**Good:**
```typescript
assert.fail('Cancel button does not work - test FAILED');
assert.fail('Drag visual feedback (blue line) not appearing - test FAILED');
assert.fail('Group collapse state not persisting after refresh - test FAILED');
```

## Test Strategy for VS Code Extensions

### What You CAN Automate ✅
- Extension activation
- Command registration and execution
- Config file I/O operations
- Message passing between extension and webview
- VS Code settings API interactions
- Template/HTML generation
- Error handling logic

### What You MUST Verify Manually ⚠️
- Webview button clicks
- Form input interactions
- Visual styling (colors, icons, opacity)
- Drag & drop UX (cursor offset, visual feedback)
- Animations and transitions
- Hover effects

### The Two-Tier Strategy

**Tier 1: Automated Tests (CI/CD)**
```bash
npm run test:unit
```
- Run on every commit
- Fast (15-20 seconds)
- No human interaction
- Tests extension logic

**Tier 2: Manual Verification Tests (Pre-Release)**
```bash
npm run test:ui
```
- Run before releasing
- Interactive (user must respond)
- Tests actual UI behavior
- **FAILS if user reports issues**

## Template for Manual Tests

```typescript
test('Manual: [Feature Name]', async function () {
    this.timeout(60000);  // Give enough time

    console.log('\n=== MANUAL [FEATURE] VERIFICATION ===');
    
    // 1. Set up the scenario
    console.log('1. Setting up...');
    await vscode.commands.executeCommand('someCommand');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Provide clear instructions
    console.log('2. Test [specific interaction]:');
    console.log('   → [Exact steps to follow]');
    console.log('   → [What should happen]');

    // 3. Prompt for verification
    const featureWorks = await vscode.window.showQuickPick(
        [
            '✅ Yes - [Feature] worked as expected',
            '❌ No - [Feature] did NOT work'
        ],
        { 
            placeHolder: 'Did [feature] work correctly?',
            ignoreFocusOut: true  // Don't dismiss when focus lost
        }
    );

    // 4. Fail if broken
    if (!featureWorks || featureWorks.startsWith('❌')) {
        assert.fail('[Feature] does not work - test FAILED');
    }

    console.log('✅ [Feature] verification PASSED');
    console.log('===================\n');
});
```

## Running and Interpreting Tests

### Expected Behavior

**Automated Tests:**
```
✔ Config should save actions (150ms)
✔ Settings should persist (200ms)
25 passing (12s)
```

**Manual Tests (Interactive):**
```
=== MANUAL CANCEL BUTTON VERIFICATION ===
1. Opening settings panel...
2. Click the Cancel button...

[VS Code Quick Pick Appears]
Options: 
  ✅ Yes - Cancel button worked
  ❌ No - Cancel button did NOT work

User selects: ❌ No

AssertionError: Cancel button does not work - test FAILED
```

### When Tests Fail

**Automated Test Failure:**
```
1) Config should save actions
   Expected 3 actions but got 0
   
→ Fix the code, re-run tests
```

**Manual Test Failure:**
```
AssertionError: Cancel button does not work - test FAILED

→ Investigation needed:
  1. Check console logs for [SettingsView] and [ViewProvider] messages
  2. Debug message passing
  3. Check for JavaScript errors
  4. Verify event handlers attached
```

## Anti-Patterns to Avoid

### ❌ Don't: Mock What You Should Test
```typescript
// BAD: Mocking the thing you're trying to verify
const mockButton = { clicked: true };
assert.ok(mockButton.clicked);  // Meaningless
```

### ❌ Don't: Sleep Instead of Verify
```typescript
// BAD: Just waiting and hoping
await new Promise(resolve => setTimeout(resolve, 10000));
assert.ok(true);  // Did nothing get verified
```

### ❌ Don't: Test Implementation Details
```typescript
// BAD: Testing how it works, not if it works
assert.ok(webview._internal.state.showing);  // Brittle, meaningless
```

### ❌ Don't: Write Tests That Can't Fail
```typescript
// BAD: Always passes
test('Something works', async () => {
    doSomething();
    assert.ok(true);  // This test is worthless
});
```

## Summary: Key Takeaways

1. **Tests must be able to fail** - If it always passes, it's not a test
2. **Manual tests must prompt for confirmation** - Use `showQuickPick` to ask the user
3. **Fail with descriptive messages** - Say exactly what's broken
4. **One verification per test** - Don't test everything at once
5. **Separate automated from manual** - Different purposes, different commands
6. **Run manual tests before release** - They catch UI bugs automation can't

## Updated Test Commands

```bash
# Run all automated tests (CI/CD)
npm run test:unit

# Run all manual verification tests (Pre-release)
npm run test:ui

# Run specific manual test
npm run test:settings:manual  # Just settings panel verification
```

**The Bottom Line:** A test suite with 100% passing tests is worthless if the features are broken. Good tests **fail when things are broken** and **pass when things work**. Manual tests must actively verify with user input, not just display instructions.

---

## The AI Method: Standalone Visual Test Harness

Whenever possible, and specifically when acting autonomously through LLM agents (like Claude or Copilot), **bypassing manual prompts entirely** is preferred for validating UI features. 

We have established a local Node server that mocks the VS Code API and serves the compiled Webview interfaces dynamically. Tools like `browser_subagent` can interact with it physically, creating a 100% automated visual verification loop.

### How to Use the UI Test Harness

1. Spin up the server:
   ```bash
   npm run test:ui-server
   ```
2. Command the agent to open the browser subagent at `http://localhost:3000`.
3. Give strict instructions to click buttons and verify `COMMAND SENT:` toast logs appear on the screen!

**All UI components MUST be tested this way during development before committing fixes or merging features.**
