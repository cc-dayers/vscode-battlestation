import type { Action, Workflow } from "../types";
import { ConfigService } from "./configService";
import { ActionExecutionService } from "./actionExecutionService";
import { buildWorkflowSummary, findWorkflow } from "../utils/workflows";

export interface WorkflowRunStepResult {
  stepId: string;
  actionId: string;
  actionName?: string;
  exitCode?: number;
  continueOnError: boolean;
  reason?: string;
}

export interface WorkflowRunResult {
  workflowId: string;
  workflowName: string;
  success: boolean;
  cancelled: boolean;
  invalid: boolean;
  blockedReason?: string;
  steps: WorkflowRunStepResult[];
}

export class WorkflowExecutionService {
  constructor(
    private readonly configService: ConfigService,
    private readonly actionExecutionService: ActionExecutionService
  ) {}

  public async runWorkflowById(workflowId: string): Promise<WorkflowRunResult> {
    const config = await this.configService.readConfig();
    const workflow = findWorkflow(config.workflows, workflowId);

    if (!workflow) {
      throw new Error(`Workflow "${workflowId}" was not found.`);
    }

    return this.runWorkflow(workflow, config.actions);
  }

  private async runWorkflow(workflow: Workflow, actions: Action[]): Promise<WorkflowRunResult> {
    const summary = buildWorkflowSummary(workflow, actions);
    if (!summary.valid) {
      return {
        workflowId: workflow.id,
        workflowName: workflow.name,
        success: false,
        cancelled: false,
        invalid: true,
        blockedReason: summary.invalidReasons.join(" "),
        steps: summary.steps.map((step) => ({
          stepId: step.id,
          actionId: step.actionId,
          actionName: step.action?.name,
          continueOnError: step.continueOnError,
          reason: step.reason,
        })),
      };
    }

    if (summary.steps.length === 0) {
      return {
        workflowId: workflow.id,
        workflowName: workflow.name,
        success: false,
        cancelled: false,
        invalid: false,
        blockedReason: "Workflow has no steps.",
        steps: [],
      };
    }

    const steps: WorkflowRunStepResult[] = [];
    for (const step of summary.steps) {
      const action = step.action as Action;
      const result = await this.actionExecutionService.executeWorkflowAction(action);

      if (!result) {
        return {
          workflowId: workflow.id,
          workflowName: workflow.name,
          success: false,
          cancelled: true,
          invalid: false,
          blockedReason: `Workflow "${workflow.name}" was cancelled.`,
          steps,
        };
      }

      steps.push({
        stepId: step.id,
        actionId: step.actionId,
        actionName: action.name,
        continueOnError: step.continueOnError,
        exitCode: result.exitCode,
      });

      if (result.exitCode !== 0 && !step.continueOnError) {
        return {
          workflowId: workflow.id,
          workflowName: workflow.name,
          success: false,
          cancelled: false,
          invalid: false,
          blockedReason: `Workflow "${workflow.name}" stopped after "${action.name}" failed.`,
          steps,
        };
      }
    }

    return {
      workflowId: workflow.id,
      workflowName: workflow.name,
      success: true,
      cancelled: false,
      invalid: false,
      steps,
    };
  }
}
