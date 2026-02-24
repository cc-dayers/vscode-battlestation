import { htmlShell } from "../templates/layout";
import { getNonce } from "../templates/nonce";

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
  cssUri?: string;
  customConfigPath?: string;
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
    customConfigPath: ctx.customConfigPath ?? null,
  };

  return htmlShell({
    title: "Settings",
    cspSource: ctx.cspSource,
    nonce: ctx.nonce,
    codiconStyles: ctx.codiconStyles,
    scriptUri: ctx.settingsScriptUri,
    cssUri: ctx.cssUri,
    styles: "",
    body: `
      <div id="root"></div>
    `,
    script: `
      window.__SETTINGS__ = ${JSON.stringify(initialState)};
    `,
  });
}
