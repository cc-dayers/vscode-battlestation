import { htmlShell } from "../templates/layout";
import { renderColorPicker, colorPickerScript } from "./components/colorPicker";
import { buttonStyles, formStyles, iconPickerStyles, colorPickerStyles } from "../templates/styles";

export interface AddGroupContext {
  cspSource: string;
  nonce: string;
  codiconStyles: string;
  availableIcons: string[];
  customColors: string[];
}

export function renderAddGroupForm(ctx: AddGroupContext): string {
  const { customColors } = ctx;
  const iconOptions = ctx.availableIcons
    .map(
      (icon) =>
        `<div class="lp-icon-option" data-icon="${icon}"><span class="codicon codicon-${icon}"></span></div>`
    )
    .join("");

  // Use shared color picker instead of manual html logic
  // We need to import renderColorPicker at top of file, so we'll do a multi-edit or assume imports are added.
  // Actually, I need to make sure imports are present. 
  // Since I can't easily see imports here without context, I will just use the available ones or assume I added them.
  // Wait, I haven't added updates to imports yet.

  return htmlShell({
    title: "Add Group",
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
      ${colorPickerStyles}
      ${buttonStyles}
    `,
    body: `
      <h3>Add New Group</h3>
      <form id="addGroupForm">
        <div class="lp-form-group">
          <label for="groupName">Group Name *</label>
          <input type="text" id="groupName" placeholder="e.g., Build Scripts" required>
        </div>
        <div class="lp-form-group">
          <label>Icon (optional)</label>
          <div class="lp-icon-picker" id="iconPicker">
            ${iconOptions}
          </div>
          <input type="text" id="customIcon" placeholder="Or enter codicon name (e.g., 'folder') or emoji" style="margin-top: 6px; width: 100%;">
          <div class="lp-hint">Click an icon above or type codicon name/emoji</div>
        </div>

        <div class="lp-form-group">
          ${renderColorPicker({
      id: "customColor",
      value: "",
      customColors,
      label: "Text/Icon Color (optional)",
      placeholder: "e.g. #ff0000 or var(--color)"
    })}
        </div>
        
        <div class="lp-form-group">
          ${renderColorPicker({
      id: "customBgColor",
      value: "",
      customColors,
      label: "Background Color (optional)",
      placeholder: "e.g. #ff0000 or var(--color)"
    })}
        </div>

        <div class="lp-form-group">
           ${renderColorPicker({
      id: "customBorderColor",
      value: "",
      customColors,
      label: "Border Color (optional)",
      placeholder: "e.g. #ff0000 or var(--color)"
    })}
        </div>

        <div class="lp-form-actions">
          <button type="button" class="lp-btn lp-btn-secondary" id="cancelBtn">Cancel</button>
          <button type="submit" class="lp-btn lp-btn-primary">Add Group</button>
        </div>
      </form>
    `,
    script: `
      ${colorPickerScript}
      (function () {
        const vscode = acquireVsCodeApi();
        let selectedIcon = '';
        
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
          selectedIcon = e.target.value.trim();
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

        document.getElementById('addGroupForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const name = document.getElementById('groupName').value.trim();
          const customIcon = document.getElementById('customIcon').value.trim();
          const icon = customIcon || selectedIcon;
          
          const color = document.getElementById('customColor').value.trim();
          const backgroundColor = document.getElementById('customBgColor').value.trim();
          const borderColor = document.getElementById('customBorderColor').value.trim();
          
          if (name) {
            vscode.postMessage({ 
              command: 'submitNewGroup', 
              group: { 
                name, 
                icon: icon || undefined, 
                color: color || undefined,
                backgroundColor: backgroundColor || undefined,
                borderColor: borderColor || undefined
              } 
            });
          }
        });
      })();
    `,
  });
}
