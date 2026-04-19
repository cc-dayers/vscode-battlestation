import { htmlShell } from "../templates/layout";
import type { BattleProvider } from "../types";

export interface BattleTestData {
  provider: BattleProvider;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  duration: number;
  parsedCount: number | null;
  parseError: string | null;
}

export interface BattleTestViewContext {
  cspSource: string;
  nonce: string;
  codiconStyles: string;
  initialData: BattleTestData;
  scriptUri?: string;
  cssUri?: string;
}

export function renderBattleTestView(ctx: BattleTestViewContext): string {
  return htmlShell({
    title: "Test Battle Provider",
    cspSource: ctx.cspSource,
    nonce: ctx.nonce,
    codiconStyles: ctx.codiconStyles,
    styles: "",
    body: `<div id="root"></div>`,
    script: `window.__BATTLE_TEST_DATA__ = ${JSON.stringify(ctx.initialData)};`,
    scriptUri: ctx.scriptUri,
    cssUri: ctx.cssUri,
  });
}
