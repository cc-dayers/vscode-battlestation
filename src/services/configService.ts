import * as vscode from "vscode";
import type { Config, Action, Group, IconMapping } from "../types";

/**
 * Async config service using vscode.workspace.fs instead of sync Node fs.
 * Compatible with remote workspaces and VS Code for Web.
 */
export class ConfigService {
  private configCache?: { config: Config; timestamp: number };
  private fileWatcher?: vscode.FileSystemWatcher;

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

  constructor(private readonly context: vscode.ExtensionContext) {
    this.setupFileWatcher();
  }

  /* ─── Workspace helpers ─── */

  private getWorkspaceRoot(): vscode.Uri | undefined {
    return vscode.workspace.workspaceFolders?.[0]?.uri;
  }

  private getBattleFolderUri(): vscode.Uri | undefined {
    const root = this.getWorkspaceRoot();
    return root ? vscode.Uri.joinPath(root, ".battle") : undefined;
  }

  private getNewConfigUri(): vscode.Uri | undefined {
    const folder = this.getBattleFolderUri();
    return folder ? vscode.Uri.joinPath(folder, "battle.config") : undefined;
  }

  private getOldConfigUri(): vscode.Uri | undefined {
    const root = this.getWorkspaceRoot();
    return root ? vscode.Uri.joinPath(root, "battle.config") : undefined;
  }

  /* ─── File watcher ─── */

  private setupFileWatcher(): void {
    const root = this.getWorkspaceRoot();
    if (!root) return;

    this.fileWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(
        vscode.workspace.workspaceFolders![0],
        "{battle.config,.battle/battle.config}"
      )
    );

    const notify = () => {
      this.invalidateCache();
      this._onDidChange.fire();
    };

    this.fileWatcher.onDidChange(notify);
    this.fileWatcher.onDidCreate(notify);
    this.fileWatcher.onDidDelete(notify);

    this.context.subscriptions.push(this.fileWatcher, this._onDidChange);
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

  /* ─── Public API ─── */

  /** Resolve the config path, auto-migrating from old location if needed. */
  async getConfigUri(): Promise<vscode.Uri | undefined> {
    const newUri = this.getNewConfigUri();
    const oldUri = this.getOldConfigUri();
    if (!newUri) return undefined;

    if (await this.fileExists(newUri)) return newUri;

    if (oldUri && (await this.fileExists(oldUri))) {
      await this.migrateConfig(oldUri, newUri);
      return newUri;
    }

    return newUri; // default location for new configs
  }

  async configExists(): Promise<boolean> {
    const uri = await this.getConfigUri();
    return uri !== undefined && (await this.fileExists(uri));
  }

  async readConfig(): Promise<Config> {
    const uri = await this.getConfigUri();
    if (!uri) return { actions: [] };

    try {
      const stat = await vscode.workspace.fs.stat(uri);
      const mtime = stat.mtime;

      if (this.configCache && this.configCache.timestamp === mtime) {
        return this.configCache.config;
      }

      const raw = await this.readText(uri);
      const config = JSON.parse(raw) as Config;
      this.configCache = { config, timestamp: mtime };
      return config;
    } catch {
      return { actions: [] };
    }
  }

  async writeConfig(config: Config): Promise<void> {
    const uri = await this.getConfigUri();
    if (!uri) return;

    const folder = this.getBattleFolderUri();
    if (folder) await this.ensureDir(folder);

    await this.writeText(uri, JSON.stringify(config, null, 2));
    this.invalidateCache();
  }

  async deleteConfig(): Promise<{ deleted: boolean; location?: string }> {
    const newUri = this.getNewConfigUri();
    const oldUri = this.getOldConfigUri();
    
    let deletedNew = false;
    let deletedOld = false;

    // Delete from new location if exists
    if (newUri && (await this.fileExists(newUri))) {
      await vscode.workspace.fs.delete(newUri);
      deletedNew = true;
    }

    // Delete from old location if exists
    if (oldUri && (await this.fileExists(oldUri))) {
      await vscode.workspace.fs.delete(oldUri);
      deletedOld = true;
    }

    if (deletedNew || deletedOld) {
      this.invalidateCache();
      const location = deletedNew && deletedOld 
        ? "both locations" 
        : deletedNew 
        ? ".battle/battle.config" 
        : "battle.config";
      return { deleted: true, location };
    }

    return { deleted: false };
  }

  async openConfigFile(): Promise<void> {
    const uri = await this.getConfigUri();
    if (!uri || !(await this.fileExists(uri))) {
      vscode.window.showWarningMessage("Config file doesn't exist. Generate it first.");
      return;
    }
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc);
  }

  invalidateCache(): void {
    this.configCache = undefined;
  }

  /* ─── Scanning helpers ─── */

  async scanNpmScripts(): Promise<Action[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) return [];

    const allActions: Action[] = [];

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
            allActions.push({
              name: `npm: ${name}`,
              command: `npm run ${name}`,
              type: "npm",
              workspace: isRootWorkspace ? undefined : workspaceName,
            });
          });
        } catch {
          // Skip invalid package.json
        }
      }

      // Recursively scan subdirectories for package.json files
      await this.scanNpmScriptsRecursive(folder.uri, allActions, workspaceName, isRootWorkspace);
    }

    return allActions;
  }

  private async scanNpmScriptsRecursive(
    dirUri: vscode.Uri,
    actions: Action[],
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
        if (name === "node_modules" || name === ".git" || name === "dist" || name === "build" || name === "out") {
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
              const workspaceLabel = isRootWorkspace ? relativePath : `${workspaceName}/${relativePath}`;
              
              Object.keys(scripts).forEach((scriptName) => {
                actions.push({
                  name: `npm: ${scriptName}`,
                  command: `cd ${relativePath} && npm run ${scriptName}`,
                  type: "npm",
                  workspace: workspaceLabel,
                });
              });
            } catch {
              // Skip invalid package.json
            }
          }
          
          // Continue scanning subdirectories
          await this.scanNpmScriptsRecursive(subDirUri, actions, workspaceName, isRootWorkspace, depth + 1);
        }
      }
    } catch {
      // Skip directories we can't read
    }
  }

  async scanTasks(): Promise<Action[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) return [];

    const allActions: Action[] = [];
    const isRootWorkspace = workspaceFolders.length === 1;

    for (const folder of workspaceFolders) {
      const uri = vscode.Uri.joinPath(folder.uri, ".vscode", "tasks.json");
      if (!(await this.fileExists(uri))) continue;

      try {
        const raw = await this.readText(uri);
        const tasksJson = JSON.parse(this.stripJsonComments(raw));
        const tasks = tasksJson.tasks || [];
        tasks
          .filter((t: any) => t.label)
          .forEach((t: any) => {
            allActions.push({
              name: `Task: ${t.label}`,
              command: `workbench.action.tasks.runTask|${t.label}`,
              type: "task",
              workspace: isRootWorkspace ? undefined : folder.name,
            });
          });
      } catch {
        // Skip invalid tasks.json
      }
    }

    return allActions;
  }

  async scanLaunchConfigs(): Promise<Action[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) return [];

    const allActions: Action[] = [];
    const isRootWorkspace = workspaceFolders.length === 1;

    for (const folder of workspaceFolders) {
      const uri = vscode.Uri.joinPath(folder.uri, ".vscode", "launch.json");
      if (!(await this.fileExists(uri))) continue;

      try {
        const raw = await this.readText(uri);
        const launchJson = JSON.parse(this.stripJsonComments(raw));
        const configs = launchJson.configurations || [];
        configs
          .filter((c: any) => c.name)
          .forEach((c: any) => {
            allActions.push({
              name: `Launch: ${c.name}`,
              command: `workbench.action.debug.start|${c.name}`,
              type: "launch",
              workspace: isRootWorkspace ? undefined : folder.name,
            });
          });
      } catch {
        // Skip invalid launch.json
      }
    }

    return allActions;
  }

  async hasSource(kind: "npm" | "tasks" | "launch"): Promise<boolean> {
    const root = this.getWorkspaceRoot();
    if (!root) return false;
    const paths: Record<string, string> = {
      npm: "package.json",
      tasks: ".vscode/tasks.json",
      launch: ".vscode/launch.json",
    };
    return this.fileExists(vscode.Uri.joinPath(root, paths[kind]));
  }

  /** Check if a file exists relative to workspace root. */
  async fileExistsInWorkspace(relativePath: string): Promise<boolean> {
    const root = this.getWorkspaceRoot();
    if (!root) return false;
    return this.fileExists(vscode.Uri.joinPath(root, relativePath));
  }

  /** Create a minimal empty config. */
  async createMinimalConfig(defaultIcons: IconMapping[]): Promise<void> {
    const config: Config = { actions: [], icons: defaultIcons };
    await this.writeConfig(config);
  }

  /** Auto-generate config by scanning workspace sources. */
  async createAutoConfig(
    sources: { npm?: boolean; tasks?: boolean; launch?: boolean },
    enableGrouping: boolean,
    defaultIcons: IconMapping[],
    enhancedActions: Action[] = []
  ): Promise<void> {
    const actions: Action[] = [];
    const groups: Group[] = [];

    if (sources.npm) {
      const npmActions = await this.scanNpmScripts();
      if (enableGrouping && npmActions.length > 0) {
        groups.push({ name: "NPM Scripts", icon: "\ud83d\udce6" });
        npmActions.forEach((item) => (item.group = "NPM Scripts"));
      }
      actions.push(...npmActions);
    }

    if (sources.tasks) {
      const taskActions = await this.scanTasks();
      if (enableGrouping && taskActions.length > 0) {
        groups.push({ name: "Tasks", icon: "\u2713" });
        taskActions.forEach((item) => (item.group = "Tasks"));
      }
      actions.push(...taskActions);
    }

    if (sources.launch) {
      const launchActions = await this.scanLaunchConfigs();
      if (enableGrouping && launchActions.length > 0) {
        groups.push({ name: "Launch Configs", icon: "\ud83d\ude80" });
        launchActions.forEach((item) => (item.group = "Launch Configs"));
      }
      actions.push(...launchActions);
    }

    // Add enhanced actions (from tool detection)
    if (enhancedActions.length > 0) {
      if (enableGrouping) {
        // Group enhanced actions by type
        const typeGroups = new Map<string, Action[]>();
        enhancedActions.forEach((action) => {
          if (!typeGroups.has(action.type)) {
            typeGroups.set(action.type, []);
          }
          typeGroups.get(action.type)!.push(action);
        });

        // Create groups for each type
        const typeGroupNames: Record<string, string> = {
          docker: "Docker",
          "docker-compose": "Docker Compose",
          python: "Python",
          go: "Go",
          rust: "Rust",
          build: "Build Tools",
          test: "Tests",
          git: "Git",
        };

        const typeGroupIcons: Record<string, string> = {
          docker: "\ud83d\udc33",
          "docker-compose": "\ud83d\udc33",
          python: "\ud83d\udc0d",
          go: "\ud83d\udd37",
          rust: "\ud83e\udd80",
          build: "\ud83d\udd28",
          test: "\ud83e\uddea",
          git: "\ud83d\udcdd",
        };

        typeGroups.forEach((actionsInType, type) => {
          const groupName = typeGroupNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
          groups.push({ name: groupName, icon: typeGroupIcons[type] || "\ud83d\udce6" });
          actionsInType.forEach((action) => (action.group = groupName));
        });
      }
      actions.push(...enhancedActions);
    }

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

    const exists = await this.configExists();
    if (exists) {
      try {
        const existingConfig = await this.readConfig();
        const autoGeneratedPrefixes = ["npm: ", "Task: ", "Launch: "];
        const customActions = existingConfig.actions.filter(
          (item) => !autoGeneratedPrefixes.some((prefix) => item.name.startsWith(prefix))
        );
        finalActions = [...actions, ...customActions];

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
    };
    await this.writeConfig(config);
  }

  /* ─── Private ─── */

  private async migrateConfig(
    oldUri: vscode.Uri,
    newUri: vscode.Uri
  ): Promise<void> {
    try {
      const folder = this.getBattleFolderUri();
      if (folder) await this.ensureDir(folder);
      await vscode.workspace.fs.copy(oldUri, newUri, { overwrite: false });
    } catch (error) {
      console.error("Failed to migrate config:", error);
    }
  }

  private stripJsonComments(jsonStr: string): string {
    return jsonStr.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  }
}
