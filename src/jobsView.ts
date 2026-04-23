import * as vscode from "vscode";
import { JobSchedulerService } from "./services/jobSchedulerService";
import { renderJobsView } from "./views";
import { getNonce } from "./templates/nonce";
import codiconCssTemplate from "../media/codicon.css";

export class JobsViewProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  private view?: vscode.WebviewView;
  private cachedCodiconStyles?: string;
  private isInitialized = false;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly jobSchedulerService: JobSchedulerService
  ) {
    this.disposables.push(
      this.jobSchedulerService.onDidUpdate((snapshots) => {
        void vscode.commands.executeCommand("setContext", "battlestation.hasJobs", snapshots.length > 0);
        if (!this.view) {
          return;
        }

        if (!this.isInitialized) {
          void this.refresh();
          return;
        }

        void this.view.webview.postMessage({
          type: "update",
          data: { jobs: snapshots },
        });
      })
    );
  }

  public dispose(): void {
    this.disposables.forEach((disposable) => disposable.dispose());
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

    const jobs = this.jobSchedulerService.getSnapshots();
    const data = { jobs };

    if (!this.isInitialized) {
      this.isInitialized = true;
      this.view.webview.html = renderJobsView({
        cspSource: this.view.webview.cspSource,
        nonce: getNonce(),
        codiconStyles: this.getCodiconStyles(),
        cssUri: this.view.webview.asWebviewUri(
          vscode.Uri.joinPath(this.context.extensionUri, "media", "output.css")
        ).toString(),
        scriptUri: this.view.webview.asWebviewUri(
          vscode.Uri.joinPath(this.context.extensionUri, "media", "jobsView.js")
        ).toString(),
        initialData: data,
      });
      return;
    }

    await this.view.webview.postMessage({ type: "update", data });
  }

  private async handleMessage(message: any): Promise<void> {
    switch (message.command) {
      case "runJobNow":
        await vscode.commands.executeCommand("battlestation.runJobNow", message.jobId);
        break;
      case "pauseJob":
        await vscode.commands.executeCommand("battlestation.pauseJob", message.jobId);
        break;
      case "resumeJob":
        await vscode.commands.executeCommand("battlestation.resumeJob", message.jobId);
        break;
      case "openJobLog":
        await vscode.commands.executeCommand("battlestation.openJobLog", message.jobId);
        break;
      case "openJobAdmin":
        await vscode.commands.executeCommand("battlestation.openJobAdmin", message.jobId);
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