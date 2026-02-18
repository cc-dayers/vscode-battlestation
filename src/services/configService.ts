import * as vscode from "vscode";
import type { Config, Action, Group, IconMapping } from "../types";

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

  /** New location: .vscode/battle.json */
  private getConfigUri(): vscode.Uri | undefined {
    const folder = this.getVSCodeFolderUri();
    return folder ? vscode.Uri.joinPath(folder, "battle.json") : undefined;
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
    const root = this.getWorkspaceRoot();
    if (!root) return;

    this.fileWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(
        vscode.workspace.workspaceFolders![0],
        ".vscode/battle.json"
      )
    );

    const notify = () => {
      this.invalidateCache();
      this._onDidChange.fire();
    };

    this.fileWatcher.onDidChange(notify);
    this.fileWatcher.onDidCreate(notify);
    this.fileWatcher.onDidDelete(notify);

    if (this.context) {
      this.context.subscriptions.push(this.fileWatcher, this._onDidChange);
    }
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

  private normalizeConfig(raw: any): Config | null {
    if (!raw || typeof raw !== "object") return null;
    if (!Array.isArray(raw.actions)) return null;

    const normalized: Config = {
      actions: raw.actions,
    };

    if (Array.isArray(raw.groups)) {
      normalized.groups = raw.groups;
    }

    if (Array.isArray(raw.icons)) {
      normalized.icons = raw.icons;
    }

    if (Array.isArray(raw.todos)) {
      normalized.todos = raw.todos;
    }

    return normalized;
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
          if (normalized) {
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
              config: normalized,
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
      const normalized = this.normalizeConfig(parsed);
      if (!normalized) {
        return { uri, exists: true, valid: false, error: "Invalid config structure" };
      }
      return { uri, exists: true, valid: true, config: normalized };
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
      const config = this.normalizeConfig(parsed);
      if (!config) return { actions: [] };
      this.configCache = { config, timestamp: mtime };
      return config;
    } catch {
      return { actions: [] };
    }
  }

  async writeConfig(config: Config): Promise<void> {
    const uri = await this.resolveConfigUri();
    if (!uri) return;

    const vsCodeFolder = this.getVSCodeFolderUri();
    if (vsCodeFolder) await this.ensureDir(vsCodeFolder);

    // Save to history before overwriting
    if (await this.fileExists(uri)) {
      try {
        const existing = await this.readConfig();
        await this.appendToHistory(existing, this.getTimestampLabel());
      } catch {
        // Failed to backup, continue anyway
      }
    }

    await this.writeText(uri, JSON.stringify(config, null, 2));
    this.invalidateCache();
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
      this.invalidateCache();
      return { deleted: true, location: locations.join(", ") };
    }

    return { deleted: false };
  }

  async openConfigFile(): Promise<void> {
    const uri = await this.resolveConfigUri();
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

  async listConfigVersions(): Promise<{ label: string; timestamp: number; config: Config }[]> {
    const history = await this.readHistory();
    return history.map(entry => ({
      label: entry.label,
      timestamp: entry.timestamp,
      config: entry.config,
    }));
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
    this.invalidateCache();
  }

  /* ─── Scanning helpers ─── */

  private applyColorRules(action: Action): void {
    const config = vscode.workspace.getConfiguration("battlestation");
    const colorRules = config.get<any[]>("colorRules", []);
    const enableAuto = config.get<boolean>("display.enableAutoActionColors", false);

    // If auto-color is disabled and we have one (from workspace scan), clear it
    // UNLESS it was set by a rule? No, rules should override.
    // Actually, scanNpmScriptsRecursive sets a bg color. We should probably clear it first if auto is disabled.
    // But currently scanNpmScriptsRecursive sets it.
    // Let's handle the "auto" part in scanNpmScriptsRecursive logic or here.
    // If I clear it here, it simplifies scan logic change.

    if (!enableAuto && action.backgroundColor && action.type === 'npm') {
      // Only clear if it looks like an auto-color? 
      // Simpler: configService logic for scanNpmScripts will just NOT set it if disabled.
      // So here we just apply rules.
    }

    for (const rule of colorRules) {
      if (!rule.color) continue;

      // Check type
      if (rule.type && rule.type !== action.type) continue;

      // Check name pattern (simple * wildcard)
      if (rule.namePattern && !this.matchesPattern(action.name, rule.namePattern)) continue;

      // Check command pattern
      if (rule.commandPattern && !this.matchesPattern(action.command, rule.commandPattern)) continue;

      // Match!
      action.backgroundColor = rule.color;
      // Last rule wins? Or first? Usually last wins in cascading style, or first wins in priority.
      // Let's assume standard "last one wins" or "first match". 
      // Let's go with "override existing" so last rule in list wins if multiple match.
    }
  }

  private matchesPattern(text: string, pattern: string): boolean {
    // Simple * to .* regex conversion
    // Escape special regex chars except *
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    const regexStr = '^' + escaped.replace(/\*/g, '.*') + '$';
    return new RegExp(regexStr, 'i').test(text);
  }

  async scanNpmScripts(): Promise<Action[]> {
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
                name: `npm: ${name}`,
                command: command,
                type: "npm",
                cwd: folder.uri.fsPath,
                workspace: isRootWorkspace ? undefined : workspaceName,
              };
              this.applyColorRules(action);
              allActions.push(action);
            }
          });
        } catch {
          // Skip invalid package.json
        }
      }

      // Recursively scan subdirectories for package.json files
      await this.scanNpmScriptsRecursive(folder.uri, allActions, seenActions, workspaceName, isRootWorkspace);
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

      // Get workspace colors config
      const wsConfig = vscode.workspace.getConfiguration("battlestation");
      const workspaceColors = wsConfig.get<Record<string, string>>("workspaceColors", {});
      const enableAutoColors = wsConfig.get<boolean>("display.enableAutoActionColors", false);

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

              // Determine color for this workspace
              let color: string | undefined;
              if (enableAutoColors) {
                color = this.getWorkspaceColor(relativePath, workspaceColors);
              }

              Object.keys(scripts).forEach((scriptName) => {
                // With cwd support, we don't need "cd ... &&" prefix anymore
                const command = `npm run ${scriptName}`;

                // Use a key that includes the relative path to distinguish same-named scripts in different folders
                const key = `${scriptName}|${command}|${workspaceLabel}`;

                if (!seenActions.has(key)) {
                  seenActions.add(key);
                  const action: Action = {
                    name: `npm: ${scriptName}`,
                    command: command,
                    type: "npm",
                    cwd: subDirUri.fsPath,
                    workspace: workspaceLabel,
                    backgroundColor: color
                  };
                  this.applyColorRules(action);
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

  private getWorkspaceColor(workspaceName: string, customColors: Record<string, string>): string {
    // Check for user override first
    if (customColors[workspaceName]) {
      return customColors[workspaceName];
    }

    // Generate deterministic color from string
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < workspaceName.length; i++) {
      hash = workspaceName.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Convert to hex color
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      // Make it pastel/dark-mode friendly by forcing high value/saturation if possible, 
      // or just use a predefined palette.
      // Let's use a palette of VS Code chart colors instead for consistency
      const palette = [
        "var(--vscode-charts-red)",
        "var(--vscode-charts-blue)",
        "var(--vscode-charts-green)",
        "var(--vscode-charts-yellow)",
        "var(--vscode-charts-orange)",
        "var(--vscode-charts-purple)",
        "var(--vscode-button-secondaryHoverBackground)"
      ];

      const index = Math.abs(hash) % palette.length;
      return palette[index];
    }

    return "var(--vscode-charts-blue)";
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
          .forEach((t: any) => {
            const label = t.label || t.script || t.command;
            if (!label) return;

            const action: Action = {
              name: `Task: ${label}`,
              command: `workbench.action.tasks.runTask|${label}`,
              type: "task",
              workspace: isRootWorkspace ? undefined : folder.name,
            };
            this.applyColorRules(action);
            allActions.push(action);
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
            const action: Action = {
              name: `Launch: ${c.name}`,
              command: `workbench.action.debug.start|${c.name}`,
              type: "launch",
              workspace: isRootWorkspace ? undefined : folder.name,
            };
            this.applyColorRules(action);
            allActions.push(action);
          });
      } catch {
        // Skip invalid launch.json
      }
    }

    return allActions;
  }

  async hasSource(kind: "npm" | "tasks" | "launch"): Promise<boolean> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) return false;

    const paths: Record<string, string[]> = {
      npm: ["package.json"],
      tasks: [".vscode", "tasks.json"],
      launch: [".vscode", "launch.json"],
    };

    const segments = paths[kind];

    // Check all workspace folders
    for (const folder of workspaceFolders) {
      const uri = vscode.Uri.joinPath(folder.uri, ...segments);
      if (await this.fileExists(uri)) {
        return true;
      }
    }

    return false;
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
    sources: { npm?: boolean; tasks?: boolean; launch?: boolean },
    groupByType: boolean,
    defaultIcons: IconMapping[],
    enhancedActions?: Action[],
    enableColoring: boolean = false
  ): Promise<void> {
    const actions: Action[] = [];
    const groups: Group[] = [];

    // 1. Gather actions from enabled sources
    if (sources.npm) {
      actions.push(...(await this.scanNpmScripts()));
    }
    if (sources.tasks) {
      actions.push(...(await this.scanTasks()));
    }
    if (sources.launch) {
      actions.push(...(await this.scanLaunchConfigs()));
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
      // ... existing grouping logic ...
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
      };

      const typeGroupIcons: Record<string, string> = {
        npm: "package",
        task: "checklist",
        launch: "rocket",
      };

      const sortedTypes = Array.from(typeGroups.keys()).sort((a, b) => {
        // Sort order: npm, task, launch, others
        const order = ['npm', 'task', 'launch'];
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
          color: enableColoring ? this.getDefaultColorForGroup(groupName) : undefined
        });
        actionsInType.forEach((action) => (action.group = groupName));
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
              color: enableColoring ? this.getDefaultColorForGroup(groupName) : undefined
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
        g.color = this.getDefaultColorForGroup(g.name);
      }
    });

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

  private getDefaultColorForGroup(name: string): string | undefined {
    const lower = name.toLowerCase();
    if (lower.includes('npm') || lower.includes('node')) return "var(--vscode-charts-purple)";
    if (lower.includes('task')) return "var(--vscode-charts-green)";
    if (lower.includes('launch') || lower.includes('debug')) return "var(--vscode-charts-orange)";
    if (lower.includes('docker') || lower.includes('container')) return "var(--vscode-charts-blue)";
    if (lower.includes('python')) return "var(--vscode-charts-yellow)";
    if (lower.includes('go')) return "var(--vscode-charts-blue)"; // Go gopher is blue-ish
    if (lower.includes('rust')) return "var(--vscode-charts-orange)"; // Rust is orange-ish
    if (lower.includes('test')) return "var(--vscode-charts-green)";
    if (lower.includes('build')) return "var(--vscode-charts-purple)";
    if (lower.includes('git')) return "var(--vscode-charts-purple)";
    return undefined;
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
