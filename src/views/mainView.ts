
import { htmlShell } from "../templates/layout";
import type { Config } from "../types";

export interface MainViewContext {
  cspSource: string;
  nonce: string;
  codiconStyles: string;
  config: Config;
  showHidden: boolean;
  searchVisible: boolean;
  scriptUri?: string;
  cssUri?: string;
  initialData?: Record<string, unknown>;
}

export function renderMainView(ctx: MainViewContext): string {
  const { initialData } = ctx;

  return htmlShell({
    title: "Launchpad",
    cspSource: ctx.cspSource,
    nonce: ctx.nonce,
    codiconStyles: ctx.codiconStyles,
    styles: "",
    body: `<div id="root"></div>`,
    script: `
      window.__INITIAL_DATA__ = ${JSON.stringify({
      ...initialData,
      showSearch: ctx.searchVisible,
    })};
    `,
    scriptUri: ctx.scriptUri,
    cssUri: ctx.cssUri,
  });
}
