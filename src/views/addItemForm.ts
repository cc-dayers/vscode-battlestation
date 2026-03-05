import { htmlShell } from "../templates/layout";
import { buttonStyles, formStyles, iconGridStyles, colorPickerStyles } from "../templates/styles";
import { renderColorPicker, colorPickerScript } from "./components/colorPicker";

const COMMON_CODICONS = [
  "terminal", "package", "rocket", "play", "debug-alt", "beaker", "tools",
  "gear", "cloud", "cloud-upload", "cloud-download", "database", "server",
  "file-code", "code", "git-merge", "git-pull-request", "source-control",
  "check", "verified", "testing-passed", "error", "warning", "info",
  "folder", "file", "files", "save", "refresh", "sync", "search",
  "filter", "list-tree", "symbol-method", "json", "archive", "bookmark",
  "bug", "megaphone", "organization", "pulse", "eye", "flame", "star",
];

export interface AddActionContext {
  cspSource: string;
  nonce: string;
  codiconStyles: string;
  typeOptions: string;
  customColors: string[];
}

export function renderAddActionForm(ctx: AddActionContext): string {
  const iconGrid = COMMON_CODICONS.map(
    (icon) =>
      `<div class="lp-icon-option" data-icon="${icon}" title="${icon}"><span class="codicon codicon-${icon}"></span></div>`
  ).join("");

  return htmlShell({
    title: "Add Action",
    cspSource: ctx.cspSource,
    nonce: ctx.nonce,
    codiconStyles: ctx.codiconStyles,
    styles: `
      body {
        font-family: var(--vscode-font-family);
        color: var(--vscode-foreground);
        background: transparent;
        padding: 12px 8px;
        margin: 0;
      }
      h3 { margin: 0 0 12px; font-size: 13px; font-weight: 600; }
      ${formStyles}
      ${iconGridStyles}
      .lp-icon-option .codicon { font-size: 16px; }
      .lp-icon-option { opacity: 0.7; transition: all 0.2s; }
      .lp-icon-option:hover { opacity: 1; }
      .lp-icon-option.selected { opacity: 1; }
      .lp-icon-grid { max-height: 150px; }
      #customIconInput { margin-top: 8px; font-family: var(--vscode-editor-font-family); }
      ${colorPickerStyles}
      ${buttonStyles}
      .param-row { display:grid; grid-template-columns:1fr 1fr 1fr 1fr auto; gap:4px; margin-bottom:4px; align-items:center; }
      .param-row input { width:100%; padding:4px 6px; font-size:11px; font-family:inherit; background:var(--vscode-input-background); color:var(--vscode-input-foreground); border:1px solid var(--vscode-input-border,transparent); border-radius:2px; box-sizing:border-box; }
      .param-row button { padding:2px 6px; font-size:11px; cursor:pointer; background:var(--vscode-button-secondaryBackground); color:var(--vscode-button-secondaryForeground); border:none; border-radius:2px; }
      .param-header { display:grid; grid-template-columns:1fr 1fr 1fr 1fr auto; gap:4px; margin-bottom:2px; font-size:10px; opacity:.6; }
    `,
    body: `
      <h3>Add New Command</h3>
      <form id="addForm">
        <div class="lp-form-group">
          <label for="name">Name *</label>
          <input type="text" id="name" placeholder="e.g., Build Project" required>
        </div>
        <div class="lp-form-group">
          <label for="type">Type *</label>
          <select id="type" required>
            ${ctx.typeOptions}
            <option value="custom">\u270f\ufe0f Custom type...</option>
          </select>
          <input type="text" id="customType" placeholder="Enter custom type" style="display: none; margin-top: 4px;">
          <div class="lp-hint" id="typeHint">Select a type or create a custom one</div>
        </div>
        <div class="lp-form-group" id="customTypeSection" style="display: none;">
          <label>Custom Type Icon</label>
          <div class="lp-icon-picker">
            <div class="lp-icon-picker-title">Choose a codicon (or enter a custom name below):</div>
            <div class="lp-icon-grid" id="iconGrid">
              ${iconGrid}
            </div>
            <input type="text" id="customIconInput" placeholder="Or enter codicon name (e.g., rocket)">
            <div class="lp-hint">Browse all codicons at <a href="https://microsoft.github.io/vscode-codicons/dist/codicon.html" style="color: var(--vscode-textLink-foreground);">microsoft.github.io/vscode-codicons</a></div>
          </div>
        </div>
        <div class="lp-form-group">
          ${renderColorPicker({
        id: "customBgColor",
        value: "",
        customColors: ctx.customColors,
        label: "Button Background Color",
        placeholder: "e.g. #ff0000, rgba(...), or var(--color)"
      })}
          <div class="lp-hint">Background color for the action button</div>
        </div>
        <div class="lp-form-group">
          <label for="command">Command *</label>
          <input type="text" id="command" placeholder="e.g., npm run build" required>
          <div class="lp-hint" id="commandHint">Use <code>\${VAR}</code> for runtime inputs (see Parameters below)</div>
        </div>
        <div class="lp-form-group">
          <label>Parameters <span style="font-weight:400;opacity:.7">(optional)</span></label>
          <div id="paramsContainer"></div>
          <button type="button" class="lp-btn lp-btn-secondary" id="addParamBtn" style="margin-top:6px;font-size:11px;padding:3px 8px">+ Add Parameter</button>
          <div class="lp-hint">Each parameter prompts the user for input at run time and replaces <code>\${NAME}</code> in the command.</div>
        </div>
        <div class="lp-form-actions">
          <button type="button" class="lp-btn lp-btn-secondary" id="cancelBtn">Cancel</button>
          <button type="submit" class="lp-btn lp-btn-primary">Add</button>
        </div>
      </form>
    `,
    script: `
      ${colorPickerScript}
      (function () {
        const vscode = acquireVsCodeApi();
        const typeSelect = document.getElementById('type');
        const customTypeInput = document.getElementById('customType');
        const customTypeSection = document.getElementById('customTypeSection');
        const iconGrid = document.getElementById('iconGrid');
        const customIconInput = document.getElementById('customIconInput');
        const commandInput = document.getElementById('command');
        const typeHint = document.getElementById('typeHint');
        const commandHint = document.getElementById('commandHint');
        let selectedIcon = null;

        // Initialize shared color picker
        window.initColorPicker('customBgColor');

        iconGrid.addEventListener('click', (e) => {
          const option = e.target.closest('.lp-icon-option');
          if (!option) return;
          iconGrid.querySelectorAll('.lp-icon-option').forEach(opt => opt.classList.remove('selected'));
          option.classList.add('selected');
          selectedIcon = option.dataset.icon;
          customIconInput.value = selectedIcon;
        });

        // Save new custom colors for reuse
        document.getElementById('customBgColor').addEventListener('change', (e) => {
          const val = e.target.value?.trim();
          if (val && !val.startsWith('var(')) {
            vscode.postMessage({ command: 'saveCustomColor', color: val });
          }
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
            typeHint.textContent = 'Enter a custom type name';
          } else {
            customTypeInput.style.display = 'none';
            customTypeInput.required = false;
            customTypeSection.style.display = 'none';
            customTypeInput.value = '';
            if (typeSelect.value === 'vscode') {
              typeHint.textContent = 'Executes a VS Code command';
              commandHint.textContent = 'e.g., workbench.action.terminal.new';
              commandInput.placeholder = 'e.g., workbench.action.terminal.new';
            } else if (typeSelect.value.includes('npm') || typeSelect.value.includes('shell')) {
              typeHint.textContent = 'Runs the command in a terminal';
              commandHint.textContent = 'Shell command to execute';
              commandInput.placeholder = 'e.g., npm run build';
            } else {
              typeHint.textContent = 'Command type: ' + typeSelect.value;
              commandHint.textContent = 'Enter the command to execute';
              commandInput.placeholder = 'e.g., your-command here';
            }
          }
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
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

        document.getElementById('addForm').addEventListener('submit', (e) => {
          e.preventDefault();
          let itemType = typeSelect.value;
          if (itemType === 'custom') {
            itemType = customTypeInput.value.trim();
            if (!itemType) return;
          }
          const params = collectParams();
          const item = {
            name: document.getElementById('name').value.trim(),
            type: itemType,
            command: document.getElementById('command').value.trim(),
            backgroundColor: document.getElementById('customBgColor').value.trim() || undefined,
            params: params.length ? params : undefined
          };
          if (item.name && item.command) {
            const customIconValue = customIconInput ? customIconInput.value.trim() : null;
            if (customIconValue) {
              vscode.postMessage({ command: 'submitNewActionWithIcon', item, customIcon: customIconValue });
            } else {
              vscode.postMessage({ command: 'submitNewAction', item });
            }
          }
        });
      })();
    `,
  });
}
