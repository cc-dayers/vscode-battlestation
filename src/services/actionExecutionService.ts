import * as path from "path";
import * as vscode from "vscode";
import type { Action, JobInputMap } from "../types";
import { RunStatusService, type RunStatusEntry } from "./runStatusService";
import { isWorkflowEligibleAction } from "../utils/workflows";

export class ActionExecutionService {
  constructor(private readonly runStatusService: RunStatusService) {}

  public async executeStandaloneAction(item: Action, inputs?: JobInputMap): Promise<void> {
    try {
      const resolvedItem = inputs
        ? this.resolveScheduledParams(item, inputs)
        : await this.resolveParams(item);
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

    switch (resolvedItem.type) {
      case "task":
        return this.executeTaskBlocking(resolvedItem);
      default:
        return this.executeShellCommandBlocking(resolvedItem);
    }
  }

  public getScheduledExecutionBlockReason(item: Action, inputs?: JobInputMap): string | undefined {
    if (!item.params || item.params.length === 0) {
      return undefined;
    }

    for (const param of item.params) {
      const value = inputs?.[param.name];
      if (typeof value !== "string" || value.length === 0) {
        return `Action "${item.name}" requires saved input "${param.name}".`;
      }
    }

    return undefined;
  }

  public async executeScheduledAction(
    item: Action,
    inputs?: JobInputMap
  ): Promise<{ cancelled: false; status?: RunStatusEntry; blockedReason?: string }> {
    const blockedReason = this.getScheduledExecutionBlockReason(item, inputs);
    if (blockedReason) {
      return { cancelled: false, blockedReason };
    }

    const resolvedItem = this.resolveScheduledParams(item, inputs);

    switch (resolvedItem.type) {
      case "launch":
        await this.executeLaunchConfig(resolvedItem.command);
        return { cancelled: false, status: this.buildRunStatus(item, 0) };
      case "vscode":
        await this.executeVSCodeCommand(resolvedItem.command);
        return { cancelled: false, status: this.buildRunStatus(item, 0) };
      case "task":
        return { cancelled: false, status: await this.executeTaskBlocking(resolvedItem) };
      default:
        return { cancelled: false, status: await this.executeShellCommandBlocking(resolvedItem) };
    }
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

  private resolveScheduledParams(item: Action, inputs?: JobInputMap): Action {
    if (!item.params || item.params.length === 0) {
      return item;
    }

    let cmd = item.command;
    for (const param of item.params) {
      const value = inputs?.[param.name] ?? "";
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

  private parseTaskLabel(command: string): string | undefined {
    const [cmd, ...labelParts] = command.split("|");
    if (cmd.trim() !== "workbench.action.tasks.runTask") {
      return undefined;
    }

    const label = labelParts.join("|").trim();
    return label.length > 0 ? label : undefined;
  }

  private normalizeFsPath(fsPath: string): string {
    const normalized = path.normalize(fsPath);
    return process.platform === "win32" ? normalized.toLowerCase() : normalized;
  }

  private isWorkspaceFolderTaskScope(
    scope: vscode.TaskScope | vscode.WorkspaceFolder | undefined
  ): scope is vscode.WorkspaceFolder {
    return typeof scope === "object" && scope !== null && "uri" in scope;
  }

  private async resolveTaskForAction(item: Action): Promise<vscode.Task> {
    const label = this.parseTaskLabel(item.command);
    if (!label) {
      throw new Error(`Task action "${item.name}" is missing a task label.`);
    }

    const tasks = await vscode.tasks.fetchTasks();
    let matches = tasks.filter((task) => task.name === label);

    if (matches.length === 0) {
      throw new Error(
        `Task "${label}" is not available in the current workspace. Regenerate your config if the task source changed.`
      );
    }

    if (item.cwd) {
      const normalizedCwd = this.normalizeFsPath(item.cwd);
      const scopedMatches = matches.filter(
        (task) =>
          this.isWorkspaceFolderTaskScope(task.scope) &&
          this.normalizeFsPath(task.scope.uri.fsPath) === normalizedCwd
      );

      if (scopedMatches.length === 1) {
        return scopedMatches[0];
      }

      if (scopedMatches.length > 1) {
        matches = scopedMatches;
      }
    } else {
      const workspaceMatches = matches.filter(
        (task) => task.scope === vscode.TaskScope.Workspace
      );

      if (workspaceMatches.length === 1) {
        return workspaceMatches[0];
      }

      if (workspaceMatches.length > 1) {
        matches = workspaceMatches;
      }
    }

    if (matches.length === 1) {
      return matches[0];
    }

    throw new Error(
      `Task "${label}" is ambiguous in the current workspace. Regenerate your config so the task keeps its folder context.`
    );
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

  private async executeTaskBlocking(item: Action): Promise<RunStatusEntry> {
    const task = await this.resolveTaskForAction(item);

    return new Promise<RunStatusEntry>((resolve, reject) => {
      let finished = false;
      let sawProcessExit = false;
      let startedExecution: vscode.TaskExecution | undefined;
      let startTaskListener: vscode.Disposable | undefined;
      let endTaskListener: vscode.Disposable | undefined;
      let endTaskProcessListener: vscode.Disposable | undefined;

      const disposeListeners = () => {
        startTaskListener?.dispose();
        endTaskListener?.dispose();
        endTaskProcessListener?.dispose();
      };

      const finish = (exitCode: number) => {
        if (finished) return;
        finished = true;
        disposeListeners();
        resolve(this.buildRunStatus(item, exitCode));
      };

      const fail = (error: unknown) => {
        if (finished) return;
        finished = true;
        disposeListeners();
        reject(error instanceof Error ? error : new Error(String(error)));
      };

      startTaskListener = vscode.tasks.onDidStartTask((event) => {
        if (event.execution.task !== task) return;
        startedExecution = event.execution;
      });

      endTaskProcessListener = vscode.tasks.onDidEndTaskProcess((event) => {
        if (!startedExecution || event.execution !== startedExecution) return;
        sawProcessExit = true;
        finish(event.exitCode ?? 0);
      });

      endTaskListener = vscode.tasks.onDidEndTask((event) => {
        if (!startedExecution || event.execution !== startedExecution) return;
        if (!sawProcessExit) {
          finish(0);
        }
      });

      void vscode.tasks.executeTask(task).then(
        (execution) => {
          startedExecution = execution;
        },
        (error) => {
          fail(error);
        }
      );
    });
  }
}
