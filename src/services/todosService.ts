import * as vscode from "vscode";
import type { Todo, TodosData } from "../types";
import { ConfigService } from "./configService";

/**
 * Async todos service using ConfigService for storage.
 * Stores todos in battle.json.
 */
export class TodosService {
  private _onDidChange = new vscode.EventEmitter<void>();
  public readonly onDidChange = this._onDidChange.event;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly configService: ConfigService
  ) {
    // Listen to config changes
    this.context.subscriptions.push(
      this.configService.onDidChange(() => {
        this._onDidChange.fire();
      })
    );
  }

  /* ─── Public API ─── */

  async readTodos(): Promise<TodosData> {
    const config = await this.configService.readConfig();
    return { todos: config.todos || [] };
  }

  async saveTodos(todosData: TodosData): Promise<void> {
    const config = await this.configService.readConfig();
    config.todos = todosData.todos;
    await this.configService.writeConfig(config);
  }

  async addTodo(
    name: string,
    detail: string,
    priority: "high" | "medium" | "low"
  ): Promise<void> {
    const data = await this.readTodos();
    const newTodo: Todo = {
      id: this.generateId(),
      name,
      detail,
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    data.todos.push(newTodo);
    await this.saveTodos(data);
  }

  async updateTodo(
    id: string,
    updates: Partial<Omit<Todo, "id" | "createdAt">>
  ): Promise<void> {
    const data = await this.readTodos();
    const idx = data.todos.findIndex((t) => t.id === id);
    if (idx >= 0) {
      data.todos[idx] = { ...data.todos[idx], ...updates };
      await this.saveTodos(data);
    }
  }

  async deleteTodo(id: string): Promise<void> {
    const data = await this.readTodos();
    data.todos = data.todos.filter((t) => t.id !== id);
    await this.saveTodos(data);
  }

  async reorderTodos(todoIds: string[]): Promise<void> {
    const data = await this.readTodos();
    const map = new Map(data.todos.map((t) => [t.id, t]));
    data.todos = todoIds
      .map((id) => map.get(id))
      .filter((t): t is Todo => t !== undefined);
    await this.saveTodos(data);
  }

  async generateDefaults(): Promise<void> {
    const defaults: Todo[] = [
      {
        id: this.generateId(),
        name: "Explore Battlestation",
        detail: "Check out the available actions and groups.",
        priority: "high",
        completed: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: this.generateId() + "-2",
        name: "Customize your setup",
        detail: "Edit battle.json to add your own scripts.",
        priority: "medium",
        completed: false,
        createdAt: new Date().toISOString(),
      },
    ];

    // Only add if config exists, else create it? 
    // ConfigService handles creation if needed, but let's assume config exists or we create it.
    if (!(await this.configService.configExists())) {
      await this.configService.createMinimalConfig(ConfigService.defaultIcons);
    }

    const config = await this.configService.readConfig();
    if (!config.todos) {
      config.todos = [];
    }
    // Append defaults
    config.todos.push(...defaults);
    await this.configService.writeConfig(config);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
