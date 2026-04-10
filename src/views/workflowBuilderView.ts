import { htmlShell } from "../templates/layout";

export interface WorkflowBuilderViewContext {
  cspSource: string;
  nonce: string;
  codiconStyles: string;
  initialData: Record<string, unknown>;
  scriptUri?: string;
  cssUri?: string;
}

export function renderWorkflowBuilderView(ctx: WorkflowBuilderViewContext): string {
  return htmlShell({
    title: "Battlestation Workflow Builder",
    cspSource: ctx.cspSource,
    nonce: ctx.nonce,
    codiconStyles: ctx.codiconStyles,
    styles: "",
    body: `<div id="root"></div>`,
    script: `
      window.__WORKFLOW_BUILDER_INITIAL_DATA__ = ${JSON.stringify(ctx.initialData)};
    `,
    scriptUri: ctx.scriptUri,
    cssUri: ctx.cssUri,
  });
}
