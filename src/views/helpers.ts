/** Shared HTML helpers */

export function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderCheckbox(
  id: string,
  label: string,
  checked: boolean,
  disabled = false
): string {
  return `
  <div class="lp-checkbox-row ${disabled ? "disabled" : ""}">
    <input type="checkbox" id="${id}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}>
    <label for="${id}">${label}</label>
  </div>`;
}

export function renderToggleSetting(
  id: string,
  label: string,
  description: string,
  checked: boolean
): string {
  return `
  <div class="lp-setting-row">
    <div class="lp-setting-label">
      <div class="lp-setting-name">${label}</div>
      <div class="lp-setting-desc">${description}</div>
    </div>
    <label class="lp-setting-toggle">
      <input type="checkbox" id="${id}" ${checked ? "checked" : ""}>
      <span class="lp-toggle-slider"></span>
    </label>
  </div>`;
}
