import * as vscode from "vscode";
import type { JobRunRecord, JobRuntimeSnapshot } from "./types";
import { JobSchedulerService } from "./services/jobSchedulerService";
import { JobLogService } from "./services/jobLogService";
import { renderJobAdminView } from "./views";
import { getNonce } from "./templates/nonce";
import codiconCssTemplate from "../media/codicon.css";

const RECENT_RUNS_LIMIT = 20;

export class JobAdminPanel implements vscode.Disposable {
  private panel?: vscode.WebviewPanel;
  private activeJobId?: string;
  private isInitialized = false;
  private cachedCodiconStyles?: string;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly jobSchedulerService: JobSchedulerService,
    private readonly jobLogService: JobLogService
  ) {
    this.disposables.push(
      this.jobSchedulerService.onDidUpdate(() => {
        void this.refresh();
      })
    );
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.panel?.dispose();
  }

  public close(): void {
    this.panel?.dispose();
  }

  public async open(jobId?: string): Promise<void> {
    this.activeJobId = jobId ?? this.activeJobId;

    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Active, true);
      await this.refresh();
      return;
    }

    const snapshot = this.activeJobId
      ? this.jobSchedulerService.getSnapshot(this.activeJobId)
      : undefined;
    const title = snapshot ? `Job: ${snapshot.name}` : "Battlestation Job Admin";

    this.panel = vscode.window.createWebviewPanel(
      "battlestation.jobAdmin",
      title,
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, "media")],
      }
    );

    this.panel.onDidDispose(() => {
      this.panel = undefined;
      this.isInitialized = false;
      this.cachedCodiconStyles = undefined;
    });

    this.panel.webview.onDidReceiveMessage((message) => {
      void this.handleMessage(message);
    });

    await this.refresh();
  }

  private async buildData(): Promise<{ snapshot: JobRuntimeSnapshot | null; recentRuns: JobRunRecord[] }> {
    const snapshot = this.activeJobId
      ? (this.jobSchedulerService.getSnapshot(this.activeJobId) ?? null)
      : null;
    const recentRuns = this.activeJobId
      ? await this.jobLogService.getRecentRuns(this.activeJobId, RECENT_RUNS_LIMIT)
      : [];
    return { snapshot, recentRuns };
  }

  private async refresh(): Promise<void> {
    if (!this.panel) {
      return;
    }

    const data = await this.buildData();

    if (data.snapshot) {
      this.panel.title = `Job: ${data.snapshot.name}`;
    }

    if (!this.isInitialized) {
      this.isInitialized = true;
      this.panel.webview.html = renderJobAdminView({
        cspSource: this.panel.webview.cspSource,
        nonce: getNonce(),
        codiconStyles: this.getCodiconStyles(),
        initialData: data,
        scriptUri: this.panel.webview
          .asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "media", "jobAdmin.js"))
          .toString(),
        cssUri: this.panel.webview
          .asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "media", "output.css"))
          .toString(),
      });
      return;
    }

    await this.panel.webview.postMessage({ type: "update", data });
  }

  private async handleMessage(message: any): Promise<void> {
    const jobId = message.jobId ?? this.activeJobId;
    switch (message.command) {
      case "runJobNow":
        await vscode.commands.executeCommand("battlestation.runJobNow", jobId);
        break;
      case "pauseJob":
        await vscode.commands.executeCommand("battlestation.pauseJob", jobId);
        break;
      case "resumeJob":
        await vscode.commands.executeCommand("battlestation.resumeJob", jobId);
        break;
      case "openJobLog":
        await vscode.commands.executeCommand("battlestation.openJobLog", jobId);
        break;
      case "openRunLog":
        await this.openRunLog(message.logPath, message.logLine);
        break;
      default:
        break;
    }
  }

  private async openRunLog(logPath?: string, logLine?: number): Promise<void> {
    if (!logPath) {
      return;
    }
    const logUri = await this.jobLogService.resolveLogUri(logPath);
    if (!logUri) {
      return;
    }
    const document = await vscode.workspace.openTextDocument(logUri);
    const selectionLine = Math.max((logLine ?? 1) - 1, 0);
    await vscode.window.showTextDocument(document, {
      selection: new vscode.Range(selectionLine, 0, selectionLine, 0),
      preview: false,
    });
  }

  private getCodiconStyles(): string {
    if (!this.panel) {
      return "";
    }
    if (this.cachedCodiconStyles) {
      return this.cachedCodiconStyles;
    }
    const codiconFontUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "codicon.ttf")
    );
    this.cachedCodiconStyles = codiconCssTemplate.replace(
      /src:\s*url\([^)]+\)(\s*format\([^)]+\))?/g,
      `src: url("${codiconFontUri}") format("truetype")`
    );
    return this.cachedCodiconStyles;
  }
}