/** Shared types used across services and views. */

export interface Action {
  name: string;
  command: string;
  type: string;
  cwd?: string; // Execution context (root directory)
  group?: string;
  hidden?: boolean;
  workspace?: string; // Can be used as secondary grouping key
  backgroundColor?: string;
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
}

export interface SecondaryGroup {
  icon?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
}

export interface Todo {
  id: string;
  name: string;
  detail: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
  createdAt: string;
}

export interface TodosData {
  todos: Todo[];
}

export interface Config {
  actions: Action[];
  groups?: Group[];
  icons?: IconMapping[];
  todos?: Todo[];
  secondaryGroups?: Record<string, SecondaryGroup>;
  density?: string; // "compact" or "comfortable"
  [key: string]: any; // Allow arbitrary keys from config
}
