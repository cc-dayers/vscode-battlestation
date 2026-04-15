import type { Action, Workflow, WorkflowStep } from "../types";

export interface ResolvedWorkflowStep {
  id: string;
  actionId: string;
  continueOnError: boolean;
  action?: Action;
  valid: boolean;
  reason?: string;
}

export interface WorkflowSummary {
  id: string;
  name: string;
  stepCount: number;
  valid: boolean;
  invalidReasons: string[];
  steps: ResolvedWorkflowStep[];
}

export interface WorkflowEligibleActionStats {
  actions: Action[];
  eligibleActionCount: number;
  totalActionCount: number;
}

const INELIGIBLE_WORKFLOW_TYPES = new Set(["vscode", "launch"]);

export function isWorkflowEligibleAction(action: Action): boolean {
  return !INELIGIBLE_WORKFLOW_TYPES.has(action.type);
}

export function getWorkflowActionKey(action: Action): string {
  return `${action.command}|${action.workspace || ""}`;
}

export function getEligibleWorkflowActions(actions: Action[]): Action[] {
  return getEligibleWorkflowActionStats(actions).actions;
}

export function getEligibleWorkflowActionStats(actions: Action[]): WorkflowEligibleActionStats {
  const eligibleActions = actions
    .filter(isWorkflowEligibleAction)
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    actions: eligibleActions,
    eligibleActionCount: eligibleActions.length,
    totalActionCount: actions.length,
  };
}

export function resolveWorkflowStep(step: WorkflowStep, actions: Action[]): ResolvedWorkflowStep {
  const action = actions.find((candidate) => candidate.id === step.actionId);
  if (!action) {
    return {
      id: step.id,
      actionId: step.actionId,
      continueOnError: step.continueOnError === true,
      valid: false,
      reason: "Referenced action no longer exists.",
    };
  }

  if (!isWorkflowEligibleAction(action)) {
    return {
      id: step.id,
      actionId: step.actionId,
      continueOnError: step.continueOnError === true,
      action,
      valid: false,
      reason: `Action type "${action.type}" is not supported in workflows yet.`,
    };
  }

  return {
    id: step.id,
    actionId: step.actionId,
    continueOnError: step.continueOnError === true,
    action,
    valid: true,
  };
}

export function buildWorkflowSummary(workflow: Workflow, actions: Action[]): WorkflowSummary {
  const resolvedSteps = workflow.steps.map((step) => resolveWorkflowStep(step, actions));
  const invalidReasons = Array.from(
    new Set(
      resolvedSteps
        .filter((step) => !step.valid && step.reason)
        .map((step) => step.reason as string)
    )
  );

  return {
    id: workflow.id,
    name: workflow.name,
    stepCount: workflow.steps.length,
    valid: invalidReasons.length === 0,
    invalidReasons,
    steps: resolvedSteps,
  };
}

export function buildWorkflowSummaries(workflows: Workflow[] | undefined, actions: Action[]): WorkflowSummary[] {
  return (workflows || []).map((workflow) => buildWorkflowSummary(workflow, actions));
}

export function findWorkflow(workflows: Workflow[] | undefined, workflowId: string): Workflow | undefined {
  return (workflows || []).find((workflow) => workflow.id === workflowId);
}
