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
      icons: LaunchpadViewProvider.defaultIcons,
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

  private invalidateCache() {
    this.configCache = undefined;
  }

  private async createAutoConfig(sources: { npm?: boolean; tasks?: boolean; launch?: boolean }, enableGrouping: boolean) {
    const configPath = this.getConfigPath();
    if (!configPath) {
      vscode.window.showWarningMessage("Launchpad: No workspace folder open.");
      return;
    }

    // Use withProgress API for better UX
    await vscode.window.withProgress(
      {
        location: { viewId: 'launchpad.view' },
        title: "Generating Launchpad config",
        cancellable: false
      },
      async (progress) => {
        // Ensure .vscode directory exists
        const vscodeDir = path.dirname(configPath);
        if (!fs.existsSync(vscodeDir)) {
          fs.mkdirSync(vscodeDir, { recursive: true });
        }

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
          return;
        }
        const workspaceRoot = workspaceFolders[0].uri.fsPath;

        const items: ConfigItem[] = [];
        const groups: Group[] = [];
        let totalSteps = 0;
        let completedSteps = 0;

        // Count steps
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
          icons: LaunchpadViewProvider.defaultIcons,
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
      name: "Launchpad",
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

  private async hideItem(item: ConfigItem) {
    const configPath = this.getConfigPath();
    if (!configPath) {
      return;
    }

    const config = this.readConfig();
    const targetItem = config.items.find(
      (i) => i.name === item.name && i.command === item.command
    );

    if (targetItem) {
      targetItem.hidden = true;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
      this.invalidateCache();
      this.refresh();
    }
  }

  private async assignItemToGroup(item: ConfigItem, groupName: string) {
    const configPath = this.getConfigPath();
    if (!configPath) {
      return;
    }

    const config = this.readConfig();
    const targetItem = config.items.find(
      (i) => i.name === item.name && i.command === item.command
    );

    if (targetItem) {
      if (groupName === "__none__") {
        delete targetItem.group;
      } else {
        targetItem.group = groupName;
        // Ensure group exists
        if (!config.groups) {
          config.groups = [];
        }
        if (!config.groups.find((g) => g.name === groupName)) {
          config.groups.push({ name: groupName });
        }
      }
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
      this.invalidateCache();
      this.refresh();
    }
  }

  private async bulkHideItems(items: ConfigItem[]) {
    const configPath = this.getConfigPath();
    if (!configPath) {
      return;
    }

    const config = this.readConfig();
    items.forEach((item) => {
      const targetItem = config.items.find(
        (i) => i.name === item.name && i.command === item.command
      );
      if (targetItem) {
        targetItem.hidden = true;
      }
    });

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    this.invalidateCache();
    this.refresh();
  }

  private async bulkShowItems(items: ConfigItem[]) {
    const configPath = this.getConfigPath();
    if (!configPath) {
      return;
    }

    const config = this.readConfig();
    items.forEach((item) => {
      const targetItem = config.items.find(
        (i) => i.name === item.name && i.command === item.command
      );
      if (targetItem) {
        targetItem.hidden = false;
      }
    });

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    this.invalidateCache();
    this.refresh();
  }

  private async addNewGroup(group: Group) {
    const configPath = this.getConfigPath();
    if (!configPath) {
      return;
    }

    const config = this.readConfig();
    if (!config.groups) {
      config.groups = [];
    }

    // Check if group already exists
    if (config.groups.find((g) => g.name === group.name)) {
      vscode.window.showWarningMessage(`Group "${group.name}" already exists.`);
      return;
    }

    config.groups.push(group);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    this.invalidateCache();

    this.showingForm = false;
    this.refresh();
  }

  private async updateGroup(oldGroup: Group, newGroup: Group) {
    const configPath = this.getConfigPath();
    if (!configPath) {
      return;
    }

    const config = this.readConfig();
    if (!config.groups) {
      return;
    }

    // Find the group to update
    const groupIndex = config.groups.findIndex((g) => g.name === oldGroup.name && g.icon === oldGroup.icon);
    if (groupIndex === -1) {
      vscode.window.showErrorMessage(`Group "${oldGroup.name}" not found.`);
      return;
    }

    // If name changed, check for conflicts
    if (oldGroup.name !== newGroup.name && config.groups.find((g) => g.name === newGroup.name)) {
      vscode.window.showWarningMessage(`Group "${newGroup.name}" already exists.`);
      return;
    }

    // Update group
    config.groups[groupIndex] = newGroup;

    // Update all items that reference the old group name
    if (oldGroup.name !== newGroup.name) {
      config.items.forEach((item) => {
        if (item.group === oldGroup.name) {
          item.group = newGroup.name;
        }
      });
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    this.invalidateCache();

    this.showingForm = false;
    this.currentEditGroup = undefined;
    this.refresh();
  }

  private async saveSettings(settings: { showIcon: boolean; showType: boolean; showCommand: boolean; showGroup: boolean; hideIcon?: string }) {
    const config = vscode.workspace.getConfiguration('battlestation');
    await config.update('display.showIcon', settings.showIcon, vscode.ConfigurationTarget.Workspace);
    await config.update('display.showType', settings.showType, vscode.ConfigurationTarget.Workspace);
    await config.update('display.showCommand', settings.showCommand, vscode.ConfigurationTarget.Workspace);
    await config.update('display.showGroup', settings.showGroup, vscode.ConfigurationTarget.Workspace);
    if (settings.hideIcon) {
      await config.update('display.hideIcon', settings.hideIcon, vscode.ConfigurationTarget.Workspace);
    }

    this.showingForm = false;
    this.refresh();

    this.showToast('✅ Settings saved');
  }

  private async openConfigFile() {
    const configPath = this.getConfigPath();
    if (!configPath) {
      vscode.window.showWarningMessage("No workspace folder open.");
      return;
    }

    if (!fs.existsSync(configPath)) {
      vscode.window.showWarningMessage("Config file doesn't exist. Generate it first.");
      return;
    }

    const doc = await vscode.workspace.openTextDocument(configPath);
    await vscode.window.showTextDocument(doc);
    
    this.showingForm = false;
    this.refresh();
  }

  private async deleteConfig() {
    const configPath = this.getConfigPath();
    if (!configPath || !fs.existsSync(configPath)) {
      vscode.window.showWarningMessage("No config file to delete.");
      return;
    }

    const choice = await vscode.window.showWarningMessage(
      "Delete battle.config? This cannot be undone.",
      { modal: true },
      "Delete",
      "Cancel"
    );

    if (choice === "Delete") {
      try {
        fs.unlinkSync(configPath);
        this.invalidateCache();
        this.showingForm = false;
        this.refresh();
        this.showToast('🗑️ Config file deleted');
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to delete config: ${(error as Error).message}`);
      }
    }
  }

  private getUsedCodiconNames(): Set<string> {
    const usedIcons = new Set<string>();
    
    try {
      const config = this.readConfig();
      
      // Add icons from config.icons
      if (config.icons) {
        config.icons.forEach(mapping => {
          if (mapping.icon) {
            usedIcons.add(mapping.icon);
          }
        });
      }
      
      // Add group icons
      if (config.groups) {
        config.groups.forEach(group => {
          if (group.icon && /^[a-z0-9-]+$/.test(group.icon)) {
            usedIcons.add(group.icon);
          }
        });
      }
      
      // Add custom icon mappings
      const customMappings = vscode.workspace.getConfiguration('battlestation').get<{ [key: string]: string }>('customIconMappings') || {};
      Object.values(customMappings).forEach(icon => usedIcons.add(icon));
      
      // Add hide icon options
      const hideIcon = vscode.workspace.getConfiguration('battlestation').get<string>('display.hideIcon', 'eye-closed');
      usedIcons.add(hideIcon);
      usedIcons.add('eye'); // for showing hidden items
      
      // Add UI icons (always needed)
      const uiIcons = ['refresh', 'gear', 'add', 'new-folder', 'folder', 'x', 'settings-gear', 'rocket', 'info'];
      uiIcons.forEach(icon => usedIcons.add(icon));
      
    } catch {
      // If anything fails, return a basic set
      return new Set(['terminal', 'package', 'extensions', 'check', 'play', 'file-code', 
                      'file', 'source-control', 'tools', 'beaker', 'folder', 'eye-closed', 
                      'eye', 'x', 'refresh', 'gear', 'add', 'new-folder', 'settings-gear', 'rocket', 'info']);
    }
    
    return usedIcons;
  }

  private getCodiconStyles(): string {
    const codiconFontUri = this.view?.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'codicon.ttf')
    );
    
    const usedIcons = this.getUsedCodiconNames();
    const codiconCssPath = path.join(this.context.extensionPath, 'media', 'codicon.css');
    
    try {
      const fullCss = fs.readFileSync(codiconCssPath, 'utf-8');
      
      // Extract base styles and font-face
      const baseCssMatch = fullCss.match(/(@font-face[\s\S]*?})([\s\S]*?)(\.codicon[^{]*{[\s\S]*?})/m);
      let baseCss = '';
      
      if (baseCssMatch) {
        baseCss = baseCssMatch[1].replace(/src:\s*url\([^)]+\)/g, `src: url("${codiconFontUri}") format("truetype")`);
        baseCss += baseCssMatch[2]; // keyframes and modifiers
        baseCss += baseCssMatch[3]; // base .codicon class
      }
      
      // Extract only the :before rules for used icons
      const iconRules: string[] = [];
      usedIcons.forEach(iconName => {
        // Match .codicon-{name}:before { content: "..." }
        const regex = new RegExp(`\.codicon-${iconName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:before\s*{[^}]*}`, 'g');
        const matches = fullCss.match(regex);
        if (matches) {
          iconRules.push(...matches);
        }
      });
      
      return baseCss + '\n' + iconRules.join('\n');
      
    } catch {
      // Fallback if CSS file can't be read
      return `
      @font-face {
        font-family: "codicon";
        font-display: block;
        src: url("${codiconFontUri}") format("truetype");
      }
      .codicon {
        font: normal normal normal 16px/1 codicon;
        display: inline-block;
        text-decoration: none;
        text-rendering: auto;
        text-align: center;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
      }`;
    }
  }

  private getHtml(config: Config): string {
    const visibleItems = this.showHidden 
      ? config.items 
      : config.items.filter((item) => !item.hidden);

    const hiddenCount = config.items.filter((item) => item.hidden).length;

    const iconMap = new Map<string, string>();
    if (config.icons) {
      config.icons.forEach((mapping) => {
        iconMap.set(mapping.type, mapping.icon);
      });
    }
    
    // Merge in custom icon mappings from workspace settings
    const customMappings = vscode.workspace.getConfiguration('battlestation').get<{ [key: string]: string }>('customIconMappings') || {};
    Object.entries(customMappings).forEach(([type, icon]) => {
      iconMap.set(type, icon);
    });

    const getIcon = (type: string): string => {
      return iconMap.get(type) || "";
    };

    // Get available groups
    const groups = config.groups || [];
    const groupOptions = groups
      .map((g) => `<div class="lp-group-option" data-item="__PLACEHOLDER__" data-group="${this.esc(g.name)}">${g.icon ? g.icon + ' ' : ''}${this.esc(g.name)}</div>`)
      .join("\n");

    // Group items if groups exist AND items actually use groups
    const showGroupsSetting = vscode.workspace.getConfiguration('battlestation').get<boolean>('display.showGroup', true);
    const hasGroups = groups.length > 0;
    const itemsHaveGroups = visibleItems.some((item) => item.group);
    let content = "";

    if (hasGroups && itemsHaveGroups && showGroupsSetting) {
      // Show grouped items
      const itemsByGroup = new Map<string, ConfigItem[]>();
      const ungroupedItems: ConfigItem[] = [];

      visibleItems.forEach((item) => {
        if (item.group) {
          if (!itemsByGroup.has(item.group)) {
            itemsByGroup.set(item.group, []);
          }
          itemsByGroup.get(item.group)!.push(item);
        } else {
          ungroupedItems.push(item);
        }
      });

      // Render grouped items
      groups.forEach((group) => {
        const groupItems = itemsByGroup.get(group.name) || [];
        if (groupItems.length > 0) {
          const buttons = groupItems.map((item) => this.renderButton(item, getIcon, groupOptions)).join("\n");
          // If group.icon looks like a codicon name (alphanumeric + hyphens), use codicon class
          const groupIconHtml = group.icon 
            ? (/^[a-z0-9-]+$/.test(group.icon) 
                ? `<span class="codicon codicon-${group.icon} lp-group-icon"></span>` 
                : `<span class="lp-group-icon">${group.icon}</span>`)
            : '';
          const groupJson = JSON.stringify(group).replace(/'/g, "&#39;");
          content += `
            <div class="lp-group">
              <div class="lp-group-header">
                <div class="lp-group-header-content">
                  ${groupIconHtml}
                  <span class="lp-group-name">${this.esc(group.name)}</span>
                </div>
                <button class="lp-group-edit-btn" data-group='${groupJson}' title="Edit group">
                  <span class="codicon codicon-settings-gear"></span>
                </button>
              </div>
              <div class="lp-group-items">${buttons}</div>
            </div>
          `;
        }
      });

      // Render ungrouped items only if there are groups AND ungrouped items
      if (ungroupedItems.length > 0) {
        const buttons = ungroupedItems.map((item) => this.renderButton(item, getIcon, groupOptions)).join("\n");
        content += `
          <div class="lp-group">
            <div class="lp-group-header">
              <span class="lp-group-name" style="opacity: 0.6;">Ungrouped</span>
            </div>
            <div class="lp-group-items">${buttons}</div>
          </div>
        `;
      }
    } else {
      // No groups or items don't use groups - render flat list (backwards compatible)
      content = visibleItems.map((item) => this.renderButton(item, getIcon, groupOptions)).join("\n");
    }

    if (visibleItems.length === 0) {
      content = '<p class="lp-empty">No items in battle.config</p>';
    }

    return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src ${this.view?.webview.cspSource} 'unsafe-inline'; font-src ${this.view?.webview.cspSource}; script-src 'unsafe-inline';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Codicon styles */
    ${this.getCodiconStyles()}
  </style>
  <title>Launchpad</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: transparent;
      padding: 8px;
      margin: 0;
    }
    .lp-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      padding: 4px;
      font-size: 11px;
    }
    .lp-search-box {
      width: 100%;
      padding: 6px 8px;
      margin-bottom: 8px;
      font-size: 12px;
      font-family: inherit;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, transparent);
      border-radius: 3px;
    }
    .lp-search-box:focus {
      outline: 1px solid var(--vscode-focusBorder);
    }
    .lp-search-actions {
      display: flex;
      gap: 6px;
      margin-bottom: 8px;
    }
    .lp-search-btn {
      flex: 1;
      padding: 4px 8px;
      font-size: 11px;
      font-family: inherit;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    .lp-search-btn:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .lp-toggle {
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      opacity: 0.8;
      user-select: none;
    }
    .lp-toggle:hover {
      opacity: 1;
    }
    .lp-toggle input[type="checkbox"] {
      cursor: pointer;
    }
    .lp-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .lp-group {
      margin-bottom: 8px;
    }
    .lp-group-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      padding: 4px 8px;
      margin-bottom: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      opacity: 0.7;
      border-bottom: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.35));
    }
    .lp-group-header-content {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
    }
    .lp-group-edit-btn {
      opacity: 0;
      padding: 2px 6px;
      background: transparent;
      border: none;
      color: var(--vscode-foreground);
      cursor: pointer;
      font-size: 14px;
      transition: opacity 0.2s;
    }
    .lp-group-header:hover .lp-group-edit-btn {
      opacity: 0.6;
    }
    .lp-group-edit-btn:hover {
      opacity: 1 !important;
      background: var(--vscode-toolbar-hoverBackground);
    }
    .lp-group-icon {
      font-size: 14px;
    }
    .lp-group-name {
      flex: 1;
    }
    .lp-group-items {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .lp-btn-wrapper {
      position: relative;
      display: flex;
      align-items: stretch;
    }
    .lp-btn-checkbox {
      position: absolute;
      left: 8px;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      z-index: 1;
    }
    .lp-btn.has-checkbox {
      padding-left: 32px;
    }
    .lp-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 8px 10px;
      border: 1px solid var(--vscode-button-border, var(--vscode-contrastBorder, transparent));
      border-radius: 4px;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      font-size: 12px;
      box-sizing: border-box;
      transition: background 0.1s;
    }
    .lp-btn:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .lp-btn-name {
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .lp-icon {
      font-size: 16px;
      line-height: 1;
      flex-shrink: 0;
    }
    .lp-hidden-badge {
      font-size: 9px;
      opacity: 0.5;
      font-weight: normal;
    }
    .lp-btn-meta {
      font-size: 10px;
      opacity: 0.7;
      margin-top: 2px;
    }
    .lp-hide-btn {
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      width: 26px;
      height: 26px;
      padding: 0;
      border: none;
      border-radius: 3px;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }
    .lp-group-btn {
      position: absolute;
      right: 32px;
      top: 50%;
      transform: translateY(-50%);
      width: 24px;
      height: 24px;
      padding: 0;
      border: none;
      border-radius: 3px;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .lp-btn-wrapper:hover .lp-hide-btn,
    .lp-btn-wrapper:hover .lp-group-btn {
      opacity: 1;
    }
    .lp-group-btn:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .lp-hide-btn:hover {
      background: var(--vscode-inputOption-hoverBackground);
    }
    .lp-group-dropdown {
      position: absolute;
      right: 32px;
      top: calc(50% + 16px);
      background: var(--vscode-dropdown-background);
      border: 1px solid var(--vscode-dropdown-border, var(--vscode-contrastBorder));
      border-radius: 3px;
      padding: 4px 0;
      z-index: 100;
      min-width: 150px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    .lp-group-option {
      padding: 4px 12px;
      font-size: 11px;
      cursor: pointer;
      white-space: nowrap;
    }
    .lp-group-option:hover {
      background: var(--vscode-list-hoverBackground);
    }
    .lp-hide-icon {
      font-size: 14px;
      line-height: 1;
    }
    .lp-empty {
      opacity: 0.6;
      font-style: italic;
      font-size: 12px;
    }
    .lp-toast {
      position: fixed;
      bottom: 16px;
      right: 16px;
      background: var(--vscode-notifications-background);
      color: var(--vscode-notifications-foreground);
      border: 1px solid var(--vscode-notifications-border);
      border-radius: 4px;
      padding: 10px 14px;
      font-size: 13px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.2s, transform 0.2s;
      pointer-events: none;
      max-width: 300px;
      line-height: 1.4;
    }
    .lp-toast.show {
      opacity: 1;
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <div id="toast" class="lp-toast"></div>
  <input type="text" class="lp-search-box" id="searchBox" placeholder="🔍 Search (try: group:npm, type:shell)..." autocomplete="off">
  <div id="searchActions" style="display: none;" class="lp-search-actions">
    <button class="lp-search-btn" id="hideAllBtn" style="display: none;">Hide All</button>
    <button class="lp-search-btn" id="showAllBtn" style="display: none;">Show All</button>
    <button class="lp-search-btn" id="selectMultipleBtn" style="display: none;">Select Multiple</button>
  </div>
  <div id="selectionActions" style="display: none;" class="lp-search-actions">
    <button class="lp-search-btn" id="hideSelectedBtn">Hide Selected</button>
    <button class="lp-search-btn" id="showSelectedBtn">Show Selected</button>
    <button class="lp-search-btn lp-btn-secondary" id="cancelSelectionBtn">Cancel</button>
  </div>
  ${hiddenCount > 0 ? `<div class="lp-toolbar">
    <label class="lp-toggle">
      <input type="checkbox" id="toggleHidden" ${this.showHidden ? 'checked' : ''}>
      <span>Show hidden (${hiddenCount})</span>
    </label>
  </div>` : ''}
  <div class="lp-grid" id="contentGrid">
    ${content}
  </div>
  <script>
    (function () {
      const vscode = acquireVsCodeApi();
      let searchTerm = '';
      let selectionMode = false;
      let allItems = ${JSON.stringify(visibleItems)};
      const iconMap = new Map(Object.entries(${JSON.stringify(Object.fromEntries(iconMap))}));
      const groupMap = ${JSON.stringify((config.groups || []).map(g => ({ name: g.name, icon: g.icon || '' })))};
      
      const toast = document.getElementById('toast');
      const searchBox = document.getElementById('searchBox');
      const searchActions = document.getElementById('searchActions');
      const selectionActions = document.getElementById('selectionActions');
      const contentGrid = document.getElementById('contentGrid');
      
      const hideAllBtn = document.getElementById('hideAllBtn');
      const showAllBtn = document.getElementById('showAllBtn');
      const selectMultipleBtn = document.getElementById('selectMultipleBtn');
      const hideSelectedBtn = document.getElementById('hideSelectedBtn');
      const showSelectedBtn = document.getElementById('showSelectedBtn');
      const cancelSelectionBtn = document.getElementById('cancelSelectionBtn');

      // Toast notification handler
      let toastTimeout;
      function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
          toast.classList.remove('show');
        }, 2500);
      }

      // Listen for messages from extension
      window.addEventListener('message', event => {
        const message = event.data;
        if (message.command === 'showToast') {
          showToast(message.message);
        }
      });

      const getIconForType = (type) => {
        return iconMap.get(type) || '';
      };

      const matchesSearch = (item, term) => {
        if (!term) return true;
        
        // Parse filter syntax: group:name, type:name
        const filters = [];
        const textTerms = [];
        
        const parts = term.split(/\s+/);
        parts.forEach(part => {
          const match = part.match(/^(group|type):(.+)$/i);
          if (match) {
            filters.push({ key: match[1].toLowerCase(), value: match[2].toLowerCase() });
          } else if (part.trim()) {
            textTerms.push(part.toLowerCase());
          }
        });
        
        // Apply filters
        for (const filter of filters) {
          if (filter.key === 'group') {
            const itemGroup = (item.group || '').toLowerCase();
            if (!itemGroup.includes(filter.value)) {
              return false;
            }
          } else if (filter.key === 'type') {
            const itemType = item.type.toLowerCase();
            if (!itemType.includes(filter.value)) {
              return false;
            }
          }
        }
        
        // If no text terms, filters matched
        if (textTerms.length === 0) {
          return true;
        }
        
        // Match text terms against name, icon, group
        const name = item.name.toLowerCase();
        const icon = getIconForType(item.type);
        const group = (item.group || '').toLowerCase();
        const groupIcon = groupMap.find(g => g.name === item.group)?.icon || '';
        
        const searchText = name + ' ' + icon + ' ' + group + ' ' + groupIcon;
        
        return textTerms.every(term => searchText.includes(term));
      };

      const getVisibleItems = () => {
        const visible = [];
        document.querySelectorAll('.lp-btn-wrapper').forEach(wrapper => {
          if (wrapper.style.display !== 'none') {
            const btn = wrapper.querySelector('.lp-btn');
            if (btn) {
              visible.push(JSON.parse(btn.getAttribute('data-item')));
            }
          }
        });
        return visible;
      };

      const updateSearchActions = (term) => {
        if (!term) {
          searchActions.style.display = 'none';
          selectionActions.style.display = 'none';
          return;
        }

        const visibleItems = getVisibleItems();
        const hasHidden = visibleItems.some(item => item.hidden);
        const hasVisible = visibleItems.some(item => !item.hidden);

        if (selectionMode) {
          searchActions.style.display = 'none';
          selectionActions.style.display = 'flex';
        } else {
          searchActions.style.display = 'flex';
          selectionActions.style.display = 'none';
          
          hideAllBtn.style.display = hasVisible ? 'block' : 'none';
          showAllBtn.style.display = hasHidden ? 'block' : 'none';
          selectMultipleBtn.style.display = 'block';
        }
      };

      const updateVisibility = (term) => {
        let hasVisible = false;
        document.querySelectorAll('.lp-btn-wrapper').forEach(wrapper => {
          const btn = wrapper.querySelector('.lp-btn');
          if (!btn) return;
          
          const item = JSON.parse(btn.getAttribute('data-item'));
          const matches = matchesSearch(item, term);
          
          wrapper.style.display = matches ? 'flex' : 'none';
          if (matches) hasVisible = true;
          
          // Add/remove checkbox based on selection mode
          let checkbox = wrapper.querySelector('.lp-btn-checkbox');
          if (selectionMode && matches && !checkbox) {
            checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'lp-btn-checkbox';
            checkbox.setAttribute('data-item', JSON.stringify(item));
            wrapper.insertBefore(checkbox, btn);
            btn.classList.add('has-checkbox');
          } else if (!selectionMode && checkbox) {
            checkbox.remove();
            btn.classList.remove('has-checkbox');
          }
        });
        
        // Hide/show groups if empty
        document.querySelectorAll('.lp-group').forEach(group => {
          const visibleItems = Array.from(group.querySelectorAll('.lp-btn-wrapper'))
            .filter(w => w.style.display !== 'none');
          group.style.display = visibleItems.length > 0 ? 'block' : 'none';
        });

        updateSearchActions(term);
      }

      searchBox.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        selectionMode = false;
        updateVisibility(searchTerm);
      });

      selectMultipleBtn.addEventListener('click', () => {
        selectionMode = true;
        updateVisibility(searchTerm);
      });

      cancelSelectionBtn.addEventListener('click', () => {
        selectionMode = false;
        updateVisibility(searchTerm);
      });

      hideAllBtn.addEventListener('click', () => {
        const items = getVisibleItems().filter(item => !item.hidden);
        if (items.length > 0) {
          vscode.postMessage({ command: 'bulkHideItems', items });
        }
      });

      showAllBtn.addEventListener('click', () => {
        const items = getVisibleItems().filter(item => item.hidden);
        if (items.length > 0) {
          vscode.postMessage({ command: 'bulkShowItems', items });
        }
      });

      hideSelectedBtn.addEventListener('click', () => {
        const selected = Array.from(document.querySelectorAll('.lp-btn-checkbox:checked'))
          .map(cb => JSON.parse(cb.getAttribute('data-item')));
        if (selected.length > 0) {
          vscode.postMessage({ command: 'bulkHideItems', items: selected });
        }
      });

      showSelectedBtn.addEventListener('click', () => {
        const selected = Array.from(document.querySelectorAll('.lp-btn-checkbox:checked'))
          .map(cb => JSON.parse(cb.getAttribute('data-item')));
        if (selected.length > 0) {
          vscode.postMessage({ command: 'bulkShowItems', items: selected });
        }
      });

      const toggleHidden = document.getElementById('toggleHidden');
      if (toggleHidden) {
        toggleHidden.addEventListener('change', () => {
          vscode.postMessage({ command: 'toggleShowHidden' });
        });
      }

      document.querySelectorAll('.lp-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const item = JSON.parse(btn.getAttribute('data-item'));
          vscode.postMessage({ command: 'executeCommand', item });
        });
      });

      document.querySelectorAll('.lp-hide-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const item = JSON.parse(btn.getAttribute('data-item'));
          vscode.postMessage({ command: 'hideItem', item });
        });
      });

      document.querySelectorAll('.lp-group-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const group = JSON.parse(btn.getAttribute('data-group'));
          vscode.postMessage({ command: 'editGroup', group });
        });
      });

      document.querySelectorAll('.lp-group-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const dropdown = btn.nextElementSibling;
          document.querySelectorAll('.lp-group-dropdown').forEach(d => {
            if (d !== dropdown) d.style.display = 'none';
          });
          dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });
      });

      document.querySelectorAll('.lp-group-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          const item = JSON.parse(opt.getAttribute('data-item'));
          const groupName = opt.getAttribute('data-group');
          vscode.postMessage({ command: 'assignGroup', item, groupName });
          opt.parentElement.style.display = 'none';
        });
      });

      document.addEventListener('click', () => {
        document.querySelectorAll('.lp-group-dropdown').forEach(d => {
          d.style.display = 'none';
        });
      });
    })();
  </script>
</body>
</html>`;
  }

  private renderButton(item: ConfigItem, getIcon: (type: string) => string, groupOptions: string, showCheckbox: boolean = false): string {
    const config = vscode.workspace.getConfiguration('battlestation');
    const showIconSetting = config.get<boolean>('display.showIcon', true);
    const showTypeSetting = config.get<boolean>('display.showType', true);
    const showCommandSetting = config.get<boolean>('display.showCommand', true);
    const hideIconName = config.get<string>('display.hideIcon', 'eye-closed');

    const icon = showIconSetting ? getIcon(item.type) : '';
    const itemJson = JSON.stringify(item).replace(/'/g, "&#39;");
    const groupOptionsWithItem = groupOptions.replace(/__PLACEHOLDER__/g, itemJson);
    
    // Build metadata line
    const metaParts = [];
    if (showTypeSetting) {
      metaParts.push(this.esc(item.type));
    }
    if (showCommandSetting) {
      metaParts.push(this.esc(item.command));
    }
    const metadata = metaParts.length > 0 ? `<span class="lp-btn-meta">${metaParts.join(' · ')}</span>` : '';
    
    // Only show group button if groups exist in config
    const showGroupButton = groupOptions.length > 0;
    
    // Hide icon - use 'eye' for showing hidden items, configured icon for hiding visible items
    const hideIcon = item.hidden ? 'eye' : hideIconName;
    
    return `<div class="lp-btn-wrapper">
      ${showCheckbox ? `<input type="checkbox" class="lp-btn-checkbox" data-item='${itemJson}'>` : ''}
      <button class="lp-btn ${showCheckbox ? 'has-checkbox' : ''}" data-item='${itemJson}'>
        <span class="lp-btn-name">
          ${icon ? `<span class="codicon codicon-${icon} lp-icon"></span>` : ''}${this.esc(item.name)}${item.hidden ? ' <span class="lp-hidden-badge">(hidden)</span>' : ''}
        </span>
        ${metadata}
      </button>
      ${showGroupButton ? `
      <button class="lp-group-btn" data-item='${itemJson}' title="Assign to group">
        <span class="codicon codicon-folder lp-group-icon"></span>
      </button>
      <div class="lp-group-dropdown" style="display: none;">
        <div class="lp-group-option" data-item='${itemJson}' data-group="__none__"><span class="codicon codicon-x"></span> Remove from group</div>
        ${groupOptionsWithItem}
      </div>
      ` : ''}
      <button class="lp-hide-btn" data-item='${itemJson}' title="${item.hidden ? 'Show this item' : 'Hide this item'}">
        <span class="codicon codicon-${hideIcon} lp-hide-icon"></span>
      </button>
    </div>`;
  }

  private getLoadingHtml(): string {
    return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src ${this.view?.webview.cspSource} 'unsafe-inline';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loading...</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: transparent;
      padding: 20px;
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 200px;
    }
    .loader {
      width: 40px;
      height: 40px;
      border: 4px solid var(--vscode-progressBar-background);
      border-top-color: var(--vscode-button-background);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .loading-text {
      margin-top: 16px;
      font-size: 13px;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="loader"></div>
  <div class="loading-text">Loading Launchpad...</div>
</body>
</html>`;
  }

  private getNoConfigHtml(): string {
    const workspaceRoot = this.getConfigPath() ? path.dirname(path.dirname(this.getConfigPath()!)) : "";
    const hasNpm = workspaceRoot && fs.existsSync(path.join(workspaceRoot, "package.json"));
    const hasTasks = workspaceRoot && fs.existsSync(path.join(workspaceRoot, ".vscode", "tasks.json"));
    const hasLaunch = workspaceRoot && fs.existsSync(path.join(workspaceRoot, ".vscode", "launch.json"));

    return this.getGenerateConfigFormHtml(hasNpm, hasTasks, hasLaunch, true);
  }

  private renderCheckbox(id: string, label: string, checked: boolean, disabled: boolean = false): string {
    return `
    <div class="lp-checkbox-row ${disabled ? 'disabled' : ''}">
      <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}>
      <label for="${id}">${label}</label>
    </div>`;
  }

  private getGenerateConfigFormHtml(hasNpm: boolean = false, hasTasks: boolean = false, hasLaunch: boolean = false, showWelcome: boolean = false): string {
    return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src ${this.view?.webview.cspSource} 'unsafe-inline'; font-src ${this.view?.webview.cspSource}; script-src 'unsafe-inline';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Codicon styles */
    ${this.getCodiconStyles()}
  </style>
  <title>Launchpad</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: transparent;
      padding: 16px 8px;
      margin: 0;
    }
    h2 { font-size: 14px; margin: 0 0 8px; }
    p { font-size: 12px; opacity: 0.8; margin: 0 0 12px; }
    .lp-sources {
      text-align: left;
      margin: 0 0 12px;
      padding: 8px;
      background: var(--vscode-editor-background);
      border-radius: 4px;
    }
    .lp-sources-title {
      font-size: 11px;
      font-weight: 600;
      opacity: 0.7;
      margin: 0 0 8px;
      text-transform: uppercase;
    }
    .lp-checkbox-row {
      display: flex;
      align-items: center;
      margin: 4px 0;
    }
    .lp-checkbox-row input {
      margin: 0 6px 0 0;
      cursor: pointer;
    }
    .lp-checkbox-row label {
      font-size: 12px;
      cursor: pointer;
      user-select: none;
    }
    .lp-checkbox-row.disabled {
      opacity: 0.4;
    }
    .lp-checkbox-row.disabled input,
    .lp-checkbox-row.disabled label {
      cursor: not-allowed;
    }
    .lp-form-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
    .lp-btn {
      flex: 1;
      padding: 6px 12px;
      font-size: 12px;
      font-family: inherit;
      border: none;
      border-radius: 3px;
      cursor: pointer;
    }
    .lp-btn-primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .lp-btn-primary:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .lp-btn-secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    .lp-btn-secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
  </style>
</head>
<body>
  ${showWelcome ? `
  <div class="lp-setup">
    <h2>Welcome to Battlestation</h2>
    <p>No <code>battle.config</code> found.</p>
    <p>Create one automatically or manually to get started.</p>
  </div>
  ` : '<h2>\ud83d\ude80 Generate Configuration</h2><p>Auto-detect commands from your workspace.</p>'}
  
  <div class="lp-sources">
    <div class="lp-sources-title">Auto-detect from:</div>
    ${this.renderCheckbox('npmCheck', 'npm scripts (package.json)', hasNpm, !hasNpm)}
    ${this.renderCheckbox('tasksCheck', 'VS Code tasks (tasks.json)', hasTasks, !hasTasks)}
    ${this.renderCheckbox('launchCheck', 'Launch configs (launch.json)', hasLaunch, !hasLaunch)}
  </div>
  <div class="lp-sources" style="margin-top: 8px;">
    <div class="lp-sources-title">Options:</div>
    ${this.renderCheckbox('groupCheck', 'Group by type', hasNpm || hasTasks || hasLaunch)}
  </div>
  ${showWelcome ? `
  <button class="lp-btn lp-btn-primary" id="createBtn" style="width: 100%;">Create battle.config</button>
  ` : `
  <div class="lp-form-actions">
    <button type="button" class="lp-btn lp-btn-secondary" id="cancelBtn">Cancel</button>
    <button type="button" class="lp-btn lp-btn-primary" id="createBtn">Generate</button>
  </div>
  `}
  <script>
    (function () {
      const vscode = acquireVsCodeApi();
      
      document.getElementById('createBtn').addEventListener('click', () => {
        const sources = {
          npm: document.getElementById('npmCheck').checked,
          tasks: document.getElementById('tasksCheck').checked,
          launch: document.getElementById('launchCheck').checked
        };
        const enableGrouping = document.getElementById('groupCheck').checked;
        vscode.postMessage({ command: 'createConfig', sources, enableGrouping });
      });
      
      const cancelBtn = document.getElementById('cancelBtn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          vscode.postMessage({ command: 'cancelForm' });
        });
      }
    })();
  </script>
</body>
</html>`;
  }

  private renderToggleSetting(id: string, label: string, description: string, checked: boolean): string {
    return `
    <div class="lp-setting-row">
      <div class="lp-setting-label">
        <div class="lp-setting-name">${label}</div>
        <div class="lp-setting-desc">${description}</div>
      </div>
      <label class="lp-setting-toggle">
        <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}>
        <span class="lp-toggle-slider"></span>
      </label>
    </div>`;
  }

  private getSettingsFormHtml(): string {
    const config = vscode.workspace.getConfiguration('battlestation');
    const showIcon = config.get<boolean>('display.showIcon', true);
    const showType = config.get<boolean>('display.showType', true);
    const showCommand = config.get<boolean>('display.showCommand', true);
    const showGroup = config.get<boolean>('display.showGroup', true);
    const hideIcon = config.get<string>('display.hideIcon', 'eye-closed');
    
    const configPath = this.getConfigPath();
    const configExists = configPath && fs.existsSync(configPath);
    
    // Get used icons for icon management
    const usedIcons = Array.from(this.getUsedCodiconNames()).sort();
    const launchpadConfig = this.readConfig();
    const configIconNames = (launchpadConfig.icons || []).map(i => i.icon);

    const hideIconOptions = [
      { value: 'eye-closed', label: 'Eye Closed', icon: 'eye-closed' },
      { value: 'x', label: 'X Mark', icon: 'x' },
      { value: 'trash', label: 'Trash', icon: 'trash' },
      { value: 'close', label: 'Close', icon: 'close' },
      { value: 'circle-slash', label: 'Circle Slash', icon: 'circle-slash' },
    ];

    return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src ${this.view?.webview.cspSource} 'unsafe-inline'; font-src ${this.view?.webview.cspSource}; script-src 'unsafe-inline';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Codicon styles */
    ${this.getCodiconStyles()}
  </style>
  <title>Settings</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: transparent;
      padding: 12px 8px;
      margin: 0;
    }
    h3 {
      margin: 0 0 16px;
      font-size: 13px;
      font-weight: 600;
    }
    .lp-setting-group {
      margin-bottom: 20px;
    }
    .lp-setting-group-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      opacity: 0.7;
      margin-bottom: 12px;
    }
    .lp-setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.15));
    }
    .lp-setting-label {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .lp-setting-name {
      font-size: 12px;
      font-weight: 500;
    }
    .lp-setting-desc {
      font-size: 10px;
      opacity: 0.7;
    }
    .lp-setting-toggle {
      width: 40px;
      height: 20px;
      position: relative;
      cursor: pointer;
    }
    .lp-setting-toggle input[type="checkbox"] {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .lp-toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 10px;
      transition: 0.2s;
    }
    .lp-toggle-slider:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: 2px;
      bottom: 2px;
      background: var(--vscode-input-foreground);
      border-radius: 50%;
      transition: 0.2s;
    }
    input:checked + .lp-toggle-slider {
      background: var(--vscode-button-background);
      border-color: var(--vscode-button-background);
    }
    input:checked + .lp-toggle-slider:before {
      transform: translateX(20px);
      background: var(--vscode-button-foreground);
    }
    .lp-form-actions {
      display: flex;
      gap: 8px;
      margin-top: 20px;
    }
    .lp-btn {
      flex: 1;
      padding: 6px 12px;
      font-size: 12px;
      font-family: inherit;
      border: none;
      border-radius: 3px;
      cursor: pointer;
    }
    .lp-btn-primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .lp-btn-primary:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .lp-btn-secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    .lp-btn-secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
  </style>
</head>
<body>
  <h3>⚙️ Settings</h3>
  
  <!-- Configuration Management -->
  <div class="lp-setting-group">
    <div class="lp-setting-group-title">📄 Configuration</div>
    
    <div class="lp-setting-row" style="border: none; padding: 4px 0;">
      <div class="lp-setting-label">
        <div class="lp-setting-name">battle.config</div>
        <div class="lp-setting-desc">Located at workspace root</div>
      </div>
    </div>
    
    <div style="display: flex; gap: 6px; margin-top: 8px;">
      <button type="button" class="lp-btn lp-btn-secondary" id="openConfigBtn" ${!configExists ? 'disabled' : ''} style="flex: 1;">
        <span class="codicon codicon-file"></span> Open
      </button>
      <button type="button" class="lp-btn lp-btn-secondary" id="generateConfigBtn" style="flex: 1;">
        <span class="codicon codicon-refresh"></span> ${configExists ? 'Regenerate' : 'Generate'}
      </button>
    </div>
    ${configExists ? `
    <div style="margin-top: 6px;">
      <button type="button" class="lp-btn lp-btn-secondary" id="deleteConfigBtn" style="width: 100%; background: var(--vscode-errorForeground); color: var(--vscode-button-foreground);">
        <span class="codicon codicon-trash"></span> Delete Config
      </button>
    </div>
    ` : ''}
  </div>

  <!-- Display Settings -->
  <div class="lp-setting-group">
    <div class="lp-setting-group-title">🎨 Display</div>
    
    ${this.renderToggleSetting('showIcon', 'Show Icons', 'Display codicons next to button names', showIcon)}
    ${this.renderToggleSetting('showType', 'Show Type', 'Display command type (npm, shell, vscode, etc.)', showType)}
    ${this.renderToggleSetting('showCommand', 'Show Command', 'Display the actual command text', showCommand)}
    ${this.renderToggleSetting('showGroup', 'Show Groups', 'Display group headers and organization', showGroup)}

    <div class="lp-setting-row">
      <div class="lp-setting-label">
        <div class="lp-setting-name">Hide Icon</div>
        <div class="lp-setting-desc">Icon to use for hiding items</div>
      </div>
      <select id="hideIcon" style="padding: 4px 8px; font-size: 12px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px;">
        ${hideIconOptions.map(opt => `
          <option value="${opt.value}" ${hideIcon === opt.value ? 'selected' : ''}>${opt.label}</option>
        `).join('')}
      </select>
    </div>
  </div>

  <!-- Icon Management -->
  <div class="lp-setting-group">
    <div class="lp-setting-group-title">🎭 Available Icons</div>
    
    <div class="lp-setting-row" style="border: none; flex-direction: column; align-items: flex-start; gap: 8px;">
      <div class="lp-setting-label" style="flex-direction: row; align-items: center; gap: 6px;">
        <span class="codicon codicon-info" style="color: var(--vscode-textLink-foreground);"></span>
        <div class="lp-setting-desc" style="margin: 0;">
          Only icons used in your config are loaded for performance. All <a href="https://microsoft.github.io/vscode-codicons/dist/codicon.html" style="color: var(--vscode-textLink-foreground);" target="_blank">codicons</a> are supported—just add them to your config and refresh.
        </div>
      </div>
      
      <div style="margin-top: 8px; width: 100%;">
        <div style="font-size: 11px; font-weight: 600; opacity: 0.7; margin-bottom: 6px;">Currently Loaded (${usedIcons.length} icons):</div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; padding: 8px; background: var(--vscode-editor-background); border-radius: 4px; max-height: 120px; overflow-y: auto;">
          ${usedIcons.map(icon => `
            <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 10px; padding: 4px 6px; background: var(--vscode-input-background); border-radius: 3px;" title="${icon}">
              <span class="codicon codicon-${icon}"></span>
              <span style="opacity: 0.7;">${icon}</span>
            </span>
          `).join('')}
        </div>
      </div>
    </div>
  </div>

  <div class="lp-form-actions">
    <button type="button" class="lp-btn lp-btn-secondary" id="cancelBtn">Cancel</button>
    <button type="button" class="lp-btn lp-btn-primary" id="saveBtn">Save Settings</button>
  </div>

  <script>
    (function () {
      const vscode = acquireVsCodeApi();

      document.getElementById('openConfigBtn')?.addEventListener('click', () => {
        vscode.postMessage({ command: 'openConfig' });
      });

      document.getElementById('generateConfigBtn')?.addEventListener('click', () => {
        vscode.postMessage({ command: 'showGenerateConfig' });
      });

      document.getElementById('deleteConfigBtn')?.addEventListener('click', () => {
        vscode.postMessage({ command: 'deleteConfig' });
      });

      document.getElementById('cancelBtn').addEventListener('click', () => {
        vscode.postMessage({ command: 'cancelForm' });
      });

      document.getElementById('saveBtn').addEventListener('click', () => {
        const settings = {
          showIcon: document.getElementById('showIcon').checked,
          showType: document.getElementById('showType').checked,
          showCommand: document.getElementById('showCommand').checked,
          showGroup: document.getElementById('showGroup').checked,
          hideIcon: document.getElementById('hideIcon').value
        };
        vscode.postMessage({ command: 'saveSettings', settings });
      });
    })();
  </script>
</body>
</html>`;
  }

  private getAddGroupFormHtml(): string {
    const config = this.readConfig();
    const existingIcons = (config.icons || []).map(i => i.icon).filter(Boolean);
    const suggestedIcons = ['folder', 'package', 'rocket', 'zap', 'tools', 'beaker', 'file-code', 'gear', 'database', 'cloud'];
    const availableIcons = suggestedIcons.filter(i => !existingIcons.includes(i));

    return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src ${this.view?.webview.cspSource} 'unsafe-inline'; font-src ${this.view?.webview.cspSource}; script-src 'unsafe-inline';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Codicon styles */
    ${this.getCodiconStyles()}
  </style>
  <title>Add Group</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: transparent;
      padding: 12px 8px;
      margin: 0;
    }
    h3 {
      margin: 0 0 12px;
      font-size: 13px;
      font-weight: 600;
    }
    .lp-form-group {
      margin-bottom: 12px;
    }
    .lp-form-group label {
      display: block;
      font-size: 11px;
      margin-bottom: 4px;
      opacity: 0.8;
    }
    .lp-form-group input {
      width: 100%;
      box-sizing: border-box;
      padding: 4px 8px;
      font-size: 12px;
      font-family: inherit;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, transparent);
      border-radius: 2px;
    }
    .lp-form-group input:focus {
      outline: 1px solid var(--vscode-focusBorder);
    }
    .lp-icon-picker {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
    }
    .lp-icon-option {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      cursor: pointer;
      border: 2px solid transparent;
      border-radius: 4px;
      background: var(--vscode-button-secondaryBackground);
    }
    .lp-icon-option:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .lp-icon-option.selected {
      border-color: var(--vscode-focusBorder);
      background: var(--vscode-button-background);
    }
    .lp-form-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }
    .lp-btn {
      flex: 1;
      padding: 6px 12px;
      font-size: 12px;
      font-family: inherit;
      border: none;
      border-radius: 3px;
      cursor: pointer;
    }
    .lp-btn-primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .lp-btn-primary:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .lp-btn-secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    .lp-btn-secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .lp-hint {
      font-size: 10px;
      opacity: 0.6;
      margin-top: 2px;
    }
  </style>
</head>
<body>
  <h3>Add New Group</h3>
  <form id="addGroupForm">
    <div class="lp-form-group">
      <label for="groupName">Group Name *</label>
      <input type="text" id="groupName" placeholder="e.g., Build Scripts" required>
    </div>
    <div class="lp-form-group">
      <label>Icon (optional)</label>
      <div class="lp-icon-picker" id="iconPicker">
        ${availableIcons.map(icon => `<div class="lp-icon-option" data-icon="${icon}"><span class="codicon codicon-${icon}"></span></div>`).join('')}
      </div>
      <input type="text" id="customIcon" placeholder="Or enter codicon name (e.g., 'folder') or emoji" style="margin-top: 6px; width: 100%;">
      <div class="lp-hint">Click an icon above or type codicon name/emoji</div>
    </div>
    <div class="lp-form-actions">
      <button type="button" class="lp-btn lp-btn-secondary" id="cancelBtn">Cancel</button>
      <button type="submit" class="lp-btn lp-btn-primary">Add Group</button>
    </div>
  </form>

  <script>
    (function () {
      const vscode = acquireVsCodeApi();
      let selectedIcon = '';

      document.querySelectorAll('.lp-icon-option').forEach(opt => {
        opt.addEventListener('click', () => {
          document.querySelectorAll('.lp-icon-option').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
          selectedIcon = opt.getAttribute('data-icon');
          document.getElementById('customIcon').value = '';
        });
      });

      document.getElementById('customIcon').addEventListener('input', (e) => {
        document.querySelectorAll('.lp-icon-option').forEach(o => o.classList.remove('selected'));
        selectedIcon = e.target.value.trim();
      });

      document.getElementById('cancelBtn').addEventListener('click', () => {
        vscode.postMessage({ command: 'cancelForm' });
      });

      document.getElementById('addGroupForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('groupName').value.trim();
        const customIcon = document.getElementById('customIcon').value.trim();
        const icon = customIcon || selectedIcon;
        
        if (name) {
          vscode.postMessage({ 
            command: 'submitNewGroup', 
            group: { name, icon: icon || undefined }
          });
        }
      });
    })();
  </script>
</body>
</html>`;
  }

  private getEditGroupFormHtml(): string {
    if (!this.currentEditGroup) {
      return this.getNoConfigHtml();
    }

    const group = this.currentEditGroup;
    const config = this.readConfig();
    const existingIcons = (config.icons || []).map(i => i.icon).filter(Boolean);
    const suggestedIcons = ['folder', 'package', 'rocket', 'zap', 'tools', 'beaker', 'file-code', 'gear', 'database', 'cloud', 'window', 'inbox', 'archive'];
    const availableIcons = suggestedIcons.filter(i => !existingIcons.includes(i) || i === group.icon);

    return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src ${this.view?.webview.cspSource} 'unsafe-inline'; font-src ${this.view?.webview.cspSource}; script-src 'unsafe-inline';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Codicon styles */
    ${this.getCodiconStyles()}
  </style>
  <title>Edit Group</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: transparent;
      padding: 12px 8px;
      margin: 0;
    }
    h3 {
      margin: 0 0 12px;
      font-size: 13px;
      font-weight: 600;
    }
    .lp-form-group {
      margin-bottom: 12px;
    }
    .lp-form-group label {
      display: block;
      font-size: 11px;
      margin-bottom: 4px;
      opacity: 0.8;
    }
    .lp-form-group input {
      width: 100%;
      box-sizing: border-box;
      padding: 4px 8px;
      font-size: 12px;
      font-family: inherit;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, transparent);
      border-radius: 2px;
    }
    .lp-form-group input:focus {
      outline: 1px solid var(--vscode-focusBorder);
    }
    .lp-icon-picker {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
    }
    .lp-icon-option {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      cursor: pointer;
      border: 2px solid transparent;
      border-radius: 4px;
      background: var(--vscode-button-secondaryBackground);
    }
    .lp-icon-option:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .lp-icon-option.selected {
      border-color: var(--vscode-focusBorder);
      background: var(--vscode-button-background);
    }
    .lp-form-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
    .lp-btn {
      flex: 1;
      padding: 6px 12px;
      font-size: 12px;
      font-family: inherit;
      border: none;
      border-radius: 3px;
      cursor: pointer;
    }
    .lp-btn-primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .lp-btn-primary:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .lp-btn-secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    .lp-btn-secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .lp-hint {
      font-size: 10px;
      opacity: 0.6;
      margin-top: 2px;
    }
  </style>
</head>
<body>
  <h3>Edit Group: ${this.esc(group.name)}</h3>
  <form id="editGroupForm">
    <div class="lp-form-group">
      <label for="groupName">Group Name *</label>
      <input type="text" id="groupName" placeholder="e.g., Build Scripts" value="${this.esc(group.name)}" required>
    </div>
    <div class="lp-form-group">
      <label>Icon (optional)</label>
      <div class="lp-icon-picker" id="iconPicker">
        ${availableIcons.map(icon => `<div class="lp-icon-option ${icon === group.icon ? 'selected' : ''}" data-icon="${icon}"><span class="codicon codicon-${icon}"></span></div>`).join('')}
      </div>
      <input type="text" id="customIcon" placeholder="Or enter codicon name (e.g., 'folder') or emoji" value="${this.esc(group.icon || '')}" style="margin-top: 6px; width: 100%;">
      <div class="lp-hint">Click an icon above or type codicon name/emoji</div>
    </div>
    <div class="lp-form-actions">
      <button type="button" class="lp-btn lp-btn-secondary" id="cancelBtn">Cancel</button>
      <button type="submit" class="lp-btn lp-btn-primary">Save Changes</button>
    </div>
  </form>

  <script>
    (function () {
      const vscode = acquireVsCodeApi();
      const oldGroup = ${JSON.stringify(group)};
      let selectedIcon = '${this.esc(group.icon || '')}';

      document.querySelectorAll('.lp-icon-option').forEach(opt => {
        opt.addEventListener('click', () => {
          document.querySelectorAll('.lp-icon-option').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
          selectedIcon = opt.getAttribute('data-icon');
          document.getElementById('customIcon').value = '';
        });
      });

      document.getElementById('customIcon').addEventListener('input', (e) => {
        document.querySelectorAll('.lp-icon-option').forEach(o => o.classList.remove('selected'));
        selectedIcon = e.target.value;
      });

      document.getElementById('cancelBtn').addEventListener('click', () => {
        vscode.postMessage({ command: 'cancelForm' });
      });

      document.getElementById('editGroupForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const groupName = document.getElementById('groupName').value.trim();
        const customIcon = document.getElementById('customIcon').value.trim();
        const icon = customIcon || selectedIcon || '';

        if (!groupName) {
          return;
        }

        const newGroup = { name: groupName, icon: icon || undefined };
        vscode.postMessage({ command: 'submitEditGroup', oldGroup, newGroup });
      });
    })();
  </script>
</body>
</html>`;
  }

  private getAddItemFormHtml(): string {
    const config = this.readConfig();
    const iconMap = new Map<string, string>();
    if (config.icons) {
      config.icons.forEach((mapping) => {
        iconMap.set(mapping.type, mapping.icon);
      });
    }

    // Merge with custom icon mappings from settings
    const customMappings = vscode.workspace.getConfiguration('battlestation').get<Record<string, string>>('customIconMappings', {});
    Object.entries(customMappings).forEach(([type, icon]) => {
      if (!iconMap.has(type)) {
        iconMap.set(type, icon);
      }
    });

    const typeOptions = Array.from(iconMap.entries())
      .map(([type, icon]) => `<option value="${type}">${type}</option>`)
      .join("\n");

    // Common codicons users can choose from
    const commonCodeicons = [
      'terminal', 'package', 'rocket', 'play', 'debug-alt', 'beaker', 'tools',
      'gear', 'cloud', 'cloud-upload', 'cloud-download', 'database', 'server',
      'file-code', 'code', 'git-merge', 'git-pull-request', 'source-control',
      'check', 'verified', 'testing-passed', 'error', 'warning', 'info',
      'folder', 'file', 'files', 'save', 'refresh', 'sync', 'search',
      'filter', 'list-tree', 'symbol-method', 'json', 'archive', 'bookmark',
      'bug', 'megaphone', 'organization', 'pulse', 'eye', 'flame', 'star'
    ];

    return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src ${this.view?.webview.cspSource} 'unsafe-inline'; font-src ${this.view?.webview.cspSource}; script-src 'unsafe-inline';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Codicon styles */
    ${this.getCodiconStyles()}
  </style>
  <title>Add Item</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: transparent;
      padding: 12px 8px;
      margin: 0;
    }
    h3 {
      margin: 0 0 12px;
      font-size: 13px;
      font-weight: 600;
    }
    .lp-form-group {
      margin-bottom: 12px;
    }
    .lp-form-group label {
      display: block;
      font-size: 11px;
      margin-bottom: 4px;
      opacity: 0.8;
    }
    .lp-form-group input,
    .lp-form-group select {
      width: 100%;
      box-sizing: border-box;
      padding: 4px 8px;
      font-size: 12px;
      font-family: inherit;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, transparent);
      border-radius: 2px;
    }
    .lp-form-group input:focus,
    .lp-form-group select:focus {
      outline: 1px solid var(--vscode-focusBorder);
    }
    .lp-form-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }
    .lp-btn {
      flex: 1;
      padding: 6px 12px;
      font-size: 12px;
      font-family: inherit;
      border: none;
      border-radius: 3px;
      cursor: pointer;
    }
    .lp-btn-primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .lp-btn-primary:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .lp-btn-secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    .lp-btn-secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .lp-hint {
      font-size: 10px;
      opacity: 0.6;
      margin-top: 2px;
    }
    .lp-icon-picker {
      margin-top: 12px;
      padding: 8px;
      background: var(--vscode-editor-background);
      border-radius: 4px;
    }
    .lp-icon-picker-title {
      font-size: 11px;
      margin-bottom: 8px;
      opacity: 0.8;
    }
    .lp-icon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
      gap: 4px;
      max-height: 150px;
      overflow-y: auto;
    }
    .lp-icon-option {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border: 1px solid transparent;
      border-radius: 3px;
      opacity: 0.7;
      transition: all 0.2s;
    }
    .lp-icon-option:hover {
      opacity: 1;
      background: var(--vscode-list-hoverBackground);
      border-color: var(--vscode-focusBorder);
    }
    .lp-icon-option.selected {
      opacity: 1;
      background: var(--vscode-list-activeSelectionBackground);
      border-color: var(--vscode-focusBorder);
    }
    .lp-icon-option .codicon {
      font-size: 16px;
    }
    #customIconInput {
      margin-top: 8px;
      font-family: var(--vscode-editor-font-family);
    }
  </style>
</head>
<body>
  <h3>Add New Command</h3>
  <form id="addForm">
    <div class="lp-form-group">
      <label for="name">Name *</label>
      <input type="text" id="name" placeholder="e.g., Build Project" required>
    </div>
    <div class="lp-form-group">
      <label for="type">Type *</label>
      <select id="type" required>
        ${typeOptions}
        <option value="custom">✏️ Custom type...</option>
      </select>
      <input type="text" id="customType" placeholder="Enter custom type" style="display: none; margin-top: 4px;">
      <div class="lp-hint" id="typeHint">Select a type or create a custom one</div>
    </div>
    <div class="lp-form-group" id="customTypeSection" style="display: none;">
      <label>Custom Type Icon</label>
      <div class="lp-icon-picker">
        <div class="lp-icon-picker-title">Choose a codicon (or enter a custom name below):</div>
        <div class="lp-icon-grid" id="iconGrid">
          ${commonCodeicons.map(icon => `
            <div class="lp-icon-option" data-icon="${icon}" title="${icon}">
              <span class="codicon codicon-${icon}"></span>
            </div>
          `).join('')}
        </div>
        <input type="text" id="customIconInput" placeholder="Or enter codicon name (e.g., rocket)">
        <div class="lp-hint">Browse all codicons at <a href="https://microsoft.github.io/vscode-codicons/dist/codicon.html" style="color: var(--vscode-textLink-foreground);">microsoft.github.io/vscode-codicons</a></div>
      </div>
    </div>
    <div class="lp-form-group">
      <label for="command">Command *</label>
      <input type="text" id="command" placeholder="e.g., npm run build" required>
      <div class="lp-hint" id="commandHint">Shell command to execute</div>
    </div>
    <div class="lp-form-actions">
      <button type="button" class="lp-btn lp-btn-secondary" id="cancelBtn">Cancel</button>
      <button type="submit" class="lp-btn lp-btn-primary">Add</button>
    </div>
  </form>

  <script>
    (function () {
      const vscode = acquireVsCodeApi();
      const typeSelect = document.getElementById('type');
      const customTypeInput = document.getElementById('customType');
      const customTypeSection = document.getElementById('customTypeSection');
      const iconGrid = document.getElementById('iconGrid');
      const customIconInput = document.getElementById('customIconInput');
      const commandInput = document.getElementById('command');
      const typeHint = document.getElementById('typeHint');
      const commandHint = document.getElementById('commandHint');
      
      let selectedIcon = null;

      // Icon selection
      iconGrid.addEventListener('click', (e) => {
        const option = e.target.closest('.lp-icon-option');
        if (!option) return;
        
        // Remove previous selection
        iconGrid.querySelectorAll('.lp-icon-option').forEach(opt => opt.classList.remove('selected'));
        
        // Select new icon
        option.classList.add('selected');
        selectedIcon = option.dataset.icon;
        customIconInput.value = selectedIcon;
      });

      // Custom icon input
      customIconInput.addEventListener('input', () => {
        iconGrid.querySelectorAll('.lp-icon-option').forEach(opt => opt.classList.remove('selected'));
        selectedIcon = customIconInput.value;
      });

      typeSelect.addEventListener('change', () => {
        if (typeSelect.value === 'custom') {
          customTypeInput.style.display = 'block';
          customTypeInput.required = true;
          customTypeSection.style.display = 'block';
          typeHint.textContent = 'Enter a custom type name';
        } else {
          customTypeInput.style.display = 'none';
          customTypeInput.required = false;
          customTypeSection.style.display = 'none';
          customTypeInput.value = '';
          
          if (typeSelect.value === 'vscode') {
            typeHint.textContent = 'Executes a VS Code command';
            commandHint.textContent = 'e.g., workbench.action.terminal.new';
            commandInput.placeholder = 'e.g., workbench.action.terminal.new';
          } else if (typeSelect.value.includes('npm') || typeSelect.value.includes('shell')) {
            typeHint.textContent = 'Runs the command in a terminal';
            commandHint.textContent = 'Shell command to execute';
            commandInput.placeholder = 'e.g., npm run build';
          } else {
            typeHint.textContent = 'Command type: ' + typeSelect.value;
            commandHint.textContent = 'Enter the command to execute';
            commandInput.placeholder = 'e.g., your-command here';
          }
        }
      });

      document.getElementById('cancelBtn').addEventListener('click', () => {
        vscode.postMessage({ command: 'cancelForm' });
      });

      document.getElementById('addForm').addEventListener('submit', (e) => {
        e.preventDefault();
        let itemType = typeSelect.value;
        
        if (itemType === 'custom') {
          itemType = customTypeInput.value.trim();
          if (!itemType) {
            return;
          }
        }
        
        const item = {
          name: document.getElementById('name').value.trim(),
          type: itemType,
          command: document.getElementById('command').value.trim()
        };
        
        if (item.name && item.command) {
          // Check if a custom icon was selected
          const selectedIconInput = document.querySelector('input[name="iconSelect"]:checked');
          const customIconInput = document.getElementById('customIconInput');
          let customIcon = null;
          
          if (selectedIconInput && selectedIconInput.value) {
            customIcon = selectedIconInput.value;
          } else if (customIconInput && customIconInput.value.trim()) {
            customIcon = customIconInput.value.trim();
          }
          
          if (customIcon) {
            vscode.postMessage({ command: 'submitNewItemWithIcon', item, customIcon });
          } else {
            vscode.postMessage({ command: 'submitNewItem', item });
          }
        }
      });
    })();
  </script>
</body>
</html>`;
  }

  private esc(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
