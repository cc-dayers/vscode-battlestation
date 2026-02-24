import * as vscode from "vscode";
import type { Action, IconMapping, Group, Config, Todo } from "./types";
import { ConfigService } from "./services/configService";
import { TodosService } from "./services/todosService";
import { ToolDetectionService } from "./services/toolDetectionService";
import { getNonce } from "./templates/nonce";
import {
  renderMainView,
  renderLoadingView,
  renderGenerateConfigView,
  renderSettingsView,
  renderAddGroupForm,
  renderEditGroupForm,
  renderEditActionForm,
  renderAddActionForm,
} from "./views";
// Import codicon CSS as a string at build time via esbuild plugin
import codiconCssTemplate from "../media/codicon.css";

type FormState =
  | false
  | true
  | "group"
  | "settings"
  | "editGroup"
  | "editAction"
  | "generateConfig";

export class BattlestationViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private showingForm: FormState = false;
  private showHidden = false;
  private searchVisible = false;
  private currentEditGroup?: Group;
  private currentEditAction?: Action;
  private generateFormParams?: {
    hasNpm: boolean;
    hasTasks: boolean;
    hasLaunch: boolean;
    enhancedMode?: {
      hasDocker: boolean;
      hasDockerCompose: boolean;
      hasPython: boolean;
      hasGo: boolean;
      hasRust: boolean;
      hasMakefile: boolean;
      hasGradle: boolean;
      hasMaven: boolean;
      hasCMake: boolean;
      hasGit: boolean;
    };
  };

  private readonly disposables: vscode.Disposable[] = [];

  public static readonly defaultIcons: IconMapping[] = [
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

  private readonly toolDetectionService: ToolDetectionService;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly configService: ConfigService,
    private readonly todosService: TodosService
  ) {
    this.toolDetectionService = new ToolDetectionService(context);
    // Refresh when config or todos change
    this.disposables.push(
      this.configService.onDidChange(() => this.refresh()),
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("battlestation")) {
          // If enhanced mode setting changed and we are preparing generation config
          if (
            e.affectsConfiguration("battlestation.experimental.enableEnhancedMode") &&
            this.showingForm === "generateConfig"
          ) {
            void this.handleShowGenerateConfig();
            return;
          }
          // Only refresh if we're in main view or a form (not transitioning)
          // This prevents race conditions when saving settings
          void this.refresh();
        }
      })
    );
    // todosView handles its own refresh for todos changes
  }

  /* ─── Disposal ─── */

  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
  }

  /* ─── WebviewViewProvider ─── */

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _ctx: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this.view = webviewView;
    this._cachedCodiconStyles = undefined;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "media"),
      ],
    };

    // Show loading view immediately while initializing
    const cspSource = webviewView.webview.cspSource;
    const nonce = getNonce();

    webviewView.webview.html = renderLoadingView(cspSource, nonce, {});

    // Set up context after first render
    void this.configService.getConfigStatus().then((status) => {
      vscode.commands.executeCommand("setContext", "battlestation.hasConfig", status.valid);
    });

    webviewView.webview.onDidReceiveMessage((msg) => this.handleMessage(msg));
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        void this.refresh();
      }
    });

    // Refresh with actual content
    void this.refresh();
  }

  /* ─── message router ─── */

  private handleMessage(message: any) {
    switch (message.command) {
      case "refresh":
        void this.refresh();
        break;
      case "redetectTools":
        void this.handleRedetectTools(message.detectionMethod || "hybrid");
        break;
      case "createConfig":
        void this.handleCreateConfig(
          message.sources || {},
          message.enableGrouping || false,
          message.enhancedSources || {},
          message.detectionMethod || "hybrid",
          message.enableColoring || false
        );
        break;
      case "executeCommand":
        void this.executeCommand(message.item);
        break;
      case "showAddForm":
        this.showingForm = true;
        void this.refresh();
        break;
      case "showAddGroupForm":
        this.showingForm = "group";
        void this.refresh();
        break;
      case "cancelForm":
        console.log('[ViewProvider] Received cancelForm message');
        this.showingForm = false;
        void this.refresh();
        break;
      case "submitNewAction":
        void this.addNewAction(message.item);
        break;
      case "submitNewActionWithIcon":
        void this.addNewActionWithIcon(message.item, message.customIcon);
        break;
      case "submitNewGroup":
        void this.addNewGroup(message.group);
        break;
      case "editGroup":
        this.showingForm = "editGroup";
        this.currentEditGroup = message.group;
        void this.refresh();
        break;
      case "submitEditGroup":
        void this.updateGroup(message.oldGroup, message.newGroup);
        break;
      case "editAction":
        this.showingForm = "editAction";
        this.currentEditAction = message.item;
        void this.refresh();
        break;
      case "setActionColor":
        void this.handleSetActionColor(message.item);
        break;
      case "submitEditAction":
        void this.updateAction(message.oldItem, message.newItem, message.customIcon);
        break;
      case "toggleShowHidden":
        this.showHidden = !this.showHidden;
        void this.refresh();
        break;
      case "hideAction":
        void this.hideAction(message.item);
        break;
      case "assignGroup":
        void this.assignActionToGroup(message.item, message.groupName);
        break;
      case "hideGroup":
        void this.toggleGroupHidden(message.group);
        break;
      case "bulkHideActions":
        void this.bulkHideActions(message.items);
        break;
      case "bulkShowActions":
        void this.bulkShowActions(message.items);
        break;
      case "saveSettings":
        void this.saveSettings(message.settings);
        break;
      case "openConfig":
        void this.configService.openConfigFile();
        this.showingForm = false;
        void this.refresh();
        break;
      case "openConfigFolder":
        void this.configService.openConfigFolder();
        break;
      case "changeConfigLocation":
        void this.handleChangeConfigLocation();
        break;
      case "resetConfigLocation":
        void this.handleResetConfigLocation();
        break;
      case "importConfig":
        void this.handleImportConfig();
        break;
      case "showGenerateConfig":
        void this.handleShowGenerateConfig();
        break;
      case "createBlankConfig":
        void this.handleCreateBlankConfig();
        break;
      case "createExampleConfig":
        void this.handleCreateExampleConfig();
        break;
      case "deleteConfig":
        void this.handleDeleteConfig();
        break;
      case "restoreConfig":
        void this.handleRestoreConfig();
        break;
      case "openVisualSettings":
        void this.handleOpenVisualSettings();
        break;
      case "saveCustomColor":
        void this.saveCustomColor(message.color);
        break;
      case "reorderActions":
        void this.handleReorderActions(message.actions);
        break;
    }
  }

  public toggleSearch() {
    this.searchVisible = !this.searchVisible;
    if (this.view) {
      this.view.webview.postMessage({ type: "toggleSearch", visible: this.searchVisible });
    }
  }

  public collapseAllGroups() {
    if (this.view) {
      this.view.webview.postMessage({ type: "collapseAllGroups" });
    }
    vscode.commands.executeCommand("setContext", "battlestation.allGroupsCollapsed", true);
  }

  public expandAllGroups() {
    if (this.view) {
      this.view.webview.postMessage({ type: "expandAllGroups" });
    }
    vscode.commands.executeCommand("setContext", "battlestation.allGroupsCollapsed", false);
  }

  public toggleShowHidden() {
    this.showHidden = !this.showHidden;
    vscode.commands.executeCommand("setContext", "battlestation.showHidden", this.showHidden);
    void this.refresh();
  }

  /* ─── public API for TodoPanelProvider ─── */

  public async getTodosData() {
    return this.todosService.readTodos();
  }

  public async createTodo(title: string, description: string) {
    await this.todosService.addTodo(title, description);
    this.showToast("Todo added");
  }

  public async modifyTodo(id: string, updates: Partial<Omit<Todo, "order">>): Promise<void> {
    await this.todosService.updateTodo(id, updates);
    this.showToast("Todo updated");
  }

  public async removeTodo(id: string) {
    await this.todosService.deleteTodo(id);
    this.showToast("Todo deleted");
  }

  public async reorderTodoList(todoIds: string[]) {
    await this.todosService.reorderTodos(todoIds);
  }

  /* ─── form launchers (called from extension commands) ─── */

  public async showAddActionForm() {
    if (!(await this.configService.configExists())) {
      await this.configService.createMinimalConfig(BattlestationViewProvider.defaultIcons);
    }
    this.showingForm = true;
    void this.refresh();
  }

  public showAddGroupForm() {
    void this.configService.configExists().then((exists) => {
      if (!exists) {
        vscode.window.showWarningMessage("Create at least one action before adding groups.");
        return;
      }
      this.showingForm = "group";
      void this.refresh();
    });
  }

  public async showSettingsForm() {
    this.showingForm = "settings";
    await vscode.commands.executeCommand("battlestation.view.focus");
    this.view?.show?.(true);
    void this.refresh();
  }

  /* ─── refresh / render ─── */

  private refreshTimeout?: NodeJS.Timeout;

  public async refresh() {
    // Debounce the refresh to prevent excessive CPU usage
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    this.refreshTimeout = setTimeout(async () => {
      if (!this.view) {
        return;
      }

      const configStatus = await this.configService.getConfigStatus();
      const exists = configStatus.exists;
      const valid = configStatus.valid;
      vscode.commands.executeCommand("setContext", "battlestation.hasConfig", valid);

      const cspSource = this.view.webview.cspSource;
      const nonce = getNonce();

      // Optimized refresh: if we are staying in the main view, just update data
      const isMainView = this.showingForm === false;
      const wasMainView = this._currentViewMode === "main"; // We need to track this

      if (isMainView) {
        this._currentViewMode = "main";
      } else {
        const activeForm = this.showingForm;
        this._currentViewMode = typeof activeForm === "boolean" ? "addAction" : activeForm;
      }

      if (this.showingForm === "settings") {
        this.view.webview.html = await this.renderSettings(cspSource, nonce);
        return;
      }

      // Check for generateConfig form BEFORE no-config screen
      if (this.showingForm === "generateConfig") {
        const params = this.generateFormParams || {
          hasNpm: false,
          hasTasks: false,
          hasLaunch: false,
        };
        this.view.webview.html = renderGenerateConfigView({
          cspSource,
          nonce,
          codiconStyles: this.getCodiconStyles(),
          ...params,
          showWelcome: false,
        });
        return;
      }

      if (!exists || !valid) {
        this.showingForm = false;
        const codiconStyles = this.getCodiconStyles();

        // Quick detection of basic tools for welcome view
        // This is fast (just file existence checks) so it won't slow down initial load
        const hasNpm = await this.configService.hasSource("npm");
        const hasTasks = await this.configService.hasSource("tasks");
        const hasLaunch = await this.configService.hasSource("launch");

        this.view.webview.html = renderGenerateConfigView({
          cspSource,
          nonce,
          codiconStyles,
          hasNpm,
          hasTasks,
          hasLaunch,
          showWelcome: true,
          enhancedMode: undefined,
        });
        return;
      }

      if (this.showingForm === "group") {
        this.view.webview.html = await this.renderAddGroup(cspSource, nonce);
        return;
      }

      if (this.showingForm === "editGroup") {
        this.view.webview.html = await this.renderEditGroup(cspSource, nonce);
        return;
      }

      if (this.showingForm === "editAction") {
        if (!this.currentEditAction) {
          this.view.webview.html = await this.renderAddAction(cspSource, nonce);
          return;
        }
        this.view.webview.html = await this.renderEditAction(cspSource, nonce);
        return;
      }

      if (this.showingForm === true) {
        this.view.webview.html = await this.renderAddAction(cspSource, nonce);
        return;
      }

      // Main view
      const config = configStatus.config || (await this.configService.readConfig());

      if (isMainView) {
        // If we were already in main view and it's visible, try to update via specific message
        // instead of replacing the whole HTML which causes a reload/flash.
        if (wasMainView && this.view.visible) {
          const enrichedConfig = this.getEnrichedConfig(config);
          this.view.webview.postMessage({
            type: "update",
            data: {
              ...enrichedConfig,
              showHidden: this.showHidden
            }
          });
          return;
        }
      }

      this.view.webview.html = this.renderMain(config, cspSource, nonce);
    }, 100);
  }

  private _currentViewMode: string | boolean = false;

  /* ─── render helpers ─── */

  private getEnrichedConfig(config: Config): Config & Record<string, any> {
    const wsConfig = vscode.workspace.getConfiguration("battlestation");
    const customMappings = wsConfig.get<Record<string, string>>("customIconMappings", {});

    // Merge custom icon mappings into config
    const mergedIcons = [...(config.icons || [])];
    for (const [type, icon] of Object.entries(customMappings)) {
      if (!mergedIcons.find((m) => m.type === type)) {
        mergedIcons.push({ type, icon });
      }
    }

    return {
      ...config,
      icons: mergedIcons,
      display: {
        showIcon: wsConfig.get<boolean>("display.showIcon", false),
        showType: wsConfig.get<boolean>("display.showType", true),
        showCommand: wsConfig.get<boolean>("display.showCommand", true),
        showGroup: wsConfig.get<boolean>("display.showGroup", true),
        hideIcon: wsConfig.get<string>("display.hideIcon", "eye-closed"),
        playButtonBg: wsConfig.get<string>("display.playButtonBackgroundColor", "transparent"),
        density: wsConfig.get<string>("display.density", "comfortable"),
        useEmojiLoader: wsConfig.get<boolean>("display.useEmojiLoader", false),
        loaderEmoji: wsConfig.get<string>("display.loaderEmoji", "🌯"),
      },
      secondaryGroups: wsConfig.get<Record<string, Group>>("secondaryGroups", {}),
    };
  }

  private renderMain(config: Config, cspSource: string, nonce: string): string {
    const enrichedConfig = this.getEnrichedConfig(config);
    const scriptUri = this.view?.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "mainView.js")
    ).toString();

    return renderMainView({
      cspSource,
      nonce,
      codiconStyles: this.getCodiconStyles(),
      config: enrichedConfig,
      initialData: enrichedConfig,
      showHidden: this.showHidden,
      searchVisible: this.searchVisible,
      scriptUri,
      cssUri: this.view?.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "media", "output.css")).toString(),
    });
  }

  private async renderSettings(cspSource: string, nonce: string): Promise<string> {
    const wsConfig = vscode.workspace.getConfiguration("battlestation");
    const config = await this.configService.readConfig();
    const usedIcons = Array.from(this.getUsedCodiconNames(config)).sort();
    const configExists = await this.configService.configExists();
    const backups = await this.configService.listConfigVersions();
    const settingsScriptUri = this.view
      ? this.view.webview.asWebviewUri(
        vscode.Uri.joinPath(this.context.extensionUri, "media", "settingsView.js")
      ).toString()
      : "";

    return renderSettingsView({
      cspSource,
      nonce,
      codiconStyles: this.getCodiconStyles(),
      showIcon: wsConfig.get<boolean>("display.showIcon", false),
      showType: wsConfig.get<boolean>("display.showType", true),
      showCommand: wsConfig.get<boolean>("display.showCommand", true),
      showGroup: wsConfig.get<boolean>("display.showGroup", true),
      hideIcon: wsConfig.get<string>("display.hideIcon", "eye-closed"),
      backupCount: backups.length,
      configExists,
      usedIcons,
      customConfigPath: this.configService.getCustomConfigPath(),
      settingsScriptUri,
      cssUri: this.view?.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "media", "output.css")).toString(),
    });
  }

  private async renderAddGroup(cspSource: string, nonce: string): Promise<string> {
    const config = await this.configService.readConfig();
    const existingIcons = (config.icons || []).map((i) => i.icon).filter(Boolean);
    const suggested = [
      "folder", "package", "rocket", "zap", "tools", "beaker",
      "file-code", "gear", "database", "cloud",
    ];
    return renderAddGroupForm({
      cspSource,
      nonce,
      codiconStyles: this.getCodiconStyles(),
      availableIcons: suggested.filter((i) => !existingIcons.includes(i)),
      customColors: config.customColors || [],
    });
  }

  private async renderEditGroup(cspSource: string, nonce: string): Promise<string> {
    if (!this.currentEditGroup) {
      // Fallback to no-config view
      return renderGenerateConfigView({
        cspSource,
        nonce,
        codiconStyles: this.getCodiconStyles(),
        hasNpm: false,
        hasTasks: false,
        hasLaunch: false,
        showWelcome: true,
      });
    }
    const config = await this.configService.readConfig();
    const existingIcons = (config.icons || []).map((i) => i.icon).filter(Boolean);
    const suggested = [
      "folder", "package", "rocket", "zap", "tools", "beaker",
      "file-code", "gear", "database", "cloud", "window", "inbox", "archive",
    ];
    return renderEditGroupForm({
      cspSource,
      nonce,
      codiconStyles: this.getCodiconStyles(),
      group: this.currentEditGroup,
      availableIcons: suggested.filter(
        (i) => !existingIcons.includes(i) || i === this.currentEditGroup!.icon
      ),
      customColors: config.customColors || [],
    });
  }

  private async renderEditAction(cspSource: string, nonce: string): Promise<string> {
    const config = await this.configService.readConfig();
    const iconMap = this.buildIconMap(config);
    return renderEditActionForm({
      cspSource,
      nonce,
      codiconStyles: this.getCodiconStyles(),
      item: this.currentEditAction!,
      iconMap,
      customColors: config.customColors || [],
    });
  }

  private async renderAddAction(cspSource: string, nonce: string): Promise<string> {
    const config = await this.configService.readConfig();
    const iconMap = this.buildIconMap(config);
    const typeOptions = Array.from(iconMap.entries())
      .map(([type]) => `<option value="${type}">${type}</option>`)
      .join("\n");
    return renderAddActionForm({
      cspSource,
      nonce,
      codiconStyles: this.getCodiconStyles(),
      typeOptions,
      customColors: config.customColors || [],
    });
  }

  /* ─── codicon styles ─── */

  private _cachedCodiconStyles: string | undefined;

  private getCodiconStyles(): string {
    if (!this.view) {
      return "";
    }

    if (this._cachedCodiconStyles) {
      return this._cachedCodiconStyles;
    }

    const codiconFontUri = this.view.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "codicon.ttf")
    );

    // CSS is imported as a string at build time via esbuild plugin
    // Replace the font URL with the webview URI
    const updatedCss = codiconCssTemplate.replace(
      /src:\s*url\([^)]+\)(\s*format\([^)]+\))?/g,
      `src: url("${codiconFontUri}") format("truetype")`
    );

    this._cachedCodiconStyles = updatedCss;
    return updatedCss;
  }

  /* ─── icon helpers ─── */

  private buildIconMap(config: Config): Map<string, string> {
    const iconMap = new Map<string, string>();
    if (config.icons) {
      config.icons.forEach((m) => iconMap.set(m.type, m.icon));
    }
    const customMappings = vscode.workspace
      .getConfiguration("battlestation")
      .get<Record<string, string>>("customIconMappings", {});
    for (const [type, icon] of Object.entries(customMappings)) {
      if (!iconMap.has(type)) {
        iconMap.set(type, icon);
      }
    }
    return iconMap;
  }

  private getUsedCodiconNames(config: Config): Set<string> {
    const used = new Set<string>();
    try {
      if (config.icons) {
        config.icons.forEach((m) => m.icon && used.add(m.icon));
      }
      if (config.groups) {
        config.groups.forEach((g) => {
          if (g.icon && /^[a-z0-9-]+$/.test(g.icon)) { used.add(g.icon); }
        });
      }
      const customMappings = vscode.workspace
        .getConfiguration("battlestation")
        .get<Record<string, string>>("customIconMappings", {});
      Object.values(customMappings).forEach((icon) => used.add(icon));
      used.add(
        vscode.workspace
          .getConfiguration("battlestation")
          .get<string>("display.hideIcon", "eye-closed")
      );
      used.add("eye");
      [
        "refresh", "gear", "add", "new-folder", "folder", "folder-opened",
        "x", "settings-gear", "rocket", "info", "edit",
      ].forEach((i) => used.add(i));
    } catch {
      return new Set([
        "terminal", "package", "extensions", "check", "play", "file-code",
        "file", "source-control", "tools", "beaker", "folder", "folder-opened",
        "eye-closed", "eye", "x", "refresh", "gear", "add", "new-folder",
        "settings-gear", "rocket", "info",
      ]);
    }
    return used;
  }

  /* ─── command execution ─── */

  private async executeCommand(item: Action) {
    try {
      switch (item.type) {
        case "launch":
          await this.executeLaunchConfig(item.command);
          break;
        case "vscode":
        case "task":
          await this.executeVSCodeCommand(item.command);
          break;
        default:
          await this.executeShellCommand(item);
          break;
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to execute: ${(error as Error).message}`);
    }
  }

  private async executeLaunchConfig(command: string) {
    // Format: workbench.action.debug.start|ConfigName
    const [, configName] = command.split("|");
    if (!configName) {
      throw new Error("No launch configuration name specified");
    }

    // Use VS Code debug API to start debugging with the named configuration
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    await vscode.debug.startDebugging(workspaceFolder, configName.trim());
  }

  private async executeVSCodeCommand(command: string) {
    const [cmd, ...args] = command.split("|");
    if (args.length > 0) {
      await vscode.commands.executeCommand(cmd.trim(), ...args);
    } else {
      await vscode.commands.executeCommand(cmd.trim());
    }
  }

  private async executeShellCommand(item: Action) {
    const wsConfig = vscode.workspace.getConfiguration("battlestation");
    const shells = wsConfig.get<Record<string, string>>("shells", {});
    const shellEnv = shells[item.type]; // e.g. "bash" or "pwsh"

    // Construct options
    const terminalOptions: vscode.TerminalOptions = {
      name: `Launchpad${item.workspace ? ` (${item.workspace})` : ""}`,
      cwd: item.cwd || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
    };

    if (shellEnv) {
      terminalOptions.shellPath = shellEnv;
    }

    // Try to reuse terminal if not specifically configured otherwise (could be a future setting)
    // For now, let's create a new one to ensure clean state and correct shell
    const terminal = vscode.window.createTerminal(terminalOptions);
    terminal.show();
    terminal.sendText(item.command);
  }

  /* ─── config CRUD (delegates to configService) ─── */

  private async addNewAction(item: Action) {
    const config = await this.configService.readConfig();
    config.actions.push(item);
    await this.configService.writeConfig(config);
    this.showingForm = false;
    void this.refresh();
    this.showToast(`\ud83d\udc4d Added: ${item.name}`);
  }

  private async addNewActionWithIcon(item: Action, customIcon: string) {
    await this.saveCustomIconMapping(item.type, customIcon);
    await this.addNewAction(item);
  }

  private async updateAction(oldItem: Action, newItem: Action, customIcon?: string) {
    const config = await this.configService.readConfig();
    const index = config.actions.findIndex(
      (i) => i.name === oldItem.name && i.command === oldItem.command && i.type === oldItem.type
    );
    if (index === -1) {
      vscode.window.showErrorMessage("Could not find action to update");
      return;
    }
    config.actions[index] = {
      ...newItem,
      group: newItem.group !== undefined ? newItem.group : oldItem.group,
      hidden: newItem.hidden !== undefined ? newItem.hidden : oldItem.hidden,
    };
    if (customIcon) {
      await this.saveCustomIconMapping(newItem.type, customIcon);
    }
    await this.configService.writeConfig(config);
    this.showingForm = false;
    this.currentEditAction = undefined;
    void this.refresh();
    this.showToast(`\u270f\ufe0f Updated "${newItem.name}"`);
  }

  private async saveCustomIconMapping(itemType: string, iconName: string) {
    const cfg = vscode.workspace.getConfiguration("battlestation");
    const current = cfg.get<Record<string, string>>("customIconMappings", {});
    current[itemType] = iconName;
    await cfg.update("customIconMappings", current, vscode.ConfigurationTarget.Workspace);
    this.showToast(`\u2728 Icon "${iconName}" saved for type "${itemType}"`);
  }

  private async hideAction(item: Action) {
    const config = await this.configService.readConfig();
    const target = config.actions.find((i) => i.name === item.name && i.command === item.command);
    if (target) {
      target.hidden = true;
      await this.configService.writeConfig(config);
      void this.refresh();
    }
  }

  private async handleSetActionColor(item: Action) {
    const THEME_COLORS = [
      { label: "$(symbol-color) Remove Color", value: "" },
      { label: "$(color-mode) Custom Color...", value: "CUSTOM" },
      { label: "$(circle-filled) Red", value: "var(--vscode-charts-red)" },
      { label: "$(circle-filled) Orange", value: "var(--vscode-charts-orange)" },
      { label: "$(circle-filled) Yellow", value: "var(--vscode-charts-yellow)" },
      { label: "$(circle-filled) Green", value: "var(--vscode-charts-green)" },
      { label: "$(circle-filled) Blue", value: "var(--vscode-charts-blue)" },
      { label: "$(circle-filled) Purple", value: "var(--vscode-charts-purple)" },
      { label: "$(circle-filled) Pink", value: "var(--vscode-button-secondaryHoverBackground)" }, // Pink-ish/Hover
    ];

    const selected = await vscode.window.showQuickPick(THEME_COLORS, {
      placeHolder: `Set background color for "${item.name}"`,
      title: "Action Color",
    });

    if (selected) {
      let colorToSet = selected.value;

      if (colorToSet === "CUSTOM") {
        const input = await vscode.window.showInputBox({
          prompt: "Enter custom CSS color (hex, rgb, var, etc.)",
          value: item.backgroundColor && !item.backgroundColor.startsWith("var(--vscode-charts") ? item.backgroundColor : "",
          placeHolder: "e.g. #ff0000 or rgba(255, 100, 100, 0.5)"
        });
        if (input === undefined) return; // Cancelled
        colorToSet = input.trim();
      }

      const config = await this.configService.readConfig();
      const target = config.actions.find((i) => i.name === item.name && i.command === item.command);

      if (target) {
        if (!colorToSet) {
          delete target.backgroundColor;
        } else {
          target.backgroundColor = colorToSet;
        }
        await this.configService.writeConfig(config);
        void this.refresh();
        this.showToast(colorToSet ? `Color set for "${item.name}"` : `Color removed for "${item.name}"`);
      }
    }
  }

  private async assignActionToGroup(item: Action, groupName: string) {
    const config = await this.configService.readConfig();
    const target = config.actions.find((i) => i.name === item.name && i.command === item.command);
    if (target) {
      if (groupName === "__none__") {
        delete target.group;
      } else {
        target.group = groupName;
        if (!config.groups) { config.groups = []; }
        if (!config.groups.find((g) => g.name === groupName)) {
          config.groups.push({ name: groupName });
        }
      }
      await this.configService.writeConfig(config);
      void this.refresh();
    }
  }

  private async bulkHideActions(items: Action[]) {
    const config = await this.configService.readConfig();
    items.forEach((item) => {
      const t = config.actions.find((i) => i.name === item.name && i.command === item.command);
      if (t) { t.hidden = true; }
    });
    await this.configService.writeConfig(config);
    void this.refresh();
  }

  private async bulkShowActions(items: Action[]) {
    const config = await this.configService.readConfig();
    items.forEach((item) => {
      const t = config.actions.find((i) => i.name === item.name && i.command === item.command);
      if (t) { t.hidden = false; }
    });
    await this.configService.writeConfig(config);
    void this.refresh();
  }

  private async addNewGroup(group: Group) {
    const config = await this.configService.readConfig();
    if (!config.groups) { config.groups = []; }
    if (config.groups.find((g) => g.name === group.name)) {
      vscode.window.showWarningMessage(`Group "${group.name}" already exists.`);
      return;
    }
    config.groups.push(group);
    await this.configService.writeConfig(config);
    this.showingForm = false;
    void this.refresh();
  }

  private async updateGroup(oldGroup: Group, newGroup: Group) {
    const config = await this.configService.readConfig();
    if (!config.groups) { return; }
    const idx = config.groups.findIndex(
      (g) => g.name === oldGroup.name && g.icon === oldGroup.icon
    );
    if (idx === -1) {
      vscode.window.showErrorMessage(`Group "${oldGroup.name}" not found.`);
      return;
    }
    if (oldGroup.name !== newGroup.name && config.groups.find((g) => g.name === newGroup.name)) {
      vscode.window.showWarningMessage(`Group "${newGroup.name}" already exists.`);
      return;
    }
    config.groups[idx] = {
      ...config.groups[idx],
      ...newGroup,
      hidden: newGroup.hidden ?? config.groups[idx].hidden,
    };
    if (oldGroup.name !== newGroup.name) {
      config.actions.forEach((item) => {
        if (item.group === oldGroup.name) { item.group = newGroup.name; }
      });
    }
    await this.configService.writeConfig(config);
    this.showingForm = false;
    this.currentEditGroup = undefined;
    void this.refresh();
  }

  private async toggleGroupHidden(group: Group) {
    const config = await this.configService.readConfig();
    if (!config.groups) {
      return;
    }

    const target = config.groups.find((g) => g.name === group.name);
    if (!target) {
      vscode.window.showErrorMessage(`Group "${group.name}" not found.`);
      return;
    }

    target.hidden = !target.hidden;
    await this.configService.writeConfig(config);
    void this.refresh();
    this.showToast(target.hidden ? `Group "${group.name}" hidden` : `Group "${group.name}" shown`);
  }

  private async saveSettings(settings: {
    showIcon: boolean;
    showType: boolean;
    showCommand: boolean;
    showGroup: boolean;
    hideIcon?: string;
    useEmojiLoader?: boolean;
    loaderEmoji?: string;
  }) {
    console.log('[View Provider] saveSettings called, showingForm before:', this.showingForm);
    // IMPORTANT: Set showingForm to false BEFORE updating config
    // to prevent onDidChangeConfiguration from re-rendering settings view
    this.showingForm = false;
    console.log('[ViewProvider] showingForm set to false');

    const cfg = vscode.workspace.getConfiguration("battlestation");
    await cfg.update("display.showIcon", settings.showIcon, vscode.ConfigurationTarget.Workspace);
    await cfg.update("display.showType", settings.showType, vscode.ConfigurationTarget.Workspace);
    await cfg.update("display.showCommand", settings.showCommand, vscode.ConfigurationTarget.Workspace);
    await cfg.update("display.showGroup", settings.showGroup, vscode.ConfigurationTarget.Workspace);
    if (settings.hideIcon) {
      await cfg.update("display.hideIcon", settings.hideIcon, vscode.ConfigurationTarget.Workspace);
    }
    if (typeof settings.useEmojiLoader === "boolean") {
      await cfg.update(
        "display.useEmojiLoader",
        settings.useEmojiLoader,
        vscode.ConfigurationTarget.Workspace
      );
    }
    if (typeof settings.loaderEmoji === "string") {
      const normalizedEmoji = settings.loaderEmoji.trim() || "🌯";
      await cfg.update(
        "display.loaderEmoji",
        normalizedEmoji,
        vscode.ConfigurationTarget.Workspace
      );
    }
    console.log('[ViewProvider] All settings updated, calling refresh');
    void this.refresh();
    this.showToast("\u2705 Settings saved");
  }

  private async handleChangeConfigLocation(): Promise<void> {
    const result = await vscode.window.showOpenDialog({
      title: 'Choose Battle Config Location',
      openLabel: 'Store battle.json Here',
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
    });
    if (!result || result.length === 0) return;
    const dirPath = result[0].fsPath;
    // Capture the current config uri before changing the path
    const currentUri = await this.configService.resolveConfigUri();
    const currentExists = await this.configService.configExists();
    await this.configService.setCustomConfigPath(dirPath);
    if (currentExists && currentUri) {
      const move = await vscode.window.showInformationMessage(
        `Config location changed to: ${dirPath}\nMove existing config to the new location?`,
        { modal: false },
        'Move', 'Keep Both'
      );
      if (move === 'Move') {
        const destUri = vscode.Uri.joinPath(vscode.Uri.file(dirPath), 'battle.json');
        await vscode.workspace.fs.copy(currentUri, destUri, { overwrite: true });
        try { await vscode.workspace.fs.delete(currentUri); } catch { /* best effort */ }
        this.configService.invalidateCache();
      }
    } else {
      vscode.window.showInformationMessage(`Config location set to: ${dirPath}`);
    }
    void this.refresh();
  }

  private async handleResetConfigLocation(): Promise<void> {
    await this.configService.setCustomConfigPath(undefined);
    vscode.window.showInformationMessage('Config location reset to default (.vscode/battle.json)');
    void this.refresh();
  }

  private async handleImportConfig(): Promise<void> {
    const result = await vscode.window.showOpenDialog({
      title: 'Import Battle Config',
      openLabel: 'Import',
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      filters: { 'JSON Config': ['json', 'config'] },
    });
    if (!result || result.length === 0) return;
    try {
      await this.configService.importConfig(result[0]);
      this.showToast('\u2705 Config imported');
      void this.refresh();
    } catch (err) {
      vscode.window.showErrorMessage(`Failed to import config: ${(err as Error).message}`);
    }
  }

  private async saveCustomColor(color: string) {
    if (!color) return;
    const config = await this.configService.readConfig();
    const current = config.customColors || [];
    if (!current.includes(color)) {
      current.push(color);
      config.customColors = current;
      await this.configService.writeConfig(config);
      void this.refresh();
      // No toast needed, implicit save
    }
  }

  private async handleReorderActions(newActions: Action[]) {
    if (!Array.isArray(newActions)) { return; }
    const config = await this.configService.readConfig();
    // Rebuild full actions array: newActions contains only the items visible at time of
    // drag. Preserve any hidden items not in newActions in their existing relative order.
    const reorderedSet = new Set(newActions.map((a) => JSON.stringify({ name: a.name, command: a.command })));
    const notReordered = (config.actions || []).filter(
      (a) => !reorderedSet.has(JSON.stringify({ name: a.name, command: a.command }))
    );
    config.actions = [...newActions, ...notReordered];
    await this.configService.writeConfig(config);
    // Update the webview in-place without a full HTML reload
    if (this.view?.visible && this._currentViewMode === "main") {
      const enrichedConfig = this.getEnrichedConfig(config);
      this.view.webview.postMessage({
        type: "update",
        data: { ...enrichedConfig, showHidden: this.showHidden },
      });
    }
  }

  /* ─── generate / delete config handlers ─── */

  private async handleDeleteConfig() {
    try {
      if (this.view) {
        this.view.webview.postMessage({ type: "setLoading", value: true });
      }
      const result = await this.configService.deleteConfig();
      if (result.deleted) {
        this.showingForm = false;
        void this.refresh();
        this.showToast(`Deleted ${result.location}`);
        vscode.window.showInformationMessage(`Config file deleted: ${result.location}`);
      } else {
        vscode.window.showWarningMessage(
          "Config file not found. It may have already been deleted."
        );
        // Reset loading if we didn't refresh
        if (this.view) {
          this.view.webview.postMessage({ type: "setLoading", value: false });
        }
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to delete config: ${(error as Error).message}`
      );
      if (this.view) {
        this.view.webview.postMessage({ type: "setLoading", value: false });
      }
    }
  }

  private async handleRestoreConfig() {
    if (this.view) {
      this.view.webview.postMessage({ type: "setLoading", value: true });
    }
    const versions = await this.configService.listConfigVersions();
    if (versions.length === 0) {
      vscode.window.showInformationMessage("No history found to restore from.");
      if (this.view) {
        this.view.webview.postMessage({ type: "setLoading", value: false });
      }
      return;
    }

    const items = versions.map((v) => ({
      label: v.label,
      description: new Date(v.timestamp).toLocaleString(),
      timestamp: v.timestamp
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: "Select a version to restore",
    });

    if (selected) {
      try {
        await this.configService.restoreConfigVersion(selected.timestamp);
        this.showingForm = false;
        void this.refresh();
        this.showToast("Config restored");
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to restore config: ${(error as Error).message}`);
        if (this.view) {
          this.view.webview.postMessage({ type: "setLoading", value: false });
        }
      }
    } else {
      if (this.view) {
        this.view.webview.postMessage({ type: "setLoading", value: false });
      }
    }
  }

  private async handleShowGenerateConfig() {
    await vscode.window.withProgress(
      {
        location: { viewId: "battlestation.view" },
        title: "Detecting tools...",
        cancellable: false,
      },
      async (progress) => {
        progress.report({ increment: 10, message: "Checking workspace files..." });
        const hasNpm = await this.configService.hasSource("npm");
        const hasTasks = await this.configService.hasSource("tasks");
        const hasLaunch = await this.configService.hasSource("launch");

        progress.report({ increment: 30, message: "Scanning for development tools..." });
        const wsConfig = vscode.workspace.getConfiguration("battlestation");
        const enableEnhancedMode = wsConfig.get<boolean>("experimental.enableEnhancedMode", false);

        // Use hybrid detection by default for initial load
        const enhancedMode = enableEnhancedMode
          ? (() => {
            const availability = this.toolDetectionService.detectToolAvailability("hybrid");
            return availability.then((tools) => ({
              hasDocker: tools.docker,
              hasDockerCompose: tools.dockerCompose,
              hasPython: tools.python,
              hasGo: tools.go,
              hasRust: tools.rust,
              hasMakefile: tools.make,
              hasGradle: tools.gradle,
              hasMaven: tools.maven,
              hasCMake: tools.cmake,
              hasGit: tools.git,
            }));
          })()
          : undefined;

        progress.report({ increment: 50, message: "Preparing options..." });
        this.showingForm = "generateConfig";
        this.generateFormParams = {
          hasNpm,
          hasTasks,
          hasLaunch,
          enhancedMode: enhancedMode ? await enhancedMode : undefined,
        };

        progress.report({ increment: 10, message: "Done" });
        void this.refresh();
      }
    );
  }

  private async handleCreateBlankConfig() {
    await vscode.window.withProgress(
      {
        location: { viewId: "battlestation.view" },
        title: "Creating blank config...",
        cancellable: false,
      },
      async (progress) => {
        try {
          this.view?.webview.postMessage({ type: "configGenerationStarted" });
          progress.report({ increment: 50, message: "Creating file..." });
          await this.configService.createMinimalConfig(BattlestationViewProvider.defaultIcons);

          progress.report({ increment: 40, message: "Opening file..." });
          await this.configService.openConfigFile();

          progress.report({ increment: 10, message: "Done" });
          this.showToast("📝 Created blank battle.config");
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          vscode.window.showErrorMessage(`Failed to create config: ${errorMsg}`);
        } finally {
          this.view?.webview.postMessage({ type: "configGenerationComplete" });
          await this.transitionToMainAfterGeneration();
        }
      }
    );
  }

  private async handleCreateExampleConfig() {
    await vscode.window.withProgress(
      {
        location: { viewId: "battlestation.view" },
        title: "Creating example config...",
        cancellable: false,
      },
      async (progress) => {
        try {
          this.view?.webview.postMessage({ type: "configGenerationStarted" });
          progress.report({ increment: 50, message: "Creating example file..." });
          await this.configService.createExampleConfig(BattlestationViewProvider.defaultIcons);

          progress.report({ increment: 40, message: "Opening file..." });
          await this.configService.openConfigFile();

          progress.report({ increment: 10, message: "Done" });
          this.showToast("✨ Created example battle.config - customize it to your needs!");
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          vscode.window.showErrorMessage(`Failed to create config: ${errorMsg}`);
        } finally {
          this.view?.webview.postMessage({ type: "configGenerationComplete" });
          await this.transitionToMainAfterGeneration();
        }
      }
    );
  }

  private async handleRedetectTools(detectionMethod: "file" | "command" | "hybrid") {
    if (this.showingForm !== "generateConfig") return;

    await vscode.window.withProgress(
      {
        location: { viewId: "battlestation.view" },
        title: "Re-detecting tools...",
        cancellable: false,
      },
      async (progress) => {
        try {
          progress.report({ increment: 20, message: `Using ${detectionMethod} detection...` });
          const availability = await this.toolDetectionService.detectToolAvailability(detectionMethod);

          progress.report({ increment: 70, message: "Updating options..." });
          const enhancedMode = {
            hasDocker: availability.docker,
            hasDockerCompose: availability.dockerCompose,
            hasPython: availability.python,
            hasGo: availability.go,
            hasRust: availability.rust,
            hasMakefile: availability.make,
            hasGradle: availability.gradle,
            hasMaven: availability.maven,
            hasCMake: availability.cmake,
            hasGit: availability.git,
          };

          if (this.generateFormParams) {
            this.generateFormParams.enhancedMode = enhancedMode;
          }

          progress.report({ increment: 10, message: "Done" });
          void this.refresh();
        } catch (error) {
          console.error("Failed to redetect tools:", error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          vscode.window.showErrorMessage(`Failed to redetect tools: ${errorMsg}`);
        }
      }
    );
  }

  private async handleCreateConfig(
    sources: Record<string, boolean>,
    enableGrouping: boolean,
    _ignoredEnhancedSources: any, // Kept for backward compat if needed, but unused now
    detectionMethod: "file" | "command" | "hybrid",
    enableColoring: boolean = false
  ) {
    await vscode.window.withProgress(
      {
        location: { viewId: "battlestation.view" },
        title: "Generating config...",
        cancellable: false,
      },
      async (progress) => {
        try {
          this.view?.webview.postMessage({ type: "configGenerationStarted" });
          // Get enhanced actions from the unified sources object
          // scanEnhanced only checks for specific keys (docker, git, etc) so we can pass the whole object
          let enhancedActions: Action[] = [];

          // Check if any enhanced source keys are present and true
          const enhancedKeys = [
            "docker", "dockerCompose", "python", "go", "rust",
            "make", "gradle", "maven", "cmake", "git"
          ];
          const hasEnhanced = enhancedKeys.some(k => sources[k] === true);

          if (hasEnhanced) {
            progress.report({ increment: 20, message: "Scanning for tools..." });
            enhancedActions = await this.toolDetectionService.scanEnhanced(
              sources,
              detectionMethod
            );
          }

          progress.report({ increment: 40, message: "Building configuration..." });

          // Extract basic sources from the unified object
          const basicSources = {
            npm: sources.npm,
            tasks: sources.tasks,
            launch: sources.launch
          };

          await this.configService.createAutoConfig(
            basicSources,
            enableGrouping,
            BattlestationViewProvider.defaultIcons,
            enhancedActions,
            enableColoring
          );

          progress.report({ increment: 30, message: "Opening config file..." });
          // Open the config file for review
          await this.configService.openConfigFile();

          progress.report({ increment: 10, message: "Done" });
          const generatedConfig = await this.configService.readConfig();
          this.showToast(`\u2705 Config generated (${generatedConfig.actions.length} actions)`);
        } catch (error) {
          console.error("Failed to create config:", error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          vscode.window.showErrorMessage(`Failed to generate config: ${errorMsg}`);
        } finally {
          this.view?.webview.postMessage({ type: "configGenerationComplete" });
          await this.transitionToMainAfterGeneration();
        }
      }
    );
  }

  private async transitionToMainAfterGeneration(): Promise<void> {
    this.showingForm = false;

    if (!this.view) {
      return;
    }

    const status = await this.configService.getConfigStatus();
    if (status.valid && status.config) {
      const cspSource = this.view.webview.cspSource;
      const nonce = getNonce();
      this._currentViewMode = "main";
      this.view.webview.html = this.renderMain(status.config, cspSource, nonce);
      return;
    }

    void this.refresh();
  }


  private async handleOpenVisualSettings() {
    await vscode.commands.executeCommand(
      "workbench.action.openSettings",
      "@ext:cc-dayers.battlestation"
    );
  }

  /* ─── toast ─── */

  private showToast(message: string) {
    this.view?.webview.postMessage({ command: "showToast", message });
  }
}

