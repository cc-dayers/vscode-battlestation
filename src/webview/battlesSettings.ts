import { html, render, nothing } from "lit";
import type { BattleProvider, BattleProviderState } from "../types";

interface BattlesSettingsState {
  providers: BattleProvider[];
  providerStates: BattleProviderState[];
}

declare global {
  interface Window {
    __BATTLES_SETTINGS__?: Partial<BattlesSettingsState>;
    acquireVsCodeApi: () => {
      postMessage: (message: unknown) => void;
      getState: () => unknown;
      setState: (state: unknown) => void;
    };
  }
}

const vscode = window.acquireVsCodeApi();
const root = document.getElementById("root");

const state: BattlesSettingsState = {
  providers: window.__BATTLES_SETTINGS__?.providers ?? [],
  providerStates: window.__BATTLES_SETTINGS__?.providerStates ?? [],
};

function getProviderState(id: string): BattleProviderState | undefined {
  return state.providerStates.find((s) => s.providerId === id);
}

function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return "Never";
  const delta = Math.max(Date.now() - timestamp, 0);
  const seconds = Math.floor(delta / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function renderProviderCard(provider: BattleProvider) {
  const ps = getProviderState(provider.id);
  const battleCount = ps?.battles?.length ?? 0;
  const lastRefreshed = formatRelativeTime(ps?.lastRefreshedAt);
  const hasError = !!ps?.lastError;
  const isEnabled = provider.enabled !== false;

  return html`
    <div class="bs-provider-card ${!isEnabled ? 'bs-provider-card--disabled' : ''}" data-provider-id=${provider.id}>
      <div class="bs-provider-card__header">
        <div class="bs-provider-card__icon">
          ${provider.icon
            ? html`<span class="codicon codicon-${provider.icon}" style="${provider.color ? `color:${provider.color}` : ''}"></span>`
            : html`<span class="codicon codicon-plug"></span>`}
        </div>
        <div class="bs-provider-card__info">
          <div class="bs-provider-card__name">${provider.name}</div>
          <div class="bs-provider-card__command">${provider.command}</div>
        </div>
        <div class="bs-provider-card__toggle">
          <label class="bs-toggle" title="${isEnabled ? 'Enabled' : 'Disabled'}">
            <input
              type="checkbox"
              ?checked=${isEnabled}
              @change=${(e: Event) => {
                vscode.postMessage({
                  command: "toggleProvider",
                  providerId: provider.id,
                  enabled: (e.target as HTMLInputElement).checked,
                });
              }}
            />
            <span class="bs-toggle__slider"></span>
          </label>
        </div>
      </div>

      <div class="bs-provider-card__meta">
        <span class="bs-meta-item">
          <span class="codicon codicon-shield"></span>
          ${battleCount} battle${battleCount === 1 ? '' : 's'}
        </span>
        <span class="bs-meta-item">
          <span class="codicon codicon-history"></span>
          ${lastRefreshed}
        </span>
        <span class="bs-meta-item">
          <span class="codicon codicon-clock"></span>
          ${provider.refreshInterval ? `${provider.refreshInterval}s` : "Manual"}
        </span>
      </div>

      ${hasError
        ? html`<div class="bs-provider-card__error">
            <span class="codicon codicon-warning"></span> ${ps!.lastError}
          </div>`
        : nothing}

      <div class="bs-provider-card__actions">
        <button
          class="bs-btn"
          @click=${() => vscode.postMessage({ command: "testProvider", providerId: provider.id })}
        >
          <span class="codicon codicon-beaker"></span> Test
        </button>
        <button
          class="bs-btn"
          @click=${() => vscode.postMessage({ command: "refreshProvider", providerId: provider.id })}
        >
          <span class="codicon codicon-refresh"></span> Refresh
        </button>
        <button
          class="bs-btn bs-btn--danger"
          @click=${() => vscode.postMessage({ command: "removeProvider", providerId: provider.id })}
        >
          <span class="codicon codicon-trash"></span> Remove
        </button>
      </div>
    </div>
  `;
}

function renderView() {
  if (!root) return;

  const hasProviders = state.providers.length > 0;

  render(
    html`
      <style>
        :host { color: var(--vscode-foreground); }
        .bs-settings-shell {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .bs-settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .bs-settings-header__title {
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .bs-back-btn {
          border: none;
          background: transparent;
          color: var(--vscode-foreground);
          cursor: pointer;
          font-size: 14px;
          padding: 4px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
        }
        .bs-back-btn:hover {
          background: var(--vscode-list-hoverBackground);
        }

        /* Provider cards */
        .bs-provider-card {
          border: 1px solid var(--vscode-panel-border, rgba(127,127,127,0.2));
          background: var(--vscode-sideBar-background);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .bs-provider-card--disabled {
          opacity: 0.55;
        }
        .bs-provider-card__header {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .bs-provider-card__icon {
          font-size: 20px;
          flex-shrink: 0;
        }
        .bs-provider-card__info {
          flex: 1;
          min-width: 0;
        }
        .bs-provider-card__name {
          font-weight: 600;
          font-size: 13px;
        }
        .bs-provider-card__command {
          font-size: 11px;
          font-family: var(--vscode-editor-font-family, monospace);
          color: var(--vscode-descriptionForeground);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .bs-provider-card__meta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .bs-meta-item {
          font-size: 11px;
          color: var(--vscode-descriptionForeground);
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .bs-provider-card__error {
          padding: 6px 10px;
          background: var(--vscode-inputValidation-errorBackground, #5a1d1d);
          border: 1px solid var(--vscode-inputValidation-errorBorder, #be1100);
          border-radius: 6px;
          font-size: 12px;
          color: var(--vscode-errorForeground, #f48771);
        }
        .bs-provider-card__actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        /* Toggle switch */
        .bs-toggle {
          position: relative;
          display: inline-block;
          width: 36px;
          height: 20px;
        }
        .bs-toggle input { display: none; }
        .bs-toggle__slider {
          position: absolute;
          inset: 0;
          background: var(--vscode-input-background);
          border: 1px solid var(--vscode-input-border, rgba(127,127,127,0.3));
          border-radius: 999px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .bs-toggle__slider::before {
          content: "";
          position: absolute;
          left: 2px;
          top: 2px;
          width: 14px;
          height: 14px;
          background: var(--vscode-foreground);
          border-radius: 50%;
          transition: transform 0.2s;
        }
        .bs-toggle input:checked + .bs-toggle__slider {
          background: var(--vscode-button-background);
          border-color: var(--vscode-button-background);
        }
        .bs-toggle input:checked + .bs-toggle__slider::before {
          transform: translateX(16px);
          background: var(--vscode-button-foreground);
        }

        /* Buttons */
        .bs-btn {
          border: 1px solid var(--vscode-button-border, transparent);
          background: var(--vscode-button-secondaryBackground, var(--vscode-button-background));
          color: var(--vscode-button-secondaryForeground, var(--vscode-button-foreground));
          border-radius: 6px;
          padding: 4px 10px;
          cursor: pointer;
          font-size: 12px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .bs-btn:hover {
          background: var(--vscode-button-secondaryHoverBackground, var(--vscode-button-hoverBackground));
        }
        .bs-btn--primary {
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
        }
        .bs-btn--primary:hover {
          background: var(--vscode-button-hoverBackground);
        }
        .bs-btn--danger {
          opacity: 0.7;
        }
        .bs-btn--danger:hover {
          opacity: 1;
          color: var(--vscode-errorForeground, #f48771);
        }

        /* Empty state */
        .bs-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 24px 16px;
          text-align: center;
          color: var(--vscode-descriptionForeground);
        }
        .bs-empty__icon { font-size: 28px; }
        .bs-empty__title { font-size: 13px; font-weight: 600; }
        .bs-empty__desc { font-size: 12px; max-width: 260px; }
      </style>
      <div class="bs-settings-shell">
        <div class="bs-settings-header">
          <div class="bs-settings-header__title">
            <button
              class="bs-back-btn"
              title="Back to Battles"
              @click=${() => vscode.postMessage({ command: "showBattles" })}
            >
              <span class="codicon codicon-arrow-left"></span>
            </button>
            <span class="codicon codicon-gear"></span>
            Battle Provider Settings
          </div>
        </div>

        ${hasProviders
          ? state.providers.map((p) => renderProviderCard(p))
          : html`
              <div class="bs-empty">
                <div class="bs-empty__icon">⚔️</div>
                <div class="bs-empty__title">No Providers Configured</div>
                <div class="bs-empty__desc">
                  Battle providers are CLI tools that output work items. Add one to get started.
                </div>
              </div>
            `}

        <button
          class="bs-btn bs-btn--primary"
          style="align-self: flex-start;"
          @click=${() => vscode.postMessage({ command: "addBattleProvider" })}
        >
          <span class="codicon codicon-add"></span> Add Provider
        </button>
      </div>
    `,
    root
  );
}

window.addEventListener("message", (event) => {
  const msg = event.data;
  if (msg.type === "update") {
    if (msg.data.providers !== undefined) {
      state.providers = msg.data.providers;
    }
    if (msg.data.providerStates !== undefined) {
      state.providerStates = msg.data.providerStates;
    }
    renderView();
  }
});

renderView();
