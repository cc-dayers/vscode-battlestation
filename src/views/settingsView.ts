import { htmlShell } from "../templates/layout";
import { buttonStyles, settingsToggleStyles } from "../templates/styles";

export interface SettingsViewContext {
  cspSource: string;
  nonce: string;
  codiconStyles: string;
  showIcon: boolean;
  showType: boolean;
  showCommand: boolean;
  showGroup: boolean;
  hideIcon: string;
  backupCount: number;
  configExists: boolean;
  usedIcons: string[];
  settingsScriptUri: string;
}

export function renderSettingsView(ctx: SettingsViewContext): string {
  const initialState = {
    showIcon: ctx.showIcon,
    showType: ctx.showType,
    showCommand: ctx.showCommand,
    showGroup: ctx.showGroup,
    hideIcon: ctx.hideIcon,
    backupCount: ctx.backupCount,
    configExists: ctx.configExists,
    usedIcons: ctx.usedIcons,
  };

  return htmlShell({
    title: "Settings",
    cspSource: ctx.cspSource,
    nonce: ctx.nonce,
    codiconStyles: ctx.codiconStyles,
    scriptUri: ctx.settingsScriptUri,
    styles: `
      body {
        font-family: var(--vscode-font-family);
        color: var(--vscode-foreground);
        background: transparent;
        padding: 12px 8px;
        margin: 0;
      }
      h3 { margin: 0; font-size: 13px; font-weight: 600; }
      ${settingsToggleStyles}
      .lp-settings-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 12px;
      }
      .lp-top-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .lp-icon-btn {
        padding: 4px 6px;
        min-width: 28px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 14px;
      }
      .lp-icon-btn:hover {
        background: var(--vscode-button-secondaryHoverBackground);
      }
      .lp-config-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      .lp-config-header .lp-setting-group-title {
        margin-bottom: 0;
        display: inline-flex;
        align-items: center;
      }
      .lp-config-actions {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }
      .lp-config-btn {
        padding: 4px 8px;
        font-size: 11px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        white-space: nowrap;
        min-height: 24px;
      }
      .lp-config-btn .codicon {
        font-size: 14px;
      }
      .lp-config-confirm {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-top: 8px;
        padding: 6px 8px;
        background: var(--vscode-editor-background);
        border: 1px solid var(--vscode-editorWidget-border);
        border-radius: 4px;
        font-size: 11px;
      }
      .lp-config-confirm-text {
        color: var(--vscode-foreground);
        opacity: 0.9;
      }
      .lp-config-confirm-actions {
        display: inline-flex;
        gap: 6px;
      }
      .lp-config-disabled {
        opacity: 0.5;
      }
      .lp-config-disabled .lp-config-btn {
        opacity: 0.8;
      }
      .lp-config-disabled .lp-config-btn.lp-config-cta {
        opacity: 1;
      }
      .lp-emoji-input {
        padding: 4px 8px;
        font-size: 12px;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border);
        border-radius: 2px;
        width: 120px;
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
      <div id="root"></div>
    `,
    script: `
      window.__SETTINGS__ = ${JSON.stringify(initialState)};
    `,
  });
}
