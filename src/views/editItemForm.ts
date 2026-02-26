import { htmlShell } from "../templates/layout";
import { buttonStyles, formStyles, iconGridStyles } from "../templates/styles";
import { esc } from "./helpers";
import type { Action } from "../types";

const COMMON_CODICONS = [
  "terminal", "package", "rocket", "play", "debug-alt", "beaker", "tools",
  "gear", "cloud", "cloud-upload", "cloud-download", "database", "server",
  "file-code", "code", "git-merge", "git-pull-request", "source-control",
  "check", "verified", "testing-passed", "error", "warning", "info",
  "folder", "file", "files", "save", "refresh", "sync", "search",
  "filter", "list-tree", "symbol-method", "json", "archive", "bookmark",
  "bug", "megaphone", "organization", "pulse", "eye", "flame", "star", "edit",
];

export interface EditActionContext {
  cspSource: string;
  nonce: string;
  codiconStyles: string;
  item: Action;
  iconMap: Map<string, string>;
  customColors: string[];
}

export function renderEditActionForm(ctx: EditActionContext): string {
  const { item, iconMap, customColors } = ctx;

  const typeOptions = Array.from(iconMap.entries())
    .map(
      ([type, _icon]) =>
        `<option value="${type}" ${type === item.type ? "selected" : ""}>${type}</option>`
    )
    .join("\n");

  const isCustomType = !iconMap.has(item.type);
  const currentIcon = iconMap.get(item.type) || "";
  const itemJson = JSON.stringify(item);

  const iconGrid = COMMON_CODICONS.map(
    (icon) =>
      `<div class="lp-icon-option ${icon === currentIcon ? "selected" : ""}" data-icon="${icon}" title="${icon}"><span class="codicon codicon-${icon}"></span></div>`
  ).join("");

  return htmlShell({
    title: "Edit Action",
    cspSource: ctx.cspSource,
    nonce: ctx.nonce,
    codiconStyles: ctx.codiconStyles,
    styles: `
      body {
        font-family: var(--vscode-font-family);
        color: var(--vscode-foreground);
        background: transparent;
        padding: 12px;
        margin: 0;
      }
      .lp-form-header {
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.35));
      }
      .lp-form-header h2 { margin: 0 0 4px 0; font-size: 16px; }
      ${formStyles}
      .lp-form-group input[type="text"],
      .lp-form-group select {
        width: 100%;
        padding: 6px 8px;
        font-size: 12px;
        font-family: inherit;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border, transparent);
        border-radius: 3px;
        box-sizing: border-box;
      }
      .lp-form-group label { display: block; margin-bottom: 6px; font-weight: 500; font-size: 12px; }
      .lp-hint { font-size: 11px; opacity: 0.7; margin-top: 4px; }
      ${iconGridStyles}
      .lp-form-actions { display: flex; gap: 8px; margin-top: 20px; }
      
      ${buttonStyles}
    `,
    body: `
      <div class="lp-form-header">
        <h2>\u270f\ufe0f Edit Action</h2>
      </div>
      <form id="editActionForm">
        <div class="lp-form-group">
          <label for="name">Name *</label>
          <input type="text" id="name" value="${esc(item.name)}" required>
          <div class="lp-hint">Display name for this action</div>
        </div>
        <div class="lp-form-group">
          <label for="type">Type *</label>
          <select id="type" required>
            ${typeOptions}
            <option value="custom" ${isCustomType ? "selected" : ""}>\u270f\ufe0f Custom type...</option>
          </select>
          <input type="text" id="customType" placeholder="Enter custom type" value="${isCustomType ? esc(item.type) : ""}" style="display: ${isCustomType ? "block" : "none"}; margin-top: 4px;">
          <div class="lp-hint" id="typeHint">Select a type or create a custom one</div>
        </div>
        <div class="lp-form-group" id="customTypeSection" style="display: ${isCustomType ? "block" : "none"};">
          <label>Custom Type Icon</label>
          <div class="lp-icon-picker">
            <div class="lp-icon-picker-title">Choose a codicon (or enter a custom name below):</div>
            <div class="lp-icon-grid" id="iconGrid">
              ${iconGrid}
            </div>
            <input type="text" id="customIconInput" placeholder="Or enter codicon name (e.g., rocket)" value="${currentIcon}">
            <div class="lp-hint">Browse all codicons at <a href="https://microsoft.github.io/vscode-codicons/dist/codicon.html" style="color: var(--vscode-textLink-foreground);">microsoft.github.io/vscode-codicons</a></div>
          </div>
        </div>
        

        
        <div class="lp-form-group">
          <label for="command">Command *</label>
          <input type="text" id="command" value="${esc(item.command)}" required>
          <div class="lp-hint" id="commandHint">Shell command to execute</div>
        </div>
        <div class="lp-form-actions">
          <button type="button" class="lp-btn lp-btn-secondary" id="cancelBtn">Cancel</button>
          <button type="submit" class="lp-btn lp-btn-primary">Update</button>
        </div>
      </form>
    `,
    script: `
      (function () {
        const vscode = acquireVsCodeApi();
        const oldItem = ${itemJson};
        const typeSelect = document.getElementById('type');
        const customTypeInput = document.getElementById('customType');
        const customTypeSection = document.getElementById('customTypeSection');
        const iconGrid = document.getElementById('iconGrid');
        const customIconInput = document.getElementById('customIconInput');
        let selectedIcon = '${currentIcon}';

        iconGrid.addEventListener('click', (e) => {
          const option = e.target.closest('.lp-icon-option');
          if (!option) return;
          iconGrid.querySelectorAll('.lp-icon-option').forEach(opt => opt.classList.remove('selected'));
          option.classList.add('selected');
          selectedIcon = option.dataset.icon;
          customIconInput.value = selectedIcon;
        });

        customIconInput.addEventListener('input', () => {
          iconGrid.querySelectorAll('.lp-icon-option').forEach(opt => opt.classList.remove('selected'));
          selectedIcon = customIconInput.value;
        });

        typeSelect.addEventListener('change', () => {
          if (typeSelect.value === 'custom') {
            customTypeInput.style.display = 'block';
            customTypeInput.required = true;
            customTypeSection.style.display = 'block';
          } else {
            customTypeInput.style.display = 'none';
            customTypeInput.required = false;
            customTypeSection.style.display = 'none';
          }
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
          vscode.postMessage({ command: 'cancelForm' });
        });

        document.getElementById('editActionForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const name = document.getElementById('name').value.trim();
          const type = typeSelect.value === 'custom' ? customTypeInput.value.trim() : typeSelect.value;
          const command = document.getElementById('command').value.trim();

          if (!name || !type || !command) return;
          const item = { name, type, command };
          if (typeSelect.value === 'custom' && selectedIcon) {
            vscode.postMessage({ command: 'submitEditAction', oldItem, newItem: item, customIcon: selectedIcon });
          } else {
            vscode.postMessage({ command: 'submitEditAction', oldItem, newItem: item });
          }
        });
      })();
    `,
  });
}
