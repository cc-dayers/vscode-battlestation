import * as vscode from "vscode";
import * as cp from "child_process";
import type { BattleProvider } from "./types";
import { BattleProviderService } from "./services/battleProviderService";
import { ConfigService } from "./services/configService";
import { renderBattleTestView, type BattleTestData } from "./views/battleTestView";
import { getNonce } from "./templates/nonce";
import codiconCssTemplate from "../media/codicon.css";

const OUTPUT_CAP = 64 * 1024;
const DEFAULT_TIMEOUT = 15_000;

export class BattleTestPanel implements vscode.Disposable {
  private panel?: vscode.WebviewPanel;
  private activeProvider?: BattleProvider;
  private lastResult?: BattleTestData;
  private isInitialized = false;
  private cachedCodiconStyles?: string;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly configService: ConfigService,
    private readonly battleProviderService: BattleProviderService
  ) {}

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.panel?.dispose();
  }

  public async open(providerId: string): Promise<void> {
    const config = await this.configService.readConfig();
    const provider = config?.battleProviders?.find((p) => p.id === providerId);
    if (!provider) {
      void vscode.window.showErrorMessage(`Battle provider "${providerId}" not found in config.`);
      return;
    }

    this.activeProvider = provider;

    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Active, true);
      this.panel.title = `Test: ${provider.name}`;
      // Run the test immediately
      await this.runTest();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "battlestation.battleTest",
      `Test: ${provider.name}`,
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

    // Run test and show results
    await this.runTest();
  }

  private async runTest(): Promise<void> {
    if (!this.panel || !this.activeProvider) {
      return;
    }

    // Signal "running" to the webview
    if (this.isInitialized) {
      void this.panel.webview.postMessage({ type: "running" });
    }

    const provider = this.activeProvider;
    const cwd = provider.cwd || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    const result: BattleTestData = {
      provider,
      stdout: "",
      stderr: "",
      exitCode: null,
      duration: 0,
      parsedCount: null,
      parseError: null,
    };

    if (!cwd) {
      result.parseError = "No workspace folder open";
      this.lastResult = result;
      await this.refresh();
      return;
    }

    const startTime = Date.now();

    try {
      const { stdout, stderr, exitCode } = await this.execCommand(provider.command, cwd);
      result.stdout = stdout;
      result.stderr = stderr;
      result.exitCode = exitCode;
      result.duration = Date.now() - startTime;

      if (exitCode === 0 && stdout.trim()) {
        try {
          const parsed = JSON.parse(stdout.trim());
          const battles = this.extractBattlesArray(parsed);
          result.parsedCount = battles.length;
        } catch (e: unknown) {
          result.parseError = e instanceof Error ? e.message : String(e);
        }
      } else if (exitCode === 0 && !stdout.trim()) {
        result.parseError = "Command produced no output";
      }
    } catch (e: unknown) {
      result.stderr = e instanceof Error ? e.message : String(e);
      result.exitCode = -1;
      result.duration = Date.now() - startTime;
    }

    this.lastResult = result;
    await this.refresh();
  }

  private execCommand(command: string, cwd: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve) => {
      const proc = cp.exec(command, {
        cwd,
        timeout: DEFAULT_TIMEOUT,
        maxBuffer: OUTPUT_CAP,
        windowsHide: true,
      });

      let stdout = "";
      let stderr = "";

      proc.stdout?.on("data", (chunk: string | Buffer) => {
        stdout += typeof chunk === "string" ? chunk : chunk.toString();
      });

      proc.stderr?.on("data", (chunk: string | Buffer) => {
        stderr += typeof chunk === "string" ? chunk : chunk.toString();
      });

      proc.on("error", (err) => {
        resolve({ stdout, stderr: stderr || err.message, exitCode: -1 });
      });

      proc.on("close", (code) => {
        resolve({ stdout, stderr, exitCode: code ?? -1 });
      });
    });
  }

  private extractBattlesArray(parsed: unknown): unknown[] {
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed && typeof parsed === "object") {
      if ("battles" in parsed && Array.isArray((parsed as any).battles)) {
        return (parsed as any).battles;
      }
      if ("result" in parsed && typeof (parsed as any).result === "object" && Array.isArray((parsed as any).result?.battles)) {
        return (parsed as any).result.battles;
      }
    }
    throw new Error("Expected { battles: [...] }, a JSON array, or a JSON-RPC 2.0 response");
  }

  private async refresh(): Promise<void> {
    if (!this.panel || !this.lastResult) {
      return;
    }

    if (!this.isInitialized) {
      this.isInitialized = true;
      this.panel.webview.html = renderBattleTestView({
        cspSource: this.panel.webview.cspSource,
        nonce: getNonce(),
        codiconStyles: this.getCodiconStyles(),
        initialData: this.lastResult,
        scriptUri: this.panel.webview
          .asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "media", "battleTest.js"))
          .toString(),
        cssUri: this.panel.webview
          .asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "media", "output.css"))
          .toString(),
      });
      return;
    }

    await this.panel.webview.postMessage({ type: "update", data: this.lastResult });
  }

  private async handleMessage(message: any): Promise<void> {
    switch (message.command) {
      case "rerun":
        await this.runTest();
        break;
      case "copyStdout":
        if (this.lastResult?.stdout) {
          await vscode.env.clipboard.writeText(this.lastResult.stdout);
          void vscode.window.showInformationMessage("Output copied to clipboard.");
        }
        break;
      default:
        break;
    }
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
