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
  private currentEditGroup?: Group;
  private currentEditAction?: Action;
  private isLoading = false;
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
    this.configService.onDidChange(() => this.refresh());
    this.todosService.onDidChange(() => {
      /* todosView handles its own refresh */
    });
  }

  /* ─── WebviewViewProvider ─── */

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _ctx: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "media"),
      ],
    };

    void this.configService.configExists().then((exists) => {
      vscode.commands.executeCommand("setContext", "battlestation.hasConfig", exists);
    });

    webviewView.webview.onDidReceiveMessage((msg) => this.handleMessage(msg));

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
          message.detectionMethod || "hybrid"
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
      case "showGenerateConfig":
        void this.handleShowGenerateConfig();
        break;
      case "deleteConfig":
        void this.handleDeleteConfig();
        break;
    }
  }

  /* ─── public API for TodoPanelProvider ─── */

  public async getTodosData() {
    return this.todosService.readTodos();
  }

  public async createTodo(name: string, detail: string, priority: "high" | "medium" | "low") {
    await this.todosService.addTodo(name, detail, priority);
    this.showToast("Todo added");
  }

  public async modifyTodo(id: string, updates: Partial<Omit<Todo, "id" | "createdAt">>) {
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

  public showSettingsForm() {
    this.showingForm = "settings";
    void this.refresh();
  }

  /* ─── refresh / render ─── */

  public async refresh() {
    if (!this.view) {
      return;
    }

    const exists = await this.configService.configExists();
    vscode.commands.executeCommand("setContext", "battlestation.hasConfig", exists);

    const cspSource = this.view.webview.cspSource;
    const nonce = getNonce();

    if (this.isLoading) {
      this.view.webview.html = renderLoadingView(cspSource, nonce);
      return;
    }

    if (!exists) {
      this.showingForm = false;
      const codiconStyles = this.getCodiconStyles();
      const hasNpm = await this.configService.fileExistsInWorkspace("package.json");
      const hasTasks = await this.configService.fileExistsInWorkspace(".vscode/tasks.json");
      const hasLaunch = await this.configService.fileExistsInWorkspace(".vscode/launch.json");
      
      // Detect available tools for enhanced mode (using hybrid by default)
      const availability = await this.toolDetectionService.detectToolAvailability("hybrid");
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
      
      this.view.webview.html = renderGenerateConfigView({
        cspSource,
        nonce,
        codiconStyles,
        hasNpm,
        hasTasks,
        hasLaunch,
        showWelcome: true,
        enhancedMode,
      });
      return;
    }

    if (this.showingForm === "settings") {
      this.view.webview.html = await this.renderSettings(cspSource, nonce);
      return;
    }

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
    const config = await this.configService.readConfig();
    this.view.webview.html = this.renderMain(config, cspSource, nonce);
  }

  /* ─── render helpers ─── */

  private renderMain(config: Config, cspSource: string, nonce: string): string {
    const wsConfig = vscode.workspace.getConfiguration("battlestation");
    const customMappings = wsConfig.get<Record<string, string>>("customIconMappings", {});

    // Merge custom icon mappings into config
    const mergedIcons = [...(config.icons || [])];
    for (const [type, icon] of Object.entries(customMappings)) {
      if (!mergedIcons.find((m) => m.type === type)) {
        mergedIcons.push({ type, icon });
      }
    }

    // Attach display settings as meta so the renderer can read them
    const enrichedConfig: Config & Record<string, any> = {
      ...config,
      icons: mergedIcons,
      __showIcon: wsConfig.get<boolean>("display.showIcon", true),
      __showType: wsConfig.get<boolean>("display.showType", true),
      __showCommand: wsConfig.get<boolean>("display.showCommand", true),
      __showGroup: wsConfig.get<boolean>("display.showGroup", true),
      __hideIcon: wsConfig.get<string>("display.hideIcon", "eye-closed"),
    };

    return renderMainView({
      cspSource,
      nonce,
      codiconStyles: this.getCodiconStyles(),
      config: enrichedConfig,
      showHidden: this.showHidden,
    });
  }

  private async renderSettings(cspSource: string, nonce: string): Promise<string> {
    const wsConfig = vscode.workspace.getConfiguration("battlestation");
    const config = await this.configService.readConfig();
    const usedIcons = Array.from(this.getUsedCodiconNames(config)).sort();
    const configExists = await this.configService.configExists();

    return renderSettingsView({
      cspSource,
      nonce,
      codiconStyles: this.getCodiconStyles(),
      showIcon: wsConfig.get<boolean>("display.showIcon", true),
      showType: wsConfig.get<boolean>("display.showType", true),
      showCommand: wsConfig.get<boolean>("display.showCommand", true),
      showGroup: wsConfig.get<boolean>("display.showGroup", true),
      hideIcon: wsConfig.get<string>("display.hideIcon", "eye-closed"),
      configExists,
      usedIcons,
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
    });
  }

  /* ─── codicon styles ─── */

  private getCodiconStyles(): string {
    if (!this.view) {
      return "";
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
        case "vscode":
        case "task":
        case "launch":
          await this.executeVSCodeCommand(item.command);
          break;
        default:
          await this.executeShellCommand(item.command);
          break;
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
      { label: "$(circle-filled) Red", value: "var(--vscode-charts-red)" },
      { label: "$(circle-filled) Orange", value: "var(--vscode-charts-orange)" },
      { label: "$(circle-filled) Yellow", value: "var(--vscode-charts-yellow)" },
      { label: "$(circle-filled) Green", value: "var(--vscode-charts-green)" },
      { label: "$(circle-filled) Blue", value: "var(--vscode-charts-blue)" },
      { label: "$(circle-filled) Purple", value: "var(--vscode-charts-purple)" },
      { label: "$(circle-filled) Pink", value: "var(--vscode-charts-pink)" },
    ];

    const selected = await vscode.window.showQuickPick(THEME_COLORS, {
      placeHolder: `Set background color for "${item.name}"`,
      title: "Action Color",
    });

    if (selected !== undefined) {
      const config = await this.configService.readConfig();
      const target = config.actions.find((i) => i.name === item.name && i.command === item.command);
      if (target) {
        if (selected.value === "") {
          delete target.backgroundColor;
        } else {
          target.backgroundColor = selected.value;
        }
        await this.configService.writeConfig(config);
        void this.refresh();
        this.showToast(`Color ${selected.value ? "set" : "removed"} for "${item.name}"`);
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
    config.groups[idx] = newGroup;
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

  private async saveSettings(settings: {
    showIcon: boolean;
    showType: boolean;
    showCommand: boolean;
    showGroup: boolean;
    hideIcon?: string;
  }) {
    const cfg = vscode.workspace.getConfiguration("battlestation");
    await cfg.update("display.showIcon", settings.showIcon, vscode.ConfigurationTarget.Workspace);
    await cfg.update("display.showType", settings.showType, vscode.ConfigurationTarget.Workspace);
    await cfg.update("display.showCommand", settings.showCommand, vscode.ConfigurationTarget.Workspace);
    await cfg.update("display.showGroup", settings.showGroup, vscode.ConfigurationTarget.Workspace);
    if (settings.hideIcon) {
      await cfg.update("display.hideIcon", settings.hideIcon, vscode.ConfigurationTarget.Workspace);
    }
    this.showingForm = false;
    void this.refresh();
    this.showToast("\u2705 Settings saved");
  }

  /* ─── generate / delete config handlers ─── */

  private async handleShowGenerateConfig() {
    const hasNpm = await this.configService.fileExistsInWorkspace("package.json");
    const hasTasks = await this.configService.fileExistsInWorkspace(".vscode/tasks.json");
    const hasLaunch = await this.configService.fileExistsInWorkspace(".vscode/launch.json");
    
    // Use hybrid detection by default for initial load
    const availability = await this.toolDetectionService.detectToolAvailability("hybrid");
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
    
    this.showingForm = "generateConfig";
    this.generateFormParams = { hasNpm, hasTasks, hasLaunch, enhancedMode };
    void this.refresh();
  }

  private async handleRedetectTools(detectionMethod: "file" | "command" | "hybrid") {
    if (this.showingForm !== "generateConfig") return;
    
    const availability = await this.toolDetectionService.detectToolAvailability(detectionMethod);
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
    void this.refresh();
  }

  private async handleCreateConfig(
    sources: { npm?: boolean; tasks?: boolean; launch?: boolean },
    enableGrouping: boolean,
    enhancedSources: any,
    detectionMethod: "file" | "command" | "hybrid"
  ) {
    this.isLoading = true;
    void this.refresh();

    try {
      // Get enhanced actions if any enhanced sources are enabled
      let enhancedActions: Action[] = [];
      if (enhancedSources && Object.values(enhancedSources).some((v) => v === true)) {
        enhancedActions = await this.toolDetectionService.scanEnhanced(
          enhancedSources,
          detectionMethod
        );
      }

      await this.configService.createAutoConfig(
        sources,
        enableGrouping,
        BattlestationViewProvider.defaultIcons,
        enhancedActions
      );
      // Open the config file for review
      await this.configService.openConfigFile();
    } finally {
      this.isLoading = false;
      this.showingForm = false;
      void this.refresh();
    }
  }

  private async handleDeleteConfig() {
    const choice = await vscode.window.showWarningMessage(
      "Delete battle.config? This cannot be undone.",
      { modal: true },
      "Delete",
      "Cancel"
    );
    if (choice === "Delete") {
      try {
        const result = await this.configService.deleteConfig();
        if (result.deleted) {
          this.showingForm = false;
          void this.refresh();
          this.showToast(`\ud83d\uddd1\ufe0f Deleted ${result.location}`);
          vscode.window.showInformationMessage(`Config file deleted: ${result.location}`);
        } else {
          vscode.window.showWarningMessage(
            "Config file not found. It may have already been deleted."
          );
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to delete config: ${(error as Error).message}`
        );
      }
    }
  }

  /* ─── toast ─── */

  private showToast(message: string) {
    this.view?.webview.postMessage({ command: "showToast", message });
  }
}

