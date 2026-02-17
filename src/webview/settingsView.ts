import { html, render } from "lit";

type SettingsState = {
  showIcon: boolean;
  showType: boolean;
  showCommand: boolean;
  showGroup: boolean;
  hideIcon: string;
  backupCount: number;
  configExists: boolean;
  usedIcons: string[];
};

type HideIconOption = {
  value: string;
  label: string;
};

const HIDE_ICON_OPTIONS: HideIconOption[] = [
  { value: "eye-closed", label: "Eye Closed" },
  { value: "x", label: "X Mark" },
  { value: "trash", label: "Trash" },
  { value: "close", label: "Close" },
  { value: "circle-slash", label: "Circle Slash" },
];

declare global {
  interface Window {
    __SETTINGS__?: SettingsState;
  }
}

declare const acquireVsCodeApi: () => {
  postMessage: (message: unknown) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
};

const vscode = acquireVsCodeApi();
const root = document.getElementById("root");

const state: SettingsState = window.__SETTINGS__ || {
  showIcon: true,
  showType: true,
  showCommand: true,
  showGroup: true,
  hideIcon: "eye-closed",
  backupCount: 0,
  configExists: false,
  usedIcons: [],
};

let showDeleteConfirm = false;

const setState = (partial: Partial<SettingsState>) => {
  Object.assign(state, partial);
  renderView();
};

const toggleDeleteConfirm = () => {
  showDeleteConfirm = !showDeleteConfirm;
  renderView();
};

const hideDeleteConfirm = () => {
  showDeleteConfirm = false;
  renderView();
};

const onSave = () => {
  vscode.postMessage({
    command: "saveSettings",
    settings: {
      showIcon: state.showIcon,
      showType: state.showType,
      showCommand: state.showCommand,
      showGroup: state.showGroup,
      hideIcon: state.hideIcon,
    },
  });
};

const renderIconChips = () =>
  state.usedIcons.map(
    (icon) => html`
      <span
        style="display: inline-flex; align-items: center; gap: 4px; font-size: 10px; padding: 4px 6px; background: var(--vscode-input-background); border-radius: 3px;"
        title=${icon}
      >
        <span class="codicon codicon-${icon}"></span>
        <span style="opacity: 0.7;">${icon}</span>
      </span>
    `
  );

const renderView = () => {
  if (!root) return;

  // Show loading state if settings haven't been injected yet
  if (!window.__SETTINGS__) {
    render(
      html`
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; opacity: 0.7;">
          <div style="font-size: 24px; margin-bottom: 8px;">⚙️</div>
          <div>Loading settings...</div>
        </div>
      `,
      root
    );
    return;
  }

  const configDisabled = !state.configExists;

  render(
    html`
      <div class="lp-settings-header">
        <h3>⚙️ Settings</h3>
        <div class="lp-top-actions">
          <button
            type="button"
            class="lp-icon-btn"
            title="Open Battlestation visual settings"
            aria-label="Open Battlestation visual settings"
            @click=${() => vscode.postMessage({ command: "openVisualSettings" })}
          >
            <span class="codicon codicon-settings"></span>
          </button>
        </div>
      </div>

      <div class="lp-setting-group ${configDisabled ? "lp-config-disabled" : ""}">
        <div class="lp-config-header">
          <div class="lp-setting-group-title">📄 battle.json</div>
          <div class="lp-config-actions">
            <button
              type="button"
              class="lp-config-btn lp-btn lp-btn-secondary"
              ?disabled=${!state.configExists}
              title=${state.configExists ? "Open config file" : "Generate config first"}
              @click=${() => {
        hideDeleteConfirm();
        vscode.postMessage({ command: "openConfig" });
      }}
            >
              <span class="codicon codicon-file"></span><span class="lp-btn-text">Open</span>
            </button>
            <button
              type="button"
              class="lp-config-btn lp-btn lp-btn-secondary lp-config-cta"
              title=${state.configExists
        ? "Regenerate config from scanned sources"
        : "Generate new config file"}
              @click=${() => {
        hideDeleteConfirm();
        vscode.postMessage({ command: "showGenerateConfig" });
      }}
            >
              <span class="codicon codicon-refresh"></span
              ><span class="lp-btn-text">${state.configExists ? "Regenerate" : "Generate"}</span>
            </button>
            ${state.backupCount > 0
        ? html`
                  <button
                    type="button"
                    class="lp-config-btn lp-btn lp-btn-secondary"
                    ?disabled=${!state.configExists}
                    title="Restore a previous config (${state.backupCount})"
                    @click=${() => {
            hideDeleteConfirm();
            vscode.postMessage({ command: "restoreConfig" });
          }}
                  >
                    <span class="codicon codicon-history"></span
                    ><span class="lp-btn-text">Restore</span>
                  </button>
                `
        : null}
            ${state.configExists
        ? html`
                  <button
                    type="button"
                    class="lp-config-btn lp-btn lp-btn-secondary"
                    title="Delete config file"
                    style="color: var(--vscode-errorForeground);"
                    @click=${() => toggleDeleteConfirm()}
                  >
                    <span class="codicon codicon-trash"></span
                    ><span class="lp-btn-text">Delete</span>
                  </button>
                `
        : null}
          </div>
          ${state.configExists && showDeleteConfirm
        ? html`
                <div class="lp-config-confirm">
                  <div class="lp-config-confirm-text">
                    Delete battle.json? This cannot be undone.
                  </div>
                  <div class="lp-config-confirm-actions">
                    <button
                      type="button"
                      class="lp-config-btn lp-btn lp-btn-secondary"
                      style="color: var(--vscode-errorForeground);"
                      @click=${() => {
            hideDeleteConfirm();
            vscode.postMessage({ command: "deleteConfig" });
          }}
                    >
                      <span class="codicon codicon-trash"></span
                      ><span class="lp-btn-text">Delete</span>
                    </button>
                    <button
                      type="button"
                      class="lp-config-btn lp-btn lp-btn-secondary"
                      @click=${() => hideDeleteConfirm()}
                    >
                      <span class="codicon codicon-close"></span
                      ><span class="lp-btn-text">Cancel</span>
                    </button>
                  </div>
                </div>
              `
        : null}
        </div>
      </div>

      <div class="lp-setting-group">
        <div class="lp-setting-group-title">🎨 Display</div>
        <div class="lp-setting-row">
          <div class="lp-setting-label">
            <div class="lp-setting-name">Show Icons</div>
            <div class="lp-setting-desc">Display codicons next to button names</div>
          </div>
          <label class="lp-setting-toggle">
            <input
              type="checkbox"
              .checked=${state.showIcon}
              @change=${(e: Event) =>
        setState({ showIcon: (e.target as HTMLInputElement).checked })}
            />
            <span class="lp-toggle-slider"></span>
          </label>
        </div>
        <div class="lp-setting-row">
          <div class="lp-setting-label">
            <div class="lp-setting-name">Show Type</div>
            <div class="lp-setting-desc">Display command type (npm, shell, vscode, etc.)</div>
          </div>
          <label class="lp-setting-toggle">
            <input
              type="checkbox"
              .checked=${state.showType}
              @change=${(e: Event) =>
        setState({ showType: (e.target as HTMLInputElement).checked })}
            />
            <span class="lp-toggle-slider"></span>
          </label>
        </div>
        <div class="lp-setting-row">
          <div class="lp-setting-label">
            <div class="lp-setting-name">Show Command</div>
            <div class="lp-setting-desc">Display the actual command text</div>
          </div>
          <label class="lp-setting-toggle">
            <input
              type="checkbox"
              .checked=${state.showCommand}
              @change=${(e: Event) =>
        setState({ showCommand: (e.target as HTMLInputElement).checked })}
            />
            <span class="lp-toggle-slider"></span>
          </label>
        </div>
        <div class="lp-setting-row">
          <div class="lp-setting-label">
            <div class="lp-setting-name">Show Groups</div>
            <div class="lp-setting-desc">Display group headers and organization</div>
          </div>
          <label class="lp-setting-toggle">
            <input
              type="checkbox"
              .checked=${state.showGroup}
              @change=${(e: Event) =>
        setState({ showGroup: (e.target as HTMLInputElement).checked })}
            />
            <span class="lp-toggle-slider"></span>
          </label>
        </div>
        <div class="lp-setting-row">
          <div class="lp-setting-label">
            <div class="lp-setting-name">Hide Icon</div>
            <div class="lp-setting-desc">Icon to use for hiding items</div>
          </div>
          <select
            id="hideIcon"
            style="padding: 4px 8px; font-size: 12px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px;"
            .value=${state.hideIcon}
            @change=${(e: Event) => setState({ hideIcon: (e.target as HTMLSelectElement).value })}
          >
            ${HIDE_ICON_OPTIONS.map(
          (opt) => html`<option value=${opt.value}>${opt.label}</option>`
        )}
          </select>
        </div>
      </div>

      <div class="lp-setting-group">
        <div class="lp-setting-group-title">🎭 Available Icons</div>
        <div
          class="lp-setting-row"
          style="border: none; flex-direction: column; align-items: flex-start; gap: 8px;"
        >
          <div class="lp-setting-label" style="flex-direction: row; align-items: center; gap: 6px;">
            <span class="codicon codicon-info" style="color: var(--vscode-textLink-foreground);"></span>
            <div class="lp-setting-desc" style="margin: 0;">
              Only icons used in your config are loaded for performance. All
              <a
                href="https://microsoft.github.io/vscode-codicons/dist/codicon.html"
                style="color: var(--vscode-textLink-foreground);"
                target="_blank"
                >codicons</a
              are supported—just add them to your config and refresh.
            </div>
          </div>
          <div style="margin-top: 8px; width: 100%;">
            <div style="font-size: 11px; font-weight: 600; opacity: 0.7; margin-bottom: 6px;">
              Currently Loaded (${state.usedIcons.length} icons):
            </div>
            <div
              style="display: flex; flex-wrap: wrap; gap: 8px; padding: 8px; background: var(--vscode-editor-background); border-radius: 4px; max-height: 120px; overflow-y: auto;"
            >
              ${renderIconChips()}
            </div>
          </div>
        </div>
      </div>

      <div class="lp-form-actions">
        <button
          type="button"
          class="lp-btn lp-btn-secondary"
          @click=${() => {
        hideDeleteConfirm();
        vscode.postMessage({ command: "cancelForm" });
      }}
        >
          Cancel
        </button>
        <button type="button" class="lp-btn lp-btn-primary" @click=${onSave}>Save Settings</button>
      </div>
    `,
    root
  );
};

renderView();
