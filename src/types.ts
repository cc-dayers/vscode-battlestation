/** Shared types used across services and views. */

export interface Action {
  name: string;
  command: string;
  type: string;
  group?: string;
  hidden?: boolean;
  workspace?: string;
  backgroundColor?: string; // Hex color for action background
}

export interface IconMapping {
  type: string;
  icon: string;
}

export interface Group {
  name: string;
  icon?: string;
  color?: string; // Text/icon color (keeping for backwards compatibility)
  backgroundColor?: string; // Background color for the group
  borderColor?: string; // Border color for the group
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
  icons?: IconMapping[];
  groups?: Group[];
  actions: Action[];
}
