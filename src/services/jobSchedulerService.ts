import * as vscode from "vscode";
import cron, { type ScheduledTask } from "node-cron";
import type {
  Action,
  BattleProvider,
  Config,
  JobDefinition,
  JobRuntimeSnapshot,
  JobRuntimeStatus,
  ScheduledWorkKind,
  ScheduledWorkScheduleKind,
} from "../types";
import { ActionExecutionService } from "./actionExecutionService";
import { JobLogService } from "./jobLogService";
import {
  WorkflowExecutionService,
  type WorkflowRunResult,
} from "./workflowExecutionService";
import { ConfigService } from "./configService";

const LAST_HYDRATED_AT_KEY = "battlestation.jobs.lastHydratedAt";
const PAUSED_PROVIDER_SYNC_IDS_KEY = "battlestation.providerSync.pausedIds";
const PROVIDER_SYNC_JOB_ID_PREFIX = "provider-sync:";

interface ScheduledWorkHandle {
  stop(): void;
  destroy(): void;
  getNextRunAt(): number | undefined;
}

interface ScheduledWorkBase {
  sourceKind: ScheduledWorkKind;
  jobId: string;
  name: string;
  schedule: string;
  scheduleKind: ScheduledWorkScheduleKind;
  enabled: boolean;
  paused: boolean;
  timezone?: string;
  intervalSeconds?: number;
  targetKind: JobRuntimeSnapshot["targetKind"];
  targetLabel?: string;
  providerId?: string;
  noOverlap: boolean;
}

interface JobScheduledWork extends ScheduledWorkBase {
  sourceKind: "job";
  definition: JobDefinition;
}

interface ProviderSyncScheduledWork extends ScheduledWorkBase {
  sourceKind: "providerSync";
  provider: BattleProvider;
  providerId: string;
  intervalSeconds: number;
}

type ScheduledWork = JobScheduledWork | ProviderSyncScheduledWork;

class CronScheduledWorkHandle implements ScheduledWorkHandle {
  constructor(private readonly task: ScheduledTask) {}

  public stop(): void {
    void this.task.stop();
  }

  public destroy(): void {
    void this.task.destroy();
  }

  public getNextRunAt(): number | undefined {
    return this.task.getNextRun()?.getTime();
  }
}

class IntervalScheduledWorkHandle implements ScheduledWorkHandle {
  private readonly timer: NodeJS.Timeout;
  private nextRunAt: number;

  constructor(intervalMs: number, callback: () => void) {
    this.nextRunAt = Date.now() + intervalMs;
    this.timer = setInterval(() => {
      this.nextRunAt = Date.now() + intervalMs;
      callback();
    }, intervalMs);
  }

  public stop(): void {
    clearInterval(this.timer);
  }

  public destroy(): void {
    clearInterval(this.timer);
  }

  public getNextRunAt(): number | undefined {
    return this.nextRunAt;
  }
}

export class JobSchedulerService implements vscode.Disposable {
  private readonly scheduledHandles = new Map<string, ScheduledWorkHandle>();
  private readonly runtimeSnapshots = new Map<string, JobRuntimeSnapshot>();
  private readonly runningJobs = new Set<string>();
  private readonly disposables: vscode.Disposable[] = [];
  private rehydrateTimeout?: NodeJS.Timeout;
  private hydratePromise?: Promise<void>;

  private readonly onDidUpdateEmitter = new vscode.EventEmitter<JobRuntimeSnapshot[]>();
  public readonly onDidUpdate = this.onDidUpdateEmitter.event;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly configService: ConfigService,
    private readonly actionExecutionService: ActionExecutionService,
    private readonly workflowExecutionService: WorkflowExecutionService,
    private readonly jobLogService: JobLogService
  ) {
    this.disposables.push(
      this.onDidUpdateEmitter,
      this.configService.onDidChange(() => {
        this.scheduleRehydrate();
      })
    );
  }

  public async hydrate(): Promise<void> {
    if (!this.hydratePromise) {
      this.hydratePromise = this.rebuildSchedules().finally(() => {
        this.hydratePromise = undefined;
      });
    }

    await this.hydratePromise;
  }

  public getSnapshots(): JobRuntimeSnapshot[] {
    return Array.from(this.runtimeSnapshots.values()).sort((left, right) =>
      left.name.localeCompare(right.name)
    );
  }

  public getSnapshot(jobId: string): JobRuntimeSnapshot | undefined {
    return this.runtimeSnapshots.get(jobId);
  }

  public async runJobNow(jobId: string): Promise<JobRuntimeSnapshot | undefined> {
    const config = await this.configService.readConfig();
    const job = (config.jobs || []).find((candidate) => candidate.id === jobId);
    if (job?.id) {
      await this.executeJob(job, config);
      return this.runtimeSnapshots.get(job.id);
    }

    const providerWork = this.findProviderSyncWork(config, jobId);
    if (!providerWork) {
      return undefined;
    }

    await this.executeProviderSync(providerWork.provider, config);
    return this.runtimeSnapshots.get(providerWork.jobId);
  }

  public async pauseJob(jobId: string): Promise<JobRuntimeSnapshot | undefined> {
    if (this.isProviderSyncJobId(jobId)) {
      if (!this.runtimeSnapshots.has(jobId)) {
        return undefined;
      }
      await this.setProviderSyncPaused(jobId, true);
      await this.hydrate();
      return this.getSnapshot(jobId);
    }

    await this.updateJob(jobId, (job) => {
      job.paused = true;
    });
    await this.hydrate();
    return this.getSnapshot(jobId);
  }

  public async resumeJob(jobId: string): Promise<JobRuntimeSnapshot | undefined> {
    if (this.isProviderSyncJobId(jobId)) {
      if (!this.runtimeSnapshots.has(jobId)) {
        return undefined;
      }
      await this.setProviderSyncPaused(jobId, false);
      await this.hydrate();
      return this.getSnapshot(jobId);
    }

    await this.updateJob(jobId, (job) => {
      job.paused = false;
    });
    await this.hydrate();
    return this.getSnapshot(jobId);
  }

  public async openLatestLog(jobId: string): Promise<boolean> {
    const snapshot = this.getSnapshot(jobId);
    if (!snapshot?.lastLogPath) {
      return false;
    }

    const logUri = await this.jobLogService.resolveLogUri(snapshot.lastLogPath);
    if (!logUri) {
      return false;
    }

    const document = await vscode.workspace.openTextDocument(logUri);
    const selectionLine = Math.max((snapshot.lastLogLine ?? 1) - 1, 0);
    await vscode.window.showTextDocument(document, {
      selection: new vscode.Range(selectionLine, 0, selectionLine, 0),
      preview: false,
    });
    return true;
  }

  public dispose(): void {
    if (this.rehydrateTimeout) {
      clearTimeout(this.rehydrateTimeout);
      this.rehydrateTimeout = undefined;
    }

    this.clearScheduledHandles();

    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }

  private scheduleRehydrate(): void {
    if (this.rehydrateTimeout) {
      clearTimeout(this.rehydrateTimeout);
    }

    this.rehydrateTimeout = setTimeout(() => {
      this.rehydrateTimeout = undefined;
      void this.hydrate();
    }, 100);
  }

  private async rebuildSchedules(): Promise<void> {
    const config = await this.configService.readConfig();
    const scheduledWork = this.getScheduledWork(config);
    const nextSnapshots = new Map<string, JobRuntimeSnapshot>();

    this.clearScheduledHandles();

    for (const work of scheduledWork) {
      const previous = this.runtimeSnapshots.get(work.jobId);
      const snapshot = await this.buildSnapshot(work, config, previous);
      nextSnapshots.set(work.jobId, snapshot);

      if (snapshot.status !== "scheduled") {
        continue;
      }

      const handle = this.createScheduledHandle(work);
      this.scheduledHandles.set(work.jobId, handle);
      nextSnapshots.set(work.jobId, {
        ...snapshot,
        nextRunAt: handle.getNextRunAt(),
      });
    }

    this.runtimeSnapshots.clear();
    for (const [jobId, snapshot] of nextSnapshots.entries()) {
      this.runtimeSnapshots.set(jobId, snapshot);
    }

    await this.context.workspaceState.update(LAST_HYDRATED_AT_KEY, Date.now());
    this.emitSnapshots();
  }

  private clearScheduledHandles(): void {
    for (const handle of this.scheduledHandles.values()) {
      handle.stop();
      handle.destroy();
    }
    this.scheduledHandles.clear();
  }

  private getScheduledWork(config: Config): ScheduledWork[] {
    const pausedProviderSyncIds = this.getPausedProviderSyncJobIds();
    const work: ScheduledWork[] = [];

    for (const job of config.jobs || []) {
      const jobId = typeof job.id === "string" ? job.id : "";
      work.push({
        sourceKind: "job",
        definition: job,
        jobId,
        name: job.name,
        schedule: job.schedule,
        scheduleKind: "cron",
        timezone: job.timezone,
        enabled: job.enabled !== false,
        paused: job.paused === true,
        targetKind: job.target.kind,
        targetLabel:
          job.target.kind === "workflow" ? job.target.workflowId : job.target.actionId,
        noOverlap: job.noOverlap === true,
      });
    }

    for (const provider of config.battleProviders || []) {
      const intervalSeconds = this.getProviderRefreshInterval(provider);
      if (!intervalSeconds || !provider.id) {
        continue;
      }

      const jobId = this.getProviderSyncJobId(provider.id);
      work.push({
        sourceKind: "providerSync",
        provider,
        jobId,
        name: this.getProviderSyncName(provider),
        schedule: this.formatIntervalSchedule(intervalSeconds),
        scheduleKind: "interval",
        intervalSeconds,
        enabled: provider.enabled !== false,
        paused: pausedProviderSyncIds.has(jobId),
        targetKind: "providerSync",
        targetLabel: provider.id,
        providerId: provider.id,
        noOverlap: true,
      });
    }

    return work;
  }

  private async buildSnapshot(
    work: ScheduledWork,
    config: Config,
    previous?: JobRuntimeSnapshot
  ): Promise<JobRuntimeSnapshot> {
    const snapshot: JobRuntimeSnapshot = {
      jobId: work.jobId,
      sourceKind: work.sourceKind,
      name: work.name,
      schedule: work.schedule,
      scheduleKind: work.scheduleKind,
      intervalSeconds: work.intervalSeconds,
      timezone: work.timezone,
      enabled: work.enabled,
      paused: work.paused,
      valid: true,
      status: work.enabled ? "scheduled" : "disabled",
      targetKind: work.targetKind,
      targetLabel: work.targetLabel,
      providerId: work.providerId,
      lastRunAt: previous?.lastRunAt,
      lastFinishedAt: previous?.lastFinishedAt,
      lastExitCode: previous?.lastExitCode,
      lastOutcome: previous?.lastOutcome,
      lastRunId: previous?.lastRunId,
      lastLogPath: previous?.lastLogPath,
      lastLogLine: previous?.lastLogLine,
      blockedReason: previous?.blockedReason,
    };

    if (work.jobId) {
      const latestRun = await this.jobLogService.getLatestRun(work.jobId);
      if (latestRun) {
        snapshot.lastRunAt = latestRun.startedAt;
        snapshot.lastFinishedAt = latestRun.finishedAt;
        snapshot.lastExitCode = latestRun.exitCode;
        snapshot.lastOutcome = latestRun.outcome;
        snapshot.lastRunId = latestRun.runId;
        snapshot.lastLogPath = latestRun.logPath;
        snapshot.lastLogLine = latestRun.logLine;
        snapshot.blockedReason = latestRun.blockedReason ?? snapshot.blockedReason;
      }
    }

    if (!work.jobId) {
      return {
        ...snapshot,
        valid: false,
        status: "invalid",
        blockedReason: "Scheduled work is missing an id.",
      };
    }

    if (!work.enabled) {
      return {
        ...snapshot,
        blockedReason: undefined,
      };
    }

    if (work.paused) {
      return {
        ...snapshot,
        status: "paused",
        blockedReason: undefined,
      };
    }

    if (work.sourceKind === "job") {
      if (!cron.validate(work.definition.schedule)) {
        return {
          ...snapshot,
          valid: false,
          status: "invalid",
          blockedReason: `Job "${work.definition.name}" has an invalid cron schedule.`,
        };
      }

      const blockedReason = await this.getJobBlockReason(work.definition, config);
      if (blockedReason) {
        return {
          ...snapshot,
          valid: false,
          status: "invalid",
          blockedReason,
        };
      }

      return {
        ...snapshot,
        blockedReason: undefined,
      };
    }

    if (!work.intervalSeconds || work.intervalSeconds <= 0) {
      return {
        ...snapshot,
        valid: false,
        status: "invalid",
        blockedReason: `Provider "${work.provider.name}" must have a positive refresh interval.`,
      };
    }

    return {
      ...snapshot,
      blockedReason: undefined,
    };
  }

  private createScheduledHandle(work: ScheduledWork): ScheduledWorkHandle {
    if (work.sourceKind === "job") {
      const task = cron.schedule(
        work.definition.schedule,
        () => {
          void this.runScheduledWork(work.jobId);
        },
        {
          name: work.definition.name,
          timezone: work.definition.timezone,
          noOverlap: work.definition.noOverlap === true,
          maxExecutions: work.definition.maxExecutions,
        }
      );

      return new CronScheduledWorkHandle(task);
    }

    return new IntervalScheduledWorkHandle(work.intervalSeconds * 1000, () => {
      void this.runScheduledWork(work.jobId);
    });
  }

  private async getJobBlockReason(job: JobDefinition, config: Config): Promise<string | undefined> {
    if (job.target.kind === "workflow") {
      const workflowId = job.target.workflowId || "";
      return this.workflowExecutionService.getScheduledRunBlockReason(workflowId, job.inputs);
    }

    const actionId = job.target.actionId || "";
    const action = config.actions.find((candidate) => candidate.id === actionId);
    if (!action) {
      return `Job "${job.name}" references an action that no longer exists.`;
    }

    return this.actionExecutionService.getScheduledExecutionBlockReason(action, job.inputs);
  }

  private async runScheduledWork(jobId: string): Promise<void> {
    const config = await this.configService.readConfig();
    const job = (config.jobs || []).find((candidate) => candidate.id === jobId);
    if (job?.id) {
      await this.executeJob(job, config);
      return;
    }

    const providerWork = this.findProviderSyncWork(config, jobId);
    if (!providerWork) {
      return;
    }

    await this.executeProviderSync(providerWork.provider, config);
  }

  private async executeJob(job: JobDefinition, config: Config): Promise<void> {
    const jobId = job.id || "";
    if (!jobId) {
      return;
    }

    const startedAt = Date.now();

    if (job.noOverlap === true && this.runningJobs.has(jobId)) {
      const finishedAt = Date.now();
      const blockedReason = `Job "${job.name}" skipped because it is already running.`;
      const runRecord = await this.jobLogService.writeRun({
        jobId,
        sourceKind: "job",
        jobName: job.name,
        targetKind: job.target.kind,
        targetLabel: job.target.kind === "workflow" ? job.target.workflowId : job.target.actionId,
        startedAt,
        finishedAt,
        outcome: "blocked",
        blockedReason,
        inputs: job.inputs,
      });
      this.patchSnapshot(jobId, {
        status: this.getIdleStatus(jobId),
        blockedReason,
        lastOutcome: "blocked",
        lastRunId: runRecord.runId,
        lastLogPath: runRecord.logPath,
        lastLogLine: runRecord.logLine,
        lastFinishedAt: finishedAt,
        nextRunAt: this.scheduledHandles.get(jobId)?.getNextRunAt(),
      });
      return;
    }

    this.runningJobs.add(jobId);
    this.patchSnapshot(jobId, {
      status: "running",
      blockedReason: undefined,
      lastRunAt: startedAt,
    });

    try {
      if (job.target.kind === "workflow") {
        const workflowId = job.target.workflowId || "";
        const result = await this.workflowExecutionService.runWorkflowById(workflowId, {
          interactive: false,
          inputs: job.inputs,
        });
        await this.applyWorkflowResult(job, result, startedAt);
        return;
      }

      const action = this.findAction(config, job);
      if (!action) {
        const finishedAt = Date.now();
        const blockedReason = `Job "${job.name}" references an action that no longer exists.`;
        const runRecord = await this.jobLogService.writeRun({
          jobId,
          sourceKind: "job",
          jobName: job.name,
          targetKind: job.target.kind,
          targetLabel: job.target.actionId,
          startedAt,
          finishedAt,
          outcome: "blocked",
          blockedReason,
          inputs: job.inputs,
        });
        this.patchSnapshot(jobId, {
          status: this.getIdleStatus(jobId, { valid: false }),
          valid: false,
          blockedReason,
          lastOutcome: "blocked",
          lastRunId: runRecord.runId,
          lastLogPath: runRecord.logPath,
          lastLogLine: runRecord.logLine,
          lastFinishedAt: finishedAt,
          nextRunAt: this.scheduledHandles.get(jobId)?.getNextRunAt(),
        });
        return;
      }

      const outcome = await this.actionExecutionService.executeScheduledAction(action, job.inputs);
      if (outcome.blockedReason) {
        const finishedAt = Date.now();
        const runRecord = await this.jobLogService.writeRun({
          jobId,
          sourceKind: "job",
          jobName: job.name,
          targetKind: job.target.kind,
          targetLabel: action.id,
          startedAt,
          finishedAt,
          outcome: "blocked",
          blockedReason: outcome.blockedReason,
          inputs: job.inputs,
        });
        this.patchSnapshot(jobId, {
          status: this.getIdleStatus(jobId),
          blockedReason: outcome.blockedReason,
          lastOutcome: "blocked",
          lastRunId: runRecord.runId,
          lastLogPath: runRecord.logPath,
          lastLogLine: runRecord.logLine,
          lastFinishedAt: finishedAt,
          nextRunAt: this.scheduledHandles.get(jobId)?.getNextRunAt(),
        });
        return;
      }

      if (outcome.status) {
        const finishedAt = Date.now();
        const runRecord = await this.jobLogService.writeRun({
          jobId,
          sourceKind: "job",
          jobName: job.name,
          targetKind: job.target.kind,
          targetLabel: action.id,
          startedAt,
          finishedAt,
          outcome: outcome.status.exitCode === 0 ? "success" : "failure",
          exitCode: outcome.status.exitCode,
          inputs: job.inputs,
        });
        this.patchSnapshot(jobId, {
          status: this.getIdleStatus(jobId),
          blockedReason: undefined,
          lastExitCode: outcome.status.exitCode,
          lastOutcome: outcome.status.exitCode === 0 ? "success" : "failure",
          lastRunId: runRecord.runId,
          lastLogPath: runRecord.logPath,
          lastLogLine: runRecord.logLine,
          lastFinishedAt: finishedAt,
          nextRunAt: this.scheduledHandles.get(jobId)?.getNextRunAt(),
        });
      }
    } catch (error) {
      const finishedAt = Date.now();
      const blockedReason = (error as Error).message;
      const runRecord = await this.jobLogService.writeRun({
        jobId,
        sourceKind: "job",
        jobName: job.name,
        targetKind: job.target.kind,
        targetLabel: job.target.kind === "workflow" ? job.target.workflowId : job.target.actionId,
        startedAt,
        finishedAt,
        outcome: "blocked",
        blockedReason,
        inputs: job.inputs,
      });
      this.patchSnapshot(jobId, {
        status: this.getIdleStatus(jobId),
        blockedReason,
        lastOutcome: "blocked",
        lastRunId: runRecord.runId,
        lastLogPath: runRecord.logPath,
        lastLogLine: runRecord.logLine,
        lastFinishedAt: finishedAt,
        nextRunAt: this.scheduledHandles.get(jobId)?.getNextRunAt(),
      });
    } finally {
      this.runningJobs.delete(jobId);
    }
  }

  private async executeProviderSync(provider: BattleProvider, config: Config): Promise<void> {
    const providerId = provider.id?.trim() || "";
    if (!providerId) {
      return;
    }

    const jobId = this.getProviderSyncJobId(providerId);
    const jobName = this.getProviderSyncName(provider);
    const startedAt = Date.now();

    if (this.runningJobs.has(jobId)) {
      const finishedAt = Date.now();
      const blockedReason = `Provider sync "${provider.name}" skipped because it is already running.`;
      const runRecord = await this.jobLogService.writeRun({
        jobId,
        sourceKind: "providerSync",
        jobName,
        targetKind: "providerSync",
        targetLabel: providerId,
        providerId,
        startedAt,
        finishedAt,
        outcome: "blocked",
        blockedReason,
      });
      this.patchSnapshot(jobId, {
        status: this.getIdleStatus(jobId),
        blockedReason,
        lastOutcome: "blocked",
        lastRunId: runRecord.runId,
        lastLogPath: runRecord.logPath,
        lastLogLine: runRecord.logLine,
        lastFinishedAt: finishedAt,
        nextRunAt: this.scheduledHandles.get(jobId)?.getNextRunAt(),
      });
      return;
    }

    this.runningJobs.add(jobId);
    this.patchSnapshot(jobId, {
      status: "running",
      blockedReason: undefined,
      lastRunAt: startedAt,
    });

    try {
      const finishedAt = Date.now();
      const runRecord = await this.jobLogService.writeRun({
        jobId,
        sourceKind: "providerSync",
        jobName,
        targetKind: "providerSync",
        targetLabel: providerId,
        providerId,
        startedAt,
        finishedAt,
        outcome: "success",
        exitCode: 0,
      });

      this.patchSnapshot(jobId, {
        status: this.getIdleStatus(jobId),
        blockedReason: undefined,
        lastOutcome: "success",
        lastExitCode: 0,
        lastRunId: runRecord.runId,
        lastLogPath: runRecord.logPath,
        lastLogLine: runRecord.logLine,
        lastFinishedAt: finishedAt,
        nextRunAt: this.scheduledHandles.get(jobId)?.getNextRunAt(),
      });
    } catch (error) {
      const finishedAt = Date.now();
      const blockedReason = (error as Error).message;
      const runRecord = await this.jobLogService.writeRun({
        jobId,
        sourceKind: "providerSync",
        jobName,
        targetKind: "providerSync",
        targetLabel: providerId,
        providerId,
        startedAt,
        finishedAt,
        outcome: "blocked",
        blockedReason,
      });
      this.patchSnapshot(jobId, {
        status: this.getIdleStatus(jobId),
        blockedReason,
        lastOutcome: "blocked",
        lastRunId: runRecord.runId,
        lastLogPath: runRecord.logPath,
        lastLogLine: runRecord.logLine,
        lastFinishedAt: finishedAt,
        nextRunAt: this.scheduledHandles.get(jobId)?.getNextRunAt(),
      });
    } finally {
      this.runningJobs.delete(jobId);
    }
  }

  private async applyWorkflowResult(
    job: JobDefinition,
    result: WorkflowRunResult,
    startedAt: number
  ): Promise<void> {
    const jobId = job.id || "";
    const exitCode = result.success ? 0 : 1;
    const finishedAt = Date.now();
    const runRecord = await this.jobLogService.writeRun({
      jobId,
      sourceKind: "job",
      jobName: job.name,
      targetKind: job.target.kind,
      targetLabel: job.target.workflowId,
      startedAt,
      finishedAt,
      outcome: result.success ? "success" : "failure",
      exitCode,
      blockedReason: result.blockedReason,
      inputs: job.inputs,
    });

    this.patchSnapshot(jobId, {
      status: this.getIdleStatus(jobId),
      blockedReason: result.blockedReason,
      lastExitCode: exitCode,
      lastOutcome: result.success ? "success" : "failure",
      lastRunId: runRecord.runId,
      lastLogPath: runRecord.logPath,
      lastLogLine: runRecord.logLine,
      lastFinishedAt: finishedAt,
      nextRunAt: this.scheduledHandles.get(jobId)?.getNextRunAt(),
    });
  }

  private async updateJob(jobId: string, mutator: (job: JobDefinition) => void): Promise<void> {
    const config = await this.configService.readConfig();
    const job = (config.jobs || []).find((candidate) => candidate.id === jobId);
    if (!job) {
      throw new Error(`Job "${jobId}" was not found.`);
    }

    mutator(job);
    await this.configService.writeConfig(config);
  }

  private findAction(config: Config, job: JobDefinition): Action | undefined {
    const actionId = job.target.actionId || "";
    return config.actions.find((candidate) => candidate.id === actionId);
  }

  private findProviderSyncWork(
    config: Config,
    jobId: string
  ): ProviderSyncScheduledWork | undefined {
    const providerId = this.parseProviderSyncJobId(jobId);
    if (!providerId) {
      return undefined;
    }

    const provider = (config.battleProviders || []).find(
      (candidate) => candidate.id === providerId
    );
    const intervalSeconds = provider ? this.getProviderRefreshInterval(provider) : undefined;
    if (!provider || !intervalSeconds || !provider.id) {
      return undefined;
    }

    return {
      sourceKind: "providerSync",
      provider,
      jobId,
      name: this.getProviderSyncName(provider),
      schedule: this.formatIntervalSchedule(intervalSeconds),
      scheduleKind: "interval",
      intervalSeconds,
      enabled: provider.enabled !== false,
      paused: this.getPausedProviderSyncJobIds().has(jobId),
      targetKind: "providerSync",
      targetLabel: provider.id,
      providerId: provider.id,
      noOverlap: true,
    };
  }

  private patchSnapshot(jobId: string, patch: Partial<JobRuntimeSnapshot>): void {
    const current = this.runtimeSnapshots.get(jobId);
    if (!current) {
      return;
    }

    this.runtimeSnapshots.set(jobId, {
      ...current,
      ...patch,
    });
    this.emitSnapshots();
  }

  private getIdleStatus(
    jobId: string,
    overrides: Partial<Pick<JobRuntimeSnapshot, "enabled" | "paused" | "valid">> = {}
  ): JobRuntimeStatus {
    const current = this.runtimeSnapshots.get(jobId);
    const enabled = overrides.enabled ?? current?.enabled ?? false;
    const paused = overrides.paused ?? current?.paused ?? false;
    const valid = overrides.valid ?? current?.valid ?? false;

    if (paused) {
      return "paused";
    }

    if (!enabled) {
      return "disabled";
    }

    if (!valid && !this.scheduledHandles.has(jobId)) {
      return "invalid";
    }

    return this.scheduledHandles.has(jobId) ? "scheduled" : valid ? "disabled" : "invalid";
  }

  private emitSnapshots(): void {
    this.onDidUpdateEmitter.fire(this.getSnapshots());
  }

  private getProviderRefreshInterval(provider: BattleProvider): number | undefined {
    if (
      typeof provider.refreshInterval !== "number" ||
      !Number.isFinite(provider.refreshInterval)
    ) {
      return undefined;
    }

    const intervalSeconds = Math.max(0, Math.floor(provider.refreshInterval));
    return intervalSeconds > 0 ? intervalSeconds : undefined;
  }

  private getProviderSyncJobId(providerId: string): string {
    return `${PROVIDER_SYNC_JOB_ID_PREFIX}${providerId}`;
  }

  private parseProviderSyncJobId(jobId: string): string | undefined {
    if (!this.isProviderSyncJobId(jobId)) {
      return undefined;
    }

    const providerId = jobId.slice(PROVIDER_SYNC_JOB_ID_PREFIX.length).trim();
    return providerId || undefined;
  }

  private isProviderSyncJobId(jobId: string): boolean {
    return jobId.startsWith(PROVIDER_SYNC_JOB_ID_PREFIX);
  }

  private getProviderSyncName(provider: BattleProvider): string {
    return `${provider.name} (Provider Sync)`;
  }

  private formatIntervalSchedule(intervalSeconds: number): string {
    if (intervalSeconds % 3600 === 0) {
      const hours = intervalSeconds / 3600;
      return `Every ${hours}h`;
    }

    if (intervalSeconds % 60 === 0) {
      const minutes = intervalSeconds / 60;
      return `Every ${minutes}m`;
    }

    return `Every ${intervalSeconds}s`;
  }

  private getPausedProviderSyncJobIds(): Set<string> {
    const stored = this.context.workspaceState.get<unknown>(PAUSED_PROVIDER_SYNC_IDS_KEY);
    if (!Array.isArray(stored)) {
      return new Set<string>();
    }

    return new Set(
      stored
        .filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
        .sort((left, right) => left.localeCompare(right))
    );
  }

  private async setProviderSyncPaused(jobId: string, paused: boolean): Promise<void> {
    const next = this.getPausedProviderSyncJobIds();
    if (paused) {
      next.add(jobId);
    } else {
      next.delete(jobId);
    }

    await this.context.workspaceState.update(
      PAUSED_PROVIDER_SYNC_IDS_KEY,
      Array.from(next.values()).sort((left, right) => left.localeCompare(right))
    );
  }
}