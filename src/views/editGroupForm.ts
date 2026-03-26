import { htmlShell } from "../templates/layout";
import { buttonStyles, formStyles, iconPickerStyles } from "../templates/styles";
import { esc } from "./helpers";
import type { Group } from "../types";

export interface EditGroupContext {
  cspSource: string;
  nonce: string;
  codiconStyles: string;
  group: Group;
  availableIcons: string[];
  customColors: string[];
}

export function renderEditGroupForm(ctx: EditGroupContext): string {
  const { group } = ctx;
  const groupJson = JSON.stringify(group);
  const iconOptions = ctx.availableIcons
    .map(
      (icon) =>
        `<div class="lp-icon-option ${icon === group.icon ? "selected" : ""}" data-icon="${icon}"><span class="codicon codicon-${icon}"></span></div>`
    )
    .join("");

  return htmlShell({
    title: "Edit Group",
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
      .lp-form-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      .lp-form-header h3 { margin: 0; }
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
      ${iconPickerStyles}
      ${buttonStyles}
    `,
    body: `
      <div class="lp-form-header">
        <h3>Edit Group: ${esc(group.name)}</h3>
        <button type="button" class="lp-close-btn" id="closeBtn" title="Cancel">
          <span class="codicon codicon-close"></span>
        </button>
      </div>
      <form id="editGroupForm">
        <div class="lp-form-group">
          <label for="groupName">Group Name *</label>
          <input type="text" id="groupName" placeholder="e.g., Build Scripts" value="${esc(group.name)}" required>
        </div>
        <div class="lp-form-group">
          <label>Icon (optional)</label>
          <div class="lp-icon-picker" id="iconPicker">
            ${iconOptions}
          </div>
          <input type="text" id="customIcon" placeholder="Or enter codicon name (e.g., 'folder') or emoji" value="${esc(group.icon || "")}" style="margin-top: 6px; width: 100%;">
          <div class="lp-hint">Click an icon above or type codicon name/emoji</div>
        </div>

        <div class="lp-form-group">
          <label>Secondary Grouping (Optional)</label>
          <select id="secondaryGroupBy" style="width: 100%; padding: 6px; margin-top: 4px; background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border: 1px solid var(--vscode-dropdown-border);">
            <option value="none" ${group.secondaryGroupBy !== 'workspace' && group.secondaryGroupBy !== 'type' ? 'selected' : ''}>None</option>
            <option value="workspace" ${group.secondaryGroupBy === 'workspace' ? 'selected' : ''}>Group by Workspace / Portal</option>
            <option value="type" ${group.secondaryGroupBy === 'type' ? 'selected' : ''}>Group by Type (build, test, etc.)</option>
          </select>
          <div class="lp-hint">Use this to organize commands into sub-folders for monorepos.</div>
        </div>

        <div class="lp-form-actions">
          <button type="button" class="lp-btn lp-btn-secondary" id="cancelBtn">Cancel</button>
          <button type="submit" class="lp-btn lp-btn-primary">Save Changes</button>
        </div>
      </form>
    `,
    script: `
      (function () {
        const vscode = acquireVsCodeApi();
        const oldGroup = ${groupJson};
        let selectedIcon = '${esc(group.icon || "")}';

        // Event delegation for icon picker and cancel
        document.addEventListener('click', (e) => {
          const target = e.target.closest('.lp-icon-option, #cancelBtn, #closeBtn');
          if (!target) return;

          // Icon selection
          if (target.classList.contains('lp-icon-option')) {
            document.querySelectorAll('.lp-icon-option').forEach(o => o.classList.remove('selected'));
            target.classList.add('selected');
            selectedIcon = target.getAttribute('data-icon');
            document.getElementById('customIcon').value = '';
            return;
          }

          // Cancel / close button
          if (target.id === 'cancelBtn' || target.id === 'closeBtn') {
            vscode.postMessage({ command: 'cancelForm' });
            return;
          }
        });

        document.getElementById('customIcon').addEventListener('input', (e) => {
          document.querySelectorAll('.lp-icon-option').forEach(o => o.classList.remove('selected'));
          selectedIcon = e.target.value;
        });

        document.getElementById('editGroupForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const groupName = document.getElementById('groupName').value.trim();
          const customIcon = document.getElementById('customIcon').value.trim();
          const secondaryGroupBy = document.getElementById('secondaryGroupBy').value;
          const icon = customIcon || selectedIcon || '';

          if (!groupName) return;
          const newGroup = {
            name: groupName,
            icon: icon || undefined,
            secondaryGroupBy: (secondaryGroupBy === 'workspace' || secondaryGroupBy === 'type') ? secondaryGroupBy : undefined,
          };
          vscode.postMessage({ command: 'submitEditGroup', oldGroup, newGroup });
        });
      })();
    `,
  });
}
