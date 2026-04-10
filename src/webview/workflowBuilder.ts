import { html, render } from "lit";
import type { Action } from "../types";

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
  workflows: WorkflowBuilderWorkflow[];
  activeWorkflowId?: string;
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
  persistState();
  renderView();
}

function createWorkflow(): void {
  vscode.postMessage({ command: "createWorkflow" });
}

function renameWorkflow(workflowId: string, name: string): void {
  vscode.postMessage({ command: "renameWorkflow", workflowId, name });
}

function deleteWorkflow(workflowId: string): void {
  if (!window.confirm("Delete this workflow?")) {
    return;
  }
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
  const query = state.searchQuery.trim().toLowerCase();
  if (!query) {
    return state.actions;
  }

  return state.actions.filter((action) => {
    return [
      action.name,
      action.command,
      action.type,
      action.group || "",
      action.workspace || "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}

function actionMeta(action: Action): string {
  const parts = [action.type];
  if (action.workspace) parts.push(action.workspace);
  if (action.group) parts.push(action.group);
  parts.push(action.command);
  return parts.join(" · ");
}

function renderWorkflowRail(workflows: WorkflowBuilderWorkflow[], activeWorkflowId?: string) {
  return html`
    <aside class="wf-rail">
      <div class="wf-rail-header">
        <div>
          <div class="wf-eyebrow">Workflows</div>
          <h2 class="wf-title">Saved Chains</h2>
        </div>
        <button class="wf-primary-btn" @click=${createWorkflow}>
          <span class="codicon codicon-add"></span>
          New
        </button>
      </div>

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
          ${workflow.valid ? null : html`<span class="wf-pill wf-pill--invalid">Invalid</span>`}
        </button>
      `)}
    </aside>
  `;
}

function renderWorkflowDetails(workflow: WorkflowBuilderWorkflow | undefined) {
  if (!workflow) {
    return html`
      <section class="wf-panel wf-panel--empty">
        <div class="wf-empty-title">Select or create a workflow</div>
        <div class="wf-empty-copy">Saved workflows will appear here with editable steps.</div>
      </section>
    `;
  }

  const canRun = workflow.valid && workflow.stepCount > 0 && state.runningWorkflowId !== workflow.id;
  const filteredActions = getFilteredActions();

  return html`
    <section class="wf-panel">
      <div class="wf-toolbar">
        <div class="wf-toolbar-main">
          <input
            class="wf-name-input"
            type="text"
            .value=${workflow.name}
            aria-label="Workflow name"
            @change=${(event: Event) => renameWorkflow(workflow.id, (event.target as HTMLInputElement).value)}>
          <div class="wf-toolbar-meta">${workflow.stepCount} step${workflow.stepCount === 1 ? "" : "s"}</div>
        </div>
        <div class="wf-toolbar-actions">
          <button
            class="wf-secondary-btn"
            ?disabled=${!canRun}
            @click=${() => runWorkflow(workflow.id)}>
            <span class="codicon codicon-play"></span>
            ${state.runningWorkflowId === workflow.id ? "Running..." : "Run"}
          </button>
          <button class="wf-danger-btn" @click=${() => deleteWorkflow(workflow.id)}>
            <span class="codicon codicon-trash"></span>
            Delete
          </button>
        </div>
      </div>

      ${workflow.valid ? null : html`
        <div class="wf-alert">
          <span class="codicon codicon-warning"></span>
          <div>${workflow.invalidReasons.join(" ")}</div>
        </div>
      `}

      <div class="wf-columns">
        <section class="wf-catalog">
          <div class="wf-section-head">
            <div>
              <div class="wf-eyebrow">Catalog</div>
              <h3 class="wf-section-title">Eligible Actions</h3>
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
              <div class="wf-empty-copy">No eligible actions match your search.</div>
            ` : filteredActions.map((action) => html`
              <div class="wf-card wf-card--catalog">
                <div class="wf-card-main">
                  <div class="wf-card-title">${action.name}</div>
                  <div class="wf-card-meta">${actionMeta(action)}</div>
                </div>
                <button class="wf-primary-btn" @click=${() => addWorkflowStep(workflow.id, action.id as string)}>
                  <span class="codicon codicon-add"></span>
                  Add
                </button>
              </div>
            `)}
          </div>
        </section>

        <section class="wf-steps">
          <div class="wf-section-head">
            <div>
              <div class="wf-eyebrow">Steps</div>
              <h3 class="wf-section-title">Sequential Run Order</h3>
            </div>
            <div class="wf-section-meta">${workflow.stepCount}</div>
          </div>

          <div class="wf-list">
            ${workflow.steps.length === 0 ? html`
              <div class="wf-empty-card">
                <div class="wf-empty-title">No steps yet</div>
                <div class="wf-empty-copy">Choose an action from the catalog to add it to this workflow.</div>
              </div>
            ` : workflow.steps.map((step, index) => html`
              <div class="wf-card ${step.valid ? "" : "wf-card--invalid"}">
                <div class="wf-step-index">${index + 1}</div>
                <div class="wf-card-main">
                  <div class="wf-card-title">${step.action?.name || "Missing action"}</div>
                  <div class="wf-card-meta">${step.action ? actionMeta(step.action) : step.reason}</div>
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
            `)}
          </div>
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
      state.workflows = message.data.workflows || [];
      if (message.data.activeWorkflowId) {
        state.activeWorkflowId = message.data.activeWorkflowId;
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
