import { htmlShell } from "../templates/layout";
import { esc } from "./helpers";

export function renderErrorView(
  error: string,
  cspSource: string,
  nonce: string,
  codiconStyles: string
): string {
  const truncated = error.length > 300 ? error.slice(0, 297) + "..." : error;

  return htmlShell({
    title: "Config Error",
    cspSource,
    nonce,
    codiconStyles,
    styles: `
      body {
        font-family: var(--vscode-font-family);
        color: var(--vscode-foreground);
        background: transparent;
        padding: 20px;
        margin: 0;
      }
      .error-card {
        border: 1px solid var(--vscode-inputValidation-errorBorder);
        background: var(--vscode-inputValidation-errorBackground, rgba(255,0,0,0.05));
        border-radius: 4px;
        padding: 16px;
      }
      .error-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        font-size: 13px;
        font-weight: 600;
        color: var(--vscode-inputValidation-errorForeground, var(--vscode-errorForeground));
      }
      .error-icon::before {
        content: "\\ea87";
        font-family: codicon;
        font-size: 16px;
      }
      .error-message {
        font-family: var(--vscode-editor-font-family, monospace);
        font-size: 12px;
        background: var(--vscode-textCodeBlock-background);
        border-radius: 3px;
        padding: 10px;
        margin-bottom: 14px;
        white-space: pre-wrap;
        word-break: break-all;
        color: var(--vscode-foreground);
        opacity: 0.9;
      }
      .error-actions {
        display: flex;
        gap: 8px;
      }
      button {
        padding: 5px 12px;
        font-size: 12px;
        font-family: var(--vscode-font-family);
        border-radius: 2px;
        cursor: pointer;
        border: 1px solid transparent;
      }
      .btn-primary {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
      }
      .btn-primary:hover { background: var(--vscode-button-hoverBackground); }
      .btn-secondary {
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        border-color: var(--vscode-button-secondaryBackground);
      }
      .btn-secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }
    `,
    body: `
      <div class="error-card">
        <div class="error-header">
          <span class="error-icon"></span>
          Config Error
        </div>
        <div class="error-message">${esc(truncated)}</div>
        <div class="error-actions">
          <button class="btn-primary" id="openConfigBtn">Open battle.json</button>
          <button class="btn-secondary" id="refreshBtn">Refresh</button>
        </div>
      </div>
    `,
    script: `
      const vscode = acquireVsCodeApi();
      document.getElementById('openConfigBtn').addEventListener('click', () => vscode.postMessage({ command: 'openConfig' }));
      document.getElementById('refreshBtn').addEventListener('click', () => vscode.postMessage({ command: 'refresh' }));
    `,
  });
}
