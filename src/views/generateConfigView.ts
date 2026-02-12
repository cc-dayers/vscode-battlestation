import { htmlShell } from "../templates/layout";
import { buttonStyles, checkboxStyles } from "../templates/styles";
import { renderCheckbox } from "./helpers";

export interface GenerateConfigContext {
  cspSource: string;
  nonce: string;
  codiconStyles: string;
  hasNpm: boolean;
  hasTasks: boolean;
  hasLaunch: boolean;
  showWelcome: boolean;
}

export function renderGenerateConfigView(ctx: GenerateConfigContext): string {
  const heading = ctx.showWelcome
    ? `<div class="lp-setup">
        <h2>Welcome to Battlestation</h2>
        <p>No <code>battle.config</code> found.</p>
        <p>Create one automatically or manually to get started.</p>
      </div>`
    : '<h2>\ud83d\ude80 Generate Configuration</h2><p>Auto-detect commands from your workspace.</p>';

  const actions = ctx.showWelcome
    ? '<button class="lp-btn lp-btn-primary" id="createBtn" style="width: 100%;">Create battle.config</button>'
    : `<div class="lp-form-actions">
        <button type="button" class="lp-btn lp-btn-secondary" id="cancelBtn">Cancel</button>
        <button type="button" class="lp-btn lp-btn-primary" id="createBtn">Generate</button>
      </div>`;

  return htmlShell({
    title: "Launchpad",
    cspSource: ctx.cspSource,
    nonce: ctx.nonce,
    codiconStyles: ctx.codiconStyles,
    styles: `
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
      ${checkboxStyles}
      .lp-form-actions { display: flex; gap: 8px; margin-top: 12px; }
      ${buttonStyles}
    `,
    body: `
      ${heading}
      <div class="lp-sources">
        <div class="lp-sources-title">Auto-detect from:</div>
        ${renderCheckbox("npmCheck", "npm scripts (package.json)", ctx.hasNpm)}
        ${renderCheckbox("tasksCheck", "VS Code tasks (tasks.json)", ctx.hasTasks)}
        ${renderCheckbox("launchCheck", "Launch configs (launch.json)", ctx.hasLaunch)}
      </div>
      <div class="lp-sources" style="margin-top: 8px;">
        <div class="lp-sources-title">Options:</div>
        ${renderCheckbox("groupCheck", "Group by type", ctx.hasNpm || ctx.hasTasks || ctx.hasLaunch)}
      </div>
      ${actions}
    `,
    script: `
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
    `,
  });
}
