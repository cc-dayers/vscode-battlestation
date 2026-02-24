import { htmlShell } from "../templates/layout";
import { buttonStyles, formStyles, iconPickerStyles } from "../templates/styles";
import { esc } from "./helpers";
import type { Group } from "../types";
import { renderColorPicker, colorPickerScript } from "./components/colorPicker";

export interface EditGroupContext {
  cspSource: string;
  nonce: string;
  codiconStyles: string;
  group: Group;
  availableIcons: string[];
  customColors: string[];
}

export function renderEditGroupForm(ctx: EditGroupContext): string {
  const { group, customColors } = ctx;
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
      ${formStyles}
      ${iconPickerStyles}
      ${buttonStyles}
    `,
    body: `
      <h3>Edit Group: ${esc(group.name)}</h3>
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
          ${renderColorPicker({
      id: "customColor",
      value: group.color,
      customColors,
      label: "Text/Icon Color (optional)",
      placeholder: "e.g. #ff0000 or var(--color)"
    })}
        </div>
        
        <div class="lp-form-group">
          ${renderColorPicker({
      id: "customBgColor",
      value: group.backgroundColor,
      customColors,
      label: "Background Color (optional)",
      placeholder: "e.g. #ff0000 or var(--color)"
    })}
        </div>

        <div class="lp-form-group">
           ${renderColorPicker({
      id: "customBorderColor",
      value: group.borderColor,
      customColors,
      label: "Border Color (optional)",
      placeholder: "e.g. #ff0000 or var(--color)"
    })}
        </div>

        <div class="lp-form-actions">
          <button type="button" class="lp-btn lp-btn-secondary" id="cancelBtn">Cancel</button>
          <button type="submit" class="lp-btn lp-btn-primary">Save Changes</button>
        </div>
      </form>
    `,
    script: `
      ${colorPickerScript}
      (function () {
        const vscode = acquireVsCodeApi();
        const oldGroup = ${groupJson};
        let selectedIcon = '${esc(group.icon || "")}';

        // Initialize color pickers
        window.initColorPicker('customColor');
        window.initColorPicker('customBgColor');
        window.initColorPicker('customBorderColor');

        // Event delegation for icon picker and cancel
        document.addEventListener('click', (e) => {
          const target = e.target.closest('.lp-icon-option, #cancelBtn');
          if (!target) return;

          // Icon selection
          if (target.classList.contains('lp-icon-option')) {
            document.querySelectorAll('.lp-icon-option').forEach(o => o.classList.remove('selected'));
            target.classList.add('selected');
            selectedIcon = target.getAttribute('data-icon');
            document.getElementById('customIcon').value = '';
            return;
          }

          // Cancel button
          if (target.id === 'cancelBtn') {
            vscode.postMessage({ command: 'cancelForm' });
            return;
          }
        });

        document.getElementById('customIcon').addEventListener('input', (e) => {
          document.querySelectorAll('.lp-icon-option').forEach(o => o.classList.remove('selected'));
          selectedIcon = e.target.value;
        });

        // Watch for custom color inputs to save them
        ['customColor', 'customBgColor', 'customBorderColor'].forEach(id => {
           document.getElementById(id).addEventListener('change', (e) => {
               const val = e.target.value;
               if (val && !val.startsWith('var(')) {
                   vscode.postMessage({ command: 'saveCustomColor', color: val });
               }
           });
        });

        document.getElementById('editGroupForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const groupName = document.getElementById('groupName').value.trim();
          const customIcon = document.getElementById('customIcon').value.trim();
          const icon = customIcon || selectedIcon || '';
          
          const color = document.getElementById('customColor').value.trim();
          const backgroundColor = document.getElementById('customBgColor').value.trim();
          const borderColor = document.getElementById('customBorderColor').value.trim();
          
          if (!groupName) return;
          const newGroup = { 
            name: groupName, 
            icon: icon || undefined, 
            color: color || undefined,
            backgroundColor: backgroundColor || undefined,
            borderColor: borderColor || undefined
          };
          vscode.postMessage({ command: 'submitEditGroup', oldGroup, newGroup });
        });
      })();
    `,
  });
}
