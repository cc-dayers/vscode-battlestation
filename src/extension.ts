import * as vscode from "vscode";
import { BattlestationViewProvider } from "./view";
import { ConfigService } from "./services/configService";
import { RunStatusService } from "./services/runStatusService";
import { ActionExecutionService } from "./services/actionExecutionService";
import { WorkflowExecutionService } from "./services/workflowExecutionService";
import { WorkflowBuilderPanel } from "./workflowBuilderPanel";

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

  context.subscriptions.push(
    provider,
    workflowBuilderPanel,
    vscode.window.registerWebviewViewProvider("battlestation.view", provider)
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

