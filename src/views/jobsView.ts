import { htmlShell } from "../templates/layout";

export interface JobsViewContext {
  cspSource: string;
  nonce: string;
  codiconStyles: string;
  scriptUri?: string;
  cssUri?: string;
  initialData?: Record<string, unknown>;
}

export function renderJobsView(ctx: JobsViewContext): string {
  return htmlShell({
    title: "Jobs",
    cspSource: ctx.cspSource,
    nonce: ctx.nonce,
    codiconStyles: ctx.codiconStyles,
    styles: "",
    body: `<div id=\"root\"></div>`,
    script: `window.__JOBS_INITIAL_DATA__ = ${JSON.stringify(ctx.initialData || {})};`,
    scriptUri: ctx.scriptUri,
    cssUri: ctx.cssUri,
  });
}