import { html, render } from "lit";
import { classMap } from "lit/directives/class-map.js";

type SettingsState = {
  showIcon: boolean;
  showType: boolean;
  showCommand: boolean;
  showGroup: boolean;
  hideIcon: string;
  backupCount: number;
  configExists: boolean;
  usedIcons: string[];
  customConfigPath: string | null;
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
    acquireVsCodeApi: () => {
      postMessage: (message: unknown) => void;
      getState: () => unknown;
      setState: (state: unknown) => void;
    };
  }
}

const vscode = window.acquireVsCodeApi();
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
  customConfigPath: null,
};

let showDeleteConfirm = false;
let showAdvanced = false;

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
  try {
    console.log('[SettingsView] Saving settings...');
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
    console.log('[SettingsView] Save message sent');
  } catch (e) {
    console.error("Failed to save settings:", e);
    alert(`Failed to save settings: ${e}`);
  }
};

const renderIconChips = () =>
  state.usedIcons.map(
    (icon) => html`
      <span class="lp-icon-chip" title=${icon}>
        <span class="codicon codicon-${icon}"></span>
        <span class="lp-icon-chip-name">${icon}</span>
      </span>
    `
  );

const configBtn = (
  icon: string,
  label: string,
  command: string,
  opts?: {
    disabled?: boolean;
    danger?: boolean;
    cta?: boolean;
    title?: string;
    ariaLabel?: string;
    onClick?: () => void;
  }
) => html`
  <button
    type="button"
    class=${classMap({
  "lp-config-btn": true,
  "lp-btn": true,
  "lp-btn-secondary": true,
  "lp-btn-danger": !!opts?.danger,
  "lp-config-cta": !!opts?.cta
})}
    ?disabled=${opts?.disabled ?? false}
    title=${opts?.title ?? label}
    aria-label=${opts?.ariaLabel ?? label}
    @click=${() => {
    if (opts?.onClick) {
      opts.onClick();
    } else {
      hideDeleteConfirm();
      vscode.postMessage({ command });
    }
  }}
  >
    <span class="codicon codicon-${icon}"></span><span class="lp-btn-text">${label}</span>
  </button>
`;

const renderView = () => {
  if (!root) return;

  // Show loading state if settings haven't been injected yet
  if (!window.__SETTINGS__) {
    render(
      html`
        <div class="lp-settings-loading">
          <div class="lp-settings-loading-icon">⚙️</div>
          <div>Loading settings...</div>
        </div>
      `,
      root
    );
    return;
  }

  render(
    html`
      <div class="lp-settings-view">
        <div class="lp-settings-header">
          <h3><span class="codicon codicon-settings-gear"></span> Settings</h3>
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

        <div class="lp-setting-group">
          <div class="lp-config-header">
            <div class="lp-config-toolbar">
              <div class="lp-setting-group-title">📄 battle.json</div>
              <div class="lp-config-actions">
                ${configBtn("file", "Open", "openConfig", {
      disabled: !state.configExists,
      title: state.configExists ? "Open config file" : "Generate config first",
      ariaLabel: "Open config file",
    })}
                ${configBtn("folder-opened", "Location", "openConfigFolder", {
      title: "Open folder containing battle.json",
      ariaLabel: "Open config location",
    })}
                ${configBtn("refresh", state.configExists ? "Regen" : "Generate", "showGenerateConfig", {
      cta: true,
      title: state.configExists ? "Regenerate config from scanned sources" : "Generate new config file",
      ariaLabel: state.configExists ? "Regenerate config" : "Generate config",
    })}
                ${state.backupCount > 0 ? configBtn("history", "Undo", "restoreConfig", {
      disabled: !state.configExists,
      title: `Restore a previous config (${state.backupCount})`,
      ariaLabel: "Restore previous config",
    }) : null}
                ${state.configExists ? configBtn("trash", "Delete", "deleteConfig", {
      danger: true,
      title: "Delete config file",
      ariaLabel: "Delete config file",
      onClick: () => toggleDeleteConfirm(),
    }) : null}
              </div>
            </div>
            ${state.configExists && showDeleteConfirm ? html`
              <div class="lp-config-confirm">
                <div class="lp-config-confirm-text">
                  <span>Delete battle.json?</span><br> You can recover any you have generated previously on this machine later.
                </div>
                <div class="lp-config-confirm-actions">
                  ${configBtn("trash", "Delete", "deleteConfig", {
      danger: true,
      ariaLabel: "Confirm delete config file"
    })}
                  ${configBtn("close", "Cancel", "", {
      onClick: () => hideDeleteConfirm(),
      ariaLabel: "Cancel delete config"
    })}
                </div>
              </div>
            ` : null}
          </div>
        </div>

        <!-- Advanced Section -->
        <div class="lp-setting-group">
        <button
          type="button"
          class="lp-generate-toggle"
          @click=${() => { showAdvanced = !showAdvanced; renderView(); }}
        >
          <span class="codicon codicon-${showAdvanced ? 'chevron-down' : 'chevron-right'}"></span>
          <span>Advanced</span>
        </button>
        ${showAdvanced ? html`
          <div class="lp-generate-content">
            <div class="lp-setting-row">
              <div class="lp-setting-label">
                <div class="lp-setting-name">Config Location</div>
                <div class="lp-setting-desc">
                  ${state.customConfigPath
          ? html`Custom: <code class="lp-inline-code">${state.customConfigPath}/battle.json</code>`
          : html`Default: <code class="lp-inline-code">.vscode/battle.json</code>`
        }
                </div>
              </div>
              <div class="lp-inline-actions">
                ${configBtn("folder-opened", "Change", "changeConfigLocation", {
          title: "Choose a custom folder to store battle.json",
          ariaLabel: "Change config location",
          onClick: () => vscode.postMessage({ command: "changeConfigLocation" })
        })}
                ${state.customConfigPath ? configBtn("discard", "Reset", "resetConfigLocation", {
          title: "Reset to default location (.vscode/battle.json)",
          ariaLabel: "Reset config location",
          onClick: () => vscode.postMessage({ command: "resetConfigLocation" })
        }) : null}
              </div>
            </div>
            <div class="lp-setting-row">
              <div class="lp-setting-label">
                <div class="lp-setting-name">Import Config</div>
                <div class="lp-setting-desc">Load an existing battle.json from disk. Your current config will be backed up first.</div>
              </div>
              ${configBtn("desktop-download", "Import", "importConfig", {
          title: "Browse for a JSON config file to import",
          ariaLabel: "Import config file",
          onClick: () => vscode.postMessage({ command: "importConfig" })
        })}
            </div>
          </div>
        ` : null}
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
            class="lp-hide-icon-select"
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
          <div class="lp-setting-row lp-icon-row">
            <div class="lp-setting-label lp-icon-help-row">
              <span class="codicon codicon-info"></span>
              <div class="lp-setting-desc lp-icon-help-text">
              Only icons used in your config are loaded for performance. All
              <a
                href="https://microsoft.github.io/vscode-codicons/dist/codicon.html"
                target="_blank"
                >codicons</a
              are supported—just add them to your config and refresh.
              </div>
            </div>
            <div class="lp-loaded-icons-wrap">
              <div class="lp-loaded-icons-title">Currently Loaded (${state.usedIcons.length} icons):</div>
              <div class="lp-loaded-icons-grid">${renderIconChips()}</div>
            </div>
          </div>
        </div>
      
        <div class="lp-form-actions">
          <button
            type="button"
            class="lp-btn lp-btn-secondary"
            @click=${() => {
        console.log("[SettingsView] Cancel clicked");
        hideDeleteConfirm();
        vscode.postMessage({ command: "cancelForm" });
      }}
          >
            Cancel
          </button>
          <button
            type="button"
            class="lp-btn lp-btn-primary"
            @click=${() => {
        console.log("[SettingsView] Save button clicked");
        onSave();
      }}
          >
            Save Settings
          </button>
        </div>
      </div>

    `,
    root
  );
};

renderView();
