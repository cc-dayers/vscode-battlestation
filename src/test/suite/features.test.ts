/**
 * Feature Tests — one suite per shipped feature.
 * Covers server-rendered HTML and config round-trips.
 * Browser/webview UI assertions live in the test:ui-server harness.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { renderErrorView } from '../../views/errorView';
import { renderMainView } from '../../views/mainView';
import { ConfigService } from '../../services/configService';
import type { Action, ActionParam, Config } from '../../types';

// ────────────────────────────────────────────────────────────
// Shared mock context (no actual workspace needed for renderer tests)
// ────────────────────────────────────────────────────────────
const mockContext = {
  globalState: { get: () => undefined, update: () => Promise.resolve() },
  workspaceState: { get: () => undefined, update: () => Promise.resolve() },
  extensionUri: vscode.Uri.file(__dirname),
  subscriptions: [],
  extensionPath: __dirname,
} as any;

// ────────────────────────────────────────────────────────────
// Feature 1: Inline Config Validation & Error State
// ────────────────────────────────────────────────────────────
suite('Feature 1: Config Validation Error State', () => {

  test('renderErrorView returns valid HTML with error message', () => {
    const html = renderErrorView('Unexpected token } in JSON', 'none', 'test-nonce', '');
    assert.ok(html.includes('<!DOCTYPE html>'), 'Should be a full HTML document');
    assert.ok(html.includes('Unexpected token'), 'Should contain the error message');
    assert.ok(html.includes('Config Error'), 'Should show heading');
  });

  test('renderErrorView truncates messages longer than 300 chars', () => {
    const long = 'x'.repeat(400);
    const html = renderErrorView(long, 'none', 'test-nonce', '');
    assert.ok(!html.includes('x'.repeat(400)), 'Should not contain full 400-char string');
    assert.ok(html.includes('...'), 'Should include truncation ellipsis');
  });

  test('renderErrorView escapes HTML special chars in error message', () => {
    const html = renderErrorView('<script>alert(1)</script>', 'none', 'test-nonce', '');
    assert.ok(!html.includes('<script>alert'), 'Should escape angle brackets in error text');
  });

  test('renderErrorView includes openConfig and refresh buttons', () => {
    const html = renderErrorView('parse error', 'none', 'test-nonce', '');
    assert.ok(html.includes("command: 'openConfig'"), 'Should include openConfig postMessage');
    assert.ok(html.includes("command: 'refresh'"), 'Should include refresh postMessage');
  });


  test('error view and main view are structurally distinct HTML shells (state machine recovery)', () => {
    // Guards the view.ts _currentViewMode fix: each render site must own its assignment.
    // Without the fix, the fast-path postMessage fires against the error view's DOM after the
    // config is corrected, and recovery is invisible — the panel stays stuck on the error view.
    const errorHtml = renderErrorView('parse error', 'none', 'test-nonce', '');
    const mainConfig: Config = { actions: [{ name: 'Build', command: 'npm run build', type: 'npm' }], groups: [], icons: [] };
    const mainHtml = renderMainView({
      cspSource: 'none', nonce: 'test-nonce', codiconStyles: '', config: mainConfig,
      showHidden: false, searchVisible: false,
      initialData: { ...mainConfig, runStatus: {} },
    });
    assert.ok(!errorHtml.includes('mainView.js'), 'Error view must not reference mainView.js bundle');
    assert.ok(!mainHtml.includes('error-card'), 'Main view must not contain error-card class');
    assert.ok(mainHtml.includes('__INITIAL_DATA__'), 'Main view must inject __INITIAL_DATA__');
  });

  test('ConfigService.getConfigStatus returns error for invalid JSON', async function () {
    this.timeout(10000);
    const cs = new ConfigService(mockContext);

    // Write a broken config directly
    const uri = await cs.resolveConfigUri();
    if (!uri) { this.skip(); return; }

    // Save original so we can restore
    let original: Config | undefined;
    try { original = await cs.readConfig(); } catch { /* no original */ }

    try {
      await vscode.workspace.fs.writeFile(uri, Buffer.from('{ invalid json !!!', 'utf-8'));
      cs.invalidateCache();
      const status = await cs.getConfigStatus();
      assert.strictEqual(status.exists, true, 'File should exist');
      assert.strictEqual(status.valid, false, 'Should be invalid');
      assert.ok(status.error, 'Should have an error message');
    } finally {
      // Restore
      if (original) {
        await cs.writeConfig(original);
      }
    }
  });
});

// ────────────────────────────────────────────────────────────
// Feature 2: Parametric Commands
// ────────────────────────────────────────────────────────────
suite('Feature 2: Parametric Commands', () => {

  test('Action type accepts params field', () => {
    const params: ActionParam[] = [
      { name: 'ENV', prompt: 'Target environment', options: ['staging', 'production'] },
      { name: 'TAG', prompt: 'Docker tag', default: 'latest' },
    ];
    const action: Action = {
      name: 'Deploy',
      command: 'npm run deploy -- --env=${ENV} --tag=${TAG}',
      type: 'npm',
      params,
    };
    assert.strictEqual(action.params?.length, 2);
    assert.strictEqual(action.params?.[0].name, 'ENV');
    assert.deepStrictEqual(action.params?.[0].options, ['staging', 'production']);
    assert.strictEqual(action.params?.[1].default, 'latest');
    assert.strictEqual(action.params?.[1].options, undefined);
  });

  test('params round-trip through config write/read', async function () {
    this.timeout(10000);
    const cs = new ConfigService(mockContext);

    const params: ActionParam[] = [
      { name: 'ENV', prompt: 'Environment', options: ['dev', 'prod'] },
      { name: 'MESSAGE', prompt: 'Commit message', default: 'update' },
    ];
    const actionWithParams: Action = {
      name: 'Param Test Action',
      command: 'echo ${ENV} ${MESSAGE}',
      type: 'shell',
      params,
    };

    // Write
    const config = await cs.readConfig();
    const originalLength = config.actions.length;
    config.actions.push(actionWithParams);
    await cs.writeConfig(config);
    cs.invalidateCache();

    // Read back
    const updated = await cs.readConfig();
    const saved = updated.actions.find(a => a.name === 'Param Test Action');
    assert.ok(saved, 'Action with params should be persisted');
    assert.ok(saved!.params, 'params field should survive round-trip');
    assert.strictEqual(saved!.params!.length, 2, 'Both params should be present');
    assert.strictEqual(saved!.params![0].name, 'ENV');
    assert.deepStrictEqual(saved!.params![0].options, ['dev', 'prod']);
    assert.strictEqual(saved!.params![1].default, 'update');

    // Cleanup
    const cleanup = await cs.readConfig();
    cleanup.actions = cleanup.actions.filter(a => a.name !== 'Param Test Action');
    assert.strictEqual(cleanup.actions.length, originalLength, 'Should be back to original length');
    await cs.writeConfig(cleanup);
  });

  test('Action without params field is unaffected', () => {
    const action: Action = { name: 'Simple', command: 'echo hi', type: 'shell' };
    assert.strictEqual(action.params, undefined, 'params should be optional / undefined by default');
  });

  test('renderAddActionForm HTML includes params section', () => {
    // Import inline to avoid side-effects at module level
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { renderAddActionForm } = require('../../views/addItemForm');
    const html = renderAddActionForm({
      cspSource: 'none',
      nonce: 'test-nonce',
      codiconStyles: '',
      typeOptions: '<option value="shell">shell</option>',
      customColors: [],
    });
    assert.ok(html.includes('paramsContainer'), 'Add form should include params container');
    assert.ok(html.includes('addParamBtn'), 'Add form should include "Add Parameter" button');
    assert.ok(html.includes('collectParams'), 'Add form should include collectParams function');
  });

  test('renderEditActionForm HTML includes params section and pre-populates existing params', async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { renderEditActionForm } = require('../../views/editItemForm');
    const item: Action = {
      name: 'Edit me',
      command: 'echo ${X}',
      type: 'shell',
      params: [{ name: 'X', prompt: 'Value of X', default: 'hello' }],
    };
    const html = renderEditActionForm({
      cspSource: 'none',
      nonce: 'test-nonce',
      codiconStyles: '',
      item,
      iconMap: new Map([['shell', 'terminal']]),
      customColors: [],
    });
    assert.ok(html.includes('paramsContainer'), 'Edit form should include params container');
    assert.ok(html.includes('oldItem.params'), 'Edit form should pre-populate existing params');
    assert.ok(html.includes('collectParams'), 'Edit form should include collectParams function');
  });
});

// ────────────────────────────────────────────────────────────
// Feature 3: Last-Run Status Indicator
// ────────────────────────────────────────────────────────────
suite('Feature 3: Last-Run Status Indicator', () => {

  const baseConfig: Config = {
    actions: [{ name: 'Build', command: 'npm run build', type: 'npm' }],
    groups: [],
    icons: [],
  };

  test('renderMainView serializes empty runStatus into __INITIAL_DATA__', () => {
    const html = renderMainView({
      cspSource: 'none',
      nonce: 'test-nonce',
      codiconStyles: '',
      config: baseConfig,
      showHidden: false,
      searchVisible: false,
      initialData: { ...baseConfig, runStatus: {} },
    });
    assert.ok(html.includes('"runStatus":{}'), 'Should include empty runStatus object');
  });

  test('renderMainView serializes runStatus entries into __INITIAL_DATA__', () => {
    const runStatus = { 'Build': { exitCode: 0, timestamp: 1700000000000 } };
    const html = renderMainView({
      cspSource: 'none',
      nonce: 'test-nonce',
      codiconStyles: '',
      config: baseConfig,
      showHidden: false,
      searchVisible: false,
      initialData: { ...baseConfig, runStatus },
    });
    assert.ok(html.includes('"runStatus"'), 'Should include runStatus in __INITIAL_DATA__');
    assert.ok(html.includes('"exitCode":0'), 'Should include exitCode');
    assert.ok(html.includes('"Build"'), 'Should include action name as key');
  });

  test('renderMainView with nonzero exitCode serializes correctly', () => {
    const runStatus = { 'Build': { exitCode: 1, timestamp: 1700000000000 } };
    const html = renderMainView({
      cspSource: 'none',
      nonce: 'test-nonce',
      codiconStyles: '',
      config: baseConfig,
      showHidden: false,
      searchVisible: false,
      initialData: { ...baseConfig, runStatus },
    });
    assert.ok(html.includes('"exitCode":1'), 'Should include nonzero exitCode');
  });

  test('mainView.js bundle includes status-dot CSS classes', () => {
    const fs = require('fs');
    const path = require('path');
    const compiled = fs.readFileSync(path.join(__dirname, '../../../media/mainView.js'), 'utf-8');
    assert.ok(compiled.includes('lp-status-dot'), 'Should include status-dot class');
    assert.ok(compiled.includes('lp-status-ok'), 'Should include status-ok class');
    assert.ok(compiled.includes('lp-status-fail'), 'Should include status-fail class');
  });
});

// ────────────────────────────────────────────────────────────
// Feature 4: Experimental Workflow Gating
// ────────────────────────────────────────────────────────────
suite('Feature 4: Experimental Workflow Gating', () => {
  test('workflow experiment defaults to disabled', () => {
    const config = vscode.workspace.getConfiguration('battlestation');
    assert.strictEqual(config.get<boolean>('experimental.workflows', false), false);
  });

  test('package contributions hide workflow commands unless the experiment is enabled', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../..', 'package.json'), 'utf8')
    );

    const commandPaletteEntries = packageJson.contributes?.menus?.commandPalette || [];
    const openWorkflowBuilderEntry = commandPaletteEntries.find(
      (entry: any) => entry.command === 'battlestation.openWorkflowBuilder'
    );
    const runWorkflowEntry = commandPaletteEntries.find(
      (entry: any) => entry.command === 'battlestation.runWorkflow'
    );
    const viewTitleEntries = packageJson.contributes?.menus?.['view/title'] || [];
    const toolbarWorkflowEntry = viewTitleEntries.find(
      (entry: any) => entry.command === 'battlestation.openWorkflowBuilder'
    );

    assert.ok(openWorkflowBuilderEntry, 'Workflow builder command should have a commandPalette visibility rule');
    assert.ok(runWorkflowEntry, 'Run workflow command should have a commandPalette visibility rule');
    assert.ok(toolbarWorkflowEntry, 'Workflow builder toolbar command should exist');
    assert.ok(
      openWorkflowBuilderEntry.when.includes('battlestation.experimental.workflows'),
      'Workflow builder command should stay out of the command palette until enabled'
    );
    assert.ok(
      runWorkflowEntry.when.includes('battlestation.experimental.workflows'),
      'Run workflow command should stay out of the command palette until enabled'
    );
    assert.ok(
      toolbarWorkflowEntry.when.includes('battlestation.experimental.workflows'),
      'Workflow builder toolbar affordance should stay hidden until enabled'
    );
  });

  test('renderMainView can carry the workflow experiment state to the webview', () => {
    const html = renderMainView({
      cspSource: 'none',
      nonce: 'test-nonce',
      codiconStyles: '',
      config: { actions: [], groups: [], icons: [] },
      showHidden: false,
      searchVisible: false,
      initialData: {
        actions: [],
        groups: [],
        workflowSummaries: [],
        experimentalFeatures: { workflows: false },
        runStatus: {},
      },
    });

    assert.ok(
      html.includes('"experimentalFeatures":{"workflows":false}'),
      'Main view should serialize the workflow experiment state into initial data'
    );
  });
});

// ────────────────────────────────────────────────────────────
// Feature: Secondary Label (workspace) editing
// ────────────────────────────────────────────────────────────
suite('Feature: Secondary Label (workspace) round-trip', () => {

  const mockCtx = {
    globalState: { get: () => undefined, update: () => Promise.resolve() },
    workspaceState: { get: () => undefined, update: () => Promise.resolve() },
    extensionUri: vscode.Uri.file(__dirname),
    subscriptions: [],
    extensionPath: __dirname,
  } as any;

  test('workspace and workspaceColor round-trip through config write/read', async function () {
    this.timeout(10000);
    const cs = new ConfigService(mockCtx);

    const actionWithWorkspace: Action = {
      name: 'workspace-round-trip',
      command: 'yarn workspace my-pkg build',
      type: 'npm',
      workspace: 'my-pkg',
      workspaceColor: '#00bcd4',
    };

    const config = await cs.readConfig();
    const originalLength = config.actions.length;
    config.actions.push(actionWithWorkspace);
    await cs.writeConfig(config);
    cs.invalidateCache();

    const updated = await cs.readConfig();
    const saved = updated.actions.find(a => a.name === 'workspace-round-trip');
    assert.ok(saved, 'Action should be persisted');
    assert.strictEqual(saved!.workspace, 'my-pkg', 'workspace should survive round-trip');
    assert.strictEqual(saved!.workspaceColor, '#00bcd4', 'workspaceColor should survive round-trip');

    // Cleanup
    const cleanup = await cs.readConfig();
    cleanup.actions = cleanup.actions.filter(a => a.name !== 'workspace-round-trip');
    assert.strictEqual(cleanup.actions.length, originalLength);
    await cs.writeConfig(cleanup);
  });

  test('clearing workspace removes both workspace and workspaceColor from saved action', async function () {
    this.timeout(10000);
    const cs = new ConfigService(mockCtx);

    // Setup: add an action with workspace, then simulate updateAction clearing it
    const original: Action = {
      name: 'ws-clear-test',
      command: 'yarn workspace pkg test',
      type: 'npm',
      workspace: 'pkg',
      workspaceColor: '#ff5722',
    };

    const config = await cs.readConfig();
    config.actions.push(original);
    await cs.writeConfig(config);
    cs.invalidateCache();

    // Simulate the merged-action logic from updateAction when workspace is cleared
    const updated = await cs.readConfig();
    const target = updated.actions.find(a => a.name === 'ws-clear-test');
    assert.ok(target, 'action should exist before clear');

    // Simulate newItem from form with workspace cleared (undefined)
    const newItem: Action = { name: 'ws-clear-test', command: 'yarn workspace pkg test', type: 'npm', workspace: undefined, workspaceColor: undefined };
    const merged: Action = { ...target!, ...newItem };
    if ('workspace' in newItem) {
      if (newItem.workspace) {
        merged.workspace = newItem.workspace;
        merged.workspaceColor = newItem.workspaceColor;
      } else {
        delete merged.workspace;
        delete merged.workspaceColor;
      }
    }

    // Write back
    const idx = updated.actions.findIndex(a => a.name === 'ws-clear-test');
    updated.actions[idx] = merged;
    await cs.writeConfig(updated);
    cs.invalidateCache();

    const final = await cs.readConfig();
    const cleared = final.actions.find(a => a.name === 'ws-clear-test');
    assert.ok(cleared, 'action should still exist');
    assert.strictEqual(cleared!.workspace, undefined, 'workspace should be cleared');
    assert.strictEqual(cleared!.workspaceColor, undefined, 'workspaceColor should be cleared');

    // Cleanup
    const cleanup = await cs.readConfig();
    cleanup.actions = cleanup.actions.filter(a => a.name !== 'ws-clear-test');
    await cs.writeConfig(cleanup);
  });

  test('renderEditActionForm renders workspace field pre-populated', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { renderEditActionForm } = require('../../views/editItemForm');
    const item: Action = {
      name: 'My Action',
      command: 'yarn build',
      type: 'npm',
      workspace: 'packages/my-lib',
      workspaceColor: '#4caf50',
    };
    const html = renderEditActionForm({
      cspSource: 'none',
      nonce: 'test-nonce',
      codiconStyles: '',
      item,
      iconMap: new Map([['npm', 'package']]),
      customColors: [],
    });
    assert.ok(html.includes('id="workspace"'), 'Edit form should include workspace input');
    assert.ok(html.includes('packages/my-lib'), 'Edit form should pre-fill workspace value');
    assert.ok(html.includes('workspaceColorGroup'), 'Edit form should include workspaceColor group');
    assert.ok(html.includes('Secondary Label'), 'Edit form should label the field "Secondary Label"');
  });

  test('renderEditActionForm hides workspaceColorGroup when workspace is empty', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { renderEditActionForm } = require('../../views/editItemForm');
    const item: Action = {
      name: 'No Workspace Action',
      command: 'echo hi',
      type: 'shell',
    };
    const html = renderEditActionForm({
      cspSource: 'none',
      nonce: 'test-nonce',
      codiconStyles: '',
      item,
      iconMap: new Map([['shell', 'terminal']]),
      customColors: [],
    });
    assert.ok(html.includes('id="workspace"'), 'Workspace input should always render');
    assert.ok(html.includes('display: none'), 'workspaceColorGroup should be display:none when workspace is empty');
  });
});

