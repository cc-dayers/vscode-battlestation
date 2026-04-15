import { html, render } from "lit";
import type { Action } from "../types";
import { filterActionsBySearch } from "../utils/actionSearch";

interface WorkflowBuilderStep {
  id: string;
  actionId: string;
  continueOnError: boolean;
  valid: boolean;
  reason?: string;
  action?: Action;
}

interface WorkflowBuilderWorkflow {
  id: string;
  name: string;
  stepCount: number;
  valid: boolean;
  invalidReasons: string[];
  steps: WorkflowBuilderStep[];
}

interface WorkflowBuilderState {
  actions: Action[];
  eligibleActionCount: number;
  totalActionCount: number;
  workflows: WorkflowBuilderWorkflow[];
  activeWorkflowId?: string;
  pendingDeleteWorkflowId?: string;
  searchQuery: string;
  runningWorkflowId?: string;
}

declare global {
  interface Window {
    __WORKFLOW_BUILDER_INITIAL_DATA__?: Partial<WorkflowBuilderState>;
    acquireVsCodeApi: () => {
      postMessage: (message: unknown) => void;
      getState: () => unknown;
      setState: (state: unknown) => void;
    };
  }
}

const vscode = window.acquireVsCodeApi();
const root = document.getElementById("root");

const storedState = (vscode.getState() as Partial<WorkflowBuilderState>) || {};
const state: WorkflowBuilderState = {
  actions: [],
  eligibleActionCount: 0,
  totalActionCount: 0,
  workflows: [],
  activeWorkflowId: storedState.activeWorkflowId,
  searchQuery: storedState.searchQuery || "",
  runningWorkflowId: undefined,
  ...window.__WORKFLOW_BUILDER_INITIAL_DATA__,
};

function persistState(): void {
  vscode.setState({
    activeWorkflowId: state.activeWorkflowId,
    searchQuery: state.searchQuery,
  });
}

function getActiveWorkflow(): WorkflowBuilderWorkflow | undefined {
  if (state.activeWorkflowId) {
    const selected = state.workflows.find((workflow) => workflow.id === state.activeWorkflowId);
    if (selected) {
      return selected;
    }
  }

  const first = state.workflows[0];
  state.activeWorkflowId = first?.id;
  persistState();
  return first;
}

function selectWorkflow(workflowId: string): void {
  state.activeWorkflowId = workflowId;
  state.pendingDeleteWorkflowId = undefined;
  persistState();
  renderView();
}

function createWorkflow(): void {
  state.pendingDeleteWorkflowId = undefined;
  vscode.postMessage({ command: "createWorkflow" });
}

function renameWorkflow(workflowId: string, name: string): void {
  vscode.postMessage({ command: "renameWorkflow", workflowId, name });
}

function requestDeleteWorkflow(workflowId: string): void {
  state.pendingDeleteWorkflowId = workflowId;
  renderView();
}

function cancelDeleteWorkflow(): void {
  if (!state.pendingDeleteWorkflowId) {
    return;
  }

  state.pendingDeleteWorkflowId = undefined;
  renderView();
}

function confirmDeleteWorkflow(workflowId: string): void {
  state.pendingDeleteWorkflowId = undefined;
  renderView();
  vscode.postMessage({ command: "deleteWorkflow", workflowId });
}

function addWorkflowStep(workflowId: string, actionId: string): void {
  vscode.postMessage({ command: "addWorkflowStep", workflowId, actionId });
}

function removeWorkflowStep(workflowId: string, stepId: string): void {
  vscode.postMessage({ command: "removeWorkflowStep", workflowId, stepId });
}

function moveWorkflowStep(workflowId: string, stepId: string, direction: "up" | "down"): void {
  vscode.postMessage({ command: "moveWorkflowStep", workflowId, stepId, direction });
}

function setStepContinueOnError(workflowId: string, stepId: string, continueOnError: boolean): void {
  vscode.postMessage({ command: "setWorkflowStepContinueOnError", workflowId, stepId, continueOnError });
}

function runWorkflow(workflowId: string): void {
  vscode.postMessage({ command: "runWorkflow", workflowId });
}

function getFilteredActions(): Action[] {
  return filterActionsBySearch(state.actions, state.searchQuery);
}

function actionMeta(action: Action): string {
  const parts = [action.type];
  if (action.workspace) parts.push(action.workspace);
  if (action.group) parts.push(action.group);
  parts.push(action.command);
  return parts.join(" · ");
}

function renderGuide(workflow: WorkflowBuilderWorkflow | undefined) {
  const statusText = !workflow
    ? "Pick or create a workflow first."
    : workflow.valid
      ? `Ready to run once your ${workflow.stepCount} step${workflow.stepCount === 1 ? "" : "s"} look right.`
      : "This workflow needs attention before it can run.";

  return html`
    <section class="wf-guide">
      <div class="wf-guide-card">
        <div class="wf-guide-step">1</div>
        <div class="wf-guide-title">Choose a workflow</div>
        <div class="wf-guide-copy">Create a chain or select one from the rail on the left.</div>
      </div>
      <div class="wf-guide-card">
        <div class="wf-guide-step">2</div>
        <div class="wf-guide-title">Add sequential steps</div>
        <div class="wf-guide-copy">Each action runs top-to-bottom. Reorder steps to control execution order.</div>
      </div>
      <div class="wf-guide-card">
        <div class="wf-guide-step">3</div>
        <div class="wf-guide-title">Run and iterate</div>
        <div class="wf-guide-copy">By default the chain stops on the first failure unless you enable continue-on-error.</div>
      </div>
      <div class="wf-guide-note">
        <span class="codicon codicon-info"></span>
        <div class="wf-guide-note-body">
          <div class="wf-guide-note-title">Sequential only</div>
          <div class="wf-guide-note-copy">
            No branching, conditions, loops, or freeform graph editing yet. Eligible actions are npm, shell,
            tasks, and other terminal-style commands. VS Code commands and launch configs are excluded.
          </div>
          <div class="wf-guide-note-status">${statusText}</div>
        </div>
      </div>
    </section>
  `;
}

function renderWorkflowRail(workflows: WorkflowBuilderWorkflow[], activeWorkflowId?: string) {
  return html`
    <aside class="wf-rail">
      <div class="wf-rail-header">
        <div>
          <div class="wf-eyebrow">Workflows</div>
          <h2 class="wf-title">Saved Chains</h2>
          <div class="wf-rail-copy">Reusable step-by-step command sequences.</div>
        </div>
        <button class="wf-primary-btn" @click=${createWorkflow}>
          <span class="codicon codicon-add"></span>
          New
        </button>
      </div>

      <div class="wf-rail-list">
        ${workflows.length === 0 ? html`
          <div class="wf-empty-card">
            <div class="wf-empty-title">No workflows yet</div>
            <div class="wf-empty-copy">Create a workflow, then add actions from the catalog.</div>
          </div>
        ` : workflows.map((workflow) => html`
          <button
            class="wf-rail-item ${workflow.id === activeWorkflowId ? "wf-rail-item--active" : ""}"
            @click=${() => selectWorkflow(workflow.id)}>
            <span class="wf-rail-item-main">
              <span class="wf-rail-item-name">${workflow.name}</span>
              <span class="wf-rail-item-meta">${workflow.stepCount} step${workflow.stepCount === 1 ? "" : "s"}</span>
            </span>
            <span class="wf-rail-item-badges">
              ${workflow.valid ? html`<span class="wf-pill wf-pill--success">Ready</span>` : html`<span class="wf-pill wf-pill--invalid">Invalid</span>`}
              <span class="codicon codicon-chevron-right wf-rail-item-chevron"></span>
            </span>
          </button>
        `)}
      </div>
    </aside>
  `;
}

function renderCatalogSection(workflow: WorkflowBuilderWorkflow, filteredActions: Action[]) {
  const eligibleCount = state.eligibleActionCount || state.actions.length;
  const totalCount = state.totalActionCount || state.actions.length;
  const excludedCount = Math.max(0, totalCount - eligibleCount);
  const summaryCopy = excludedCount > 0
     ? `Showing ${eligibleCount} of ${totalCount} actions. Launch configs and VS Code commands stay out of workflows.`
    : "Only actions that can run in a sequential chain appear here.";

  return html`
    <section class="wf-catalog">
      <div class="wf-section-head">
        <div>
          <div class="wf-eyebrow">Catalog</div>
          <h3 class="wf-section-title">Eligible Actions</h3>
          <div class="wf-section-copy">${summaryCopy}</div>
        </div>
        <div class="wf-section-meta">${filteredActions.length}</div>
      </div>

      <input
        class="wf-search"
        type="text"
        placeholder="Search actions"
        .value=${state.searchQuery}
        @input=${(event: Event) => {
          state.searchQuery = (event.target as HTMLInputElement).value;
          persistState();
          renderView();
        }}>

      <div class="wf-list">
        ${filteredActions.length === 0 ? html`
          <div class="wf-empty-card wf-empty-card--compact">
            <div class="wf-empty-title">No matches</div>
            <div class="wf-empty-copy">Try a different search term.</div>
          </div>
        ` : filteredActions.map((action) => html`
          <div class="wf-card wf-card--catalog">
            <div class="wf-card-main">
              <div class="wf-card-title-row">
                <div class="wf-card-title">${action.name}</div>
                <span class="wf-pill wf-pill--neutral">${action.type}</span>
              </div>
              <div class="wf-card-meta">${actionMeta(action)}</div>
            </div>
            <button class="wf-primary-btn" @click=${() => addWorkflowStep(workflow.id, action.id as string)}>
              <span class="codicon codicon-add"></span>
              Add step
            </button>
          </div>
        `)}
      </div>
    </section>
  `;
}

function renderStepFlow(workflow: WorkflowBuilderWorkflow) {
  if (workflow.steps.length === 0) {
    return html`
      <div class="wf-empty-card wf-empty-card--flow">
        <div class="wf-empty-title">No steps yet</div>
        <div class="wf-empty-copy">Pick an action from the catalog to add your first node to this sequence.</div>
      </div>
    `;
  }

  return html`
    <ol class="wf-step-flow" aria-label="Workflow steps">
      ${workflow.steps.map((step, index) => {
        const isLast = index === workflow.steps.length - 1;
        const stepStopLabel = step.continueOnError ? "Continue on fail" : "Stop on fail";
        const nodeClass = [
          "wf-step-node",
          !step.valid ? "wf-step-node--invalid" : "",
          step.continueOnError ? "wf-step-node--warning" : "",
        ].filter(Boolean).join(" ");

        return html`
          <li class="wf-step-shell">
            <div class="wf-step-connector" aria-hidden="true">
              <span class=${nodeClass}>${index + 1}</span>
              ${isLast ? html`<span class="wf-step-terminal">End</span>` : html`<span class="wf-step-line"></span>`}
            </div>

            <div class="wf-card wf-card--step ${step.valid ? "" : "wf-card--invalid"}">
              <div class="wf-card-head">
                <div class="wf-card-main">
                  <div class="wf-card-title-row">
                    <div class="wf-card-title">${step.action?.name || "Missing action"}</div>
                    <div class="wf-card-pills">
                      ${step.action ? html`<span class="wf-pill wf-pill--neutral">${step.action.type}</span>` : null}
                      <span class="wf-pill ${step.continueOnError ? "wf-pill--warning" : "wf-pill--subtle"}">${stepStopLabel}</span>
                    </div>
                  </div>
                  <div class="wf-card-meta">${step.action ? actionMeta(step.action) : step.reason}</div>
                </div>

                <div class="wf-step-actions">
                  <button
                    class="wf-icon-btn"
                    title="Move up"
                    ?disabled=${index === 0}
                    @click=${() => moveWorkflowStep(workflow.id, step.id, "up")}>
                    <span class="codicon codicon-arrow-up"></span>
                  </button>
                  <button
                    class="wf-icon-btn"
                    title="Move down"
                    ?disabled=${index === workflow.steps.length - 1}
                    @click=${() => moveWorkflowStep(workflow.id, step.id, "down")}>
                    <span class="codicon codicon-arrow-down"></span>
                  </button>
                  <button
                    class="wf-icon-btn wf-icon-btn--danger"
                    title="Remove step"
                    @click=${() => removeWorkflowStep(workflow.id, step.id)}>
                    <span class="codicon codicon-close"></span>
                  </button>
                </div>
              </div>

              <label class="wf-checkbox">
                <input
                  type="checkbox"
                  .checked=${step.continueOnError}
                  @change=${(event: Event) => setStepContinueOnError(
                    workflow.id,
                    step.id,
                    (event.target as HTMLInputElement).checked
                  )}>
                Continue if this step fails
              </label>
            </div>
          </li>
        `;
      })}
    </ol>
  `;
}

function renderWorkflowDetails(workflow: WorkflowBuilderWorkflow | undefined) {
  const filteredActions = getFilteredActions();

  if (!workflow) {
    return html`
      <section class="wf-panel wf-panel--empty">
        ${renderGuide(undefined)}
        <div class="wf-empty-card wf-empty-card--hero">
          <div class="wf-empty-title">Select or create a workflow</div>
          <div class="wf-empty-copy">Once a workflow is selected, you can add actions from the catalog and shape the sequential flow on the right.</div>
        </div>
      </section>
    `;
  }

  const canRun = workflow.valid && workflow.stepCount > 0 && state.runningWorkflowId !== workflow.id;
  const statusPillClass = workflow.valid ? "wf-pill--success" : "wf-pill--invalid";
  const statusLabel = workflow.valid ? "Runnable" : "Needs fixes";
  const isPendingDelete = state.pendingDeleteWorkflowId === workflow.id;

  return html`
    <section class="wf-panel">
      ${renderGuide(workflow)}

      <div class="wf-toolbar">
        <div class="wf-toolbar-main">
          <input
            class="wf-name-input"
            type="text"
            .value=${workflow.name}
            aria-label="Workflow name"
            @change=${(event: Event) => renameWorkflow(workflow.id, (event.target as HTMLInputElement).value)}>
          <div class="wf-toolbar-meta">
            <span class="wf-pill wf-pill--neutral">${workflow.stepCount} step${workflow.stepCount === 1 ? "" : "s"}</span>
            <span class="wf-pill ${statusPillClass}">${statusLabel}</span>
          </div>
        </div>
        <div class="wf-toolbar-actions">
          <button
            class="wf-secondary-btn"
            ?disabled=${!canRun}
            @click=${() => runWorkflow(workflow.id)}>
            <span class="codicon codicon-play"></span>
            ${state.runningWorkflowId === workflow.id ? "Running..." : "Run"}
          </button>
          <button class="wf-danger-btn" @click=${() => requestDeleteWorkflow(workflow.id)}>
            <span class="codicon codicon-trash"></span>
            Delete
          </button>
        </div>
      </div>

      ${isPendingDelete ? html`
        <div class="wf-inline-confirm" role="alert">
          <div class="wf-inline-confirm-copy">
            <div class="wf-inline-confirm-title">Delete this workflow?</div>
            <div class="wf-inline-confirm-text">This removes the saved chain and its step list.</div>
          </div>
          <div class="wf-inline-confirm-actions">
            <button class="wf-danger-btn" @click=${() => confirmDeleteWorkflow(workflow.id)}>
              <span class="codicon codicon-trash"></span>
              Delete workflow
            </button>
            <button class="wf-secondary-btn" @click=${cancelDeleteWorkflow}>
              <span class="codicon codicon-close"></span>
              Cancel
            </button>
          </div>
        </div>
      ` : null}

      ${workflow.valid ? null : html`
        <div class="wf-alert">
          <span class="codicon codicon-warning"></span>
          <div>${workflow.invalidReasons.join(" ")}</div>
        </div>
      `}

      <div class="wf-columns">
        ${renderCatalogSection(workflow, filteredActions)}

        <section class="wf-steps">
          <div class="wf-section-head">
            <div>
              <div class="wf-eyebrow">Flow</div>
              <h3 class="wf-section-title">Sequential Run Order</h3>
              <div class="wf-section-copy">Each node waits for the previous node to finish.</div>
            </div>
            <div class="wf-section-meta">${workflow.stepCount}</div>
          </div>
          ${renderStepFlow(workflow)}
        </section>
      </div>
    </section>
  `;
}

function renderView(): void {
  if (!root) {
    return;
  }

  const activeWorkflow = getActiveWorkflow();
  render(html`
    <div class="wf-shell">
      ${renderWorkflowRail(state.workflows, activeWorkflow?.id)}
      ${renderWorkflowDetails(activeWorkflow)}
    </div>
  `, root);
}

window.addEventListener("message", (event) => {
  const message = event.data;
  switch (message.type) {
    case "update":
      state.actions = message.data.actions || [];
      state.eligibleActionCount = message.data.eligibleActionCount ?? state.actions.length;
      state.totalActionCount = message.data.totalActionCount ?? state.actions.length;
      state.workflows = message.data.workflows || [];
      if (
        state.pendingDeleteWorkflowId &&
        !state.workflows.some((workflow) => workflow.id === state.pendingDeleteWorkflowId)
      ) {
        state.pendingDeleteWorkflowId = undefined;
      }
      if (message.data.activeWorkflowId) {
        state.activeWorkflowId = message.data.activeWorkflowId;
      } else if (!state.workflows.some((workflow) => workflow.id === state.activeWorkflowId)) {
        state.activeWorkflowId = undefined;
      }
      persistState();
      renderView();
      break;
    case "workflowRunState":
      state.runningWorkflowId = message.workflowId;
      renderView();
      break;
    default:
      break;
  }
});

renderView();
