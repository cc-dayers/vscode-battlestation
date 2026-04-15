import * as vscode from "vscode";
import { BattlestationViewProvider } from "./view";
import { ConfigService } from "./services/configService";
import { RunStatusService } from "./services/runStatusService";
import { ActionExecutionService } from "./services/actionExecutionService";
import { WorkflowExecutionService } from "./services/workflowExecutionService";
import { WorkflowBuilderPanel } from "./workflowBuilderPanel";

const WORKFLOWS_EXPERIMENT_KEY = "experimental.workflows";
const WORKFLOWS_EXPERIMENT_CONTEXT = "battlestation.experimental.workflows";

export function activate(context: vscode.ExtensionContext) {
  const configService = new ConfigService(context);
  const runStatusService = new RunStatusService();
  const actionExecutionService = new ActionExecutionService(runStatusService);
  const workflowExecutionService = new WorkflowExecutionService(configService, actionExecutionService);
  const workflowBuilderPanel = new WorkflowBuilderPanel(context, configService, workflowExecutionService);
  const provider = new BattlestationViewProvider(
    context,
    configService,
    actionExecutionService,
    workflowExecutionService,
    workflowBuilderPanel,
    runStatusService
  );

  const syncExperimentalContexts = () => {
    const workflowsEnabled = vscode.workspace
      .getConfiguration("battlestation")
      .get<boolean>(WORKFLOWS_EXPERIMENT_KEY, false);

    void vscode.commands.executeCommand(
      "setContext",
      WORKFLOWS_EXPERIMENT_CONTEXT,
      workflowsEnabled
    );

    if (!workflowsEnabled) {
      workflowBuilderPanel.close();
    }
  };

  syncExperimentalContexts();

  context.subscriptions.push(
    provider,
    workflowBuilderPanel,
    vscode.window.registerWebviewViewProvider("battlestation.view", provider),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(`battlestation.${WORKFLOWS_EXPERIMENT_KEY}`)) {
        syncExperimentalContexts();
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.open", () => {
      vscode.commands.executeCommand("battlestation.view.focus");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.openWorkflowBuilder", (workflowId?: string) => {
      void provider.openWorkflowBuilder(workflowId);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.runWorkflow", (workflowId?: string) => {
      void provider.runWorkflow(workflowId);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.refresh", () => {
      provider.syncAndRefresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.addItem", () => {
      provider.showAddActionForm();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.addGroup", () => {
      provider.showAddGroupForm();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.openSettings", () => {
      provider.showSettingsForm();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.toggleSearch", () => {
      provider.toggleSearch();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.toggleHidden", () => {
      provider.toggleShowHidden();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.hideHidden", () => {
      provider.toggleShowHidden();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.collapseAllGroups", () => {
      provider.collapseAllGroups();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.expandAllGroups", () => {
      provider.expandAllGroups();
    })
  );
}

export function deactivate() { }

