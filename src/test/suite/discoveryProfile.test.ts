import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConfigService } from '../../services/configService';

suite('Discovery Profile Tests', () => {
  const workspaceState = new Map<string, unknown>();
  const mockContext = {
    globalState: { get: () => undefined, update: () => Promise.resolve() },
    workspaceState: {
      get: (key: string) => workspaceState.get(key),
      update: (key: string, value: unknown) => {
        if (typeof value === 'undefined') {
          workspaceState.delete(key);
        } else {
          workspaceState.set(key, value);
        }
        return Promise.resolve();
      },
    },
    extensionUri: vscode.Uri.file(__dirname),
    subscriptions: [] as Array<{ dispose?: () => void }>,
  } as any;

  let configService: ConfigService;
  let fixtureRoots: vscode.Uri[] = [];

  async function createFixtureRoot(label: string): Promise<vscode.Uri> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
    assert.ok(workspaceRoot, 'Expected the test workspace to be open');

    const fixtureRoot = vscode.Uri.joinPath(
      workspaceRoot!,
      'temp_last30days',
      `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    );
    await vscode.workspace.fs.createDirectory(fixtureRoot);
    fixtureRoots.push(fixtureRoot);
    return fixtureRoot;
  }

  async function writeJsonFile(uri: vscode.Uri, value: unknown): Promise<void> {
    await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(uri, '..'));
    await vscode.workspace.fs.writeFile(uri, Buffer.from(JSON.stringify(value, null, 2)));
  }

  setup(() => {
    workspaceState.clear();
    mockContext.subscriptions.length = 0;
    fixtureRoots = [];
    configService = new ConfigService(mockContext);
    (configService as any).disposeTrackedManifestWatchers?.();
    (configService as any).refreshTrackedManifestWatchers = async () => {};
  });

  teardown(async () => {
    await configService.setCustomConfigPath(undefined);
    (configService as any).disposeTrackedManifestWatchers?.();

    for (const disposable of mockContext.subscriptions.splice(0)) {
      disposable.dispose?.();
    }

    for (const fixtureRoot of fixtureRoots.reverse()) {
      try {
        await vscode.workspace.fs.delete(fixtureRoot, { recursive: true, useTrash: false });
      } catch {
        // Best-effort cleanup for temporary fixtures.
      }
    }
  });

  test('createAutoConfig persists discovery metadata for later sync', async function () {
    this.timeout(10000);

    const fixtureRoot = await createFixtureRoot('discovery-profile');
    await configService.setCustomConfigPath(vscode.Uri.joinPath(fixtureRoot, '.config').fsPath);

    await configService.createAutoConfig(
      { npm: true, tasks: false, launch: true, docker: false, make: false, rust: false, go: false },
      true,
      ConfigService.defaultIcons,
      [],
      true,
      true,
      'workspace'
    );

    const config = await configService.readConfig();
    assert.ok(config.discovery, 'Expected generated configs to persist discovery metadata');
    assert.deepStrictEqual(config.discovery?.sources, {
      npm: true,
      tasks: false,
      launch: true,
      docker: false,
      make: false,
      rust: false,
      go: false,
    });
    assert.strictEqual(config.discovery?.deepScan, true);
    assert.strictEqual(config.discovery?.enableGrouping, true);
    assert.strictEqual(config.discovery?.enableColoring, true);
    assert.strictEqual(config.discovery?.secondaryGroupBy, 'workspace');
  });

  test('scanTasks deep scan includes nested .vscode manifests', async function () {
    this.timeout(10000);

    const fixtureRoot = await createFixtureRoot('nested-tasks');
    await writeJsonFile(vscode.Uri.joinPath(fixtureRoot, 'packages', 'app', '.vscode', 'tasks.json'), {
      version: '2.0.0',
      tasks: [
        {
          label: 'nested-build',
          command: 'npm run build',
          group: 'build',
        },
      ],
    });

    const shallowTasks = await configService.scanTasks(false);
    assert.ok(
      !shallowTasks.some((task) => task.name === 'nested-build'),
      'Shallow scan should not include nested tasks.json manifests'
    );

    const deepTasks = await configService.scanTasks(true);
    const nestedTask = deepTasks.find((task) => task.name === 'nested-build');
    assert.ok(nestedTask, 'Deep scan should include nested tasks.json manifests');
    assert.ok(
      nestedTask?.workspace?.includes('packages/app'),
      `Expected nested task workspace label to include packages/app, got ${nestedTask?.workspace}`
    );
    assert.ok(
      nestedTask?.workspace?.includes('Build'),
      `Expected nested task workspace label to include Build, got ${nestedTask?.workspace}`
    );
  });

  test('scanLaunchConfigs includes active workspace-file launch definitions', async function () {
    this.timeout(10000);

    (configService as any).getActiveWorkspaceFileJson = async () => ({
      launch: {
        configurations: [{ name: 'Workspace Debug' }],
        compounds: [{ name: 'Workspace Compound' }],
      },
    });
    (configService as any).getWorkspaceFileLabel = () => 'Workspace';

    const launchConfigs = await configService.scanLaunchConfigs(false);

    assert.ok(
      launchConfigs.some(
        (config) =>
          config.name === 'Workspace Debug' &&
          config.type === 'launch' &&
          config.workspace === 'Workspace'
      ),
      'Expected workspace-file launch configurations to be included'
    );
    assert.ok(
      launchConfigs.some(
        (config) =>
          config.name === 'Workspace Compound' &&
          config.command === 'workbench.action.debug.start|Workspace Compound'
      ),
      'Expected workspace-file launch compounds to be included'
    );
  });

  test('syncConfig reuses the stored discovery profile for deep task scans', async function () {
    this.timeout(10000);

    const fixtureRoot = await createFixtureRoot('sync-profile');
    await writeJsonFile(vscode.Uri.joinPath(fixtureRoot, 'packages', 'sync-app', '.vscode', 'tasks.json'), {
      version: '2.0.0',
      tasks: [
        {
          label: 'sync-nested-task',
          command: 'npm run test',
        },
      ],
    });
    await configService.setCustomConfigPath(vscode.Uri.joinPath(fixtureRoot, '.config').fsPath);

    await configService.writeConfig({
      actions: [
        {
          name: 'stale-task',
          command: 'workbench.action.tasks.runTask|stale-task',
          type: 'task',
        },
      ],
      discovery: {
        version: 1,
        sources: { tasks: true },
        deepScan: true,
      },
    });

    await configService.syncConfig();

    const config = await configService.readConfig();
    assert.ok(
      config.actions.some((action) => action.name === 'sync-nested-task'),
      'syncConfig should use the persisted discovery profile to deep-scan nested tasks'
    );
    assert.ok(
      config.actions.every((action) => action.type !== 'npm'),
      'syncConfig should not add sources that were not enabled in the persisted profile'
    );
    assert.strictEqual(config.discovery?.deepScan, true);
    assert.strictEqual(config.discovery?.sources.tasks, true);
    assert.strictEqual(config.discovery?.sources.npm, false);
  });
});