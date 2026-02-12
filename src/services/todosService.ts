import * as vscode from "vscode";
import type { Todo, TodosData } from "../types";

/**
 * Async todos service using vscode.workspace.fs.
 */
export class TodosService {
  private todosCache?: { todos: TodosData; timestamp: number };
  private fileWatcher?: vscode.FileSystemWatcher;

  private _onDidChange = new vscode.EventEmitter<void>();
  public readonly onDidChange = this._onDidChange.event;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.setupWatcher();
  }

  /* ─── Helpers ─── */

  private getWorkspaceRoot(): vscode.Uri | undefined {
    return vscode.workspace.workspaceFolders?.[0]?.uri;
  }

  private getBattleFolderUri(): vscode.Uri | undefined {
    const root = this.getWorkspaceRoot();
    return root ? vscode.Uri.joinPath(root, ".battle") : undefined;
  }

  private getTodosUri(): vscode.Uri | undefined {
    const folder = this.getBattleFolderUri();
    return folder ? vscode.Uri.joinPath(folder, "todos.json") : undefined;
  }

  private async fileExists(uri: vscode.Uri): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(uri);
      return true;
    } catch {
      return false;
    }
  }

  private async readText(uri: vscode.Uri): Promise<string> {
    const bytes = await vscode.workspace.fs.readFile(uri);
    return Buffer.from(bytes).toString("utf-8");
  }

  private async writeText(uri: vscode.Uri, content: string): Promise<void> {
    await vscode.workspace.fs.writeFile(uri, Buffer.from(content, "utf-8"));
  }

  private async ensureDir(uri: vscode.Uri): Promise<void> {
    try {
      await vscode.workspace.fs.createDirectory(uri);
    } catch {
      /* already exists */
    }
  }

  /* ─── Watcher ─── */

  private setupWatcher(): void {
    const ws = vscode.workspace.workspaceFolders?.[0];
    if (!ws) return;

    this.fileWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(ws, ".battle/todos.json")
    );

    const notify = () => {
      this.invalidateCache();
      this._onDidChange.fire();
    };

    this.fileWatcher.onDidChange(notify);
    this.fileWatcher.onDidCreate(notify);
    this.fileWatcher.onDidDelete(notify);

    this.context.subscriptions.push(this.fileWatcher, this._onDidChange);
  }

  /* ─── Public API ─── */

  async readTodos(): Promise<TodosData> {
    const uri = this.getTodosUri();
    if (!uri) return { todos: [] };

    try {
      if (this.todosCache) {
        const stat = await vscode.workspace.fs.stat(uri);
        if (stat.mtime === this.todosCache.timestamp) {
          return this.todosCache.todos;
        }
      }

      if (!(await this.fileExists(uri))) return { todos: [] };

      const stat = await vscode.workspace.fs.stat(uri);
      const raw = await this.readText(uri);
      const todos = JSON.parse(raw) as TodosData;
      this.todosCache = { todos, timestamp: stat.mtime };
      return todos;
    } catch {
      return { todos: [] };
    }
  }

  async saveTodos(todosData: TodosData): Promise<void> {
    const uri = this.getTodosUri();
    if (!uri) return;

    try {
      const folder = this.getBattleFolderUri();
      if (folder) await this.ensureDir(folder);
      await this.writeText(uri, JSON.stringify(todosData, null, 2));
      this.invalidateCache();
    } catch (error) {
      console.error("Failed to save todos:", error);
      vscode.window.showErrorMessage("Failed to save todos");
    }
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

  invalidateCache(): void {
    this.todosCache = undefined;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
