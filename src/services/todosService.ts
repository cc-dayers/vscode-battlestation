import * as vscode from "vscode";
import type { Todo, TodosData, TodoGroup, Action } from "../types";
import { ConfigService } from "./configService";
import { exec } from "child_process";
import * as util from "util";

const execAsync = util.promisify(exec);

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

  async getActiveListId(): Promise<string> {
    const config = await this.configService.readConfig();
    if (config.activeTodoList && config.todoLists?.[config.activeTodoList]) {
      return config.activeTodoList;
    }

    // Fallback: Return first list or create default
    if (config.todoLists && Object.keys(config.todoLists).length > 0) {
      const firstId = Object.keys(config.todoLists)[0];
      await this.setActiveList(firstId);
      return firstId;
    }

    // No lists exist, active ID is undefined until created
    return "";
  }

  async setActiveList(id: string): Promise<void> {
    const config = await this.configService.readConfig();
    if (config.todoLists?.[id]) {
      config.activeTodoList = id;
      await this.configService.writeConfig(config);
    }
  }

  async createList(name: string): Promise<string> {
    const config = await this.configService.readConfig();
    const id = this.generateId();
    if (!config.todoLists) config.todoLists = {};

    config.todoLists[id] = {
      id,
      name,
      todos: {},
      icon: "list-flat"
    };

    // If this is the only list, make it active
    if (!config.activeTodoList) {
      config.activeTodoList = id;
    }

    await this.configService.writeConfig(config);
    return id;
  }

  async deleteList(id: string): Promise<void> {
    const config = await this.configService.readConfig();
    if (config.todoLists?.[id]) {
      delete config.todoLists[id];
      if (config.activeTodoList === id) {
        // Switch to another list if available
        const remaining = Object.keys(config.todoLists);
        config.activeTodoList = remaining.length > 0 ? remaining[0] : undefined;
      }
      await this.configService.writeConfig(config);
    }
  }

  async switchList(id: string): Promise<void> {
    const config = await this.configService.readConfig();
    if (config.todoLists?.[id]) {
      config.activeTodoList = id;
      await this.configService.writeConfig(config);
    }
  }

  async renameList(id: string, newName: string): Promise<void> {
    const config = await this.configService.readConfig();
    if (config.todoLists?.[id]) {
      config.todoLists[id].name = newName;
      await this.configService.writeConfig(config);
    }
  }

  async readTodos(listId?: string): Promise<TodosData> {
    const config = await this.configService.readConfig();
    const targetId = listId || await this.getActiveListId();

    if (!targetId || !config.todoLists?.[targetId]) {
      return { todos: {} };
    }

    return { todos: config.todoLists[targetId].todos || {} };
  }

  async saveTodos(todos: TodoGroup, listId?: string): Promise<void> {
    const config = await this.configService.readConfig();
    const targetId = listId || await this.getActiveListId();

    if (targetId && config.todoLists?.[targetId]) {
      config.todoLists[targetId].todos = todos;

      // Legacy sync: Keep 'todos' property in sync with active list for backward compatibility if needed
      // but let's assume we fully moved over. We can clear legacy todos here if we want.
      // config.todos = todos; 

      await this.configService.writeConfig(config);
    }
  }

  async addTodo(
    title: string,
    description: string,
    then?: string
  ): Promise<void> {
    const data = await this.readTodos();
    const id = this.generateId();
    const count = Object.keys(data.todos).length;

    data.todos[id] = {
      title,
      description,
      completed: false,
      order: count,
      then
    };
    await this.saveTodos(data.todos);
  }

  async updateTodo(
    id: string,
    updates: Partial<Todo>
  ): Promise<void> {
    const data = await this.readTodos();
    if (data.todos[id]) {
      const wasCompleted = data.todos[id].completed;
      data.todos[id] = { ...data.todos[id], ...updates };
      await this.saveTodos(data.todos);

      if (!wasCompleted && updates.completed && data.todos[id].then) {
        void this.executeThenAction(data.todos[id].then!);
      }
    }
  }

  private async executeThenAction(actionString: string) {
    if (actionString.startsWith("goto:")) {
      const listId = actionString.replace("goto:", "").trim();
      await this.setActiveList(listId);
    } else if (actionString.startsWith("command:")) {
      const cmd = actionString.replace("command:", "").trim();
      await vscode.commands.executeCommand(cmd);
    } else if (actionString.startsWith("action:")) {
      const actionName = actionString.replace("action:", "").trim();
      // We need to find the action by name/command match? 
      // Ideally we should use IDs but actions don't have stable IDs yet.
      // Let's assume actionName represents the name for now, or just execute it if we can find it.
      // For now, let's limit to commands or goto. 
      // If action: is strictly required, we'd need to lookup config.actions.
      // Let's support executing a command string directly if no prefix? 
      // No, let's stick to explicit prefixes.
      // "action:" logic:
      const config = await this.configService.readConfig();
      const action = config.actions.find(a => a.name === actionName);
      if (action) {
        vscode.commands.executeCommand("battlestation.execute", action);
      } else {
        vscode.window.showWarningMessage(`Action "${actionName}" not found.`);
      }
    }
  }

  async deleteTodo(id: string): Promise<void> {
    const data = await this.readTodos();
    if (data.todos[id]) {
      delete data.todos[id];
      await this.saveTodos(data.todos);
    }
  }

  async reorderTodos(todoIds: string[]): Promise<void> {
    const data = await this.readTodos();
    todoIds.forEach((id, index) => {
      if (data.todos[id]) {
        data.todos[id].order = index;
      }
    });
    await this.saveTodos(data.todos);
  }

  async fetchTodosFromCommand(commandLine: string): Promise<string[]> {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!root) {
      throw new Error("No workspace open");
    }
    const { stdout } = await execAsync(commandLine, { cwd: root, maxBuffer: 1024 * 1024 });
    return stdout.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  }

  async generateFromCommand(commandLine: string): Promise<void> {
    try {
      vscode.window.showInformationMessage(`Running generator: ${commandLine}`);
      const lines = await this.fetchTodosFromCommand(commandLine);

      if (lines.length === 0) {
        vscode.window.showWarningMessage("Command returned no output.");
        return;
      }

      // Ensure we have a list
      let activeId = await this.getActiveListId();
      if (!activeId) {
        activeId = await this.createList("Generated List");
      }

      // Update todos
      const data = await this.readTodos(activeId);
      let count = Object.keys(data.todos).length;

      // Add each line as a todo
      lines.forEach(line => {
        const id = this.generateId();
        data.todos[id] = {
          title: line,
          description: `Generated from: \`${commandLine}\``,
          completed: false,
          order: count++
        };
      });

      // Also save the action as a hidden system action
      const config = await this.configService.readConfig();
      const existingAction = config.actions.find(a => a.command === commandLine && a.type === 'system');

      if (!existingAction) {
        const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        const action: Action = {
          name: `Generate Todos: ${commandLine.substring(0, 20)}${commandLine.length > 20 ? '...' : ''}`,
          command: commandLine,
          type: 'system',
          hidden: true,
          cwd: root
        };
        config.actions.push(action);
        await this.configService.writeConfig(config);
      }

      // Save todos to the active list
      await this.saveTodos(data.todos, activeId);

      vscode.window.showInformationMessage(`Generated ${lines.length} todos.`);
      this._onDidChange.fire(); // Force refresh
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to run generator: ${(error as Error).message}`);
    }
  }

  async generateDefaults(): Promise<void> {
    const id1 = this.generateId();
    const id2 = this.generateId() + "-2";

    const defaults: TodoGroup = {
      [id1]: {
        title: "Explore Battlestation",
        description: "Check out the available actions and groups.",
        completed: false,
        order: 0
      },
      [id2]: {
        title: "Customize your setup",
        description: "Edit battle.json to add your own scripts.",
        completed: false,
        order: 1
      }
    };

    if (!(await this.configService.configExists())) {
      await this.configService.createMinimalConfig(ConfigService.defaultIcons);
    }

    const config = await this.configService.readConfig();
    if (!config.todos || Object.keys(config.todos).length === 0) {
      config.todos = defaults;
      await this.configService.writeConfig(config);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
