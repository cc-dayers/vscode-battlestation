import { htmlShell } from "../templates/layout";
import type { JobRunRecord, JobRuntimeSnapshot } from "../types";

export interface JobAdminData {
  snapshot: JobRuntimeSnapshot | null;
  recentRuns: JobRunRecord[];
}

export interface JobAdminViewContext {
  cspSource: string;
  nonce: string;
  codiconStyles: string;
  initialData: JobAdminData;
  scriptUri?: string;
  cssUri?: string;
}

export function renderJobAdminView(ctx: JobAdminViewContext): string {
  return htmlShell({
    title: "Battlestation Job Admin",
    cspSource: ctx.cspSource,
    nonce: ctx.nonce,
    codiconStyles: ctx.codiconStyles,
    styles: "",
    body: `<div id="root"></div>`,
    script: `window.__JOB_ADMIN_DATA__ = ${JSON.stringify(ctx.initialData)};`,
    scriptUri: ctx.scriptUri,
    cssUri: ctx.cssUri,
  });
}