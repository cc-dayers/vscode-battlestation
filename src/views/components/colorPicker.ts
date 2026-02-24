
import { esc } from "../helpers";

export const THEME_COLORS = [
  { name: "Blue", value: "var(--vscode-charts-blue)" },
  { name: "Red", value: "var(--vscode-charts-red)" },
  { name: "Green", value: "var(--vscode-charts-green)" },
  { name: "Yellow", value: "var(--vscode-charts-yellow)" },
  { name: "Orange", value: "var(--vscode-charts-orange)" },
  { name: "Purple", value: "var(--vscode-charts-purple)" },
  { name: "Pink", value: "var(--vscode-charts-pink)" },
  { name: "Foreground", value: "var(--vscode-foreground)" },
  { name: "Error", value: "var(--vscode-errorForeground)" },
  { name: "Warning", value: "var(--vscode-editorWarning-foreground)" },
  { name: "Info", value: "var(--vscode-editorInfo-foreground)" },
  { name: "Success", value: "var(--vscode-testing-iconPassed)" },
];

export interface ColorPickerOptions {
  id: string; // Base ID for this picker instance
  value?: string;
  customColors?: string[];
  label?: string;
  placeholder?: string;
  onChange?: string; // Optional JS callback name
}

export function renderColorPicker(opts: ColorPickerOptions): string {
  const { id, value, customColors = [], label, placeholder } = opts;

  const themeOptions = THEME_COLORS.map(
    (color) =>
      `<div class="lp-color-option ${color.value === value ? "selected" : ""}" 
            data-color="${color.value}" 
            style="background: ${color.value};" 
            title="${color.name}"
            role="button"
            tabindex="0"></div>`
  ).join("");

  const customOptions = customColors
    .map(
      (color) =>
        `<div class="lp-color-option ${color === value ? "selected" : ""}" 
                data-color="${color}" 
                style="background: ${color};" 
                title="${color}"
                role="button"
                tabindex="0"></div>`
    )
    .join("");

  return `
    <div class="lp-color-picker-container" id="${id}-container">
      ${label ? `<label class="lp-picker-label">${label}</label>` : ""}
      
      <div class="lp-color-sections">
        <div class="lp-color-section">
          <div class="lp-color-section-header">
            <span>Template Colors</span>
          </div>
          <div class="lp-color-grid" id="${id}-theme-grid">
            ${themeOptions}
          </div>
        </div>

        <div class="lp-color-section">
          <div class="lp-color-section-header">
            <span>Saved Colors</span>
            <button type="button" class="lp-add-color-btn" id="${id}-toggle-btn" title="Add custom color" aria-label="Add custom color">
              <span class="codicon codicon-add"></span>
              <span>Add</span>
            </button>
          </div>
          ${customColors.length > 0
      ? `<div class="lp-color-grid" id="${id}-custom-grid">${customOptions}</div>`
      : `<div class="lp-no-custom-colors">No saved colors yet</div>`}
        </div>
      </div>

      <div class="lp-color-input-row" id="${id}-input-row" style="display: none;">
        <div class="lp-color-preview" id="${id}-preview" style="background: ${value || 'transparent'};"></div>
        <input type="text" id="${id}" 
               class="lp-color-text-input"
               placeholder="${placeholder || 'e.g. #ff0000 or var(--color)'}" 
               value="${esc(value || "")}">
        <div class="lp-native-picker-wrapper">
           <input type="color" id="${id}-native" value="${value?.startsWith('#') ? value : '#000000'}" title="Pick from color wheel">
           <span class="codicon codicon-color-mode"></span>
        </div>
      </div>
      <!-- <div class="lp-hint">Use theme colors for best dark/light mode support.</div> -->
    </div>
  `;
}

export const colorPickerScript = `
  // Shared Color Picker Logic
  (function() {
    window.initColorPicker = function(id) {
      const container = document.getElementById(id + '-container');
      if (!container) return;

      const input = document.getElementById(id);
      const nativeInput = document.getElementById(id + '-native');
      const preview = document.getElementById(id + '-preview');
      const toggleBtn = document.getElementById(id + '-toggle-btn');
      const inputRow = document.getElementById(id + '-input-row');

      function updateUI(color, skipInput = false) {
        if (!skipInput) input.value = color;
        preview.style.background = color;
        
        // Update selection state
        container.querySelectorAll('.lp-color-option').forEach(opt => {
          if (opt.getAttribute('data-color') === color) {
            opt.classList.add('selected');
          } else {
            opt.classList.remove('selected');
          }
        });

        // Sync native picker if hex
        if (color && color.startsWith('#') && color.length === 7) {
            nativeInput.value = color;
        }
      }
      
      // Toggle Input Visibility
      if (toggleBtn && inputRow) {
          toggleBtn.addEventListener('click', (e) => {
              e.preventDefault();
              const isHidden = inputRow.style.display === 'none';
              inputRow.style.display = isHidden ? 'flex' : 'none';
              if (isHidden) {
                  input.focus();
              }
          });
      }

      // Handle swatch clicks
      container.addEventListener('click', (e) => {
        const option = e.target.closest('.lp-color-option');
        if (option) {
          const color = option.getAttribute('data-color');
          updateUI(color);
          // Trigger input event for form change tracking
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      // Handle text input
      input.addEventListener('input', (e) => {
        updateUI(e.target.value, true);
      });

      // Handle native picker
      nativeInput.addEventListener('input', (e) => {
        const val = e.target.value;
        updateUI(val);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });

      // Initialize native picker with value if it's hex
      if (input.value && input.value.startsWith('#')) {
        nativeInput.value = input.value;
      }
      
      // If we have a value that isn't in the grid, show the input row?
      // Optional: Logic to auto-open if value is custom
      const inGrid = Array.from(container.querySelectorAll('.lp-color-option'))
        .some(opt => opt.getAttribute('data-color') === input.value);
        
      if (input.value && !inGrid && inputRow) {
          inputRow.style.display = 'flex';
      }
    };
  })();
`;
