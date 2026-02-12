/** Shared types used across services and views. */

export interface Action {
  name: string;
  command: string;
  type: string;
  group?: string;
  hidden?: boolean;
  workspace?: string;
}

export interface IconMapping {
  type: string;
  icon: string;
}

export interface Group {
  name: string;
  icon?: string;
  color?: string;
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
