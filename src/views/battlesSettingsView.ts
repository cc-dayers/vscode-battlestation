import { htmlShell } from "../templates/layout";
import type { BattleProvider, BattleProviderState } from "../types";

export interface BattlesSettingsData {
  providers: BattleProvider[];
  providerStates: BattleProviderState[];
}

export interface BattlesSettingsViewContext {
  cspSource: string;
  nonce: string;
  codiconStyles: string;
  initialData: BattlesSettingsData;
  scriptUri?: string;
  cssUri?: string;
}

export function renderBattlesSettingsView(ctx: BattlesSettingsViewContext): string {
  return htmlShell({
    title: "Battle Provider Settings",
    cspSource: ctx.cspSource,
    nonce: ctx.nonce,
    codiconStyles: ctx.codiconStyles,
    styles: "",
    body: `<div id="root"></div>`,
    script: `window.__BATTLES_SETTINGS__ = ${JSON.stringify(ctx.initialData)};`,
    scriptUri: ctx.scriptUri,
    cssUri: ctx.cssUri,
  });
}
