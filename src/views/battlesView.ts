import { htmlShell } from "../templates/layout";

export interface BattlesViewContext {
  cspSource: string;
  nonce: string;
  codiconStyles: string;
  scriptUri?: string;
  cssUri?: string;
  initialData?: Record<string, unknown>;
}

export function renderBattlesView(ctx: BattlesViewContext): string {
  return htmlShell({
    title: "Battles",
    cspSource: ctx.cspSource,
    nonce: ctx.nonce,
    codiconStyles: ctx.codiconStyles,
    styles: "",
    body: `<div id="root"></div>`,
    script: `window.__BATTLES_INITIAL_DATA__ = ${JSON.stringify(ctx.initialData || {})};`,
    scriptUri: ctx.scriptUri,
    cssUri: ctx.cssUri,
  });
}
