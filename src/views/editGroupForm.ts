import { htmlShell } from "../templates/layout";
import { buttonStyles, formStyles, iconPickerStyles, colorPickerStyles } from "../templates/styles";
import { esc } from "./helpers";
import type { Group } from "../types";

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

export interface EditGroupContext {
  cspSource: string;
  nonce: string;
  codiconStyles: string;
  group: Group;
  availableIcons: string[];
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

  const colorOptions = THEME_COLORS
    .map(
      (color) =>
        `<div class="lp-color-option ${color.value === group.color ? "selected" : ""}" data-color="${color.value}" style="background: ${color.value};" title="${color.name}"></div>`
    )
    .join("");

  const bgColorOptions = THEME_COLORS
    .map(
      (color) =>
        `<div class="lp-color-option ${color.value === group.backgroundColor ? "selected" : ""}" data-color="${color.value}" style="background: ${color.value};" title="${color.name}"></div>`
    )
    .join("");

  const borderColorOptions = THEME_COLORS
    .map(
      (color) =>
        `<div class="lp-color-option ${color.value === group.borderColor ? "selected" : ""}" data-color="${color.value}" style="background: ${color.value};" title="${color.name}"></div>`
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
      ${colorPickerStyles}
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
          <label>Text/Icon Color (optional)</label>
          <div class="lp-color-picker" id="colorPicker">
            ${colorOptions}
          </div>
          <div class="lp-hint">Color for text and icon in group header</div>
        </div>
        <div class="lp-form-group">
          <label>Background Color (optional)</label>
          <div class="lp-color-picker" id="bgColorPicker">
            ${bgColorOptions}
          </div>
          <div class="lp-hint">Background color for the group section</div>
        </div>
        <div class="lp-form-group">
          <label>Border Color (optional)</label>
          <div class="lp-color-picker" id="borderColorPicker">
            ${borderColorOptions}
          </div>
          <div class="lp-hint">Border color around the group section</div>
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
        let selectedColor = '${esc(group.color || "")}';
        let selectedBgColor = '${esc(group.backgroundColor || "")}';
        let selectedBorderColor = '${esc(group.borderColor || "")}';

        document.querySelectorAll('.lp-icon-option').forEach(opt => {
          opt.addEventListener('click', () => {
            document.querySelectorAll('.lp-icon-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedIcon = opt.getAttribute('data-icon');
            document.getElementById('customIcon').value = '';
          });
        });

        document.querySelectorAll('#colorPicker .lp-color-option').forEach(opt => {
          opt.addEventListener('click', () => {
            document.querySelectorAll('#colorPicker .lp-color-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedColor = opt.getAttribute('data-color');
          });
        });

        document.querySelectorAll('#bgColorPicker .lp-color-option').forEach(opt => {
          opt.addEventListener('click', () => {
            document.querySelectorAll('#bgColorPicker .lp-color-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedBgColor = opt.getAttribute('data-color');
          });
        });

        document.querySelectorAll('#borderColorPicker .lp-color-option').forEach(opt => {
          opt.addEventListener('click', () => {
            document.querySelectorAll('#borderColorPicker .lp-color-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedBorderColor = opt.getAttribute('data-color');
          });
        });

        document.getElementById('customIcon').addEventListener('input', (e) => {
          document.querySelectorAll('.lp-icon-option').forEach(o => o.classList.remove('selected'));
          selectedIcon = e.target.value;
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
          vscode.postMessage({ command: 'cancelForm' });
        });

        document.getElementById('editGroupForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const groupName = document.getElementById('groupName').value.trim();
          const customIcon = document.getElementById('customIcon').value.trim();
          const icon = customIcon || selectedIcon || '';
          if (!groupName) return;
          const newGroup = { 
            name: groupName, 
            icon: icon || undefined, 
            color: selectedColor || undefined,
            backgroundColor: selectedBgColor || undefined,
            borderColor: selectedBorderColor || undefined
          };
          vscode.postMessage({ command: 'submitEditGroup', oldGroup, newGroup });
        });
      })();
    `,
  });
}
