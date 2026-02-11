import * as vscode from "vscode";
import { BattlestationViewProvider } from "./view";

export function activate(context: vscode.ExtensionContext) {
  const provider = new BattlestationViewProvider(context);

  context.subscriptions.push(
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
      provider.showAddItemForm();
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
}

export function deactivate() {}
