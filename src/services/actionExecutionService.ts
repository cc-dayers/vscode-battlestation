import * as vscode from "vscode";
import type { Action } from "../types";
import { RunStatusService, type RunStatusEntry } from "./runStatusService";
import { isWorkflowEligibleAction } from "../utils/workflows";

export class ActionExecutionService {
  constructor(private readonly runStatusService: RunStatusService) {}

  public async executeStandaloneAction(item: Action): Promise<void> {
    try {
      const resolvedItem = await this.resolveParams(item);
      if (!resolvedItem) {
        return;
      }

      switch (resolvedItem.type) {
        case "launch":
          await this.executeLaunchConfig(resolvedItem.command);
          break;
        case "vscode":
        case "task":
          await this.executeVSCodeCommand(resolvedItem.command);
          break;
        default:
          await this.executeShellCommandStandalone(resolvedItem);
          break;
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to execute: ${(error as Error).message}`);
    }
  }

  public async executeWorkflowAction(item: Action): Promise<RunStatusEntry | undefined> {
    const resolvedItem = await this.resolveParams(item);
    if (!resolvedItem) {
      return undefined;
    }

    if (!isWorkflowEligibleAction(resolvedItem)) {
      throw new Error(`Action type "${resolvedItem.type}" is not supported in workflows.`);
    }

    return this.executeShellCommandBlocking(resolvedItem);
  }

  private async resolveParams(item: Action): Promise<Action | undefined> {
    if (!item.params || item.params.length === 0) return item;

    let cmd = item.command;
    for (const param of item.params) {
      let value: string | undefined;
      if (param.options && param.options.length > 0) {
        value = await vscode.window.showQuickPick(param.options, { title: param.prompt });
      } else {
        value = await vscode.window.showInputBox({ prompt: param.prompt, value: param.default ?? "" });
      }
      if (value === undefined) return undefined;
      cmd = cmd.replaceAll(`\${${param.name}}`, value);
    }

    return { ...item, command: cmd };
  }

  private async executeLaunchConfig(command: string): Promise<void> {
    const [, configName] = command.split("|");
    if (!configName) {
      throw new Error("No launch configuration name specified");
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    await vscode.debug.startDebugging(workspaceFolder, configName.trim());
  }

  private async executeVSCodeCommand(command: string): Promise<void> {
    const [cmd, ...args] = command.split("|");
    if (args.length > 0) {
      await vscode.commands.executeCommand(cmd.trim(), ...args);
    } else {
      await vscode.commands.executeCommand(cmd.trim());
    }
  }

  private createTerminal(item: Action): vscode.Terminal {
    const wsConfig = vscode.workspace.getConfiguration("battlestation");
    const shells = wsConfig.get<Record<string, string>>("shells", {});
    const shellEnv = shells[item.type];

    const terminalOptions: vscode.TerminalOptions = {
      name: item.name,
      cwd: item.cwd || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
    };

    if (shellEnv) {
      terminalOptions.shellPath = shellEnv;
    }

    const terminal = vscode.window.createTerminal(terminalOptions);
    terminal.show();
    return terminal;
  }

  private buildRunStatus(item: Action, exitCode: number): RunStatusEntry {
    const status = {
      exitCode,
      timestamp: Date.now(),
    };
    this.runStatusService.report(item, status);
    return status;
  }

  private async executeShellCommandStandalone(item: Action): Promise<void> {
    const terminal = this.createTerminal(item);

    let reported = false;
    const reportStatus = (exitCode: number) => {
      if (reported) return;
      reported = true;
      this.buildRunStatus(item, exitCode);
    };

    const runViaIntegration = (integration: vscode.TerminalShellIntegration) => {
      const execution = integration.executeCommand(item.command);
      const execEndListener = vscode.window.onDidEndTerminalShellExecution((event) => {
        if (event.execution !== execution) return;
        execEndListener.dispose();
        reportStatus(event.exitCode ?? -1);
      });
    };

    if (terminal.shellIntegration) {
      runViaIntegration(terminal.shellIntegration);
    } else {
      let commandSent = false;
      let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

      const integrationListener = vscode.window.onDidChangeTerminalShellIntegration(({ terminal: changedTerminal, shellIntegration }) => {
        if (changedTerminal !== terminal) return;
        integrationListener.dispose();
        if (fallbackTimer) {
          clearTimeout(fallbackTimer);
        }
        commandSent = true;
        runViaIntegration(shellIntegration);
      });

      fallbackTimer = setTimeout(() => {
        integrationListener.dispose();
        if (!commandSent) {
          commandSent = true;
          terminal.sendText(item.command);
        }
      }, 2000);
    }

    const closeListener = vscode.window.onDidCloseTerminal((closedTerminal) => {
      if (closedTerminal !== terminal) return;
      closeListener.dispose();
      reportStatus(closedTerminal.exitStatus?.code ?? -1);
    });
  }

  private async executeShellCommandBlocking(item: Action): Promise<RunStatusEntry> {
    const terminal = this.createTerminal(item);

    return new Promise<RunStatusEntry>((resolve) => {
      let finished = false;
      let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
      let integrationListener: vscode.Disposable | undefined;
      let closeListener: vscode.Disposable | undefined;
      let execEndListener: vscode.Disposable | undefined;

      const disposeListeners = () => {
        if (fallbackTimer) {
          clearTimeout(fallbackTimer);
        }
        integrationListener?.dispose();
        closeListener?.dispose();
        execEndListener?.dispose();
      };

      const finish = (exitCode: number) => {
        if (finished) return;
        finished = true;
        disposeListeners();
        resolve(this.buildRunStatus(item, exitCode));
      };

      const runViaIntegration = (integration: vscode.TerminalShellIntegration) => {
        const execution = integration.executeCommand(item.command);
        execEndListener = vscode.window.onDidEndTerminalShellExecution((event) => {
          if (event.execution !== execution) return;
          finish(event.exitCode ?? -1);
        });
      };

      closeListener = vscode.window.onDidCloseTerminal((closedTerminal) => {
        if (closedTerminal !== terminal) return;
        finish(closedTerminal.exitStatus?.code ?? -1);
      });

      if (terminal.shellIntegration) {
        runViaIntegration(terminal.shellIntegration);
        return;
      }

      integrationListener = vscode.window.onDidChangeTerminalShellIntegration(({ terminal: changedTerminal, shellIntegration }) => {
        if (changedTerminal !== terminal) return;
        integrationListener?.dispose();
        if (fallbackTimer) {
          clearTimeout(fallbackTimer);
          fallbackTimer = undefined;
        }
        runViaIntegration(shellIntegration);
      });

      fallbackTimer = setTimeout(() => {
        vscode.window.showWarningMessage(
          `Workflow step "${item.name}" could not start because shell integration was unavailable.`
        );
        finish(1);
      }, 2000);
    });
  }
}
