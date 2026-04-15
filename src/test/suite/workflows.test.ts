import * as assert from 'assert';
import * as vscode from 'vscode';
import { ActionExecutionService } from '../../services/actionExecutionService';
import { ConfigService } from '../../services/configService';
import { RunStatusService } from '../../services/runStatusService';
import { WorkflowExecutionService } from '../../services/workflowExecutionService';
import { WorkflowBuilderPanel } from '../../workflowBuilderPanel';
import { buildWorkflowSummaries } from '../../utils/workflows';
import type { Action, Config } from '../../types';

const mockContext = {
  globalState: { get: () => undefined, update: () => Promise.resolve() },
  workspaceState: { get: () => undefined, update: () => Promise.resolve() },
  extensionUri: vscode.Uri.file(__dirname),
  subscriptions: [],
  extensionPath: __dirname,
} as any;

function patchTasksApi(
  overrides: Partial<Record<'fetchTasks' | 'executeTask' | 'onDidStartTask' | 'onDidEndTask' | 'onDidEndTaskProcess', unknown>>
): () => void {
  const tasksApi = vscode.tasks as unknown as Record<string, unknown>;
  const originalDescriptors = new Map<string, PropertyDescriptor | undefined>();

  for (const [key, value] of Object.entries(overrides)) {
    originalDescriptors.set(key, Object.getOwnPropertyDescriptor(tasksApi, key));
    Object.defineProperty(tasksApi, key, {
      value,
      configurable: true,
      writable: true,
    });
  }

  return () => {
    for (const [key, descriptor] of originalDescriptors.entries()) {
      if (descriptor) {
        Object.defineProperty(tasksApi, key, descriptor);
      } else {
        delete tasksApi[key];
      }
    }
  };
}

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

  test('buildWorkflowSummaries keeps task steps workflow-valid', () => {
    const actions: Action[] = [
      {
        id: 'action-task',
        name: 'Compile Task',
        command: 'workbench.action.tasks.runTask|compile',
        type: 'task',
      },
    ];

    const summaries = buildWorkflowSummaries([
      {
        id: 'workflow-task',
        name: 'Task Flow',
        steps: [{ id: 'step-task', actionId: 'action-task' }],
      },
    ], actions);

    assert.strictEqual(summaries[0].valid, true);
    assert.strictEqual(summaries[0].steps[0].valid, true);
    assert.deepStrictEqual(summaries[0].invalidReasons, []);
  });

  test('executeWorkflowAction resolves folder-scoped tasks by cwd and reports the task exit code', async () => {
    const runStatusService = new RunStatusService();
    const actionExecutionService = new ActionExecutionService(runStatusService);
    const startEmitter = new vscode.EventEmitter<any>();
    const endEmitter = new vscode.EventEmitter<any>();
    const endProcessEmitter = new vscode.EventEmitter<any>();
    const folderA: vscode.WorkspaceFolder = {
      uri: vscode.Uri.file('c:/repo/packages/app-a'),
      name: 'app-a',
      index: 0,
    };
    const folderB: vscode.WorkspaceFolder = {
      uri: vscode.Uri.file('c:/repo/packages/app-b'),
      name: 'app-b',
      index: 1,
    };
    const taskA = { name: 'compile', scope: folderA } as vscode.Task;
    const taskB = { name: 'compile', scope: folderB } as vscode.Task;
    let executedTask: vscode.Task | undefined;

    const restoreTasksApi = patchTasksApi({
      fetchTasks: async () => [taskA, taskB],
      executeTask: async (task: vscode.Task) => {
        executedTask = task;
        const execution = { task, terminate: () => undefined } as vscode.TaskExecution;
        startEmitter.fire({ execution });
        setTimeout(() => {
          endProcessEmitter.fire({ execution, exitCode: 7 });
          endEmitter.fire({ execution });
        }, 0);
        return execution;
      },
      onDidStartTask: startEmitter.event,
      onDidEndTask: endEmitter.event,
      onDidEndTaskProcess: endProcessEmitter.event,
    });

    try {
      const status = await actionExecutionService.executeWorkflowAction({
        id: 'action-task',
        name: 'Compile Task',
        command: 'workbench.action.tasks.runTask|compile',
        type: 'task',
        cwd: folderA.uri.fsPath,
      });

      assert.strictEqual(executedTask, taskA);
      assert.strictEqual(status?.exitCode, 7);
      assert.strictEqual(runStatusService.toObject()['Compile Task']?.exitCode, 7);
    } finally {
      restoreTasksApi();
      startEmitter.dispose();
      endEmitter.dispose();
      endProcessEmitter.dispose();
    }
  });

  test('executeWorkflowAction prefers workspace-scoped tasks when no cwd is available', async () => {
    const runStatusService = new RunStatusService();
    const actionExecutionService = new ActionExecutionService(runStatusService);
    const startEmitter = new vscode.EventEmitter<any>();
    const endEmitter = new vscode.EventEmitter<any>();
    const endProcessEmitter = new vscode.EventEmitter<any>();
    const folderTask = {
      name: 'compile',
      scope: {
        uri: vscode.Uri.file('c:/repo/packages/app-a'),
        name: 'app-a',
        index: 0,
      },
    } as vscode.Task;
    const workspaceTask = { name: 'compile', scope: vscode.TaskScope.Workspace } as vscode.Task;
    let executedTask: vscode.Task | undefined;

    const restoreTasksApi = patchTasksApi({
      fetchTasks: async () => [folderTask, workspaceTask],
      executeTask: async (task: vscode.Task) => {
        executedTask = task;
        const execution = { task, terminate: () => undefined } as vscode.TaskExecution;
        startEmitter.fire({ execution });
        setTimeout(() => {
          endProcessEmitter.fire({ execution, exitCode: 0 });
          endEmitter.fire({ execution });
        }, 0);
        return execution;
      },
      onDidStartTask: startEmitter.event,
      onDidEndTask: endEmitter.event,
      onDidEndTaskProcess: endProcessEmitter.event,
    });

    try {
      const status = await actionExecutionService.executeWorkflowAction({
        id: 'action-task',
        name: 'Workspace Compile',
        command: 'workbench.action.tasks.runTask|compile',
        type: 'task',
      });

      assert.strictEqual(executedTask, workspaceTask);
      assert.strictEqual(status?.exitCode, 0);
    } finally {
      restoreTasksApi();
      startEmitter.dispose();
      endEmitter.dispose();
      endProcessEmitter.dispose();
    }
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

  test('workflow builder can delete an invalid active workflow without throwing', async function () {
    this.timeout(10000);

    const cs = new ConfigService(mockContext);
    const panel = new WorkflowBuilderPanel(mockContext, cs, {} as any);
    const original = await cs.readConfig();

    try {
      await cs.writeConfig({
        actions: [],
        workflows: [
          {
            id: 'workflow-invalid-delete',
            name: 'Broken Chain',
            steps: [{ id: 'step-missing', actionId: 'missing-action' }],
          },
          {
            id: 'workflow-safe',
            name: 'Keep Me',
            steps: [],
          },
        ],
      });

      (panel as any).activeWorkflowId = 'workflow-invalid-delete';
      await (panel as any).deleteWorkflow('workflow-invalid-delete');

      const updated = await cs.readConfig();
      assert.deepStrictEqual(
        updated.workflows?.map((workflow) => workflow.id),
        ['workflow-safe'],
        'Expected deleteWorkflow to remove only the requested workflow'
      );
      assert.strictEqual(
        (panel as any).activeWorkflowId,
        'workflow-safe',
        'Expected the workflow builder to select the remaining workflow after deletion'
      );
    } finally {
      panel.dispose();
      await cs.writeConfig(original);
    }
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
