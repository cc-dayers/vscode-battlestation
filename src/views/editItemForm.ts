import { htmlShell } from "../templates/layout";
import { buttonStyles, formStyles, iconGridStyles, colorPickerStyles } from "../templates/styles";
import { renderColorPicker, colorPickerScript } from "./components/colorPicker";
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
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.35));
      }
      .lp-form-header h2 { margin: 0; font-size: 16px; }
      .lp-close-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--vscode-foreground);
        opacity: 0.6;
        padding: 2px 4px;
        border-radius: 3px;
        display: flex;
        align-items: center;
        line-height: 1;
      }
      .lp-close-btn:hover { opacity: 1; background: var(--vscode-toolbar-hoverBackground); }
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
      ${colorPickerStyles}
      .param-row { display:grid; grid-template-columns:1fr 1fr 1fr 1fr auto; gap:4px; margin-bottom:4px; align-items:center; }
      .param-row input { width:100%; padding:4px 6px; font-size:11px; font-family:inherit; background:var(--vscode-input-background); color:var(--vscode-input-foreground); border:1px solid var(--vscode-input-border,transparent); border-radius:2px; box-sizing:border-box; }
      .param-row button { padding:2px 6px; font-size:11px; cursor:pointer; background:var(--vscode-button-secondaryBackground); color:var(--vscode-button-secondaryForeground); border:none; border-radius:2px; }
      .param-header { display:grid; grid-template-columns:1fr 1fr 1fr 1fr auto; gap:4px; margin-bottom:2px; font-size:10px; opacity:.6; }
      ${buttonStyles}
    `,
    body: `
      <div class="lp-form-header">
        <h2>\u270f\ufe0f Edit Action</h2>
        <button type="button" class="lp-close-btn" id="closeBtn" title="Cancel">
          <span class="codicon codicon-close"></span>
        </button>
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
          <div class="lp-hint" id="commandHint">Use <code>\${VAR}</code> for runtime inputs (see Parameters below)</div>
        </div>
        <div class="lp-form-group">
          <label>Parameters <span style="font-weight:400;opacity:.7">(optional)</span></label>
          <div id="paramsContainer"></div>
          <button type="button" class="lp-btn lp-btn-secondary" id="addParamBtn" style="margin-top:6px;font-size:11px;padding:3px 8px">+ Add Parameter</button>
          <div class="lp-hint">Each parameter prompts the user for input at run time and replaces <code>\${NAME}</code> in the command.</div>
        </div>
        <div class="lp-form-group">
          <label>Button Background Color</label>
          ${renderColorPicker({ id: 'customBgColor', value: item.backgroundColor || '', customColors })}
          <div class="lp-hint">Background color for the action button</div>
        </div>
        <div class="lp-form-actions">
          <button type="button" class="lp-btn lp-btn-secondary" id="cancelBtn">Cancel</button>
          <button type="submit" class="lp-btn lp-btn-primary">Update</button>
        </div>
      </form>
    `,
    script: `
      ${colorPickerScript}
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
        document.getElementById('closeBtn').addEventListener('click', () => {
          vscode.postMessage({ command: 'cancelForm' });
        });

        // ── Params ──
        const paramsContainer = document.getElementById('paramsContainer');
        function addParamRow(p) {
          const hdr = paramsContainer.children.length === 0
            ? '<div class="param-header"><span>Name</span><span>Prompt</span><span>Default</span><span>Options (csv)</span><span></span></div>'
            : '';
          const row = document.createElement('div');
          row.innerHTML = hdr + '<div class="param-row">'
            + '<input placeholder="ENV" value="' + (p?.name||'') + '">'
            + '<input placeholder="Label shown to user" value="' + (p?.prompt||'') + '">'
            + '<input placeholder="optional" value="' + (p?.default||'') + '">'
            + '<input placeholder="a,b,c" value="' + ((p?.options||[]).join(',')) + '">'
            + '<button type="button" title="Remove">✕</button>'
            + '</div>';
          row.querySelector('button').addEventListener('click', () => row.remove());
          paramsContainer.appendChild(row);
        }
        (oldItem.params || []).forEach(p => addParamRow(p));
        document.getElementById('addParamBtn').addEventListener('click', () => addParamRow(null));

        function collectParams() {
          return Array.from(paramsContainer.querySelectorAll('.param-row')).map(row => {
            const inputs = row.querySelectorAll('input');
            const opts = inputs[3].value.trim();
            return {
              name: inputs[0].value.trim(),
              prompt: inputs[1].value.trim(),
              default: inputs[2].value.trim() || undefined,
              options: opts ? opts.split(',').map(s => s.trim()).filter(Boolean) : undefined
            };
          }).filter(p => p.name && p.prompt);
        }

        document.getElementById('editActionForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const name = document.getElementById('name').value.trim();
          const type = typeSelect.value === 'custom' ? customTypeInput.value.trim() : typeSelect.value;
          const command = document.getElementById('command').value.trim();

          if (!name || !type || !command) return;
          const params = collectParams();
          const backgroundColor = document.getElementById('customBgColor').value.trim() || undefined;
          const item = { name, type, command, backgroundColor, params: params.length ? params : undefined };
          if (typeSelect.value === 'custom' && selectedIcon) {
            vscode.postMessage({ command: 'submitEditAction', oldItem, newItem: item, customIcon: selectedIcon });
          } else {
            vscode.postMessage({ command: 'submitEditAction', oldItem, newItem: item });
          }
        });
      })();
      if (typeof initColorPicker === 'function') initColorPicker('customBgColor');
    `,
  });
}
