import * as vscode from "vscode";
import type { Config, Workflow } from "./types";
import { ConfigService } from "./services/configService";
import { WorkflowExecutionService } from "./services/workflowExecutionService";
import { renderWorkflowBuilderView } from "./views";
import { getNonce } from "./templates/nonce";
import { buildWorkflowSummaries, findWorkflow, getEligibleWorkflowActionStats } from "./utils/workflows";
import { createEntityId } from "./utils/id";
import codiconCssTemplate from "../media/codicon.css";

export class WorkflowBuilderPanel implements vscode.Disposable {
  private panel?: vscode.WebviewPanel;
  private activeWorkflowId?: string;
  private isInitialized = false;
  private cachedCodiconStyles?: string;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly configService: ConfigService,
    private readonly workflowExecutionService: WorkflowExecutionService
  ) {
    this.disposables.push(
      this.configService.onDidChange(() => {
        void this.refresh();
      })
    );
  }

  public dispose(): void {
    this.disposables.forEach((disposable) => disposable.dispose());
    this.panel?.dispose();
  }

  public close(): void {
    this.panel?.dispose();
  }

  public async open(workflowId?: string): Promise<void> {
    const status = await this.configService.getConfigStatus();
    if (status.exists && !status.valid) {
      vscode.window.showErrorMessage("Fix battle.json before opening the workflow builder.");
      return;
    }

    if (!status.exists) {
      await this.configService.writeConfig({
        actions: [],
        icons: ConfigService.defaultIcons,
        workflows: [],
      });
    }

    this.activeWorkflowId = workflowId ?? this.activeWorkflowId;

    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Active, true);
      await this.refresh();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "battlestation.workflowBuilder",
      "Battlestation Workflow Builder",
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, "media")],
      }
    );

    this.panel.onDidDispose(() => {
      this.panel = undefined;
      this.isInitialized = false;
      this.cachedCodiconStyles = undefined;
    });

    this.panel.webview.onDidReceiveMessage((message) => {
      void this.handleMessage(message);
    });

    await this.refresh();
  }

  private async handleMessage(message: any): Promise<void> {
    switch (message.command) {
      case "createWorkflow":
        await this.createWorkflow();
        break;
      case "renameWorkflow":
        await this.renameWorkflow(message.workflowId, message.name);
        break;
      case "deleteWorkflow":
        await this.deleteWorkflow(message.workflowId);
        break;
      case "addWorkflowStep":
        await this.addWorkflowStep(message.workflowId, message.actionId);
        break;
      case "removeWorkflowStep":
        await this.removeWorkflowStep(message.workflowId, message.stepId);
        break;
      case "moveWorkflowStep":
        await this.moveWorkflowStep(message.workflowId, message.stepId, message.direction);
        break;
      case "setWorkflowStepContinueOnError":
        await this.setWorkflowStepContinueOnError(message.workflowId, message.stepId, message.continueOnError === true);
        break;
      case "runWorkflow":
        await this.runWorkflow(message.workflowId);
        break;
      default:
        break;
    }
  }

  private async refresh(): Promise<void> {
    if (!this.panel) {
      return;
    }

    const config = await this.configService.readConfig();
    const activeWorkflowId = this.resolveActiveWorkflowId(config.workflows);
    const actionStats = getEligibleWorkflowActionStats(config.actions);
    const data = {
      actions: actionStats.actions,
      eligibleActionCount: actionStats.eligibleActionCount,
      totalActionCount: actionStats.totalActionCount,
      workflows: buildWorkflowSummaries(config.workflows, config.actions),
      activeWorkflowId,
    };

    if (!this.isInitialized) {
      this.isInitialized = true;
      this.panel.webview.html = renderWorkflowBuilderView({
        cspSource: this.panel.webview.cspSource,
        nonce: getNonce(),
        codiconStyles: this.getCodiconStyles(),
        initialData: data,
        scriptUri: this.panel.webview.asWebviewUri(
          vscode.Uri.joinPath(this.context.extensionUri, "media", "workflowBuilder.js")
        ).toString(),
        cssUri: this.panel.webview.asWebviewUri(
          vscode.Uri.joinPath(this.context.extensionUri, "media", "output.css")
        ).toString(),
      });
      return;
    }

    await this.panel.webview.postMessage({ type: "update", data });
  }

  private resolveActiveWorkflowId(workflows: Workflow[] | undefined): string | undefined {
    const availableWorkflows = workflows || [];
    if (availableWorkflows.length === 0) {
      this.activeWorkflowId = undefined;
      return undefined;
    }

    const existing = this.activeWorkflowId
      ? findWorkflow(availableWorkflows, this.activeWorkflowId)
      : undefined;

    const resolved = existing?.id ?? availableWorkflows[0].id;
    this.activeWorkflowId = resolved;
    return resolved;
  }

  private async updateConfig(mutator: (config: Config) => void | Promise<void>): Promise<void> {
    const config = await this.configService.readConfig();
    await mutator(config);
    await this.configService.writeConfig(config);
  }

  private async createWorkflow(): Promise<void> {
    await this.updateConfig((config) => {
      const workflows = config.workflows || [];
      const nextWorkflow: Workflow = {
        id: createEntityId("workflow"),
        name: `Workflow ${workflows.length + 1}`,
        steps: [],
      };
      config.workflows = [...workflows, nextWorkflow];
      this.activeWorkflowId = nextWorkflow.id;
    });
  }

  private async renameWorkflow(workflowId: string, name: string): Promise<void> {
    await this.updateConfig((config) => {
      const workflow = findWorkflow(config.workflows, workflowId);
      if (!workflow) {
        return;
      }
      workflow.name = name.trim() || "Untitled Workflow";
    });
  }

  private async deleteWorkflow(workflowId: string): Promise<void> {
    await this.updateConfig((config) => {
      config.workflows = (config.workflows || []).filter((workflow) => workflow.id !== workflowId);
      if (this.activeWorkflowId === workflowId) {
        this.activeWorkflowId = config.workflows[0]?.id;
      }
    });
  }

  private async addWorkflowStep(workflowId: string, actionId: string): Promise<void> {
    await this.updateConfig((config) => {
      const workflow = findWorkflow(config.workflows, workflowId);
      if (!workflow) {
        return;
      }

      workflow.steps.push({
        id: createEntityId("step"),
        actionId,
      });
      this.activeWorkflowId = workflow.id;
    });
  }

  private async removeWorkflowStep(workflowId: string, stepId: string): Promise<void> {
    await this.updateConfig((config) => {
      const workflow = findWorkflow(config.workflows, workflowId);
      if (!workflow) {
        return;
      }

      workflow.steps = workflow.steps.filter((step) => step.id !== stepId);
      this.activeWorkflowId = workflow.id;
    });
  }

  private async moveWorkflowStep(workflowId: string, stepId: string, direction: "up" | "down"): Promise<void> {
    await this.updateConfig((config) => {
      const workflow = findWorkflow(config.workflows, workflowId);
      if (!workflow) {
        return;
      }

      const index = workflow.steps.findIndex((step) => step.id === stepId);
      if (index === -1) {
        return;
      }

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= workflow.steps.length) {
        return;
      }

      const steps = [...workflow.steps];
      [steps[index], steps[targetIndex]] = [steps[targetIndex], steps[index]];
      workflow.steps = steps;
      this.activeWorkflowId = workflow.id;
    });
  }

  private async setWorkflowStepContinueOnError(workflowId: string, stepId: string, continueOnError: boolean): Promise<void> {
    await this.updateConfig((config) => {
      const workflow = findWorkflow(config.workflows, workflowId);
      if (!workflow) {
        return;
      }

      const step = workflow.steps.find((candidate) => candidate.id === stepId);
      if (!step) {
        return;
      }

      step.continueOnError = continueOnError ? true : undefined;
      this.activeWorkflowId = workflow.id;
    });
  }

  private async runWorkflow(workflowId: string): Promise<void> {
    if (!this.panel) {
      return;
    }

    await this.panel.webview.postMessage({ type: "workflowRunState", workflowId });
    try {
      const result = await this.workflowExecutionService.runWorkflowById(workflowId);
      if (result.success) {
        vscode.window.showInformationMessage(`Workflow "${result.workflowName}" completed successfully.`);
      } else if (result.invalid || result.blockedReason) {
        vscode.window.showWarningMessage(result.blockedReason || `Workflow "${result.workflowName}" could not run.`);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to run workflow: ${(error as Error).message}`);
    } finally {
      await this.panel.webview.postMessage({ type: "workflowRunState", workflowId: undefined });
    }
  }

  private getCodiconStyles(): string {
    if (!this.panel) {
      return "";
    }

    if (this.cachedCodiconStyles) {
      return this.cachedCodiconStyles;
    }

    const codiconFontUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "codicon.ttf")
    );
    this.cachedCodiconStyles = codiconCssTemplate.replace(
      /src:\s*url\([^)]+\)(\s*format\([^)]+\))?/g,
      `src: url("${codiconFontUri}") format("truetype")`
    );
    return this.cachedCodiconStyles;
  }
}
