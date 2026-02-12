import { htmlShell } from "../templates/layout";
import { buttonStyles, settingsToggleStyles } from "../templates/styles";
import { renderToggleSetting } from "./helpers";

interface HideIconOption {
  value: string;
  label: string;
  icon: string;
}

export interface SettingsViewContext {
  cspSource: string;
  nonce: string;
  codiconStyles: string;
  showIcon: boolean;
  showType: boolean;
  showCommand: boolean;
  showGroup: boolean;
  hideIcon: string;
  configExists: boolean;
  usedIcons: string[];
}

const HIDE_ICON_OPTIONS: HideIconOption[] = [
  { value: "eye-closed", label: "Eye Closed", icon: "eye-closed" },
  { value: "x", label: "X Mark", icon: "x" },
  { value: "trash", label: "Trash", icon: "trash" },
  { value: "close", label: "Close", icon: "close" },
  { value: "circle-slash", label: "Circle Slash", icon: "circle-slash" },
];

export function renderSettingsView(ctx: SettingsViewContext): string {
  const hideIconSelect = HIDE_ICON_OPTIONS.map(
    (opt) =>
      `<option value="${opt.value}" ${ctx.hideIcon === opt.value ? "selected" : ""}>${opt.label}</option>`
  ).join("");

  const iconChips = ctx.usedIcons
    .map(
      (icon) => `
      <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 10px; padding: 4px 6px; background: var(--vscode-input-background); border-radius: 3px;" title="${icon}">
        <span class="codicon codicon-${icon}"></span>
        <span style="opacity: 0.7;">${icon}</span>
      </span>`
    )
    .join("");

  return htmlShell({
    title: "Settings",
    cspSource: ctx.cspSource,
    nonce: ctx.nonce,
    codiconStyles: ctx.codiconStyles,
    styles: `
      body {
        font-family: var(--vscode-font-family);
        color: var(--vscode-foreground);
        background: transparent;
        padding: 12px 8px;
        margin: 0;
      }
      h3 { margin: 0 0 16px; font-size: 13px; font-weight: 600; }
      ${settingsToggleStyles}
      .lp-config-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      .lp-config-actions {
        display: flex;
        gap: 4px;
      }
      .lp-config-btn {
        padding: 4px 8px;
        font-size: 11px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
        min-height: 24px;
      }
      .lp-config-btn .codicon {
        font-size: 14px;
      }
      @container (max-width: 280px) {
        .lp-config-btn .lp-btn-text { display: none; }
        .lp-config-btn { padding: 4px; min-width: 28px; justify-content: center; }
      }
      @media (max-width: 280px) {
        .lp-config-btn .lp-btn-text { display: none; }
        .lp-config-btn { padding: 4px; min-width: 28px; justify-content: center; }
      }
      .lp-form-actions { display: flex; gap: 8px; margin-top: 20px; }
      ${buttonStyles}
    `,
    body: `
      <h3>\u2699\ufe0f Settings</h3>

      <!-- Configuration Management -->
      <div class="lp-setting-group">
        <div class="lp-config-header">
          <div class="lp-setting-group-title">\ud83d\udcc4 battle.config</div>
          <div class="lp-config-actions">
            <button type="button" class="lp-config-btn lp-btn lp-btn-secondary" id="openConfigBtn" ${!ctx.configExists ? "disabled" : ""} title="${!ctx.configExists ? "Generate config first" : "Open config file"}">
              <span class="codicon codicon-file"></span><span class="lp-btn-text">Open</span>
            </button>
            <button type="button" class="lp-config-btn lp-btn lp-btn-secondary" id="generateConfigBtn" title="${ctx.configExists ? "Regenerate config from scanned sources" : "Generate new config file"}">
              <span class="codicon codicon-refresh"></span><span class="lp-btn-text">${ctx.configExists ? "Regenerate" : "Generate"}</span>
            </button>
            ${
              ctx.configExists
                ? `<button type="button" class="lp-config-btn lp-btn lp-btn-secondary" id="deleteConfigBtn" title="Delete config file" style="color: var(--vscode-errorForeground);">
                  <span class="codicon codicon-trash"></span><span class="lp-btn-text">Delete</span>
                </button>`
                : ""
            }
          </div>
        </div>
      </div>

      <!-- Display Settings -->
      <div class="lp-setting-group">
        <div class="lp-setting-group-title">\ud83c\udfa8 Display</div>
        ${renderToggleSetting("showIcon", "Show Icons", "Display codicons next to button names", ctx.showIcon)}
        ${renderToggleSetting("showType", "Show Type", "Display command type (npm, shell, vscode, etc.)", ctx.showType)}
        ${renderToggleSetting("showCommand", "Show Command", "Display the actual command text", ctx.showCommand)}
        ${renderToggleSetting("showGroup", "Show Groups", "Display group headers and organization", ctx.showGroup)}

        <div class="lp-setting-row">
          <div class="lp-setting-label">
            <div class="lp-setting-name">Hide Icon</div>
            <div class="lp-setting-desc">Icon to use for hiding items</div>
          </div>
          <select id="hideIcon" style="padding: 4px 8px; font-size: 12px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px;">
            ${hideIconSelect}
          </select>
        </div>
      </div>

      <!-- Icon Management -->
      <div class="lp-setting-group">
        <div class="lp-setting-group-title">\ud83c\udfad Available Icons</div>
        <div class="lp-setting-row" style="border: none; flex-direction: column; align-items: flex-start; gap: 8px;">
          <div class="lp-setting-label" style="flex-direction: row; align-items: center; gap: 6px;">
            <span class="codicon codicon-info" style="color: var(--vscode-textLink-foreground);"></span>
            <div class="lp-setting-desc" style="margin: 0;">
              Only icons used in your config are loaded for performance. All <a href="https://microsoft.github.io/vscode-codicons/dist/codicon.html" style="color: var(--vscode-textLink-foreground);" target="_blank">codicons</a> are supported\u2014just add them to your config and refresh.
            </div>
          </div>
          <div style="margin-top: 8px; width: 100%;">
            <div style="font-size: 11px; font-weight: 600; opacity: 0.7; margin-bottom: 6px;">Currently Loaded (${ctx.usedIcons.length} icons):</div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; padding: 8px; background: var(--vscode-editor-background); border-radius: 4px; max-height: 120px; overflow-y: auto;">
              ${iconChips}
            </div>
          </div>
        </div>
      </div>

      <div class="lp-form-actions">
        <button type="button" class="lp-btn lp-btn-secondary" id="cancelBtn">Cancel</button>
        <button type="button" class="lp-btn lp-btn-primary" id="saveBtn">Save Settings</button>
      </div>
    `,
    script: `
      (function () {
        const vscode = acquireVsCodeApi();

        document.getElementById('openConfigBtn')?.addEventListener('click', () => {
          vscode.postMessage({ command: 'openConfig' });
        });
        document.getElementById('generateConfigBtn')?.addEventListener('click', () => {
          vscode.postMessage({ command: 'showGenerateConfig' });
        });
        document.getElementById('deleteConfigBtn')?.addEventListener('click', () => {
          vscode.postMessage({ command: 'deleteConfig' });
        });
        document.getElementById('cancelBtn').addEventListener('click', () => {
          vscode.postMessage({ command: 'cancelForm' });
        });
        document.getElementById('saveBtn').addEventListener('click', () => {
          const settings = {
            showIcon: document.getElementById('showIcon').checked,
            showType: document.getElementById('showType').checked,
            showCommand: document.getElementById('showCommand').checked,
            showGroup: document.getElementById('showGroup').checked,
            hideIcon: document.getElementById('hideIcon').value
          };
          vscode.postMessage({ command: 'saveSettings', settings });
        });
      })();
    `,
  });
}
