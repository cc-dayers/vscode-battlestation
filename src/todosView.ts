import * as vscode from "vscode";
import type { BattlestationViewProvider } from "./view";
import { TodosService } from "./services/todosService";
import { htmlShell } from "./templates/layout";
import { getNonce } from "./templates/nonce";
import { esc } from "./views/helpers";
import type { Todo } from "./types";

export class TodoPanelProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private currentView: "list" | "form" = "list";
  private editingTodoId?: string;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly todosService: TodosService,
    private readonly mainProvider: BattlestationViewProvider
  ) {
    this.disposables.push(
      this.todosService.onDidChange(() => this.refresh())
    );
  }

  /* ─── Disposal ─── */

  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _ctx: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    
    // Show loading state immediately
    const cspSource = webviewView.webview.cspSource;
    const nonce = getNonce();
    webviewView.webview.html = this.renderSimpleLoading(cspSource, nonce);
    
    webviewView.webview.onDidReceiveMessage((msg) => this.handleMessage(msg));
    void this.refresh();
  }

  private handleMessage(message: any) {
    switch (message.command) {
      case "showAddForm":
        this.currentView = "form";
        this.editingTodoId = undefined;
        void this.refresh();
        break;
      case "showEditForm":
        this.currentView = "form";
        this.editingTodoId = message.todoId;
        void this.refresh();
        break;
      case "saveTodo":
        void this.saveTodo(message.todo);
        break;
      case "deleteTodo":
        void this.todosService.deleteTodo(message.todoId).then(() => this.refresh());
        break;
      case "toggleComplete":
        void this.toggleComplete(message.todoId);
        break;
      case "reorderTodos":
        void this.todosService.reorderTodos(message.todoIds);
        break;
      case "cancelForm":
        this.currentView = "list";
        this.editingTodoId = undefined;
        void this.refresh();
        break;
    }
  }

  private async saveTodo(todo: { name: string; detail: string; priority: "high" | "medium" | "low" }) {
    if (this.editingTodoId) {
      await this.mainProvider.modifyTodo(this.editingTodoId, {
        name: todo.name,
        detail: todo.detail,
        priority: todo.priority,
      });
    } else {
      await this.mainProvider.createTodo(todo.name, todo.detail, todo.priority);
    }
    this.currentView = "list";
    this.editingTodoId = undefined;
    void this.refresh();
  }

  private async toggleComplete(todoId: string) {
    const data = await this.todosService.readTodos();
    const todo = data.todos.find((t) => t.id === todoId);
    if (todo) {
      await this.mainProvider.modifyTodo(todoId, { completed: !todo.completed });
      void this.refresh();
    }
  }

  public async refresh() {
    if (!this.view) return;
    const nonce = getNonce();
    const cspSource = this.view.webview.cspSource;
    if (this.currentView === "list") {
      this.view.webview.html = await this.renderList(cspSource, nonce);
    } else {
      this.view.webview.html = await this.renderForm(cspSource, nonce);
    }
  }

  /* ─── Simple loading view ─── */

  private renderSimpleLoading(cspSource: string, nonce: string): string {
    return htmlShell({
      title: "Loading Todos...",
      cspSource,
      nonce,
      styles: `
        body {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          font-family: var(--vscode-font-family);
          color: var(--vscode-foreground);
          opacity: 0.7;
        }
        .loading { text-align: center; }
        .spinner { font-size: 20px; margin-bottom: 8px; }
      `,
      body: `
        <div class="loading">
          <div class="spinner">⏳</div>
          <div>Loading todos...</div>
        </div>
      `,
      script: "",
    });
  }

  /* ─── List view ─── */

  private async renderList(cspSource: string, nonce: string): Promise<string> {
    const data = await this.todosService.readTodos();
    const codiconFontUri = this.view?.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "codicon.ttf")
    );

    const codiconCss = `
      @font-face { font-family: "codicon"; font-display: block; src: url("${codiconFontUri}") format("truetype"); }
      .codicon { font: normal normal normal 16px/1 codicon; display: inline-block; text-decoration: none; text-rendering: auto; text-align: center; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; user-select: none; }
      .codicon-add:before { content: "\\ea60"; }
      .codicon-edit:before { content: "\\ea73"; }
      .codicon-trash:before { content: "\\ea81"; }
    `;

    const items = data.todos
      .map(
        (todo) => `
        <li class="todo-item priority-${todo.priority} ${todo.completed ? "completed" : ""}"
            draggable="true" data-id="${todo.id}">
          <input type="checkbox" class="todo-checkbox" ${todo.completed ? "checked" : ""}
                 data-id="${todo.id}">
          <div class="todo-content" data-edit="${todo.id}">
            <div class="todo-name">${esc(todo.name)}</div>
            ${todo.detail ? `<div class="todo-detail">${esc(todo.detail)}</div>` : ""}
          </div>
          <div class="todo-actions">
            <button class="icon-btn edit-btn" data-id="${todo.id}" title="Edit"><span class="codicon codicon-edit"></span></button>
            <button class="icon-btn delete-btn" data-id="${todo.id}" title="Delete"><span class="codicon codicon-trash"></span></button>
          </div>
        </li>`
      )
      .join("");

    const body =
      data.todos.length === 0
        ? `<div class="todo-header"><h2>\ud83d\udcdd Todos</h2><button class="add-btn" id="addBtn" title="Add Todo"><span class="codicon codicon-add"></span></button></div>
           <div class="empty-state">No todos yet. Click + to add one!</div>`
        : `<div class="todo-header"><h2>\ud83d\udcdd Todos</h2><button class="add-btn" id="addBtn" title="Add Todo"><span class="codicon codicon-add"></span></button></div>
           <ul class="todo-list" id="todoList">${items}</ul>`;

    return htmlShell({
      title: "Todos",
      cspSource,
      nonce,
      styles: `${codiconCss}${todoListStyles}`,
      body,
      script: todoListScript,
    });
  }

  /* ─── Form view ─── */

  private async renderForm(cspSource: string, nonce: string): Promise<string> {
    const data = await this.todosService.readTodos();
    const editingTodo = this.editingTodoId
      ? data.todos.find((t) => t.id === this.editingTodoId)
      : null;

    return htmlShell({
      title: editingTodo ? "Edit Todo" : "Add Todo",
      cspSource,
      nonce,
      styles: todoFormStyles,
      body: `
        <div class="form-header">
          <h2>${editingTodo ? "\u270f\ufe0f Edit Todo" : "\u2795 Add Todo"}</h2>
        </div>
        <form id="todoForm">
          <div class="form-group">
            <label for="name">Name *</label>
            <input type="text" id="name" required value="${editingTodo ? esc(editingTodo.name) : ""}">
          </div>
          <div class="form-group">
            <label for="detail">Details</label>
            <textarea id="detail">${editingTodo ? esc(editingTodo.detail) : ""}</textarea>
          </div>
          <div class="form-group">
            <label for="priority">Priority</label>
            <select id="priority">
              <option value="low" ${editingTodo?.priority === "low" ? "selected" : ""}>Low</option>
              <option value="medium" ${editingTodo?.priority === "medium" || !editingTodo ? "selected" : ""}>Medium</option>
              <option value="high" ${editingTodo?.priority === "high" ? "selected" : ""}>High</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" class="cancel-btn" id="cancelBtn">Cancel</button>
            <button type="submit" class="save-btn">Save</button>
          </div>
        </form>
      `,
      script: `
        (function() {
          const vscode = acquireVsCodeApi();
          document.getElementById('todoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const detail = document.getElementById('detail').value.trim();
            const priority = document.getElementById('priority').value;
            if (!name) return;
            vscode.postMessage({ command: 'saveTodo', todo: { name, detail, priority } });
          });
          document.getElementById('cancelBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'cancelForm' });
          });
          document.getElementById('name').focus();
        })();
      `,
    });
  }
}

/* ─── Styles ─── */

const todoListStyles = `
  body { padding: 10px; color: var(--vscode-foreground); font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); }
  .todo-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
  .todo-header h2 { margin: 0; font-size: 16px; }
  .add-btn { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 6px 10px; cursor: pointer; border-radius: 2px; display: flex; align-items: center; justify-content: center; }
  .add-btn:hover { background: var(--vscode-button-hoverBackground); }
  .empty-state { text-align: center; padding: 40px 20px; color: var(--vscode-descriptionForeground); }
  .todo-list { list-style: none; padding: 0; margin: 0; }
  .todo-item { display: flex; align-items: center; padding: 10px; margin-bottom: 8px; background: var(--vscode-editor-background); border-radius: 4px; cursor: move; border-left: 3px solid transparent; }
  .todo-item:hover { background: var(--vscode-list-hoverBackground); }
  .todo-item.priority-high { border-left-color: #f85149; }
  .todo-item.priority-medium { border-left-color: #d29922; }
  .todo-item.priority-low { border-left-color: #3fb950; }
  .todo-item.completed { opacity: 0.6; }
  .todo-item.completed .todo-name { text-decoration: line-through; }
  .todo-checkbox { margin-right: 10px; cursor: pointer; }
  .todo-content { flex: 1; min-width: 0; cursor: pointer; }
  .todo-name { font-weight: 500; margin-bottom: 2px; }
  .todo-detail { font-size: 12px; color: var(--vscode-descriptionForeground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .todo-actions { display: none; gap: 8px; }
  .todo-item:hover .todo-actions { display: flex; }
  .icon-btn { background: transparent; border: none; color: var(--vscode-foreground); cursor: pointer; padding: 2px; opacity: 0.7; display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 2px; }
  .icon-btn:hover { opacity: 1; background: var(--vscode-toolbar-hoverBackground); }
  .dragging { opacity: 0.5; }
`;

const todoListScript = `
  (function() {
    const vscode = acquireVsCodeApi();
    let draggedElement = null;

    document.getElementById('addBtn')?.addEventListener('click', () => {
      vscode.postMessage({ command: 'showAddForm' });
    });

    // Event delegation for all todo item interactions
    document.addEventListener('change', (e) => {
      if (e.target.matches && e.target.matches('.todo-checkbox')) {
        vscode.postMessage({ command: 'toggleComplete', todoId: e.target.dataset.id });
      }
    });

    document.addEventListener('click', (e) => {
      // Todo content click (edit)
      if (e.target.matches && e.target.matches('.todo-content')) {
        vscode.postMessage({ command: 'showEditForm', todoId: e.target.dataset.edit });
        return;
      }

      // Edit button click
      const editBtn = e.target.closest('.edit-btn');
      if (editBtn) {
        vscode.postMessage({ command: 'showEditForm', todoId: editBtn.dataset.id });
        return;
      }

      // Delete button click
      const deleteBtn = e.target.closest('.delete-btn');
      if (deleteBtn) {
        if (confirm('Delete this todo?')) {
          vscode.postMessage({ command: 'deleteTodo', todoId: deleteBtn.dataset.id });
        }
        return;
      }
    });

    // Event delegation for drag and drop
    document.addEventListener('dragstart', (e) => {
      const item = e.target.closest('.todo-item');
      if (item) {
        draggedElement = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      }
    });

    document.addEventListener('dragover', (e) => {
      const target = e.target.closest('.todo-item');
      if (target && draggedElement && target !== draggedElement) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const list = document.getElementById('todoList');
        const items = Array.from(list.children);
        const dIdx = items.indexOf(draggedElement);
        const tIdx = items.indexOf(target);
        if (dIdx < tIdx) { target.parentNode.insertBefore(draggedElement, target.nextSibling); }
        else { target.parentNode.insertBefore(draggedElement, target); }
      }
    });

    document.addEventListener('drop', (e) => {
      if (e.target.closest('.todo-item')) {
        e.stopPropagation();
      }
    });

    document.addEventListener('dragend', (e) => {
      const item = e.target.closest('.todo-item');
      if (item) {
        item.classList.remove('dragging');
        const list = document.getElementById('todoList');
        const ids = Array.from(list.children).map(el => el.dataset.id);
        vscode.postMessage({ command: 'reorderTodos', todoIds: ids });
      }
    });
  })();
`;

const todoFormStyles = `
  body { padding: 10px; color: var(--vscode-foreground); font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); }
  .form-header { margin-bottom: 20px; }
  .form-header h2 { margin: 0 0 5px 0; font-size: 16px; }
  .form-group { margin-bottom: 15px; }
  label { display: block; margin-bottom: 5px; font-weight: 500; }
  input[type="text"], textarea, select { width: 100%; padding: 6px 8px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px; font-family: inherit; font-size: inherit; box-sizing: border-box; }
  textarea { min-height: 80px; resize: vertical; }
  .form-actions { display: flex; gap: 10px; margin-top: 20px; }
  button { flex: 1; padding: 8px 16px; border: none; border-radius: 2px; cursor: pointer; font-size: inherit; }
  .save-btn { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
  .save-btn:hover { background: var(--vscode-button-hoverBackground); }
  .cancel-btn { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
  .cancel-btn:hover { background: var(--vscode-button-secondaryHoverBackground); }
`;
