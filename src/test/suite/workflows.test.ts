import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConfigService } from '../../services/configService';
import { WorkflowExecutionService } from '../../services/workflowExecutionService';
import { buildWorkflowSummaries } from '../../utils/workflows';
import type { Action, Config } from '../../types';

const mockContext = {
  globalState: { get: () => undefined, update: () => Promise.resolve() },
  workspaceState: { get: () => undefined, update: () => Promise.resolve() },
  extensionUri: vscode.Uri.file(__dirname),
  subscriptions: [],
  extensionPath: __dirname,
} as any;

suite('Workflow Features', () => {
  test('readConfig backfills missing action ids and preserves workflows', async function () {
    this.timeout(10000);
    const cs = new ConfigService(mockContext);
    const uri = await cs.resolveConfigUri();
    assert.ok(uri, 'Expected a resolved config URI');

    const original = await cs.readConfig();
    try {
      const rawConfig = {
        actions: [
          { id: 'legacy-build', name: 'Build', command: 'npm run build', type: 'npm' },
          { name: 'Test', command: 'npm test', type: 'npm' },
        ],
        workflows: [
          {
            id: 'workflow-release',
            name: 'Release',
            steps: [{ id: 'step-build', actionId: 'legacy-build' }],
          },
        ],
      };

      await vscode.workspace.fs.writeFile(uri!, Buffer.from(JSON.stringify(rawConfig, null, 2), 'utf-8'));
      cs.invalidateCache();

      const config = await cs.readConfig();
      assert.strictEqual(config.actions[0].id, 'legacy-build');
      assert.ok(config.actions[1].id, 'Expected readConfig to backfill a missing action id');
      assert.strictEqual(config.workflows?.[0].name, 'Release');
      assert.strictEqual(config.workflows?.[0].steps[0].actionId, 'legacy-build');
    } finally {
      await cs.writeConfig(original);
    }
  });

  test('syncConfig preserves action ids and workflow references for discoverable actions', async function () {
    this.timeout(10000);
    const cs = new ConfigService(mockContext);
    const original = await cs.readConfig();

    try {
      const seededConfig: Config = {
        actions: [
          {
            id: 'workflow-build-action',
            name: 'Build Project',
            command: 'npm run build',
            type: 'npm',
          },
        ],
        workflows: [
          {
            id: 'workflow-build',
            name: 'Build Flow',
            steps: [{ id: 'workflow-build-step', actionId: 'workflow-build-action' }],
          },
        ],
      };

      await cs.writeConfig(seededConfig);
      await cs.syncConfig();

      const updated = await cs.readConfig();
      const buildAction = updated.actions.find((action) => action.command === 'npm run build' && action.type === 'npm');
      assert.ok(buildAction, 'Expected syncConfig to keep the build action discoverable');
      assert.strictEqual(buildAction?.id, 'workflow-build-action');
      assert.strictEqual(updated.workflows?.[0].steps[0].actionId, 'workflow-build-action');
    } finally {
      await cs.writeConfig(original);
    }
  });

  test('buildWorkflowSummaries flags missing and ineligible workflow steps', () => {
    const actions: Action[] = [
      { id: 'action-shell', name: 'Build', command: 'npm run build', type: 'npm' },
      { id: 'action-vscode', name: 'Open Settings', command: 'workbench.action.openSettings', type: 'vscode' },
    ];

    const summaries = buildWorkflowSummaries([
      {
        id: 'workflow-validation',
        name: 'Validation',
        steps: [
          { id: 'step-missing', actionId: 'missing-action' },
          { id: 'step-ineligible', actionId: 'action-vscode' },
        ],
      },
    ], actions);

    assert.ok(summaries);
    assert.strictEqual(summaries[0].valid, false);
    assert.strictEqual(summaries[0].steps[0].valid, false);
    assert.strictEqual(summaries[0].steps[1].valid, false);
    assert.ok(summaries[0].invalidReasons.some((reason) => reason.includes('no longer exists')));
    assert.ok(summaries[0].invalidReasons.some((reason) => reason.includes('not supported')));
  });

  test('workflow runner stops on failure by default', async () => {
    const config: Config = {
      actions: [
        { id: 'action-build', name: 'Build', command: 'npm run build', type: 'npm' },
        { id: 'action-test', name: 'Test', command: 'npm test', type: 'npm' },
      ],
      workflows: [
        {
          id: 'workflow-stop',
          name: 'Stop On Fail',
          steps: [
            { id: 'step-build', actionId: 'action-build' },
            { id: 'step-test', actionId: 'action-test' },
          ],
        },
      ],
    };

    const calls: string[] = [];
    const fakeActionExecutionService = {
      executeWorkflowAction: async (action: Action) => {
        calls.push(action.id as string);
        return {
          exitCode: action.id === 'action-build' ? 1 : 0,
          timestamp: Date.now(),
        };
      },
    } as any;

    const service = new WorkflowExecutionService({ readConfig: async () => config } as any, fakeActionExecutionService);
    const result = await service.runWorkflowById('workflow-stop');

    assert.strictEqual(result.success, false);
    assert.deepStrictEqual(calls, ['action-build']);
  });

  test('workflow runner continues past failures when continueOnError is set', async () => {
    const config: Config = {
      actions: [
        { id: 'action-build', name: 'Build', command: 'npm run build', type: 'npm' },
        { id: 'action-test', name: 'Test', command: 'npm test', type: 'npm' },
      ],
      workflows: [
        {
          id: 'workflow-continue',
          name: 'Continue On Fail',
          steps: [
            { id: 'step-build', actionId: 'action-build', continueOnError: true },
            { id: 'step-test', actionId: 'action-test' },
          ],
        },
      ],
    };

    const calls: string[] = [];
    const fakeActionExecutionService = {
      executeWorkflowAction: async (action: Action) => {
        calls.push(action.id as string);
        return {
          exitCode: action.id === 'action-build' ? 1 : 0,
          timestamp: Date.now(),
        };
      },
    } as any;

    const service = new WorkflowExecutionService({ readConfig: async () => config } as any, fakeActionExecutionService);
    const result = await service.runWorkflowById('workflow-continue');

    assert.strictEqual(result.success, true);
    assert.deepStrictEqual(calls, ['action-build', 'action-test']);
  });

  test('openWorkflowBuilder and runWorkflow commands execute without error', async function () {
    this.timeout(10000);
    const cs = new ConfigService(mockContext);
    const original = await cs.readConfig();

    try {
      await cs.writeConfig({
        actions: [],
        workflows: [
          {
            id: 'workflow-invalid-command',
            name: 'Invalid Command Workflow',
            steps: [{ id: 'step-missing-command', actionId: 'missing-action' }],
          },
        ],
      });

      await vscode.commands.executeCommand('battlestation.openWorkflowBuilder');
      await vscode.commands.executeCommand('battlestation.runWorkflow', 'workflow-invalid-command');
      assert.ok(true, 'Commands should resolve without throwing');
    } finally {
      await cs.writeConfig(original);
    }
  });
});
