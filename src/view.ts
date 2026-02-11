import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

interface ConfigItem {
  name: string;
  command: string;
  type: string;
  group?: string;
  hidden?: boolean;
}

interface IconMapping {
  type: string;
  icon: string;
}

interface Group {
  name: string;
  icon?: string;
}

interface Config {
  icons?: IconMapping[];
  groups?: Group[];
  items: ConfigItem[];
}

export class BattlestationViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private showingForm: boolean | "group" | "settings" | "editGroup" | "generateConfig" = false;
  private showHidden = false;
  private currentEditGroup?: Group;
  private configCache?: { config: Config; timestamp: number };
  private fileWatcher?: vscode.FileSystemWatcher;
  private isLoading = false;
  private generateFormParams?: { hasNpm: boolean; hasTasks: boolean; hasLaunch: boolean };

  private static readonly defaultIcons: IconMapping[] = [
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

  constructor(private readonly context: vscode.ExtensionContext) {
    // Set up file watcher for battle.config
    this.setupFileWatcher();
  }

  private setupFileWatcher() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
      // Watch for changes to battle.config
      this.fileWatcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(workspaceFolders[0], 'battle.config')
      );
      
      // Refresh on file changes
      this.fileWatcher.onDidChange(() => {
        this.invalidateCache();
        this.refresh();
      });
      
      this.fileWatcher.onDidCreate(() => {
        this.invalidateCache();
        this.refresh();
      });
      
      this.fileWatcher.onDidDelete(() => {
        this.invalidateCache();
        this.refresh();
      });
      
      this.context.subscriptions.push(this.fileWatcher);
    }
  }

  private invalidateCache() {
    this.configCache = undefined;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _ctx: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'media')
      ]
    };

    // Set initial context for button states
    vscode.commands.executeCommand('setContext', 'battlestation.hasConfig', this.configExists());

    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case "refresh":
          this.refresh();
          break;
        case "createConfig":
          this.createAutoConfig(message.sources || {}, message.enableGrouping || false);
          break;
        case "executeCommand":
          this.executeCommand(message.item);
          break;
        case "showAddForm":
          this.showingForm = true;
          this.refresh();
          break;
        case "showAddGroupForm":
          this.showingForm = "group";
          this.refresh();
          break;
        case "cancelForm":
          this.showingForm = false;
          this.refresh();
          break;
        case "submitNewItem":
          this.addNewItem(message.item);
          break;
        case "submitNewItemWithIcon":
          this.addNewItemWithIcon(message.item, message.customIcon);
          break;
        case "submitNewGroup":
          this.addNewGroup(message.group);
          break;
        case "editGroup":
          this.showingForm = "editGroup";
          this.currentEditGroup = message.group;
          this.refresh();
          break;
        case "submitEditGroup":
          this.updateGroup(message.oldGroup, message.newGroup);
          break;
        case "toggleShowHidden":
          this.showHidden = !this.showHidden;
          this.refresh();
          break;
        case "hideItem":
          this.hideItem(message.item);
          break;
        case "assignGroup":
          this.assignItemToGroup(message.item, message.groupName);
          break;
        case "bulkHideItems":
          this.bulkHideItems(message.items);
          break;
        case "bulkShowItems":
          this.bulkShowItems(message.items);
          break;
        case "saveSettings":
          this.saveSettings(message.settings);
          break;
        case "openConfig":
          this.openConfigFile();
          break;
        case "showGenerateConfig":
          const workspaceRoot = this.getConfigPath() ? path.dirname(path.dirname(this.getConfigPath()!)) : "";
          const hasNpm = workspaceRoot && fs.existsSync(path.join(workspaceRoot, "package.json"));
          const hasTasks = workspaceRoot && fs.existsSync(path.join(workspaceRoot, ".vscode", "tasks.json"));
          const hasLaunch = workspaceRoot && fs.existsSync(path.join(workspaceRoot, ".vscode", "launch.json"));
          this.showingForm = "generateConfig";
          this.generateFormParams = { hasNpm, hasTasks, hasLaunch };
          this.refresh();
          break;
        case "deleteConfig":
          this.deleteConfig();
          break;
      }
    });

    this.refresh();
  }

  public refresh() {
    if (!this.view) {
      return;
    }

    // Update context for button states
    vscode.commands.executeCommand('setContext', 'battlestation.hasConfig', this.configExists());

    // Show loading state
    if (this.isLoading) {
      this.view.webview.html = this.getLoadingHtml();
      return;
    }

    if (!this.configExists()) {
      this.showingForm = false;
      this.view.webview.html = this.getNoConfigHtml();
      return;
    }

    if (this.showingForm === "settings") {
      this.view.webview.html = this.getSettingsFormHtml();
      return;
    }

    if (this.showingForm === "generateConfig") {
      const params = this.generateFormParams || { hasNpm: false, hasTasks: false, hasLaunch: false };
      this.view.webview.html = this.getGenerateConfigFormHtml(params.hasNpm, params.hasTasks, params.hasLaunch, false);
      return;
    }

    if (this.showingForm === "group") {
      this.view.webview.html = this.getAddGroupFormHtml();
      return;
    }

    if (this.showingForm === "editGroup") {
      this.view.webview.html = this.getEditGroupFormHtml();
      return;
    }

    if (this.showingForm === true) {
      this.view.webview.html = this.getAddItemFormHtml();
      return;
    }

    const config = this.readConfig();
    this.view.webview.html = this.getHtml(config);
  }

  public showAddItemForm() {
    // If no config exists, create a minimal one
    if (!this.configExists()) {
      this.createMinimalConfig();
    }
    this.showingForm = true;
    this.refresh();
  }

  public showAddGroupForm() {
    // Groups require items to exist first
    if (!this.configExists()) {
      vscode.window.showWarningMessage("Create at least one item before adding groups.");
      return;
    }
    this.showingForm = "group";
    this.refresh();
  }

  public showSettingsForm() {
    this.showingForm = "settings";
    this.refresh();
  }

  private getConfigPath(): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return undefined;
    }
    return path.join(workspaceFolders[0].uri.fsPath, "battle.config");
  }

  private configExists(): boolean {
    const configPath = this.getConfigPath();
    return configPath !== undefined && fs.existsSync(configPath);
  }

  private showToast(message: string) {
    if (this.view) {
      this.view.webview.postMessage({ command: 'showToast', message });
    }
  }

  private createMinimalConfig(): void {
    const configPath = this.getConfigPath();
    if (!configPath) {
      vscode.window.showWarningMessage("No workspace folder open.");
      return;
    }

    // Ensure .vscode directory exists
    const vscodePath = path.dirname(configPath);
    if (!fs.existsSync(vscodePath)) {
      fs.mkdirSync(vscodePath, { recursive: true });
    }

    // Create minimal config
    const config: Config = {
      items: [],
      icons: BattlestationViewProvider.defaultIcons,
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    this.invalidateCache();
  }

  private readConfig(): Config {
    const configPath = this.getConfigPath();
    if (!configPath) {
      return { items: [] };
    }

    try {
      // Check cache first
      const stats = fs.statSync(configPath);
      const mtime = stats.mtimeMs;
      
      if (this.configCache && this.configCache.timestamp === mtime) {
        return this.configCache.config;
      }
      
      // Read and cache
      const raw = fs.readFileSync(configPath, "utf-8");
      const config = JSON.parse(raw) as Config;
      this.configCache = { config, timestamp: mtime };
      return config;
    } catch {
      return { items: [] };
    }
  }

  private async createAutoConfig(sources: { npm?: boolean; tasks?: boolean; launch?: boolean }, enableGrouping: boolean) {
    const configPath = this.getConfigPath();
    if (!configPath) {
      vscode.window.showWarningMessage("Battlestation: No workspace folder open.");
      return;
    }

    // Use withProgress API for better UX
    await vscode.window.withProgress(
      {
        location: { viewId: 'battlestation.view' },
        title: "Generating Battlestation config",
        cancellable: false
      },
      async (progress) => {
        // Continue with rest of implementation...
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
          return;
        }
        const workspaceRoot = workspaceFolders[0].uri.fsPath;

        const items: ConfigItem[] = [];
        const groups: Group[] = [];
        let totalSteps = 0;
        let completedSteps = 0;

        if (sources.npm) totalSteps++;
        if (sources.tasks) totalSteps++;
        if (sources.launch) totalSteps++;
        if (totalSteps === 0) totalSteps = 1;

        const incrementProgress = () => {
          completedSteps++;
          progress.report({ 
            increment: (100 / totalSteps),
            message: `${completedSteps}/${totalSteps} sources scanned` 
          });
        };

        if (sources.npm) {
          progress.report({ message: "Scanning NPM scripts..." });
          const npmItems = this.scanNpmScripts(workspaceRoot);
          if (enableGrouping && npmItems.length > 0) {
            groups.push({ name: "NPM Scripts", icon: "📦" });
            npmItems.forEach((item) => (item.group = "NPM Scripts"));
          }
          items.push(...npmItems);
          incrementProgress();
        }

        if (sources.tasks) {
          progress.report({ message: "Scanning VS Code tasks..." });
          const taskItems = this.scanTasks(workspaceRoot);
          if (enableGrouping && taskItems.length > 0) {
            groups.push({ name: "Tasks", icon: "✓" });
            taskItems.forEach((item) => (item.group = "Tasks"));
          }
          items.push(...taskItems);
          incrementProgress();
        }

        if (sources.launch) {
          progress.report({ message: "Scanning launch configurations..." });
          const launchItems = this.scanLaunchConfigs(workspaceRoot);
          if (enableGrouping && launchItems.length > 0) {
            groups.push({ name: "Launch Configs", icon: "🚀" });
            launchItems.forEach((item) => (item.group = "Launch Configs"));
          }
          items.push(...launchItems);
          incrementProgress();
        }

        if (items.length === 0) {
          items.push(
            { name: "Build Project", command: "npm run build", type: "build" },
            { name: "Open Terminal", command: "workbench.action.terminal.new", type: "vscode" }
          );
        }

        progress.report({ message: "Writing configuration..." });

        const config: Config = {
          items,
          groups: groups.length > 0 ? groups : undefined,
          icons: BattlestationViewProvider.defaultIcons,
        };

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
        this.invalidateCache();

        progress.report({ message: "Done!" });
      }
    );

    const doc = await vscode.workspace.openTextDocument(configPath);
    await vscode.window.showTextDocument(doc);

    this.refresh();
  }

  private scanNpmScripts(workspaceRoot: string): ConfigItem[] {
    const packagePath = path.join(workspaceRoot, "package.json");
    if (!fs.existsSync(packagePath)) {
      return [];
    }

    try {
      const pkg = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
      const scripts = pkg.scripts || {};
      return Object.keys(scripts).map((name) => ({
        name: `npm: ${name}`,
        command: `npm run ${name}`,
        type: "npm",
      }));
    } catch {
      return [];
    }
  }

  private scanTasks(workspaceRoot: string): ConfigItem[] {
    const tasksPath = path.join(workspaceRoot, ".vscode", "tasks.json");
    if (!fs.existsSync(tasksPath)) {
      return [];
    }

    try {
      const raw = fs.readFileSync(tasksPath, "utf-8");
      const tasksJson = JSON.parse(this.stripJsonComments(raw));
      const tasks = tasksJson.tasks || [];
      return tasks
        .filter((t: any) => t.label)
        .map((t: any) => ({
          name: `Task: ${t.label}`,
          command: `workbench.action.tasks.runTask|${t.label}`,
          type: "task",
        }));
    } catch {
      return [];
    }
  }

  private scanLaunchConfigs(workspaceRoot: string): ConfigItem[] {
    const launchPath = path.join(workspaceRoot, ".vscode", "launch.json");
    if (!fs.existsSync(launchPath)) {
      return [];
    }

    try {
      const raw = fs.readFileSync(launchPath, "utf-8");
      const launchJson = JSON.parse(this.stripJsonComments(raw));
      const configs = launchJson.configurations || [];
      return configs
        .filter((c: any) => c.name)
        .map((c: any) => ({
          name: `Launch: ${c.name}`,
          command: `workbench.action.debug.start|${c.name}`,
          type: "launch",
        }));
    } catch {
      return [];
    }
  }

  private stripJsonComments(jsonStr: string): string {
    return jsonStr.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  }

  private async executeCommand(item: ConfigItem) {
    try {
      switch (item.type) {
        case "vscode":
          await this.executeVSCodeCommand(item.command);
          break;
        case "shell":
        case "npm":
        case "build":
        case "task":
        case "launch":
          await this.executeShellCommand(item.command);
          break;
        default:
          // For custom types, try to execute as shell command
          await this.executeShellCommand(item.command);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to execute: ${(error as Error).message}`);
    }
  }

  private async executeVSCodeCommand(command: string) {
    const [cmd, ...args] = command.split("|");
    if (args.length > 0) {
      await vscode.commands.executeCommand(cmd.trim(), ...args);
    } else {
      await vscode.commands.executeCommand(cmd.trim());
    }
  }

  private async executeShellCommand(command: string) {
    const terminal = vscode.window.createTerminal({
      name: "Battlestation",
      cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
    });
    terminal.show();
    terminal.sendText(command);
  }

  private async addNewItem(item: ConfigItem) {
    const configPath = this.getConfigPath();
    if (!configPath) {
      return;
    }

    const config = this.readConfig();
    config.items.push(item);

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    this.invalidateCache();

    this.showingForm = false;
    this.refresh();

    this.showToast(`👍 Added: ${item.name}`);
  }

  private async addNewItemWithIcon(item: ConfigItem, customIcon: string) {
    // Save the custom icon mapping to workspace settings
    await this.saveCustomIconMapping(item.type, customIcon);
    
    // Then add the item normally
    await this.addNewItem(item);
  }

  private async saveCustomIconMapping(itemType: string, iconName: string) {
    const config = vscode.workspace.getConfiguration('battlestation');
    const currentMappings = config.get<{ [key: string]: string }>('customIconMappings') || {};
    
    // Update or add the mapping
    currentMappings[itemType] = iconName;
    
    // Save to workspace settings
    await config.update('customIconMappings', currentMappings, vscode.ConfigurationTarget.Workspace);
    
    this.showToast(`✨ Icon "${iconName}" saved for type "${itemType}"`);
  }

  // Continue with remaining methods...
  // This is a placeholder - the actual file is 2826 lines
  // The complete implementation continues with all other methods

  private esc(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}