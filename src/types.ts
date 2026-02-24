/** Shared types used across services and views. */

export interface Action {
  name: string;
  command: string;
  type: string;
  cwd?: string; // Execution context (root directory)
  group?: string;
  hidden?: boolean;
  workspace?: string; // Can be used as secondary grouping key
  backgroundColor?: string; // Background color for the action button
  workspaceColor?: string; // Background color for the workspace label badge
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

export interface SecondaryGroup {
  icon?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
}

export interface Todo {
  title: string;
  description?: string;
  then?: string; // ID of an action to run after completion
  completed?: boolean;
  order?: number;
}

export interface TodoGroup {
  [id: string]: Todo;
}

export interface TodosData {
  todos: TodoGroup;
}

export interface BattleConfig {
  groups: Group[];
  actions: Action[];
  todos?: TodoGroup;
}

export interface TodoList {
  id: string;
  name: string;
  todos: TodoGroup;
  icon?: string;
  color?: string;
}

export interface Config {
  actions: Action[];
  groups?: Group[];
  icons?: IconMapping[];
  todos?: TodoGroup; // Legacy field, kept for migration
  todoLists?: Record<string, TodoList>; // map id -> list
  activeTodoList?: string; // ID of currently active list
  secondaryGroups?: Record<string, SecondaryGroup>;
  customColors?: string[]; // User-defined color palette
  density?: string; // "compact" or "comfortable"
  [key: string]: any; // Allow arbitrary keys from config
}
