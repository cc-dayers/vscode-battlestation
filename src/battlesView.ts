import * as vscode from "vscode";
import type { BattleProviderState } from "./types";
import { BattleProviderService } from "./services/battleProviderService";
import { ConfigService } from "./services/configService";
import { renderBattlesView, renderBattlesSettingsView } from "./views";
import { getNonce } from "./templates/nonce";
import codiconCssTemplate from "../media/codicon.css";

type ViewMode = "battles" | "settings";

export class BattlesViewProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  private view?: vscode.WebviewView;
  private cachedCodiconStyles?: string;
  private isInitialized = false;
  private viewMode: ViewMode = "battles";
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly battleProviderService: BattleProviderService,
    private readonly configService: ConfigService
  ) {
    this.disposables.push(
      this.battleProviderService.onDidUpdate((states) => {
        void vscode.commands.executeCommand(
          "setContext",
          "battlestation.hasBattles",
          states.some((s) => s.battles.length > 0)
        );
        void vscode.commands.executeCommand(
          "setContext",
          "battlestation.hasBattleProviders",
          states.length > 0
        );
        if (!this.view) {
          return;
        }

        if (this.viewMode === "battles") {
          if (!this.isInitialized) {
            void this.refresh();
            return;
          }
          void this.view.webview.postMessage({
            type: "update",
            data: { providers: states },
          });
        } else if (this.viewMode === "settings") {
          void this.refreshSettings();
        }
      })
    );
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    this.cachedCodiconStyles = undefined;
    this.isInitialized = false;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "media"),
      ],
    };

    webviewView.webview.onDidReceiveMessage((message) => {
      void this.handleMessage(message);
    });

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        void this.refresh();
      }
    });

    void this.refresh();
  }

  public showSettings(): void {
    this.viewMode = "settings";
    this.isInitialized = false;
    this.cachedCodiconStyles = undefined;
    void this.renderSettingsView();
  }

  public showBattles(): void {
    this.viewMode = "battles";
    this.isInitialized = false;
    this.cachedCodiconStyles = undefined;
    void this.refresh();
  }

  public async refresh(): Promise<void> {
    if (!this.view) {
      return;
    }

    if (this.viewMode === "settings") {
      await this.renderSettingsView();
      return;
    }

    const providers = this.battleProviderService.getStates();
    const data = { providers };

    if (!this.isInitialized) {
      this.isInitialized = true;
      this.view.webview.html = renderBattlesView({
        cspSource: this.view.webview.cspSource,
        nonce: getNonce(),
        codiconStyles: this.getCodiconStyles(),
        cssUri: this.view.webview
          .asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, "media", "output.css")
          )
          .toString(),
        scriptUri: this.view.webview
          .asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, "media", "battlesView.js")
          )
          .toString(),
        initialData: data,
      });
      return;
    }

    await this.view.webview.postMessage({ type: "update", data });
  }

  private async renderSettingsView(): Promise<void> {
    if (!this.view) {
      return;
    }

    const config = await this.configService.readConfig();
    const providers = config?.battleProviders ?? [];
    const providerStates = this.battleProviderService.getStates();

    this.isInitialized = true;
    this.view.webview.html = renderBattlesSettingsView({
      cspSource: this.view.webview.cspSource,
      nonce: getNonce(),
      codiconStyles: this.getCodiconStyles(),
      cssUri: this.view.webview
        .asWebviewUri(
          vscode.Uri.joinPath(this.context.extensionUri, "media", "output.css")
        )
        .toString(),
      scriptUri: this.view.webview
        .asWebviewUri(
          vscode.Uri.joinPath(this.context.extensionUri, "media", "battlesSettings.js")
        )
        .toString(),
      initialData: { providers, providerStates },
    });
  }

  private async refreshSettings(): Promise<void> {
    if (!this.view || this.viewMode !== "settings") {
      return;
    }

    const config = await this.configService.readConfig();
    const providers = config?.battleProviders ?? [];
    const providerStates = this.battleProviderService.getStates();

    await this.view.webview.postMessage({
      type: "update",
      data: { providers, providerStates },
    });
  }

  private async handleMessage(message: any): Promise<void> {
    switch (message.command) {
      case "refreshProvider":
        await this.battleProviderService.refreshProvider(message.providerId);
        break;
      case "refreshAll":
        await this.battleProviderService.refreshAll();
        break;
      case "openBattleUrl":
        if (message.url) {
          void vscode.env.openExternal(vscode.Uri.parse(message.url));
        }
        break;
      case "battleAction":
        await this.handleBattleAction(message);
        break;
      case "dismissBattle":
        break;
      case "addBattleProvider":
        void vscode.commands.executeCommand("battlestation.addBattleProvider");
        break;
      case "showBattles":
        this.showBattles();
        break;
      case "showSettings":
        this.showSettings();
        break;
      case "testProvider":
        void vscode.commands.executeCommand("battlestation.testBattleProvider", message.providerId);
        break;
      case "toggleProvider":
        await this.toggleProvider(message.providerId, message.enabled);
        break;
      case "removeProvider":
        await this.removeProvider(message.providerId);
        break;
      default:
        break;
    }
  }

  private async toggleProvider(providerId: string, enabled: boolean): Promise<void> {
    const config = await this.configService.readConfig();
    if (!config?.battleProviders) return;

    const provider = config.battleProviders.find((p) => p.id === providerId);
    if (!provider) return;

    provider.enabled = enabled;
    await this.configService.writeConfig(config);
  }

  private async removeProvider(providerId: string): Promise<void> {
    const answer = await vscode.window.showWarningMessage(
      "Remove this battle provider?",
      { modal: true },
      "Remove"
    );
    if (answer !== "Remove") return;

    const config = await this.configService.readConfig();
    if (!config?.battleProviders) return;

    config.battleProviders = config.battleProviders.filter((p) => p.id !== providerId);
    await this.configService.writeConfig(config);
  }

  private async handleBattleAction(message: any): Promise<void> {
    const { actionType, actionValue } = message;
    switch (actionType) {
      case "url":
        void vscode.env.openExternal(vscode.Uri.parse(actionValue));
        break;
      case "shell": {
        const terminal = vscode.window.createTerminal("Battle Action");
        terminal.sendText(actionValue);
        terminal.show();
        break;
      }
      case "vscode":
        void vscode.commands.executeCommand(actionValue);
        break;
      default:
        break;
    }
  }

  private getCodiconStyles(): string {
    if (!this.view) {
      return "";
    }
    if (this.cachedCodiconStyles) {
      return this.cachedCodiconStyles;
    }
    const codiconFontUri = this.view.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "codicon.ttf")
    );
    this.cachedCodiconStyles = codiconCssTemplate.replace(
      /src:\s*url\([^)]+\)(\s*format\([^)]+\))?/g,
      `src: url("${codiconFontUri}") format("truetype")`
    );
    return this.cachedCodiconStyles;
  }
}
