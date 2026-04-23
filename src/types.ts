/** Shared types used across services and views. */

export interface ActionParam {
  name: string;       // Variable name used in command string, e.g. "ENV"
  prompt: string;     // Label shown in VS Code input box
  default?: string;   // Pre-filled default value
  options?: string[]; // If present, show QuickPick instead of InputBox
}

export interface Action {
  id?: string;
  name: string;
  command: string;
  type: string;
  cwd?: string; // Execution context (root directory)
  group?: string;
  hidden?: boolean;
  workspace?: string; // Can be used as secondary grouping key
  workspaceColor?: string; // Color for the workspace badge
  params?: ActionParam[]; // Runtime input variables interpolated into command
  backgroundColor?: string;
  rowBackgroundColor?: string;
}

export interface WorkflowStep {
  id: string;
  actionId: string;
  continueOnError?: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
}

export interface JobTarget {
  kind: "action" | "workflow" | "providerSync";
  actionId?: string;
  workflowId?: string;
}

export type JobRunTargetKind = JobTarget["kind"];
export type ScheduledWorkKind = "job" | "providerSync";
export type ScheduledWorkScheduleKind = "cron" | "interval";

export interface JobInputMap {
  [key: string]: string;
}

export interface JobDefinition {
  id?: string;
  name: string;
  enabled?: boolean;
  paused?: boolean;
  schedule: string;
  timezone?: string;
  noOverlap?: boolean;
  maxExecutions?: number;
  target: JobTarget;
  inputs?: JobInputMap;
}

export type JobRuntimeStatus = "scheduled" | "running" | "paused" | "disabled" | "invalid";
export type JobLastOutcome = "success" | "failure" | "blocked" | "missed";

export interface JobRuntimeSnapshot {
  jobId: string;
  sourceKind?: ScheduledWorkKind;
  name: string;
  schedule: string;
  scheduleKind?: ScheduledWorkScheduleKind;
  intervalSeconds?: number;
  timezone?: string;
  enabled: boolean;
  paused: boolean;
  valid: boolean;
  status: JobRuntimeStatus;
  targetKind: JobRunTargetKind;
  targetLabel?: string;
  providerId?: string;
  nextRunAt?: number;
  lastRunAt?: number;
  lastFinishedAt?: number;
  lastExitCode?: number;
  lastOutcome?: JobLastOutcome;
  lastRunId?: string;
  lastLogPath?: string;
  lastLogLine?: number;
  blockedReason?: string;
}

export interface JobRunRecord {
  runId: string;
  jobId: string;
  sourceKind?: ScheduledWorkKind;
  jobName: string;
  targetKind: JobRunTargetKind;
  targetLabel?: string;
  providerId?: string;
  startedAt: number;
  finishedAt: number;
  exitCode?: number;
  outcome: JobLastOutcome;
  blockedReason?: string;
  logPath: string;
  logLine: number;
  inputs?: JobInputMap;
}

export interface IconMapping {
  type: string;
  icon: string;
}

export interface Group {
  name: string;
  icon?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  hidden?: boolean;
  secondaryGroupBy?: "workspace" | "type" | "none";
}

// --- Battles: external work items from CLI providers ---

export interface BattleProvider {
  id: string;
  name: string;
  command: string;
  cwd?: string;
  refreshInterval?: number;   // seconds, 0 = manual only
  icon?: string;              // codicon name or emoji
  color?: string;             // hex color
  enabled?: boolean;          // default true
}

export interface BattleAction {
  label: string;
  type: "url" | "shell" | "vscode";
  value: string;
}

export type BattleStatus = "active" | "done" | "blocked" | "dismissed";
export type BattlePriority = "critical" | "high" | "medium" | "low";

export interface Battle {
  id: string;
  title: string;
  description?: string;
  status: BattleStatus;
  priority?: BattlePriority;
  url?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  actions?: BattleAction[];
}

export interface BattleProviderState {
  providerId: string;
  providerName: string;
  providerIcon?: string;
  providerColor?: string;
  battles: Battle[];
  lastRefreshedAt?: number;
  lastError?: string;
  isLoading: boolean;
}

export interface BattleConfig {
  groups: Group[];
  actions: Action[];
  workflows?: Workflow[];
  jobs?: JobDefinition[];
}

export interface DiscoverySources {
  npm?: boolean;
  tasks?: boolean;
  launch?: boolean;
  docker?: boolean;
  make?: boolean;
  rust?: boolean;
  go?: boolean;
}

export interface DiscoveryProfile {
  version: 1;
  sources: DiscoverySources;
  deepScan: boolean;
  detectionMethod?: "file" | "command" | "hybrid";
  enableGrouping?: boolean;
  enableColoring?: boolean;
  secondaryGroupBy?: "auto" | "workspace" | "type" | "none";
  generatedAt?: number;
}

export interface Config {
  actions: Action[];
  groups?: Group[];
  icons?: IconMapping[];
  workflows?: Workflow[];
  jobs?: JobDefinition[];
  battleProviders?: BattleProvider[];
  customColors?: string[]; // User-defined color palette
  discovery?: DiscoveryProfile;
  [key: string]: any; // Allow arbitrary keys from config
}
