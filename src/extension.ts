import * as vscode from "vscode";
import { BattlestationViewProvider } from "./view";
import { ConfigService } from "./services/configService";

export function activate(context: vscode.ExtensionContext) {
  const configService = new ConfigService(context);
  const provider = new BattlestationViewProvider(context, configService);

  context.subscriptions.push(
    provider,
    vscode.window.registerWebviewViewProvider("battlestation.view", provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.open", () => {
      vscode.commands.executeCommand("battlestation.view.focus");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.refresh", () => {
      provider.refresh();
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

