import * as vscode from "vscode";
import { BattlestationViewProvider } from "./view";
import { TodoPanelProvider } from "./todosView";
import { ConfigService } from "./services/configService";
import { TodosService } from "./services/todosService";

export function activate(context: vscode.ExtensionContext) {
  const configService = new ConfigService(context);
  const todosService = new TodosService(context);
  const provider = new BattlestationViewProvider(context, configService, todosService);
  const todosProvider = new TodoPanelProvider(context, todosService, provider);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("battlestation.view", provider)
  );

  // Register todos view only if experimental feature is enabled
  const config = vscode.workspace.getConfiguration('battlestation');
  if (config.get<boolean>('experimental.enableTodos', false)) {
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider("battlestation.todosView", todosProvider)
    );
  }

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.open", () => {
      vscode.commands.executeCommand("battlestation.view.focus");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.openTodos", () => {
      vscode.commands.executeCommand("battlestation.todosView.focus");
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
}

export function deactivate() {}
