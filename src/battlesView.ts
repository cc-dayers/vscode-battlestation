import * as vscode from "vscode";
import type { BattleProviderState } from "./types";
import { BattleProviderService } from "./services/battleProviderService";
import { renderBattlesView } from "./views";
import { getNonce } from "./templates/nonce";
import codiconCssTemplate from "../media/codicon.css";

export class BattlesViewProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  private view?: vscode.WebviewView;
  private cachedCodiconStyles?: string;
  private isInitialized = false;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly battleProviderService: BattleProviderService
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

        if (!this.isInitialized) {
          void this.refresh();
          return;
        }

        void this.view.webview.postMessage({
          type: "update",
          data: { providers: states },
        });
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

  public async refresh(): Promise<void> {
    if (!this.view) {
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
        // For MVP, dismiss is handled client-side (filtered out from display).
        // A future version could persist dismissed IDs.
        break;
      case "addBattleProvider":
        void vscode.commands.executeCommand("battlestation.addBattleProvider");
        break;
      default:
        break;
    }
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
