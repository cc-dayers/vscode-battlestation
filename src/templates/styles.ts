/* ─── Shared CSS strings ─── */

export const baseStyles = `
  * { box-sizing: border-box; }
  body {
    font-family: var(--vscode-font-family);
    color: var(--vscode-foreground);
    background: transparent;
    padding: 8px;
    margin: 0;
    overflow-x: hidden;
  }
`;

export const buttonStyles = `
  .lp-btn {
    flex: 1;
    padding: 6px 12px;
    font-size: 12px;
    font-family: inherit;
    border: none;
    border-radius: 3px;
    cursor: pointer;
  }
  .lp-btn-primary {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
  }
  .lp-btn-primary:hover {
    background: var(--vscode-button-hoverBackground);
  }
  .lp-btn-secondary {
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
  }
  .lp-btn-secondary:hover {
    background: var(--vscode-button-secondaryHoverBackground);
  }
`;

export const formStyles = `
  .lp-form-group {
    margin-bottom: 12px;
  }
  .lp-form-group label {
    display: block;
    font-size: 11px;
    margin-bottom: 4px;
    opacity: 0.8;
  }
  .lp-form-group input,
  .lp-form-group select,
  .lp-form-group textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 4px 8px;
    font-size: 12px;
    font-family: inherit;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border, transparent);
    border-radius: 2px;
  }
  .lp-form-group input:focus,
  .lp-form-group select:focus,
  .lp-form-group textarea:focus {
    outline: 1px solid var(--vscode-focusBorder);
  }
  .lp-form-actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }
  .lp-hint {
    font-size: 10px;
    opacity: 0.6;
    margin-top: 2px;
  }
`;

export const iconPickerStyles = `
  .lp-icon-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }
  .lp-icon-option {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    cursor: pointer;
    border: 2px solid transparent;
    border-radius: 4px;
    background: var(--vscode-button-secondaryBackground);
  }
  .lp-icon-option:hover {
    background: var(--vscode-button-secondaryHoverBackground);
  }
  .lp-icon-option.selected {
    border-color: var(--vscode-focusBorder);
    background: var(--vscode-button-background);
  }
`;

export const iconGridStyles = `
  .lp-icon-picker {
    padding: 8px;
    background: var(--vscode-editor-background);
    border-radius: 3px;
    border: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.35));
  }
  .lp-icon-picker-title {
    font-size: 11px;
    margin-bottom: 8px;
    opacity: 0.8;
  }
  .lp-icon-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
    gap: 4px;
    margin-bottom: 8px;
    max-height: 180px;
    overflow-y: auto;
  }
  .lp-icon-option {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    border-radius: 3px;
    cursor: pointer;
    font-size: 18px;
  }
  .lp-icon-option:hover {
    background: var(--vscode-list-hoverBackground);
    border-color: var(--vscode-focusBorder);
  }
  .lp-icon-option.selected {
    background: var(--vscode-list-activeSelectionBackground);
    border-color: var(--vscode-focusBorder);
  }
`;

export const toastStyles = `
  .lp-toast {
    position: fixed;
    bottom: 16px;
    right: 16px;
    background: var(--vscode-notifications-background);
    color: var(--vscode-notifications-foreground);
    border: 1px solid var(--vscode-notifications-border);
    border-radius: 4px;
    padding: 10px 14px;
    font-size: 13px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.2s, transform 0.2s;
    pointer-events: none;
    max-width: 300px;
    line-height: 1.4;
  }
  .lp-toast.show {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const toastScript = `
  let _toastTimeout;
  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(_toastTimeout);
    _toastTimeout = setTimeout(() => { toast.classList.remove('show'); }, 2500);
  }
  window.addEventListener('message', event => {
    const msg = event.data;
    if (msg.command === 'showToast') { showToast(msg.message); }
  });
`;

export const settingsToggleStyles = `
  .lp-setting-group { margin-bottom: 20px; }
  .lp-setting-group-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    opacity: 0.7;
    margin-bottom: 12px;
  }
  .lp-setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.15));
  }
  .lp-setting-label { flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .lp-setting-name { font-size: 12px; font-weight: 500; }
  .lp-setting-desc { font-size: 10px; opacity: 0.7; }
  .lp-setting-toggle { width: 40px; height: 20px; position: relative; cursor: pointer; }
  .lp-setting-toggle input[type="checkbox"] { opacity: 0; width: 0; height: 0; }
  .lp-toggle-slider {
    position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
    background: var(--vscode-input-background);
    border: 1px solid var(--vscode-input-border);
    border-radius: 10px; transition: 0.2s;
  }
  .lp-toggle-slider:before {
    position: absolute; content: ""; height: 14px; width: 14px; left: 2px; bottom: 2px;
    background: var(--vscode-input-foreground); border-radius: 50%; transition: 0.2s;
  }
  input:checked + .lp-toggle-slider {
    background: var(--vscode-button-background);
    border-color: var(--vscode-button-background);
  }
  input:checked + .lp-toggle-slider:before {
    transform: translateX(20px);
    background: var(--vscode-button-foreground);
  }
`;

export const colorPickerStyles = `
  .lp-color-picker {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
    gap: 6px;
    padding: 8px;
    background: var(--vscode-input-background);
    border: 1px solid var(--vscode-input-border, transparent);
    border-radius: 3px;
  }
  .lp-color-option {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.15s;
    position: relative;
  }
  .lp-color-option:hover {
    transform: scale(1.1);
    border-color: var(--vscode-focusBorder);
  }
  .lp-color-option.selected {
    border-color: var(--vscode-focusBorder);
    box-shadow: 0 0 0 1px var(--vscode-focusBorder);
  }
  .lp-color-option.selected::after {
    content: "✓";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--vscode-editor-background);
    font-weight: bold;
    font-size: 16px;
    text-shadow: 0 0 2px rgba(0,0,0,0.5);
  }
`;

export const checkboxStyles = `
  .lp-checkbox-row {
    display: flex;
    align-items: center;
    margin: 4px 0;
    cursor: pointer;
    user-select: none;
    font-size: 12px;
    padding: 4px;
    border-radius: 3px;
    transition: background 0.1s;
  }
  .lp-checkbox-row:hover {
    background: var(--vscode-list-hoverBackground);
  }
  .lp-checkbox-row input {
    margin: 0 8px 0 0;
    cursor: pointer;
  }
  .lp-checkbox-row.disabled input {
    cursor: not-allowed;
  }
`;

export const optionCardStyles = `
  .lp-option-card {
    display: block;
    margin: 16px 0;
    padding: 12px;
    background: var(--vscode-editorWidget-background);
    border: 1px solid var(--vscode-widget-border);
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease;
    position: relative;
  }
  .lp-option-card:hover {
    background: var(--vscode-list-hoverBackground);
    border-color: var(--vscode-focusBorder);
  }
  .lp-option-card.selected {
    background: var(--vscode-inputOption-activeBackground);
    border-color: var(--vscode-focusBorder);
    color: var(--vscode-inputOption-activeForeground);
    box-shadow: 0 0 0 1px var(--vscode-focusBorder);
  }
  .lp-option-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .lp-option-title {
    font-size: 13px;
    font-weight: 500;
  }
  .lp-option-desc {
    margin-left: 24px;
    margin-top: 4px;
    font-size: 11px;
    opacity: 0.8;
  }
`;
