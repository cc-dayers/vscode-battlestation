/** Shared types used across services and views. */

export interface Action {
  name: string;
  command: string;
  type: string;
  cwd?: string; // Execution context (root directory)
  group?: string;
  hidden?: boolean;
  workspace?: string; // Can be used as secondary grouping key
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
}

export interface BattleConfig {
  groups: Group[];
  actions: Action[];
}

export interface Config {
  actions: Action[];
  groups?: Group[];
  icons?: IconMapping[];
  customColors?: string[]; // User-defined color palette
  [key: string]: any; // Allow arbitrary keys from config
}
