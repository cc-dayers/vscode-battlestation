import * as vscode from "vscode";
import type {
  Config,
  Action,
  Group,
  IconMapping,
  Workflow,
  WorkflowStep,
  DiscoveryProfile,
  DiscoverySources,
} from "../types";
import { getPreferredThemeColorForName, pickDistinctThemeColor } from "../utils/themeColors";
import { createEntityId } from "../utils/id";
import { getWorkflowActionKey } from "../utils/workflows";

interface HistoryEntry {
  timestamp: number;
  label: string;
  config: Config;
}

/**
 * Async config service using vscode.workspace.fs instead of sync Node fs.
 * Compatible with remote workspaces and VS Code for Web.
 * 
 * Config location: .vscode/battle.config
 * History location: .vscode/battle.history.jsonl
 */
export class ConfigService {
  private configCache?: { config: Config; timestamp: number };
  private fileWatcher?: vscode.FileSystemWatcher;
  private trackedManifestWatchers: vscode.FileSystemWatcher[] = [];
  private trackedManifestSyncTimeout?: NodeJS.Timeout;

  private static readonly DISCOVERY_PROFILE_VERSION = 1;
  private static readonly MANIFEST_SEARCH_EXCLUDE = "**/{node_modules,.git,.vscode-test,dist,build,out,coverage,.next}/**";
  private static readonly DISCOVERABLE_TYPES_BY_SOURCE: Record<keyof DiscoverySources, string[]> = {
    npm: ["npm"],
    tasks: ["task"],
    launch: ["launch"],
    docker: ["docker"],
    make: ["make"],
    rust: ["rust"],
    go: ["go"],
  };

  static readonly defaultIcons: IconMapping[] = [
    { type: "shell", icon: "terminal" },
    { type: "npm", icon: "package" },
    { type: "vscode", icon: "extensions" },
    { type: "task", icon: "check" },
    { type: "launch", icon: "play" },
    { type: "python", icon: "file-code" },
    { type: "node", icon: "file-code" },
    { type: "go", icon: "file-code" },
    { type: "rust", icon: "file-code" },
    { type: "docker", icon: "file" },
    { type: "git", icon: "source-control" },
    { type: "build", icon: "tools" },
    { type: "test", icon: "beaker" },
  ];

  private _onDidChange = new vscode.EventEmitter<void>();
  public readonly onDidChange = this._onDidChange.event;

  constructor(private readonly context?: vscode.ExtensionContext) {
    if (this.context) {
      this.setupFileWatcher();
      void this.refreshTrackedManifestWatchers();
      this.context.subscriptions.push(
        vscode.workspace.onDidChangeWorkspaceFolders(() => {
          this.refreshFileWatcher();
          void this.refreshTrackedManifestWatchers();
        })
      );
    }
  }

  /* ─── Workspace helpers ─── */

  private getWorkspaceRoot(): vscode.Uri | undefined {
    return vscode.workspace.workspaceFolders?.[0]?.uri;
  }

  private getVSCodeFolderUri(): vscode.Uri | undefined {
    const root = this.getWorkspaceRoot();
    return root ? vscode.Uri.joinPath(root, ".vscode") : undefined;
  }

  private static readonly CUSTOM_PATH_KEY = 'battlestation.customConfigPath';

  /** Get the user-selected custom config directory, if any */
  getCustomConfigPath(): string | undefined {
    return this.context?.workspaceState?.get<string>(ConfigService.CUSTOM_PATH_KEY);
  }

  /** Persist the custom config directory and refresh the file watcher */
  async setCustomConfigPath(dirPath: string | undefined): Promise<void> {
    await this.context?.workspaceState?.update(ConfigService.CUSTOM_PATH_KEY, dirPath);
    this.notifyConfigChanged();
    this.refreshFileWatcher();
    await this.refreshTrackedManifestWatchers();
  }

  /** Default location: .vscode/battle.json */
  private getDefaultConfigUri(): vscode.Uri | undefined {
    const folder = this.getVSCodeFolderUri();
    return folder ? vscode.Uri.joinPath(folder, "battle.json") : undefined;
  }

  /** Active config location — custom dir takes priority over default */
  private getConfigUri(): vscode.Uri | undefined {
    const custom = this.getCustomConfigPath();
    if (custom) {
      return vscode.Uri.joinPath(vscode.Uri.file(custom), "battle.json");
    }
    return this.getDefaultConfigUri();
  }

  /** Old location: .vscode/battle.config */
  private getOldConfigUri(): vscode.Uri | undefined {
    const folder = this.getVSCodeFolderUri();
    return folder ? vscode.Uri.joinPath(folder, "battle.config") : undefined;
  }

  /** History file: .vscode/battle.history.jsonl */
  private getHistoryUri(): vscode.Uri | undefined {
    const folder = this.getVSCodeFolderUri();
    return folder ? vscode.Uri.joinPath(folder, "battle.history.jsonl") : undefined;
  }

  /** Legacy location 1: .battle/battle.config */
  private getLegacyBattleFolderConfigUri(): vscode.Uri | undefined {
    const root = this.getWorkspaceRoot();
    return root ? vscode.Uri.joinPath(root, ".battle", "battle.config") : undefined;
  }

  /** Legacy location 2: battle.config (root) */
  private getLegacyRootConfigUri(): vscode.Uri | undefined {
    const root = this.getWorkspaceRoot();
    return root ? vscode.Uri.joinPath(root, "battle.config") : undefined;
  }

  /** Legacy versions folder: .battle/versions/ */
  private getLegacyVersionsFolderUri(): vscode.Uri | undefined {
    const root = this.getWorkspaceRoot();
    return root ? vscode.Uri.joinPath(root, ".battle", "versions") : undefined;
  }

  /* ─── File watcher ─── */

  private setupFileWatcher(): void {
    this.refreshFileWatcher();
  }

  private refreshFileWatcher(): void {
    // Dispose previous watcher
    this.fileWatcher?.dispose();

    const custom = this.getCustomConfigPath();
    let pattern: vscode.RelativePattern | string;

    if (custom) {
      pattern = new vscode.RelativePattern(
        vscode.Uri.file(custom),
        "battle.json"
      );
    } else {
      const root = this.getWorkspaceRoot();
      if (!root) return;
      pattern = new vscode.RelativePattern(
        vscode.workspace.workspaceFolders![0],
        ".vscode/battle.json"
      );
    }

    this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

    const notify = () => {
      this.notifyConfigChanged();
      void this.refreshTrackedManifestWatchers();
    };

    this.fileWatcher.onDidChange(notify);
    this.fileWatcher.onDidCreate(notify);
    this.fileWatcher.onDidDelete(notify);

    if (this.context) {
      this.context.subscriptions.push(this.fileWatcher);
    }
  }

  private disposeTrackedManifestWatchers(): void {
    if (this.trackedManifestSyncTimeout) {
      clearTimeout(this.trackedManifestSyncTimeout);
      this.trackedManifestSyncTimeout = undefined;
    }

    for (const watcher of this.trackedManifestWatchers) {
      watcher.dispose();
    }
    this.trackedManifestWatchers = [];
  }

  private getDiscoverySourcesFromActions(actions: readonly Action[]): DiscoverySources {
    const sources: DiscoverySources = {};

    for (const action of actions) {
      for (const [source, types] of Object.entries(
        ConfigService.DISCOVERABLE_TYPES_BY_SOURCE
      ) as Array<[keyof DiscoverySources, string[]]>) {
        if (types.includes(action.type)) {
          sources[source] = true;
        }
      }
    }

    return sources;
  }

  private hasEnabledDiscoverySources(sources: DiscoverySources | undefined): boolean {
    return Boolean(
      sources && Object.values(sources).some((value) => value === true)
    );
  }

  private getEffectiveDiscoveryProfile(
    config: Config,
    deepScanOverride?: boolean
  ): DiscoveryProfile | undefined {
    const normalizedProfile = config.discovery
      ? this.normalizeDiscoveryProfile(config.discovery)
      : undefined;

    if (normalizedProfile && this.hasEnabledDiscoverySources(normalizedProfile.sources)) {
      return {
        ...normalizedProfile,
        deepScan:
          typeof deepScanOverride === "boolean"
            ? deepScanOverride
            : normalizedProfile.deepScan,
      };
    }

    const inferredSources = this.getDiscoverySourcesFromActions(config.actions || []);
    if (!this.hasEnabledDiscoverySources(inferredSources)) {
      return undefined;
    }

    return {
      version: ConfigService.DISCOVERY_PROFILE_VERSION,
      sources: inferredSources,
      deepScan: deepScanOverride ?? false,
    };
  }

  private getTrackedManifestGlobs(profile: DiscoveryProfile): string[] {
    const globs = new Set<string>();

    if (profile.sources.npm) {
      globs.add(profile.deepScan ? "**/package.json" : "package.json");
    }

    if (profile.sources.tasks) {
      globs.add(profile.deepScan ? "**/.vscode/tasks.json" : ".vscode/tasks.json");
    }

    if (profile.sources.launch) {
      globs.add(profile.deepScan ? "**/.vscode/launch.json" : ".vscode/launch.json");
    }

    if (profile.sources.docker) {
      globs.add(
        profile.deepScan
          ? "**/{docker-compose.yml,docker-compose.yaml,compose.yml,compose.yaml}"
          : "{docker-compose.yml,docker-compose.yaml,compose.yml,compose.yaml}"
      );
    }

    if (profile.sources.make) {
      globs.add(
        profile.deepScan
          ? "**/{Makefile,makefile,GNUmakefile}"
          : "{Makefile,makefile,GNUmakefile}"
      );
    }

    if (profile.sources.rust) {
      globs.add(profile.deepScan ? "**/Cargo.toml" : "Cargo.toml");
    }

    if (profile.sources.go) {
      globs.add(profile.deepScan ? "**/go.mod" : "go.mod");
    }

    return Array.from(globs);
  }

  private scheduleTrackedManifestSync(): void {
    if (this.trackedManifestSyncTimeout) {
      clearTimeout(this.trackedManifestSyncTimeout);
    }

    this.trackedManifestSyncTimeout = setTimeout(() => {
      this.trackedManifestSyncTimeout = undefined;
      void this.runTrackedManifestSync();
    }, 300);
  }

  private async runTrackedManifestSync(): Promise<void> {
    try {
      const configUri = await this.resolveConfigUri();
      if (!configUri || !(await this.fileExists(configUri))) {
        return;
      }

      await this.syncConfig();
    } catch {
      // Ignore manifest-triggered sync failures; the user can still resync manually.
    }
  }

  private async refreshTrackedManifestWatchers(config?: Config): Promise<void> {
    this.disposeTrackedManifestWatchers();

    const configUri = await this.resolveConfigUri();
    if (!configUri || !(await this.fileExists(configUri))) {
      return;
    }

    const resolvedConfig = config ?? (await this.readConfig());
    const profile = this.getEffectiveDiscoveryProfile(resolvedConfig);
    if (!profile) {
      return;
    }

    const notify = () => this.scheduleTrackedManifestSync();

    for (const glob of this.getTrackedManifestGlobs(profile)) {
      const watcher = vscode.workspace.createFileSystemWatcher(
        glob,
        false,
        false,
        false
      );
      watcher.onDidChange(notify);
      watcher.onDidCreate(notify);
      watcher.onDidDelete(notify);
      this.trackedManifestWatchers.push(watcher);
    }

    const workspaceFile = vscode.workspace.workspaceFile;
    if (workspaceFile && (profile.sources.tasks || profile.sources.launch)) {
      const watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(
          vscode.Uri.joinPath(workspaceFile, ".."),
          this.getUriBaseName(workspaceFile)
        )
      );
      watcher.onDidChange(notify);
      watcher.onDidCreate(notify);
      watcher.onDidDelete(notify);
      this.trackedManifestWatchers.push(watcher);
    }
  }

  private getUriBaseName(uri: vscode.Uri): string {
    const normalizedPath = uri.path.replace(/\/+$/, "");
    const lastSlash = normalizedPath.lastIndexOf("/");
    return lastSlash >= 0 ? normalizedPath.slice(lastSlash + 1) : normalizedPath;
  }

  private getWorkspaceRelativePath(
    workspaceFolder: vscode.WorkspaceFolder,
    target: vscode.Uri
  ): string {
    const workspacePath = workspaceFolder.uri.path.replace(/\/+$/, "");
    const targetPath = target.path.replace(/\/+$/, "");

    if (targetPath === workspacePath) {
      return "";
    }

    if (!targetPath.startsWith(`${workspacePath}/`)) {
      return "";
    }

    return targetPath.slice(workspacePath.length + 1);
  }

  private getWorkspaceLabelForTarget(target: vscode.Uri): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return undefined;
    }

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(target);
    if (!workspaceFolder) {
      return undefined;
    }

    const relativePath = this.getWorkspaceRelativePath(workspaceFolder, target);
    if (!relativePath) {
      return workspaceFolders.length === 1 ? undefined : workspaceFolder.name;
    }

    return workspaceFolders.length === 1
      ? relativePath
      : `${workspaceFolder.name}/${relativePath}`;
  }

  private async readJsoncFile(uri: vscode.Uri): Promise<any | undefined> {
    try {
      const raw = await this.readText(uri);
      return JSON.parse(this.stripJsonComments(raw));
    } catch {
      return undefined;
    }
  }

  private async getActiveWorkspaceFileJson(): Promise<any | undefined> {
    const workspaceFile = vscode.workspace.workspaceFile;
    if (!workspaceFile) {
      return undefined;
    }

    return this.readJsoncFile(workspaceFile);
  }

  private getWorkspaceFileLabel(): string {
    const workspaceFile = vscode.workspace.workspaceFile;
    if (!workspaceFile) {
      return "Workspace";
    }

    return this.getUriBaseName(workspaceFile).replace(/\.code-workspace$/i, "") || "Workspace";
  }

  private async getWorkspaceFileTaskActions(): Promise<Action[]> {
    const workspaceJson = await this.getActiveWorkspaceFileJson();
    const tasksContainer = workspaceJson?.tasks;
    const tasks = Array.isArray(tasksContainer?.tasks)
      ? tasksContainer.tasks
      : Array.isArray(tasksContainer)
        ? tasksContainer
        : [];

    const workspaceLabel = this.getWorkspaceFileLabel();
    const actions: Action[] = [];

    for (const task of tasks) {
      if (task?.hide === true) {
        continue;
      }

      const label =
        (typeof task?.label === "string" && task.label.trim()) ||
        (typeof task?.script === "string" && task.script.trim()) ||
        (typeof task?.command === "string" && task.command.trim()) ||
        undefined;

      if (!label) {
        continue;
      }

      let secondaryGroup: string | undefined;
      if (typeof task?.group === "string") {
        secondaryGroup = task.group.charAt(0).toUpperCase() + task.group.slice(1);
      } else if (
        task?.group &&
        typeof task.group === "object" &&
        typeof task.group.kind === "string"
      ) {
        secondaryGroup = task.group.kind.charAt(0).toUpperCase() + task.group.kind.slice(1);
      }

      if (secondaryGroup?.toLowerCase() === "none") {
        secondaryGroup = undefined;
      }

      actions.push({
        name: label,
        command: `workbench.action.tasks.runTask|${label}`,
        type: "task",
        workspace: secondaryGroup
          ? `${workspaceLabel} - ${secondaryGroup}`
          : workspaceLabel,
      });
    }

    return actions;
  }

  private async getWorkspaceFileLaunchActions(): Promise<Action[]> {
    const workspaceJson = await this.getActiveWorkspaceFileJson();
    const launchContainer = workspaceJson?.launch;
    const configs = Array.isArray(launchContainer?.configurations)
      ? launchContainer.configurations
      : [];
    const compounds = Array.isArray(launchContainer?.compounds)
      ? launchContainer.compounds
      : [];
    const workspaceLabel = this.getWorkspaceFileLabel();
    const actions: Action[] = [];

    for (const config of configs) {
      if (
        typeof config?.name !== "string" ||
        config.name.trim().length === 0 ||
        config?.presentation?.hidden === true
      ) {
        continue;
      }

      const name = config.name.trim();
      actions.push({
        name,
        command: `workbench.action.debug.start|${name}`,
        type: "launch",
        workspace: workspaceLabel,
      });
    }

    for (const compound of compounds) {
      if (
        typeof compound?.name !== "string" ||
        compound.name.trim().length === 0 ||
        compound?.presentation?.hidden === true
      ) {
        continue;
      }

      const name = compound.name.trim();
      actions.push({
        name,
        command: `workbench.action.debug.start|${name}`,
        type: "launch",
        workspace: workspaceLabel,
      });
    }

    return actions;
  }

  /** Copy an external JSON file into the active config location */
  async importConfig(sourceUri: vscode.Uri): Promise<void> {
    const destUri = this.getConfigUri();
    if (!destUri) {
      throw new Error('No workspace open');
    }
    // Ensure destination directory exists
    const destDir = vscode.Uri.joinPath(destUri, '..');
    await this.ensureDir(destDir);
    // Backup existing config first
    if (await this.fileExists(destUri)) {
      const existing = JSON.parse(await this.readText(destUri));
      await this.appendToHistory(existing, `Before import ${this.getTimestampLabel()}`);
    }
    await vscode.workspace.fs.copy(sourceUri, destUri, { overwrite: true });
    this.notifyConfigChanged();
  }

  /* ─── Async FS helpers ─── */

  private async fileExists(uri: vscode.Uri): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(uri);
      return true;
    } catch {
      return false;
    }
  }

  private async readText(uri: vscode.Uri): Promise<string> {
    const bytes = await vscode.workspace.fs.readFile(uri);
    return Buffer.from(bytes).toString("utf-8");
  }

  private async writeText(uri: vscode.Uri, content: string): Promise<void> {
    await vscode.workspace.fs.writeFile(uri, Buffer.from(content, "utf-8"));
  }

  private async ensureDir(uri: vscode.Uri): Promise<void> {
    try {
      await vscode.workspace.fs.createDirectory(uri);
    } catch {
      /* already exists */
    }
  }

  private ensureUniqueId(id: unknown, usedIds: Set<string>, prefix: string): { value: string; didMutate: boolean } {
    if (typeof id === "string" && id.trim().length > 0 && !usedIds.has(id)) {
      usedIds.add(id);
      return { value: id, didMutate: false };
    }

    let value = createEntityId(prefix);
    while (usedIds.has(value)) {
      value = createEntityId(prefix);
    }
    usedIds.add(value);
    return { value, didMutate: true };
  }

  private normalizeAction(raw: any, usedIds: Set<string>): { action: Action | null; didMutate: boolean } {
    if (!raw || typeof raw !== "object") {
      return { action: null, didMutate: false };
    }

    const { value: id, didMutate } = this.ensureUniqueId(raw.id, usedIds, "action");
    return {
      action: {
        ...raw,
        id,
      },
      didMutate,
    };
  }

  private normalizeWorkflowStep(raw: any, usedIds: Set<string>): { step: WorkflowStep | null; didMutate: boolean } {
    if (!raw || typeof raw !== "object") {
      return { step: null, didMutate: false };
    }

    const { value: id, didMutate: idMutated } = this.ensureUniqueId(raw.id, usedIds, "step");
    const actionId = typeof raw.actionId === "string" ? raw.actionId : "";

    return {
      step: {
        id,
        actionId,
        continueOnError: raw.continueOnError === true ? true : undefined,
      },
      didMutate: idMutated || actionId !== raw.actionId,
    };
  }

  private normalizeWorkflow(raw: any, usedIds: Set<string>): { workflow: Workflow | null; didMutate: boolean } {
    if (!raw || typeof raw !== "object") {
      return { workflow: null, didMutate: false };
    }

    const { value: id, didMutate: idMutated } = this.ensureUniqueId(raw.id, usedIds, "workflow");
    const name = typeof raw.name === "string" && raw.name.trim().length > 0
      ? raw.name.trim()
      : "Untitled Workflow";
    const rawSteps = Array.isArray(raw.steps) ? raw.steps : [];

    const usedStepIds = new Set<string>();
    let stepsMutated = !Array.isArray(raw.steps);
    const steps = rawSteps
      .map((stepRaw: any) => {
        const { step, didMutate } = this.normalizeWorkflowStep(stepRaw, usedStepIds);
        if (didMutate) {
          stepsMutated = true;
        }
        return step;
      })
      .filter((step: WorkflowStep | null): step is WorkflowStep => step !== null);

    return {
      workflow: {
        id,
        name,
        steps,
      },
      didMutate: idMutated || name !== raw.name || stepsMutated,
    };
  }

  private normalizeConfig(raw: any): { config: Config | null; didMutate: boolean } {
    if (!raw || typeof raw !== "object") return { config: null, didMutate: false };
    if (!Array.isArray(raw.actions)) return { config: null, didMutate: false };

    const usedActionIds = new Set<string>();
    let didMutate = false;
    const actions = raw.actions
      .map((actionRaw: any) => {
        const { action, didMutate: actionMutated } = this.normalizeAction(actionRaw, usedActionIds);
        if (actionMutated) {
          didMutate = true;
        }
        return action;
      })
      .filter((action: Action | null): action is Action => action !== null);

    const normalized: Config = {
      actions,
    };

    if (Array.isArray(raw.groups)) {
      normalized.groups = raw.groups;
    }

    if (Array.isArray(raw.icons)) {
      normalized.icons = raw.icons;
    }

    // Migration: Legacy todos array -> ignore or migrate if needed
    // Current: todos object -> Keep for backward compatibility but migrate to todoLists if missing
    if (raw.todos && typeof raw.todos === "object" && !Array.isArray(raw.todos)) {
      normalized.todos = raw.todos;
    }

    if (raw.todoLists && typeof raw.todoLists === "object") {
      normalized.todoLists = raw.todoLists;
      normalized.activeTodoList = raw.activeTodoList;
    } else if (normalized.todos) {
      // Auto-migrate legacy single list to "default" list
      const defaultListId = "default";
      normalized.todoLists = {
        [defaultListId]: {
          id: defaultListId,
          name: "Main List",
          todos: normalized.todos,
          icon: "list-flat"
        }
      };
      normalized.activeTodoList = defaultListId;
    }



    if (Array.isArray(raw.customColors)) {
      normalized.customColors = raw.customColors;
    }

    if (raw.discovery && typeof raw.discovery === "object") {
      normalized.discovery = this.normalizeDiscoveryProfile(raw.discovery);
    }

    if (Array.isArray(raw.workflows)) {
      const usedWorkflowIds = new Set<string>();
      normalized.workflows = raw.workflows
        .map((workflowRaw: any) => {
          const { workflow, didMutate: workflowMutated } = this.normalizeWorkflow(workflowRaw, usedWorkflowIds);
          if (workflowMutated) {
            didMutate = true;
          }
          return workflow;
        })
        .filter((workflow: Workflow | null): workflow is Workflow => workflow !== null);
    }

    return { config: normalized, didMutate };
  }

  private normalizeDiscoveryProfile(raw: any): DiscoveryProfile {
    const sources = raw?.sources && typeof raw.sources === "object" ? raw.sources : {};

    return {
      version: ConfigService.DISCOVERY_PROFILE_VERSION,
      sources: {
        npm: sources.npm === true,
        tasks: sources.tasks === true,
        launch: sources.launch === true,
        docker: sources.docker === true,
        make: sources.make === true,
        rust: sources.rust === true,
        go: sources.go === true,
      },
      deepScan: raw?.deepScan === true,
      detectionMethod:
        raw?.detectionMethod === "file" || raw?.detectionMethod === "command" || raw?.detectionMethod === "hybrid"
          ? raw.detectionMethod
          : undefined,
      enableGrouping: raw?.enableGrouping === true ? true : undefined,
      enableColoring: raw?.enableColoring === true ? true : undefined,
      secondaryGroupBy:
        raw?.secondaryGroupBy === "auto" || raw?.secondaryGroupBy === "workspace" || raw?.secondaryGroupBy === "type" || raw?.secondaryGroupBy === "none"
          ? raw.secondaryGroupBy
          : undefined,
      generatedAt: typeof raw?.generatedAt === "number" ? raw.generatedAt : undefined,
    };
  }

  private async persistNormalizedConfig(uri: vscode.Uri, config: Config): Promise<number> {
    await this.writeText(uri, JSON.stringify(config, null, 2));
    const stat = await vscode.workspace.fs.stat(uri);
    return stat.mtime;
  }

  private getTimestampLabel(): string {
    const now = new Date();
    return now.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  /** Append config to JSONL history file */
  private async appendToHistory(config: Config, label: string): Promise<void> {
    const historyUri = this.getHistoryUri();
    if (!historyUri) return;

    const vsCodeFolder = this.getVSCodeFolderUri();
    if (vsCodeFolder) await this.ensureDir(vsCodeFolder);

    const entry: HistoryEntry = {
      timestamp: Date.now(),
      label,
      config,
    };

    const line = JSON.stringify(entry) + '\n';

    try {
      // Append to existing file or create new
      let existing = '';
      if (await this.fileExists(historyUri)) {
        existing = await this.readText(historyUri);
      }
      await this.writeText(historyUri, existing + line);
    } catch (error) {
      console.error('Failed to append to history:', error);
    }
  }

  /** Read all history entries from JSONL file */
  private async readHistory(): Promise<HistoryEntry[]> {
    const historyUri = this.getHistoryUri();
    if (!historyUri || !(await this.fileExists(historyUri))) {
      return [];
    }

    try {
      const content = await this.readText(historyUri);
      const lines = content.split('\n').filter(line => line.trim());
      const entries: HistoryEntry[] = [];

      for (const line of lines) {
        try {
          const entry = JSON.parse(line) as HistoryEntry;
          entries.push(entry);
        } catch {
          // Skip invalid lines
        }
      }

      return entries.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
  }

  /** Migrate old .battle/versions/*.json files to JSONL history */
  private async migrateLegacyVersions(): Promise<void> {
    const legacyVersionsDir = this.getLegacyVersionsFolderUri();
    if (!legacyVersionsDir || !(await this.fileExists(legacyVersionsDir))) {
      return;
    }

    try {
      const entries = await vscode.workspace.fs.readDirectory(legacyVersionsDir);
      const files = entries.filter(([, type]) => type === vscode.FileType.File);

      for (const [name] of files) {
        if (!name.startsWith('battle.config.')) continue;

        const uri = vscode.Uri.joinPath(legacyVersionsDir, name);
        try {
          const raw = await this.readText(uri);
          const config = JSON.parse(raw);
          const normalized = this.normalizeConfig(config);
          if (normalized.config) {
            const stat = await vscode.workspace.fs.stat(uri);
            const entry: HistoryEntry = {
              timestamp: stat.mtime,
              label: new Date(stat.mtime).toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }),
              config: normalized.config,
            };

            const historyUri = this.getHistoryUri();
            if (historyUri) {
              const vsCodeFolder = this.getVSCodeFolderUri();
              if (vsCodeFolder) await this.ensureDir(vsCodeFolder);

              let existing = '';
              if (await this.fileExists(historyUri)) {
                existing = await this.readText(historyUri);
              }
              const line = JSON.stringify(entry) + '\n';
              await this.writeText(historyUri, existing + line);
            }
          }
        } catch {
          // Skip invalid files
        }
      }
    } catch {
      // Migration failed, not critical
    }
  }

  /* ─── Public API ─── */

  /** Resolve the config path, auto-migrating from legacy locations if needed. */
  async resolveConfigUri(): Promise<vscode.Uri | undefined> {
    const newUri = this.getConfigUri();
    if (!newUri) return undefined;

    // Check new location first
    if (await this.fileExists(newUri)) {
      return newUri;
    }

    // Check .vscode/battle.config and migrate
    const oldUri = this.getOldConfigUri();
    if (oldUri && (await this.fileExists(oldUri))) {
      const migrated = await this.migrateConfig(oldUri, newUri);
      if (migrated) {
        await this.migrateLegacyVersions();
        // Optional: Delete old config after successful migration? 
        // Better to keep it for safety for now, or maybe rename it to .bak?
        // Users might be confused if they see both. Let's delete it if migration succeeded.
        try {
          await vscode.workspace.fs.delete(oldUri);
        } catch { }
      }
      return migrated ? newUri : oldUri;
    }

    // Check legacy locations and migrate
    const legacyBattle = this.getLegacyBattleFolderConfigUri();
    if (legacyBattle && (await this.fileExists(legacyBattle))) {
      const migrated = await this.migrateConfig(legacyBattle, newUri);
      if (migrated) {
        await this.migrateLegacyVersions(); // Also migrate version history
      }
      return migrated ? newUri : legacyBattle;
    }

    const legacyRoot = this.getLegacyRootConfigUri();
    if (legacyRoot && (await this.fileExists(legacyRoot))) {
      const migrated = await this.migrateConfig(legacyRoot, newUri);
      return migrated ? newUri : legacyRoot;
    }

    return newUri; // default location for new configs
  }

  async configExists(): Promise<boolean> {
    const uri = await this.resolveConfigUri();
    return uri !== undefined && (await this.fileExists(uri));
  }

  async getConfigStatus(): Promise<{
    uri?: vscode.Uri;
    exists: boolean;
    valid: boolean;
    config?: Config;
    error?: string;
  }> {
    const uri = await this.resolveConfigUri();
    if (!uri) {
      return { exists: false, valid: false };
    }

    if (!(await this.fileExists(uri))) {
      return { uri, exists: false, valid: false };
    }

    try {
      const raw = await this.readText(uri);
      const parsed = JSON.parse(raw);
      const { config, didMutate } = this.normalizeConfig(parsed);
      if (!config) {
        return { uri, exists: true, valid: false, error: "Invalid config structure" };
      }
      if (didMutate) {
        await this.persistNormalizedConfig(uri, config);
      }
      return { uri, exists: true, valid: true, config };
    } catch (error) {
      return {
        uri,
        exists: true,
        valid: false,
        error: (error as Error).message,
      };
    }
  }

  async readConfig(): Promise<Config> {
    const uri = await this.resolveConfigUri();
    if (!uri) return { actions: [] };

    try {
      const stat = await vscode.workspace.fs.stat(uri);
      const mtime = stat.mtime;

      if (this.configCache && this.configCache.timestamp === mtime) {
        return this.configCache.config;
      }

      const raw = await this.readText(uri);
      const parsed = JSON.parse(raw);
      const { config, didMutate } = this.normalizeConfig(parsed);
      if (!config) return { actions: [] };

      let cacheTimestamp = mtime;
      if (didMutate) {
        cacheTimestamp = await this.persistNormalizedConfig(uri, config);
      }

      this.configCache = { config, timestamp: cacheTimestamp };
      return config;
    } catch {
      return { actions: [] };
    }
  }

  async writeConfig(config: Config): Promise<void> {
    const uri = await this.resolveConfigUri();
    if (!uri) {
      console.error('[ConfigService] writeConfig: resolveConfigUri returned undefined — no workspace open?');
      throw new Error('Cannot write config: no valid config path resolved. Is a workspace open?');
    }

    // Ensure the parent directory of the resolved config URI exists.
    // This correctly handles both the default (.vscode/) and custom paths.
    const parentUri = vscode.Uri.joinPath(uri, '..');
    await this.ensureDir(parentUri);

    // Save to history before overwriting
    if (await this.fileExists(uri)) {
      try {
        const existing = await this.readConfig();
        await this.appendToHistory(existing, this.getTimestampLabel());
      } catch {
        // Failed to backup, continue anyway
      }
    }

    const normalized = this.normalizeConfig(config);
    if (!normalized.config) {
      throw new Error("Cannot write invalid config structure.");
    }

    const json = JSON.stringify(normalized.config, null, 2);
    await this.writeText(uri, json);
    this.notifyConfigChanged();
    await this.refreshTrackedManifestWatchers(normalized.config);

    // Verify the write succeeded
    if (!(await this.fileExists(uri))) {
      console.error('[ConfigService] writeConfig: file does not exist after write at', uri.fsPath);
      throw new Error(`Config file was not created at ${uri.fsPath}`);
    }
  }

  async deleteConfig(): Promise<{ deleted: boolean; location?: string }> {
    const locations: string[] = [];

    // Delete from new location
    const newUri = this.getConfigUri();
    if (newUri && (await this.fileExists(newUri))) {
      try {
        const config = await this.readConfig();
        await this.appendToHistory(config, `Deleted: ${this.getTimestampLabel()}`);
      } catch {
        // Continue even if backup fails
      }
      await vscode.workspace.fs.delete(newUri);
      locations.push(".vscode/battle.json");
    }

    // Delete from old location (.vscode/battle.config)
    const oldUri = this.getOldConfigUri();
    if (oldUri && (await this.fileExists(oldUri))) {
      await vscode.workspace.fs.delete(oldUri);
      locations.push(".vscode/battle.config");
    }

    // Delete from legacy locations
    const legacyBattle = this.getLegacyBattleFolderConfigUri();
    if (legacyBattle && (await this.fileExists(legacyBattle))) {
      await vscode.workspace.fs.delete(legacyBattle);
      locations.push(".battle/battle.config");
    }

    const legacyRoot = this.getLegacyRootConfigUri();
    if (legacyRoot && (await this.fileExists(legacyRoot))) {
      await vscode.workspace.fs.delete(legacyRoot);
      locations.push("battle.config");
    }

    if (locations.length > 0) {
      this.notifyConfigChanged();
      this.disposeTrackedManifestWatchers();
      return { deleted: true, location: locations.join(", ") };
    }

    return { deleted: false };
  }

  async openConfigFile(): Promise<boolean> {
    const uri = await this.resolveConfigUri();
    if (!uri || !(await this.fileExists(uri))) {
      return false;
    }
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc);
    return true;
  }

  async openConfigFolder(): Promise<void> {
    const customPath = this.getCustomConfigPath();
    const folderUri = customPath
      ? vscode.Uri.file(customPath)
      : this.getVSCodeFolderUri();

    if (!folderUri) {
      vscode.window.showWarningMessage('No workspace folder is open.');
      return;
    }

    await this.ensureDir(folderUri);

    try {
      await vscode.env.openExternal(folderUri);
    } catch {
      await vscode.commands.executeCommand('revealFileInOS', folderUri);
    }
  }

  invalidateCache(): void {
    this.configCache = undefined;
  }

  private notifyConfigChanged(): void {
    this.invalidateCache();
    this._onDidChange.fire();
  }

  async listConfigVersions(): Promise<{ label: string; timestamp: number; config: Config }[]> {
    const history = await this.readHistory();
    return history.map(entry => ({
      label: entry.label,
      timestamp: entry.timestamp,
      config: entry.config,
    }));
  }

  async clearHistory(): Promise<{ deleted: boolean }> {
    const historyUri = this.getHistoryUri();
    if (historyUri && (await this.fileExists(historyUri))) {
      await vscode.workspace.fs.delete(historyUri);
      this.invalidateCache();
      return { deleted: true };
    }
    return { deleted: false };
  }

  async restoreConfigVersion(timestamp: number): Promise<void> {
    const history = await this.readHistory();
    const entry = history.find(e => e.timestamp === timestamp);
    if (!entry) {
      throw new Error('History entry not found');
    }

    const configUri = await this.resolveConfigUri();
    if (!configUri) return;

    const vsCodeFolder = this.getVSCodeFolderUri();
    if (vsCodeFolder) await this.ensureDir(vsCodeFolder);

    // Save current config to history before restoring
    if (await this.fileExists(configUri)) {
      try {
        const current = await this.readConfig();
        await this.appendToHistory(current, `Before restore: ${this.getTimestampLabel()}`);
      } catch {
        // Continue even if backup fails
      }
    }

    await this.writeText(configUri, JSON.stringify(entry.config, null, 2));
    this.notifyConfigChanged();
    await this.refreshTrackedManifestWatchers(entry.config);
  }

  /* ─── Scanning helpers ─── */

  async scanNpmScripts(deepScan: boolean = false): Promise<Action[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) return [];

    const allActions: Action[] = [];
    const seenActions = new Set<string>();

    for (const folder of workspaceFolders) {
      const isRootWorkspace = workspaceFolders.length === 1;
      const workspaceName = folder.name;

      // Scan root package.json
      const pkgUri = vscode.Uri.joinPath(folder.uri, "package.json");
      if (await this.fileExists(pkgUri)) {
        try {
          const raw = await this.readText(pkgUri);
          const pkg = JSON.parse(raw);
          const scripts = pkg.scripts || {};
          Object.keys(scripts).forEach((name) => {
            const command = `npm run ${name}`;
            const key = `${name}|${command}|root`;

            if (!seenActions.has(key)) {
              seenActions.add(key);
              const action: Action = {
                name: name,
                command: command,
                type: "npm",
                cwd: folder.uri.fsPath,
                workspace: isRootWorkspace ? undefined : workspaceName,
              };
              allActions.push(action);
            }
          });
        } catch {
          // Skip invalid package.json
        }
      }

      // Recursively scan subdirectories for package.json files
      if (deepScan) {
        await this.scanNpmScriptsRecursive(folder.uri, allActions, seenActions, workspaceName, isRootWorkspace);
      }
    }

    return allActions;
  }

  private async scanNpmScriptsRecursive(
    dirUri: vscode.Uri,
    actions: Action[],
    seenActions: Set<string>,
    workspaceName: string,
    isRootWorkspace: boolean,
    depth = 0
  ): Promise<void> {
    // Prevent infinite recursion and skip node_modules
    if (depth > 10) return;

    try {
      const entries = await vscode.workspace.fs.readDirectory(dirUri);



      for (const [name, type] of entries) {
        // Skip common directories
        if (
          name === "node_modules" ||
          name === ".git" ||
          name === ".vscode-test" ||
          name === "dist" ||
          name === "build" ||
          name === "out" ||
          name === "coverage" ||
          name === ".next"
        ) {
          continue;
        }

        if (type === vscode.FileType.Directory) {
          const subDirUri = vscode.Uri.joinPath(dirUri, name);
          const pkgUri = vscode.Uri.joinPath(subDirUri, "package.json");

          if (await this.fileExists(pkgUri)) {
            try {
              const raw = await this.readText(pkgUri);
              const pkg = JSON.parse(raw);
              const scripts = pkg.scripts || {};
              const relativePath = vscode.workspace.asRelativePath(subDirUri, false);

              // Better monorepo support: use package name if available instead of raw path
              const workspaceNameOrPath = pkg.name || relativePath;
              const workspaceLabel = isRootWorkspace ? workspaceNameOrPath : `${workspaceName}/${workspaceNameOrPath}`;

              Object.keys(scripts).forEach((scriptName) => {
                // With cwd support, we don't need "cd ... &&" prefix anymore
                const command = `npm run ${scriptName}`;

                // Use a key that includes the relative path to distinguish same-named scripts in different folders
                const key = `${scriptName}|${command}|${workspaceLabel}`;

                if (!seenActions.has(key)) {
                  seenActions.add(key);
                  const action: Action = {
                    name: scriptName,
                    command: command,
                    type: "npm",
                    cwd: subDirUri.fsPath,
                    workspace: workspaceLabel
                  };
                  actions.push(action);
                }
              });

            } catch {
              // Skip invalid package.json
            }
          }

          // Continue scanning subdirectories
          await this.scanNpmScriptsRecursive(subDirUri, actions, seenActions, workspaceName, isRootWorkspace, depth + 1);
        }
      }
    } catch {
      // Skip directories we can't read
    }
  }



  private async findToolFiles(patterns: string[], deepScan: boolean): Promise<{ uri: vscode.Uri; isRoot: boolean; relativePath: string }[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) return [];

    const results: { uri: vscode.Uri; isRoot: boolean; relativePath: string }[] = [];
    
    for (const folder of workspaceFolders) {
      const isRootWorkspace = workspaceFolders.length === 1;

      if (deepScan) {
        try {
          // Use relative pattern to search only within this workspace folder
          const globPattern = `**/{${patterns.join(',')}}`;
          const relativePattern = new vscode.RelativePattern(folder, globPattern);
          const uris = await vscode.workspace.findFiles(
            relativePattern,
            ConfigService.MANIFEST_SEARCH_EXCLUDE
          );
          
          for (const uri of uris) {
            const relPath = vscode.workspace.asRelativePath(uri, false);
            const folderPath = relPath.substring(0, relPath.lastIndexOf('/')) || '';
            const workspaceLabel = isRootWorkspace 
              ? folderPath 
              : folderPath ? `${folder.name}/${folderPath}` : folder.name;
              
            results.push({
              uri,
              isRoot: folderPath === '',
              relativePath: workspaceLabel
            });
          }
        } catch {
          // ignore
        }
      } else {
        // Root only
        for (const pattern of patterns) {
          const uri = vscode.Uri.joinPath(folder.uri, pattern);
          if (await this.fileExists(uri)) {
            results.push({
              uri,
              isRoot: true,
              relativePath: isRootWorkspace ? '' : folder.name
            });
          }
        }
      }
    }
    // Deduplicate by path
    const unique = new Map<string, any>();
    for (const res of results) {
      unique.set(res.uri.fsPath, res);
    }
    return Array.from(unique.values());
  }

  private async findVsCodeManifestUris(
    fileName: "tasks.json" | "launch.json",
    deepScan: boolean
  ): Promise<vscode.Uri[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return [];
    }

    const uris = new Map<string, vscode.Uri>();

    for (const folder of workspaceFolders) {
      if (deepScan) {
        try {
          const matches = await vscode.workspace.findFiles(
            new vscode.RelativePattern(folder, `**/.vscode/${fileName}`),
            ConfigService.MANIFEST_SEARCH_EXCLUDE
          );
          for (const match of matches) {
            uris.set(match.toString(), match);
          }
        } catch {
          // Ignore unreadable folders during deep discovery.
        }
      } else {
        const uri = vscode.Uri.joinPath(folder.uri, ".vscode", fileName);
        if (await this.fileExists(uri)) {
          uris.set(uri.toString(), uri);
        }
      }
    }

    return Array.from(uris.values());
  }

  async scanMake(deepScan = false): Promise<Action[]> {
    const files = await this.findToolFiles(['Makefile', 'makefile', 'GNUmakefile'], deepScan);
    const actions: Action[] = [];
    
    for (const file of files) {
      try {
        const content = await this.readText(file.uri);
        const lines = content.split('\n');
        const cwd = vscode.Uri.joinPath(file.uri, '..').fsPath;
        
        let foundTargets = false;
        for (const line of lines) {
          const match = line.match(/^([a-zA-Z0-9_-]+):/);
          if (match) {
            const target = match[1];
            if (!target.startsWith('.') && !target.startsWith('%')) {
               foundTargets = true;
               actions.push({
                 name: `Make: ${target}`,
                 command: `make ${target}`,
                 type: "make",
                 cwd,
                 workspace: file.relativePath || undefined
               });
            }
          }
        }
        
        // Fallback default targets if regex fails to find any
        if (!foundTargets) {
           actions.push({ name: "Make: all", command: "make all", type: "make", cwd, workspace: file.relativePath || undefined });
           actions.push({ name: "Make: clean", command: "make clean", type: "make", cwd, workspace: file.relativePath || undefined });
        }
      } catch {
        // skip
      }
    }
    return actions;
  }

  async scanDocker(deepScan = false): Promise<Action[]> {
    const files = await this.findToolFiles(['docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml'], deepScan);
    const actions: Action[] = [];
    
    for (const file of files) {
      const cwd = vscode.Uri.joinPath(file.uri, '..').fsPath;
      actions.push({ name: "Docker Compose Up", command: "docker-compose up -d", type: "docker", cwd, workspace: file.relativePath || undefined });
      actions.push({ name: "Docker Compose Down", command: "docker-compose down", type: "docker", cwd, workspace: file.relativePath || undefined });
      actions.push({ name: "Docker Compose Logs", command: "docker-compose logs -f", type: "docker", cwd, workspace: file.relativePath || undefined });
    }
    return actions;
  }

  async scanRust(deepScan = false): Promise<Action[]> {
    const files = await this.findToolFiles(['Cargo.toml'], deepScan);
    const actions: Action[] = [];
    
    for (const file of files) {
      const cwd = vscode.Uri.joinPath(file.uri, '..').fsPath;
      // Could read Cargo.toml for workspace name, but using folder is fine for now
      actions.push({ name: "Cargo Build", command: "cargo build", type: "rust", cwd, workspace: file.relativePath || undefined });
      actions.push({ name: "Cargo Run", command: "cargo run", type: "rust", cwd, workspace: file.relativePath || undefined });
      actions.push({ name: "Cargo Test", command: "cargo test", type: "rust", cwd, workspace: file.relativePath || undefined });
    }
    return actions;
  }

  async scanGo(deepScan = false): Promise<Action[]> {
    const files = await this.findToolFiles(['go.mod'], deepScan);
    const actions: Action[] = [];
    
    for (const file of files) {
      const cwd = vscode.Uri.joinPath(file.uri, '..').fsPath;
      actions.push({ name: "Go Run", command: "go run .", type: "go", cwd, workspace: file.relativePath || undefined });
      actions.push({ name: "Go Test", command: "go test ./...", type: "go", cwd, workspace: file.relativePath || undefined });
      actions.push({ name: "Go Mod Tidy", command: "go mod tidy", type: "go", cwd, workspace: file.relativePath || undefined });
    }
    return actions;
  }

  async scanTasks(deepScan = false): Promise<Action[]> {
    const allActions: Action[] = [];
    const seenActions = new Set<string>();
    const manifestUris = await this.findVsCodeManifestUris("tasks.json", deepScan);

    for (const uri of manifestUris) {
      const tasksJson = await this.readJsoncFile(uri);
      const tasks = Array.isArray(tasksJson?.tasks) ? tasksJson.tasks : [];
      const manifestRoot = vscode.Uri.joinPath(uri, "..", "..");
      const workspaceLabel = this.getWorkspaceLabelForTarget(manifestRoot);

      for (const task of tasks) {
        if (task?.hide === true) {
          continue;
        }

        const label =
          (typeof task?.label === "string" && task.label.trim()) ||
          (typeof task?.script === "string" && task.script.trim()) ||
          (typeof task?.command === "string" && task.command.trim()) ||
          undefined;
        if (!label) {
          continue;
        }

        let secondaryGroup: string | undefined;
        if (typeof task?.group === "string") {
          secondaryGroup = task.group.charAt(0).toUpperCase() + task.group.slice(1);
        } else if (
          task?.group &&
          typeof task.group === "object" &&
          typeof task.group.kind === "string"
        ) {
          secondaryGroup = task.group.kind.charAt(0).toUpperCase() + task.group.kind.slice(1);
        }

        if (secondaryGroup?.toLowerCase() === "none") {
          secondaryGroup = undefined;
        }

        const workspaceValue = workspaceLabel && secondaryGroup
          ? `${workspaceLabel} - ${secondaryGroup}`
          : secondaryGroup || workspaceLabel;
        const key = `${label}|${workspaceValue || ""}`;
        if (seenActions.has(key)) {
          continue;
        }

        seenActions.add(key);
        allActions.push({
          name: label,
          command: `workbench.action.tasks.runTask|${label}`,
          type: "task",
          cwd: manifestRoot.fsPath,
          workspace: workspaceValue,
        });
      }
    }

    for (const action of await this.getWorkspaceFileTaskActions()) {
      const key = `${action.name}|${action.workspace || ""}`;
      if (!seenActions.has(key)) {
        seenActions.add(key);
        allActions.push(action);
      }
    }

    return allActions;
  }

  async scanLaunchConfigs(deepScan = false): Promise<Action[]> {
    const allActions: Action[] = [];
    const seenActions = new Set<string>();
    const manifestUris = await this.findVsCodeManifestUris("launch.json", deepScan);

    for (const uri of manifestUris) {
      const launchJson = await this.readJsoncFile(uri);
      const configs = Array.isArray(launchJson?.configurations)
        ? launchJson.configurations
        : [];
      const compounds = Array.isArray(launchJson?.compounds)
        ? launchJson.compounds
        : [];
      const manifestRoot = vscode.Uri.joinPath(uri, "..", "..");
      const workspaceLabel = this.getWorkspaceLabelForTarget(manifestRoot);

      for (const config of configs) {
        if (
          typeof config?.name !== "string" ||
          config.name.trim().length === 0 ||
          config?.presentation?.hidden === true
        ) {
          continue;
        }

        const name = config.name.trim();
        const key = `${name}|${workspaceLabel || ""}`;
        if (seenActions.has(key)) {
          continue;
        }

        seenActions.add(key);
        allActions.push({
          name,
          command: `workbench.action.debug.start|${name}`,
          type: "launch",
          workspace: workspaceLabel,
        });
      }

      for (const compound of compounds) {
        if (
          typeof compound?.name !== "string" ||
          compound.name.trim().length === 0 ||
          compound?.presentation?.hidden === true
        ) {
          continue;
        }

        const name = compound.name.trim();
        const key = `${name}|${workspaceLabel || ""}`;
        if (seenActions.has(key)) {
          continue;
        }

        seenActions.add(key);
        allActions.push({
          name,
          command: `workbench.action.debug.start|${name}`,
          type: "launch",
          workspace: workspaceLabel,
        });
      }
    }

    for (const action of await this.getWorkspaceFileLaunchActions()) {
      const key = `${action.name}|${action.workspace || ""}`;
      if (!seenActions.has(key)) {
        seenActions.add(key);
        allActions.push(action);
      }
    }

    return allActions;
  }

  async hasSource(kind: "npm" | "tasks" | "launch"): Promise<boolean> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) return false;

    if (kind === "tasks") {
      if ((await this.findVsCodeManifestUris("tasks.json", true)).length > 0) {
        return true;
      }

      return (await this.getWorkspaceFileTaskActions()).length > 0;
    }

    if (kind === "launch") {
      if ((await this.findVsCodeManifestUris("launch.json", true)).length > 0) {
        return true;
      }

      return (await this.getWorkspaceFileLaunchActions()).length > 0;
    }

    const packageJsonFiles = await vscode.workspace.findFiles(
      "**/package.json",
      ConfigService.MANIFEST_SEARCH_EXCLUDE,
      1
    );
    return packageJsonFiles.length > 0;
  }

  /** Check if a file exists relative to workspace root. */
  async fileExistsInWorkspace(relativePath: string): Promise<boolean> {
    const root = this.getWorkspaceRoot();
    if (!root) return false;
    return this.fileExists(vscode.Uri.joinPath(root, relativePath));
  }

  /** Create a minimal config with 2 demo actions. */
  async createMinimalConfig(defaultIcons: IconMapping[]): Promise<void> {
    const config: Config = {
      actions: [
        {
          name: "👋 Hello Battlestation",
          command: "workbench.action.showCommands",
          type: "vscode",
        },
        {
          name: "🚀 Open Terminal",
          command: "workbench.action.terminal.new",
          type: "vscode",
        },
      ],
      icons: defaultIcons,
    };
    await this.writeConfig(config);
  }

  /** Create an example config with helpful placeholders for getting started. */
  async createExampleConfig(defaultIcons: IconMapping[]): Promise<void> {
    const config: Config = {
      actions: [
        {
          name: "Build Project",
          command: "npm run build",
          type: "npm",
          group: "Build"
        },
        {
          name: "Run Tests",
          command: "npm test",
          type: "npm",
          group: "Test"
        },
        {
          name: "Start Dev Server",
          command: "npm run dev",
          type: "npm",
          group: "Development"
        },
        {
          name: "Open VS Code Settings",
          command: "workbench.action.openSettings",
          type: "vscode"
        },
        {
          name: "Custom Shell Command",
          command: "echo 'Replace me with your command'",
          type: "shell"
        },
      ],
      groups: [
        { name: "Build", icon: "tools", color: "var(--vscode-charts-blue)" },
        { name: "Test", icon: "beaker", color: "var(--vscode-charts-green)" },
        { name: "Development", icon: "rocket", color: "var(--vscode-charts-orange)" }
      ],
      icons: defaultIcons,
    };
    await this.writeConfig(config);
  }

  /** Auto-generate config by scanning workspace sources. */
  async createAutoConfig(
    sources: DiscoverySources,
    groupByType: boolean,
    defaultIcons: IconMapping[],
    enhancedActions?: Action[],
    enableColoring: boolean = false,
    deepScan: boolean = false,
    secondaryGroupBy: 'auto' | 'workspace' | 'type' | 'none' = 'auto'
  ): Promise<void> {
    const actions: Action[] = [];
    const groups: Group[] = [];
    const usedPrimaryGroupColors = new Set<string>();
    const usedSecondaryGroupColors = new Set<string>();

    const assignDistinctPrimaryColor = (groupName: string): string | undefined => {
      if (!enableColoring) return undefined;
      const color = pickDistinctThemeColor(groupName, usedPrimaryGroupColors);
      usedPrimaryGroupColors.add(color);
      return color;
    };

    const assignDistinctSecondaryColor = (groupName: string): string | undefined => {
      if (!enableColoring) return undefined;
      const color = pickDistinctThemeColor(groupName, usedSecondaryGroupColors);
      usedSecondaryGroupColors.add(color);
      return color;
    };

    // 1. Gather actions from enabled sources
    if (sources.npm) {
      actions.push(...(await this.scanNpmScripts(deepScan)));
    }
    if (sources.make) {
      actions.push(...(await this.scanMake(deepScan)));
    }
    if (sources.rust) {
      actions.push(...(await this.scanRust(deepScan)));
    }
    if (sources.go) {
      actions.push(...(await this.scanGo(deepScan)));
    }
    if (sources.docker) {
      actions.push(...(await this.scanDocker(deepScan)));
    }
    if (sources.tasks) {
      actions.push(...(await this.scanTasks(deepScan)));
    }
    if (sources.launch) {
      actions.push(...(await this.scanLaunchConfigs(deepScan)));
    }

    // 2. Identify likely groups if grouping is enabled
    // ... logic to create groups from actions ...
    if (groupByType) {
      if (enhancedActions && enhancedActions.length > 0) {
        // If we have enhanced actions, we might want to respect their type/groups too
        // For now, let's just append them to actions and let standard grouping handle them if they fit?
        // Actually enhancedActions already have types like 'docker', 'python'. 
        // We should group them.

        // Let's just merge them into actions first?
        // But the previous implementation (in original code) handles enhancedActions separately?
        // Wait, the previous implementation did:
        // actions.push(...enhancedActions) at the end. 
        // But the grouping logic was BEFORE that push.
        // Let's look at the original code structure.

        // Original code:
        // 1. Scan npm, tasks, launch -> actions
        // 2. Grouping logic on `actions`
        // 3. actions.push(...enhancedActions)
        // 4. Ensure groups have colors

        // I need to preserve this structure but make coloring conditional.

        // Re-reading original file content via tool helps.
      }

      const typeGroups = new Map<string, Action[]>();
      // Group actions by type (npm, task, launch, etc.)
      actions.forEach(a => {
        let type = a.type || 'other';
        if (a.name.startsWith('npm: ')) type = 'npm';
        else if (a.name.startsWith('Task: ')) type = 'task';
        else if (a.name.startsWith('Launch: ')) type = 'launch';

        if (!typeGroups.has(type)) typeGroups.set(type, []);
        typeGroups.get(type)!.push(a);
      });

      const typeGroupNames: Record<string, string> = {
        npm: "NPM Scripts",
        task: "VS Code Tasks",
        launch: "Launch Configs",
        docker: "Docker",
        make: "Makefiles",
        rust: "Rust",
        go: "Go"
      };

      const typeGroupIcons: Record<string, string> = {
        npm: "package",
        task: "checklist",
        launch: "rocket",
        docker: "server-environment",
        make: "tools",
        rust: "gear",
        go: "terminal"
      };

      const sortedTypes = Array.from(typeGroups.keys()).sort((a, b) => {
        // Sort order: npm, docker, make, rust, go, task, launch, others
        const order = ['npm', 'docker', 'make', 'rust', 'go', 'task', 'launch'];
        const idxA = order.indexOf(a);
        const idxB = order.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
      });

      sortedTypes.forEach(type => {
        const actionsInType = typeGroups.get(type)!;
        const groupName = typeGroupNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
        groups.push({
          name: groupName,
          icon: typeGroupIcons[type] || "\ud83d\udce6",
          color: assignDistinctPrimaryColor(groupName)
        });
        actionsInType.forEach((action) => (action.group = groupName));
      });

      // Infer secondaryGroupBy for each generated group
      groups.forEach(g => {
        const resolved = secondaryGroupBy === 'none'
          ? undefined
          : secondaryGroupBy === 'workspace' ? 'workspace'
          : secondaryGroupBy === 'type' ? 'type'
          : (() => {
              // 'auto': inspect actions in this group
              const groupActions = actions.filter(a => a.group === g.name);
              const distinctWorkspaces = new Set(groupActions.map(a => a.workspace).filter((w): w is string => !!w));
              if (distinctWorkspaces.size > 1) return 'workspace';
              return undefined;
            })();
        if (resolved) {
          g.secondaryGroupBy = resolved as 'workspace' | 'type';
        }
      });
    }

    if (enhancedActions && enhancedActions.length > 0) {
      if (groupByType) {
        // Group enhanced actions
        const typeGroups = new Map<string, Action[]>();
        enhancedActions.forEach(a => {
          const type = a.type;
          if (!typeGroups.has(type)) typeGroups.set(type, []);
          typeGroups.get(type)!.push(a);
        });

        typeGroups.forEach((actionsInType, type) => {
          // Reuse existing group if exists
          const groupName = type.charAt(0).toUpperCase() + type.slice(1);
          let group = groups.find(g => g.name === groupName);
          if (!group) {
            group = {
              name: groupName,
              icon: "\ud83d\udce6", // Simple default, can refine
              color: assignDistinctPrimaryColor(groupName)
            };
            groups.push(group);
          }
          actionsInType.forEach(action => action.group = groupName);
        });
      }
      actions.push(...enhancedActions);
    }

    // Ensure standard groups also have colors (NPM, Tasks, Launch) if missing
    // AND coloring is enabled
    groups.forEach(g => {
      if (!g.color && enableColoring) {
        g.color = assignDistinctPrimaryColor(g.name);
      }
    });

    if (enableColoring) {
      actions.forEach(a => {
        if (a.workspace && !a.workspaceColor) {
           const color = assignDistinctSecondaryColor(a.workspace);
           if (color) {
             a.workspaceColor = color;
           }
        }
      });
    }

    // Final sorting of actions by group
    const sortedActions: Action[] = [];
    const groupOrder = new Map(groups.map((g, i) => [g.name, i]));

    actions.sort((a, b) => {
      const gA = a.group ? groupOrder.get(a.group) ?? 999 : 999;
      const gB = b.group ? groupOrder.get(b.group) ?? 999 : 999;
      if (gA !== gB) return gA - gB;
      return a.name.localeCompare(b.name);
    });


    if (actions.length === 0) {
      actions.push(
        { name: "Build Project", command: "npm run build", type: "build" },
        { name: "Open Terminal", command: "workbench.action.terminal.new", type: "vscode" }
      );
    }

    // Merge with existing config if present
    let finalActions = actions;
    let finalGroups: Group[] | undefined = groups.length > 0 ? groups : undefined;
    let finalIcons: IconMapping[] = defaultIcons;
    let finalWorkflows: Workflow[] | undefined;

    const exists = await this.configExists();
    if (exists) {
      try {
        const existingConfig = await this.readConfig();
        finalWorkflows = existingConfig.workflows;
        const existingActionsByKey = new Map(
          existingConfig.actions.map((action) => [getWorkflowActionKey(action), action] as const)
        );
        const normalizedScannedActions = actions.map((action) => {
          const existing = existingActionsByKey.get(getWorkflowActionKey(action));
          if (!existing) {
            return action;
          }

          return {
            ...action,
            id: existing.id,
            hidden: existing.hidden,
            backgroundColor: existing.backgroundColor,
            rowBackgroundColor: existing.rowBackgroundColor,
            params: existing.params,
            group: existing.group ?? action.group,
            workspaceColor: existing.workspaceColor ?? action.workspaceColor,
          };
        });
        const autoGeneratedPrefixes = ["npm: ", "Task: ", "Launch: "];
        const newKeys = new Set(normalizedScannedActions.map((action) => getWorkflowActionKey(action)));
        const customActions = existingConfig.actions.filter(
          (item) => !autoGeneratedPrefixes.some((prefix) => item.name.startsWith(prefix)) &&
                    !newKeys.has(getWorkflowActionKey(item))
        );
        finalActions = [...normalizedScannedActions, ...customActions];

        if (existingConfig.groups && existingConfig.groups.length > 0) {
          const existingNames = new Set(existingConfig.groups.map((g) => g.name));
          const newGroups = groups.filter((g) => !existingNames.has(g.name));
          finalGroups = [...existingConfig.groups, ...newGroups];
        }

        if (existingConfig.icons) {
          const existingMap = new Map(existingConfig.icons.map((i) => [i.type, i.icon]));
          defaultIcons.forEach((d) => {
            if (!existingMap.has(d.type)) existingMap.set(d.type, d.icon);
          });
          finalIcons = Array.from(existingMap.entries()).map(([type, icon]) => ({ type, icon }));
        }
      } catch {
        /* use new config */
      }
    }

    const config: Config = {
      actions: finalActions,
      groups: finalGroups,
      icons: finalIcons,
      workflows: finalWorkflows,
      discovery: {
        version: ConfigService.DISCOVERY_PROFILE_VERSION,
        sources: {
          npm: sources.npm === true,
          tasks: sources.tasks === true,
          launch: sources.launch === true,
          docker: sources.docker === true,
          make: sources.make === true,
          rust: sources.rust === true,
          go: sources.go === true,
        },
        deepScan,
        enableGrouping: groupByType,
        enableColoring,
        secondaryGroupBy,
        generatedAt: Date.now(),
      },
    };
    await this.writeConfig(config);
  }

  /** 
   * Rescans all discoverable sources and synchronizes the config. 
   * Removes references to scripts that no longer exist, and adds new ones. 
   */
  async syncConfig(deepScan = false): Promise<void> {
    const exists = await this.configExists();
    if (!exists) return; // Nothing to sync

    const existingConfig = await this.readConfig();
    const discoveryProfile = this.getEffectiveDiscoveryProfile(
      existingConfig,
      deepScan
    );
    const effectiveSources = discoveryProfile?.sources ?? {};
    const effectiveDeepScan = discoveryProfile?.deepScan ?? deepScan;
    const discoverableTypes = new Set(
      (Object.entries(ConfigService.DISCOVERABLE_TYPES_BY_SOURCE) as Array<
        [keyof DiscoverySources, string[]]
      >)
        .filter(([source]) => effectiveSources[source] === true)
        .flatMap(([, types]) => types)
    );

    if (discoverableTypes.size === 0) {
      return;
    }
    
    // 1. Gather current reality from disk
    const newActions: Action[] = [];
    if (effectiveSources.npm) {
      newActions.push(...(await this.scanNpmScripts(effectiveDeepScan)));
    }
    if (effectiveSources.make) {
      newActions.push(...(await this.scanMake(effectiveDeepScan)));
    }
    if (effectiveSources.rust) {
      newActions.push(...(await this.scanRust(effectiveDeepScan)));
    }
    if (effectiveSources.go) {
      newActions.push(...(await this.scanGo(effectiveDeepScan)));
    }
    if (effectiveSources.docker) {
      newActions.push(...(await this.scanDocker(effectiveDeepScan)));
    }
    if (effectiveSources.tasks) {
      newActions.push(...(await this.scanTasks(effectiveDeepScan)));
    }
    if (effectiveSources.launch) {
      newActions.push(...(await this.scanLaunchConfigs(effectiveDeepScan)));
    }

    const newActionsMap = new Map<string, Action>();
    newActions.forEach(action => newActionsMap.set(getWorkflowActionKey(action), action));
    const finalActions: Action[] = [];
    
    // 2. Process existing actions
    for (const existing of existingConfig.actions) {
      if (discoverableTypes.has(existing.type || '')) {
         const key = getWorkflowActionKey(existing);
         const newActionMatch = newActionsMap.get(key);
         if (newActionMatch) {
            // It still exists in the workspace. Keep the user's customized version and ID.
            finalActions.push({
              ...newActionMatch,
              ...existing,
              id: existing.id ?? newActionMatch.id,
            });
         } else {
            // It is an auto-discoverable tool that no longer exists (e.g. script removed from package.json).
            // Do not keep it. (Lost reference logic)
         }
      } else {
         // It is a manually added tool (shell, vscode, etc.). Always keep.
         finalActions.push(existing);
      }
    }

    // 3. Add strictly NEW actions discovered
    const existingKeys = new Set(finalActions.map((action) => getWorkflowActionKey(action)));
    const finalGroups = [...(existingConfig.groups || [])];
    const groupNamesSet = new Set(finalGroups.map(g => g.name));

    const typeGroupNames: Record<string, string> = {
      npm: "NPM Scripts", task: "VS Code Tasks", launch: "Launch Configs",
      docker: "Docker", make: "Makefiles", rust: "Rust", go: "Go"
    };

    const typeGroupIcons: Record<string, string> = {
      npm: "package", task: "checklist", launch: "rocket",
      docker: "server-environment", make: "tools", rust: "gear", go: "terminal"
    };

    for (const newAct of newActions) {
      const key = getWorkflowActionKey(newAct);
      if (!existingKeys.has(key)) {
         // Attempt to place in a default group
         const defaultGroupName = typeGroupNames[newAct.type || 'other'];
         if (defaultGroupName) {
             newAct.group = defaultGroupName;
             if (!groupNamesSet.has(defaultGroupName)) {
                 finalGroups.push({
                     name: defaultGroupName,
                     icon: typeGroupIcons[newAct.type || 'other'] || "folder",
                     color: this.getDefaultColorForGroup(defaultGroupName)
                 });
                 groupNamesSet.add(defaultGroupName);
             }
         }
         finalActions.push(newAct);
      }
    }

    const newConfig: Config = { 
       ...existingConfig, 
       actions: finalActions,
       groups: finalGroups.length > 0 ? finalGroups : undefined,
       discovery: discoveryProfile ?? existingConfig.discovery,
    };

    await this.writeConfig(newConfig);
  }

  /* ─── Private ─── */

  private getDefaultColorForGroup(name: string): string | undefined {
    return getPreferredThemeColorForName(name);
  }

  private getDefaultIconForGroup(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('npm') || lower.includes('node')) return "package";
    if (lower.includes('task')) return "checklist";
    if (lower.includes('launch') || lower.includes('debug')) return "rocket";
    if (lower.includes('docker') || lower.includes('container')) return "server";
    if (lower.includes('python')) return "snake";
    if (lower.includes('go')) return "go";
    if (lower.includes('rust')) return "gear";
    if (lower.includes('test')) return "beaker";
    if (lower.includes('build')) return "tools";
    if (lower.includes('git')) return "git-branch";
    return "folder";
  }

  private async migrateConfig(
    oldUri: vscode.Uri,
    newUri: vscode.Uri
  ): Promise<boolean> {
    try {
      const vsCodeFolder = this.getVSCodeFolderUri();
      if (vsCodeFolder) await this.ensureDir(vsCodeFolder);
      await vscode.workspace.fs.copy(oldUri, newUri, { overwrite: false });
      return true;
    } catch (error) {
      console.error("Failed to migrate config:", error);
      return false;
    }
  }

  private stripJsonComments(jsonStr: string): string {
    let result = '';
    let i = 0;
    const len = jsonStr.length;
    let inString = false;

    while (i < len) {
      const char = jsonStr[i];
      const nextChar = jsonStr[i + 1];

      if (inString) {
        result += char;
        if (char === '\\' && i + 1 < len) {
          result += jsonStr[++i]; // Skip escaped char
        } else if (char === '"') {
          inString = false;
        }
      } else {
        if (char === '"') {
          inString = true;
          result += char;
        } else if (char === '/' && nextChar === '/') {
          // Single line comment
          i += 2;
          while (i < len && jsonStr[i] !== '\n') i++;
          continue; // Skip the newline too if you want, or keep it
        } else if (char === '/' && nextChar === '*') {
          // Multi line comment
          i += 2;
          while (i + 1 < len && !(jsonStr[i] === '*' && jsonStr[i + 1] === '/')) i++;
          i++; // Skip last '/'
        } else {
          result += char;
        }
      }
      i++;
    }
    return result;
  }
}
