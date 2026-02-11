import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

interface ConfigItem {
  name: string;
  command: string;
  type: string;
}

interface Config {
  items: ConfigItem[];
}

export class LaunchpadPanel {
  public static currentPanel: LaunchpadPanel | undefined;
  private static readonly viewType = "launchpad";

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionContext: vscode.ExtensionContext;
  private disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext
  ) {
    this.panel = panel;
    this.extensionContext = context;

    this.update();

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      (message) => this.handleMessage(message),
      null,
      this.disposables
    );
  }

  public static createOrShow(context: vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (LaunchpadPanel.currentPanel) {
      LaunchpadPanel.currentPanel.panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      LaunchpadPanel.viewType,
      "Launchpad",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: false,
      }
    );

    LaunchpadPanel.currentPanel = new LaunchpadPanel(panel, context);
  }

  private readConfig(): Config {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return { items: [] };
    }

    const configPath = path.join(workspaceFolders[0].uri.fsPath, "config.json");

    try {
      const raw = fs.readFileSync(configPath, "utf-8");
      return JSON.parse(raw) as Config;
    } catch {
      vscode.window.showWarningMessage(
        "Launchpad: Could not read config.json in workspace root."
      );
      return { items: [] };
    }
  }

  private handleMessage(message: { command: string }) {
    switch (message.command) {
      case "refresh":
        this.update();
        break;
    }
  }

  private update() {
    const config = this.readConfig();
    this.panel.webview.html = this.getHtml(config);
  }

  private getHtml(config: Config): string {
    const buttons = config.items
      .map(
        (item) =>
          `<button class="lp-btn" data-command="${this.escapeHtml(item.command)}" data-type="${this.escapeHtml(item.type)}">
            <span class="lp-btn-name">${this.escapeHtml(item.name)}</span>
            <span class="lp-btn-meta">${this.escapeHtml(item.type)} · ${this.escapeHtml(item.command)}</span>
          </button>`
      )
      .join("\n");

    return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Launchpad</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      padding: 16px;
      margin: 0;
    }
    h1 {
      font-size: 1.4em;
      margin: 0 0 16px;
      font-weight: 600;
    }
    .lp-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .lp-btn {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 10px 14px;
      border: 1px solid var(--vscode-button-border, var(--vscode-contrastBorder, transparent));
      border-radius: 4px;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      font-size: 13px;
      transition: background 0.1s;
    }
    .lp-btn:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .lp-btn-name {
      font-weight: 600;
    }
    .lp-btn-meta {
      font-size: 11px;
      opacity: 0.7;
      margin-top: 2px;
    }
    .lp-empty {
      opacity: 0.6;
      font-style: italic;
    }
    .lp-toolbar {
      margin-bottom: 12px;
    }
    .lp-toolbar button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 4px 12px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
    }
    .lp-toolbar button:hover {
      background: var(--vscode-button-hoverBackground);
    }
  </style>
</head>
<body>
  <h1>Launchpad</h1>
  <div class="lp-toolbar">
    <button id="refreshBtn">↻ Refresh Config</button>
  </div>
  <div class="lp-grid">
    ${buttons.length > 0 ? buttons : '<p class="lp-empty">No items found in config.json</p>'}
  </div>

  <script>
    (function () {
      const vscode = acquireVsCodeApi();

      document.getElementById('refreshBtn').addEventListener('click', () => {
        vscode.postMessage({ command: 'refresh' });
      });

      document.querySelectorAll('.lp-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          // Buttons read config but don’t execute yet — future feature
          const name = btn.querySelector('.lp-btn-name').textContent;
          console.log('Button clicked:', name);
        });
      });
    })();
  </script>
</body>
</html>`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  private dispose() {
    LaunchpadPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) {
        d.dispose();
      }
    }
  }
}
