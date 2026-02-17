import { htmlShell } from "../templates/layout";
import { buttonStyles, formStyles, iconPickerStyles, colorPickerStyles } from "../templates/styles";

const THEME_COLORS = [
  { name: "Red", value: "var(--vscode-charts-red)" },
  { name: "Orange", value: "var(--vscode-charts-orange)" },
  { name: "Yellow", value: "var(--vscode-charts-yellow)" },
  { name: "Green", value: "var(--vscode-charts-green)" },
  { name: "Blue", value: "var(--vscode-charts-blue)" },
  { name: "Purple", value: "var(--vscode-charts-purple)" },
  { name: "Pink", value: "var(--vscode-charts-pink)" },
  { name: "Foreground", value: "var(--vscode-foreground)" },
  { name: "Error", value: "var(--vscode-errorForeground)" },
  { name: "Warning", value: "var(--vscode-editorWarning-foreground)" },
  { name: "Info", value: "var(--vscode-editorInfo-foreground)" },
  { name: "Success", value: "var(--vscode-testing-iconPassed)" },
];

export interface AddGroupContext {
  cspSource: string;
  nonce: string;
  codiconStyles: string;
  availableIcons: string[];
}

export function renderAddGroupForm(ctx: AddGroupContext): string {
  const iconOptions = ctx.availableIcons
    .map(
      (icon) =>
        `<div class="lp-icon-option" data-icon="${icon}"><span class="codicon codicon-${icon}"></span></div>`
    )
    .join("");

  const colorOptions = THEME_COLORS
    .map(
      (color) =>
        `<div class="lp-color-option" data-color="${color.value}" style="background: ${color.value};" title="${color.name}"></div>`
    )
    .join("");

  const bgColorOptions = THEME_COLORS
    .map(
      (color) =>
        `<div class="lp-color-option" data-color="${color.value}" style="background: ${color.value};" title="${color.name}"></div>`
    )
    .join("");

  const borderColorOptions = THEME_COLORS
    .map(
      (color) =>
        `<div class="lp-color-option" data-color="${color.value}" style="background: ${color.value};" title="${color.name}"></div>`
    )
    .join("");

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
          <label>Text/Icon Color (optional)</label>
          <div class="lp-color-picker" id="colorPicker">
            ${colorOptions}
          </div>
          <input type="text" id="customColor" placeholder="Or enter color (e.g., #ff0000, rgba(...), or var(...))" style="margin-top: 6px; width: 100%;">
          <div class="lp-hint">Color for text and icon in group header</div>
        </div>
        <div class="lp-form-group">
          <label>Background Color (optional)</label>
          <div class="lp-color-picker" id="bgColorPicker">
            ${bgColorOptions}
          </div>
          <input type="text" id="customBgColor" placeholder="Or enter color (e.g., #ff0000, rgba(...), or var(...))" style="margin-top: 6px; width: 100%;">
          <div class="lp-hint">Background color for the group section</div>
        </div>
        <div class="lp-form-group">
          <label>Border Color (optional)</label>
          <div class="lp-color-picker" id="borderColorPicker">
            ${borderColorOptions}
          </div>
          <input type="text" id="customBorderColor" placeholder="Or enter color (e.g., #ff0000, rgba(...), or var(...))" style="margin-top: 6px; width: 100%;">
          <div class="lp-hint">Border color around the group section</div>
        </div>
        <div class="lp-form-actions">
          <button type="button" class="lp-btn lp-btn-secondary" id="cancelBtn">Cancel</button>
          <button type="submit" class="lp-btn lp-btn-primary">Add Group</button>
        </div>
      </form>
    `,
    script: `
      (function () {
        const vscode = acquireVsCodeApi();
        let selectedIcon = '';
        
        // Helper to handle color selection logic
        function handleColorSelection(wrapperId, inputId, selectedValue) {
          const wrapper = document.getElementById(wrapperId);
          const input = document.getElementById(inputId);
          
          // Clear previous selection
          wrapper.querySelectorAll('.lp-color-option').forEach(o => o.classList.remove('selected'));
          
          // Find if there's a matching preset
          const matchingPreset = Array.from(wrapper.querySelectorAll('.lp-color-option'))
            .find(o => o.getAttribute('data-color') === selectedValue);
            
          if (matchingPreset) {
            matchingPreset.classList.add('selected');
          }
          
          // Update input if it doesn't match (for manual typing, we don't want to overwrite)
          if (input.value !== selectedValue) {
             input.value = selectedValue;
          }
        }

        // Event delegation for all click events
        document.addEventListener('click', (e) => {
          const target = e.target.closest('.lp-icon-option, .lp-color-option, #cancelBtn');
          if (!target) return;

          // Icon selection
          if (target.classList.contains('lp-icon-option')) {
            document.querySelectorAll('.lp-icon-option').forEach(o => o.classList.remove('selected'));
            target.classList.add('selected');
            selectedIcon = target.getAttribute('data-icon');
            document.getElementById('customIcon').value = '';
            return;
          }

          // Color selection
          if (target.classList.contains('lp-color-option')) {
            const parent = target.parentElement;
            const color = target.getAttribute('data-color');
            
            if (parent.id === 'colorPicker') {
              handleColorSelection('colorPicker', 'customColor', color);
            } else if (parent.id === 'bgColorPicker') {
              handleColorSelection('bgColorPicker', 'customBgColor', color);
            } else if (parent.id === 'borderColorPicker') {
              handleColorSelection('borderColorPicker', 'customBorderColor', color);
            }
            return;
          }

          // Cancel button
          if (target.id === 'cancelBtn') {
            vscode.postMessage({ command: 'cancelForm' });
            return;
          }
        });
        
        // Listen for manual color input to clear presets if needed
        ['customColor', 'customBgColor', 'customBorderColor'].forEach(id => {
            const pickerId = id === 'customColor' ? 'colorPicker' : (id === 'customBgColor' ? 'bgColorPicker' : 'borderColorPicker');
            document.getElementById(id).addEventListener('input', (e) => {
                const val = e.target.value;
                handleColorSelection(pickerId, id, val);
            });
        });

        document.getElementById('customIcon').addEventListener('input', (e) => {
          document.querySelectorAll('.lp-icon-option').forEach(o => o.classList.remove('selected'));
          selectedIcon = e.target.value.trim();
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
