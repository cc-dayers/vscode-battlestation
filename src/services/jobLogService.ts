import * as vscode from "vscode";
import type {
  JobInputMap,
  JobRunRecord,
  JobRunTargetKind,
  ScheduledWorkKind,
} from "../types";
import { createEntityId } from "../utils/id";

export interface JobRunWriteRequest {
  jobId: string;
  jobName: string;
  sourceKind?: ScheduledWorkKind;
  targetKind: JobRunTargetKind;
  targetLabel?: string;
  providerId?: string;
  startedAt: number;
  finishedAt: number;
  outcome: JobRunRecord["outcome"];
  exitCode?: number;
  blockedReason?: string;
  inputs?: JobInputMap;
}

export class JobLogService {
  constructor(private readonly workspaceRootOverride?: vscode.Uri) {}

  public async writeRun(request: JobRunWriteRequest): Promise<JobRunRecord> {
    const workspaceRoot = this.getWorkspaceRoot();
    if (!workspaceRoot) {
      throw new Error("Cannot write job logs without an open workspace.");
    }

    const runId = createEntityId("run");
    const jobsDir = this.getJobsDirUri(workspaceRoot);
    const logsDir = vscode.Uri.joinPath(jobsDir, "logs", this.toSafeSegment(request.jobId));
    const logUri = vscode.Uri.joinPath(logsDir, `${runId}.log`);
    const logPath = this.toRelativeWorkspacePath(workspaceRoot, logUri);

    await this.ensureDir(jobsDir);
    await this.ensureDir(logsDir);

    const lines = [
      `Job: ${request.jobName}`,
      `Run ID: ${runId}`,
      `Outcome: ${request.outcome}`,
      `Started: ${new Date(request.startedAt).toISOString()}`,
      `Finished: ${new Date(request.finishedAt).toISOString()}`,
      `Target: ${request.targetKind}${request.targetLabel ? ` (${request.targetLabel})` : ""}`,
      `Exit Code: ${request.exitCode ?? "n/a"}`,
    ];

    if (request.blockedReason) {
      lines.push(`Blocked Reason: ${request.blockedReason}`);
    }

    if (request.inputs && Object.keys(request.inputs).length > 0) {
      lines.push("Inputs:");
      for (const [key, value] of Object.entries(request.inputs)) {
        lines.push(`  ${key}: ${value}`);
      }
    }

    const logLine = request.blockedReason ? 8 : 3;
    await vscode.workspace.fs.writeFile(logUri, Buffer.from(lines.join("\n") + "\n", "utf-8"));

    const record: JobRunRecord = {
      runId,
      jobId: request.jobId,
      sourceKind:
        request.sourceKind ?? (request.targetKind === "providerSync" ? "providerSync" : "job"),
      jobName: request.jobName,
      targetKind: request.targetKind,
      targetLabel: request.targetLabel,
      providerId: request.providerId,
      startedAt: request.startedAt,
      finishedAt: request.finishedAt,
      exitCode: request.exitCode,
      outcome: request.outcome,
      blockedReason: request.blockedReason,
      logPath,
      logLine,
      inputs: request.inputs,
    };

    await this.appendRunRecord(record);
    return record;
  }

  public async getLatestRun(jobId: string): Promise<JobRunRecord | undefined> {
    const runs = await this.readRunRecords();
    const filtered = runs
      .filter((record) => record.jobId === jobId)
      .sort((left, right) => right.finishedAt - left.finishedAt);

    return filtered[0];
  }

  public async getRecentRuns(jobId: string, limit: number): Promise<JobRunRecord[]> {
    const cap = Math.min(limit, 100);
    const all = await this.readRunRecords();
    return all
      .filter((record) => record.jobId === jobId)
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, cap);
  }

  public async resolveLogUri(logPath: string): Promise<vscode.Uri | undefined> {
    const workspaceRoot = this.getWorkspaceRoot();
    if (!workspaceRoot) {
      return undefined;
    }

    const cleanPath = logPath.replace(/^\/+/, "");
    const parts = cleanPath.split("/").filter(Boolean);
    return parts.reduce((uri, segment) => vscode.Uri.joinPath(uri, segment), workspaceRoot);
  }

  private getWorkspaceRoot(): vscode.Uri | undefined {
    return this.workspaceRootOverride ?? vscode.workspace.workspaceFolders?.[0]?.uri;
  }

  private getJobsDirUri(workspaceRoot: vscode.Uri): vscode.Uri {
    return vscode.Uri.joinPath(workspaceRoot, ".vscode", "battle.jobs");
  }

  private getRunsUri(workspaceRoot: vscode.Uri): vscode.Uri {
    return vscode.Uri.joinPath(this.getJobsDirUri(workspaceRoot), "runs.jsonl");
  }

  private async appendRunRecord(record: JobRunRecord): Promise<void> {
    const workspaceRoot = this.getWorkspaceRoot();
    if (!workspaceRoot) {
      return;
    }

    const runsUri = this.getRunsUri(workspaceRoot);
    await this.ensureDir(vscode.Uri.joinPath(workspaceRoot, ".vscode", "battle.jobs"));

    let existing = "";
    try {
      const bytes = await vscode.workspace.fs.readFile(runsUri);
      existing = Buffer.from(bytes).toString("utf-8");
    } catch {
      existing = "";
    }

    const line = `${JSON.stringify(record)}\n`;
    await vscode.workspace.fs.writeFile(runsUri, Buffer.from(existing + line, "utf-8"));
  }

  private async readRunRecords(): Promise<JobRunRecord[]> {
    const workspaceRoot = this.getWorkspaceRoot();
    if (!workspaceRoot) {
      return [];
    }

    const runsUri = this.getRunsUri(workspaceRoot);
    try {
      const bytes = await vscode.workspace.fs.readFile(runsUri);
      const content = Buffer.from(bytes).toString("utf-8");
      return content
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .flatMap((line) => {
          try {
            return [JSON.parse(line) as JobRunRecord];
          } catch {
            return [];
          }
        });
    } catch {
      return [];
    }
  }

  private async ensureDir(uri: vscode.Uri): Promise<void> {
    try {
      await vscode.workspace.fs.createDirectory(uri);
    } catch {
      // Directory already exists.
    }
  }

  private toRelativeWorkspacePath(workspaceRoot: vscode.Uri, uri: vscode.Uri): string {
    const rootPath = workspaceRoot.path.replace(/\/+$/, "");
    const fullPath = uri.path;
    if (fullPath.startsWith(rootPath)) {
      return fullPath.slice(rootPath.length + 1);
    }
    return uri.path.replace(/^\/+/, "");
  }

  private toSafeSegment(value: string): string {
    return value.replace(/[^a-zA-Z0-9._-]/g, "-");
  }
}