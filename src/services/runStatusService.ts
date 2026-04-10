import * as vscode from "vscode";
import type { Action } from "../types";

export interface RunStatusEntry {
  exitCode: number;
  timestamp: number;
}

export interface RunStatusEvent {
  action: Action;
  status: RunStatusEntry;
}

export class RunStatusService {
  private readonly statuses = new Map<string, RunStatusEntry>();
  private readonly eventEmitter = new vscode.EventEmitter<RunStatusEvent>();

  public readonly onDidChange = this.eventEmitter.event;

  public report(action: Action, status: RunStatusEntry): void {
    this.statuses.set(action.name, status);
    this.eventEmitter.fire({ action, status });
  }

  public toObject(): Record<string, RunStatusEntry> {
    return Object.fromEntries(this.statuses);
  }

  public clear(): void {
    this.statuses.clear();
  }
}
