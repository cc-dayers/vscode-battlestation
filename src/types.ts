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

export interface BattleConfig {
  groups: Group[];
  actions: Action[];
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
  customColors?: string[]; // User-defined color palette
  discovery?: DiscoveryProfile;
  [key: string]: any; // Allow arbitrary keys from config
}
