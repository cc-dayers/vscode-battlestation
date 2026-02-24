import * as vscode from "vscode";
import type { BattlestationViewProvider } from "./view";
import { TodosService } from "./services/todosService";
import { htmlShell } from "./templates/layout";
import { getNonce } from "./templates/nonce";
import { esc } from "./views/helpers";
import type { Todo } from "./types";

/* ─── Styles ─── */

const todoListStyles = "";
const todoFormStyles = "";
const wizardStyles = "";



const reviewStyles = "";

const todoListScript = `
  (function () {
    const vscode = acquireVsCodeApi();

    // List Management
    const listSelect = document.getElementById('listSelect');
    if (listSelect) {
      listSelect.addEventListener('change', (e) => {
        vscode.postMessage({ command: 'switchList', listId: e.target.value });
      });
    }

    document.getElementById('addListBtn')?.addEventListener('click', () => {
      // In a real app we'd show a modal, but for now let's use a quick prompt 
      // passed via message? No, we can't do prompts in webview easily. 
      // Let's just create "New List" and let them edit it (future improvement).
      // Or simplest:
      vscode.postMessage({ command: 'createList', name: "New List " + Math.floor(Math.random() * 100) });
    });

    document.getElementById('renameListBtn')?.addEventListener('click', () => {
      const id = listSelect?.value;
      if (id) {
        vscode.postMessage({ command: 'renameList', listId: id });
      }
    });

    document.getElementById('deleteListBtn')?.addEventListener('click', () => {

      const id = listSelect?.value;
      if (id) {
        vscode.postMessage({ command: 'deleteList', listId: id });
      }
    });

    document.getElementById('toggleCompletedBtn')?.addEventListener('click', () => {
      vscode.postMessage({ command: 'toggleShowCompleted' });
    });

    // Todo Management
    document.getElementById('addBtn')?.addEventListener('click', () => {
      vscode.postMessage({ command: 'showAddForm' });
    });

    document.getElementById('todoList')?.addEventListener('click', (e) => {
      const target = e.target;

      // Checkbox
      if (target.classList.contains('todo-checkbox')) {
        vscode.postMessage({ command: 'toggleComplete', todoId: target.getAttribute('data-id') });
        return;
      }

      // Edit Button
      const editBtn = target.closest('.edit-btn');
      if (editBtn) {
        vscode.postMessage({ command: 'showEditForm', todoId: editBtn.getAttribute('data-id') });
        return;
      }

      // Delete Button
      const deleteBtn = target.closest('.delete-btn');
      if (deleteBtn) {
        vscode.postMessage({ command: 'deleteTodo', todoId: deleteBtn.getAttribute('data-id') });
        return;
      }

      // Content click (edit)
      const content = target.closest('.todo-content');
      if (content) {
        // Maybe toggle complete or edit? Let's edit for now
        vscode.postMessage({ command: 'showEditForm', todoId: content.getAttribute('data-edit') });
      }
    });

    // Wizard Logic
    document.getElementById('startFreshBtn')?.addEventListener('click', () => {
      vscode.postMessage({ command: 'generateTodos' });
    });

    document.getElementById('runGeneratorBtn')?.addEventListener('click', () => {
      const commandInput = document.getElementById('generatorCommand');
      if (commandInput && commandInput.value.trim()) {
        vscode.postMessage({ command: 'generateTodos', generatorCommand: commandInput.value.trim() });
      } else {
        vscode.postMessage({ command: 'showError', message: 'Please enter a command to generate todos.' });
      }
    });

    const genInput = document.getElementById('generatorCommand');
    if (genInput) {
        genInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && genInput.value.trim()) {
            if (genInput.value.trim()) {
               vscode.postMessage({ command: 'generateTodos', generatorCommand: genInput.value.trim() });
            }
          }
        });
    }

    let draggedElement = null;

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

export class TodoPanelProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private currentView: "list" | "form" | "review" = "list";
  private editingTodoId?: string;
  private stagedTodos: string[] = [];
  private generatorCommand: string = "";
  private readonly disposables: vscode.Disposable[] = [];
  private showCompleted: boolean = true;


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
      case "generateTodos":
        void this.todosService.generateDefaults();
        break;
      case "runGenerator":
        void this.runGenerator(message.commandLine);
        break;
      case "importTodos":
        void this.importTodos(message.todos);
        break;
      case "cancelReview":
        this.currentView = "list";
        this.stagedTodos = [];
        void this.refresh();
        break;
      case "switchList":
        void this.todosService.setActiveList(message.listId);
        break;
      case "createList":
        void this.todosService.createList(message.name);
        break;
      case "deleteList":
        void this.todosService.deleteList(message.listId);
        break;
      case "renameList":
        void this.renameList(message.listId);
        break;
      case "refresh":
        void this.refresh();
        break;
      case "cancelForm":
        this.currentView = "list";
        this.editingTodoId = undefined;
        void this.refresh();
        break;
      case "toggleShowCompleted":
        this.showCompleted = !this.showCompleted;
        void this.refresh();
        break;
    }
  }

  private async renameList(listId: string) {
    const config = await this.todosService['configService'].readConfig();
    const currentName = config.todoLists?.[listId]?.name || "New List";

    const newName = await vscode.window.showInputBox({
      prompt: "Enter new name for list",
      value: currentName
    });

    if (newName && newName.trim()) {
      await this.todosService.renameList(listId, newName.trim());
      this.refresh();
    }
  }

  private async runGenerator(command: string) {

    try {
      const lines = await this.todosService.fetchTodosFromCommand(command);
      if (lines.length === 0) {
        vscode.window.showWarningMessage("Command returned no output.");
        return;
      }
      this.stagedTodos = lines;
      this.generatorCommand = command;
      this.currentView = "review";
      this.refresh();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to run generator: ${(error as Error).message}`);
    }
  }

  private async importTodos(selectedTodos: string[]) {
    // Save generated items
    let activeId = await this.todosService.getActiveListId();
    if (!activeId) {
      activeId = await this.todosService.createList("Generated List");
    }

    const data = await this.todosService.readTodos(activeId);
    let count = Object.keys(data.todos).length;

    selectedTodos.forEach(line => {
      const id = `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      data.todos[id] = {
        title: line,
        description: `Generated from: \`${this.generatorCommand}\``,
        completed: false,
        order: count++
      };
    });

    await this.todosService.saveTodos(data.todos, activeId);
    this.currentView = "list";
    this.stagedTodos = [];
    this.refresh();
  }

  private async saveTodo(todo: { title: string; description: string }) {
    if (this.editingTodoId) {
      await this.todosService.updateTodo(this.editingTodoId, {
        title: todo.title,
        description: todo.description,
      });
    } else {
      await this.todosService.addTodo(todo.title, todo.description);
    }
    this.currentView = "list";
    this.editingTodoId = undefined;
    void this.refresh();
  }

  private async toggleComplete(todoId: string) {
    const data = await this.todosService.readTodos();
    const todo = data.todos[todoId];
    if (todo) {
      await this.mainProvider.modifyTodo(todoId, { completed: !todo.completed });
      void this.refresh();
    }
  }

  public async refresh() {
    if (!this.view) return;
    try {
      const nonce = getNonce();
      const cspSource = this.view.webview.cspSource;
      if (this.currentView === "list") {
        this.view.webview.html = await this.renderList(cspSource, nonce);
      } else {
        this.view.webview.html = await this.renderForm(cspSource, nonce);
      }
    } catch (e) {
      const error = e as Error;
      this.view.webview.html = this.renderSimpleError(error.message);
    }
  }

  private renderSimpleError(message: string): string {
    const nonce = getNonce();
    return htmlShell({
      title: "Error",
      cspSource: this.view?.webview.cspSource || "",
      nonce,
      styles: `
        body { display: flex; align-items: center; justify-content: center; height: 100vh; color: var(--vscode-errorForeground); }
        .error { text-align: center; padding: 20px; }
      `,
      body: `
        <div class="error">
          <h3>\u26a0\ufe0f Error Loading Todos</h3>
          <p>${esc(message)}</p>
          <button id="retryBtn">Retry</button>
        </div>
      `,
      script: `
        (function() {
          const vscode = acquireVsCodeApi();
          document.getElementById('retryBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'refresh' });
          });
        })();
      `
    });
  }

  /* ─── Review view ─── */

  private async renderReview(cspSource: string, nonce: string): Promise<string> {
    const items = this.stagedTodos.map((line, i) => `
      <div class="review-item">
        <label class="checkbox-container">
          <input type="checkbox" checked data-index="${i}">
          <span class="checkmark"></span>
          <span class="review-text">${esc(line)}</span>
        </label>
      </div>
    `).join("");

    return htmlShell({
      title: "Review Todos",
      cspSource,
      nonce,
      styles: todoListStyles + reviewStyles,
      cssUri: this.view?.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "media", "output.css")).toString(),
      body: `
        <div class="review-header">
          <h2>Found ${this.stagedTodos.length} Todos</h2>
          <p>Review items to import from: <code>${esc(this.generatorCommand)}</code></p>
        </div>
        <div class="review-list">
          ${items}
        </div>
        <div class="review-actions">
          <button class="secondary-btn" id="cancelReviewBtn">Cancel</button>
          <button class="primary-btn" id="importBtn">Import Selected</button>
        </div>
      `,
      script: `
        (function() {
          const vscode = acquireVsCodeApi();
          
          document.getElementById('cancelReviewBtn').addEventListener('click', () => {
             vscode.postMessage({ command: 'cancelReview' });
          });
          
          document.getElementById('importBtn').addEventListener('click', () => {
             const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
             const selected = Array.from(checkboxes).map(cb => {
               const index = parseInt(cb.getAttribute('data-index'));
               return document.querySelectorAll('.review-text')[index].innerText;
             });
             vscode.postMessage({ command: 'importTodos', todos: selected });
          });
        })();
      `
    });
  }

  /* ─── Simple loading view ─── */

  private renderSimpleLoading(cspSource: string, nonce: string): string {
    const cssUri = this.view?.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "media", "output.css")).toString();
    return htmlShell({
      title: "Loading Todos...",
      cspSource,
      nonce,
      cssUri,
      styles: "",
      body: `
        <div class="loading-body">
          <div class="loading">
            <div class="spinner">⏳</div>
            <div>Loading todos...</div>
          </div>
        </div>
      `,
      script: "",
    });
  }

  /* ─── List view ─── */

  private async renderList(cspSource: string, nonce: string): Promise<string> {
    const activeListId = await this.todosService.getActiveListId();
    const data = await this.todosService.readTodos(activeListId);
    const config = await this.todosService['configService'].readConfig(); // Access config for lists
    const lists = config.todoLists || {};

    // Sort lists by name
    const listOptions = Object.values(lists).sort((a, b) => a.name.localeCompare(b.name))
      .map(l => `<option value="${l.id}" ${l.id === activeListId ? "selected" : ""}>${esc(l.name)}</option>`)
      .join("");

    const todos = Object.entries(data.todos || {}).map(([id, todo]) => ({ id, ...todo }));

    // Sort by order
    todos.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const items = (this.showCompleted ? todos : todos.filter(t => !t.completed))
      .map(
        (todo) => `
        <li class="todo-item ${todo.completed ? "completed" : ""}"
            draggable="true" data-id="${todo.id}">
          <input type="checkbox" class="todo-checkbox" ${todo.completed ? "checked" : ""}
                 data-id="${todo.id}">
          <div class="todo-content" data-edit="${todo.id}">
            <div class="todo-name">${esc(todo.title)}</div>
            ${todo.description ? `<div class="todo-detail">${esc(todo.description)}</div>` : ""}
          </div>
          <div class="todo-actions">
            <button class="icon-btn edit-btn" data-id="${todo.id}" title="Edit"><span class="codicon codicon-edit"></span></button>
            <button class="icon-btn delete-btn" data-id="${todo.id}" title="Delete"><span class="codicon codicon-trash"></span></button>
          </div>
        </li>`
      )
      .join("");

    const header = `
      <div class="todo-header-bar">
        <div class="list-selector">
          <select id="listSelect" title="Switch List">
            ${listOptions}
          </select>
           <button class="icon-btn" id="addListBtn" title="New List"><span class="codicon codicon-add"></span></button>
           <button class="icon-btn" id="renameListBtn" title="Rename List"><span class="codicon codicon-edit"></span></button>
           <button class="icon-btn" id="deleteListBtn" title="Delete List" ${Object.keys(lists).length <= 1 ? "disabled" : ""}><span class="codicon codicon-trash"></span></button>
           <button class="icon-btn" id="toggleCompletedBtn" title="${this.showCompleted ? 'Hide Completed' : 'Show Completed'}"><span class="codicon codicon-${this.showCompleted ? 'eye' : 'eye-closed'}"></span></button>
        </div>
         <button class="add-btn" id="addBtn" title="Add Todo"><span class="codicon codicon-add"></span> Todo</button>
      </div>`;

    const body =
      todos.length === 0
        ? `<div class="wizard-container">
             <div class="wizard-hero">
               <div class="hero-icon">\u2728</div>
               <h2>Smart Todos</h2>
               <p>Your intelligent task manager. Start fresh or generate tasks from your codebase.</p>
             </div>
             
             ${header} <!-- Show header even in wizard to allow list switching -->

             <div class="wizard-grid">
               <!-- Option A -->
               <div class="wizard-card interactive" id="startFreshBtn">
                 <div class="card-icon"><span class="codicon codicon-list-flat"></span></div>
                 <div class="card-content">
                   <div class="card-title">Start Fresh</div>
                   <p class="card-desc">Create an empty list and add tasks manually.</p>
                 </div>
                 <div class="card-arrow"><span class="codicon codicon-arrow-right"></span></div>
               </div>

               <div class="wizard-divider">or</div>

               <!-- Option B -->
               <div class="wizard-card">
                 <div class="card-header">
                   <div class="card-icon"><span class="codicon codicon-terminal"></span></div>
                   <div class="card-content">
                     <div class="card-title">Generate from Command</div>
                     <p class="card-desc">Populate tasks from code (e.g. TODO comments).</p>
                   </div>
                 </div>
                 <div class="input-group-wrapper">
                   <div class="input-group">
                     <span class="input-prefix">$</span>
                     <input type="text" id="generatorCommand" placeholder="grep -r TODO .">
                     <button class="icon-btn play-btn" id="runGeneratorBtn" title="Run Command">
                       <span class="codicon codicon-play"></span>
                     </button>
                   </div>
                 </div>
               </div>
             </div>
           </div>`
        : `<div class="todo-wrapper">
             ${header}
             <ul class="todo-list" id="todoList">${items}</ul>
           </div>`;

    return htmlShell({
      title: "Todos",
      cspSource,
      nonce,
      styles: todoListStyles + wizardStyles + reviewStyles,
      body,
      script: todoListScript,
      cssUri: this.view?.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "media", "output.css")).toString(),
    });
  }

  /* ─── Form view ─── */

  private async renderForm(cspSource: string, nonce: string): Promise<string> {
    const data = await this.todosService.readTodos();
    const editingTodo = this.editingTodoId && data.todos[this.editingTodoId]
      ? { id: this.editingTodoId, ...data.todos[this.editingTodoId] }
      : null;

    const cssUri = this.view?.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "media", "output.css")).toString();

    return htmlShell({
      title: editingTodo ? "Edit Todo" : "Add Todo",
      cspSource,
      nonce,
      styles: todoFormStyles,
      cssUri,
      body: `
        <div class="form-header">
          <h2>${editingTodo ? "\u270f\ufe0f Edit Todo" : "\u2795 Add Todo"}</h2>
        </div>
        <form id="todoForm">
          <div class="form-group">
            <label for="title">Title *</label>
            <input type="text" id="title" required value="${editingTodo ? esc(editingTodo.title) : ""}">
          </div>
          <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description">${editingTodo ? esc(editingTodo.description || "") : ""}</textarea>
          </div>
          <div class="form-group">
            <label for="then">Then (Action)</label>
            <input type="text" id="then" value="${editingTodo ? esc(editingTodo.then || "") : ""}" placeholder="e.g. goto:listId, action:Action Name, command:workbench.action.reloadWindow">
            <div class="lp-hint">Action to execute upon completion</div>
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
            const title = document.getElementById('title').value.trim();
            const description = document.getElementById('description').value.trim();
            const then = document.getElementById('then').value.trim();
            if (!title) return;
            vscode.postMessage({ command: 'saveTodo', todo: { title, description, then } });
          });
          document.getElementById('cancelBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'cancelForm' });
          });
          document.getElementById('title').focus();
        })();
`,
    });
  }
}

