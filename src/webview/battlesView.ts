import { html, render, nothing } from "lit";
import type { Battle, BattleProviderState, BattlePriority } from "../types";

interface BattlesViewState {
  providers: BattleProviderState[];
  searchQuery: string;
  collapsedProviders: string[];
}

declare global {
  interface Window {
    __BATTLES_INITIAL_DATA__?: Partial<BattlesViewState>;
    acquireVsCodeApi: () => {
      postMessage: (message: unknown) => void;
      getState: () => unknown;
      setState: (state: unknown) => void;
    };
  }
}

const vscode = window.acquireVsCodeApi();
const root = document.getElementById("root");

const state: BattlesViewState = {
  providers: window.__BATTLES_INITIAL_DATA__?.providers || [],
  searchQuery: "",
  collapsedProviders: [],
};

// --- Helpers ---

function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) {
    return "Never";
  }
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

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function priorityClass(priority?: BattlePriority): string {
  if (!priority) return "";
  return `battles-priority--${priority}`;
}

function statusIcon(status: string): string {
  switch (status) {
    case "active": return "🔴";
    case "blocked": return "🟠";
    case "done": return "✅";
    case "dismissed": return "⚪";
    default: return "⚪";
  }
}

function filteredBattles(battles: Battle[]): Battle[] {
  const query = state.searchQuery.trim().toLowerCase();
  let filtered = battles.filter((b) => b.status !== "dismissed");
  if (query) {
    filtered = filtered.filter((b) =>
      [b.title, b.description, b.status, b.priority, ...(b.tags ?? [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(query))
    );
  }
  // Sort by priority
  return filtered.sort(
    (a, b) =>
      (PRIORITY_ORDER[a.priority ?? "medium"] ?? 2) -
      (PRIORITY_ORDER[b.priority ?? "medium"] ?? 2)
  );
}

function isCollapsed(providerId: string): boolean {
  return state.collapsedProviders.includes(providerId);
}

function toggleCollapse(providerId: string): void {
  const idx = state.collapsedProviders.indexOf(providerId);
  if (idx >= 0) {
    state.collapsedProviders.splice(idx, 1);
  } else {
    state.collapsedProviders.push(providerId);
  }
  renderView();
}

// --- Action handlers ---

function handleBattleAction(battle: Battle, action: { type: string; value: string; label: string }): void {
  vscode.postMessage({
    command: "battleAction",
    battleId: battle.id,
    actionType: action.type,
    actionValue: action.value,
  });
}

function handleOpenUrl(battle: Battle): void {
  if (battle.url) {
    vscode.postMessage({ command: "openBattleUrl", url: battle.url });
  }
}

function handleDismiss(providerId: string, battleId: string): void {
  vscode.postMessage({ command: "dismissBattle", providerId, battleId });
}

// --- Templates ---

function renderBattleCard(battle: Battle, providerId: string) {
  const actions = battle.actions ?? [];
  return html`
    <article class="battles-card" data-battle-id=${battle.id}>
      <div class="battles-card__header">
        <span class="battles-card__status">${statusIcon(battle.status)}</span>
        <span class="battles-card__title">${battle.title}</span>
        ${battle.priority
          ? html`<span class="battles-badge ${priorityClass(battle.priority)}">${battle.priority.toUpperCase()}</span>`
          : nothing}
      </div>
      ${battle.description
        ? html`<div class="battles-card__desc">${battle.description}</div>`
        : nothing}
      ${battle.tags && battle.tags.length > 0
        ? html`<div class="battles-card__tags">
            ${battle.tags.map((tag) => html`<span class="battles-tag">${tag}</span>`)}
          </div>`
        : nothing}
      <div class="battles-card__actions">
        ${battle.url
          ? html`<button class="battles-btn" @click=${() => handleOpenUrl(battle)}>
              <span class="codicon codicon-link-external"></span> Open
            </button>`
          : nothing}
        ${actions.map(
          (action) => html`
            <button class="battles-btn" @click=${() => handleBattleAction(battle, action)}>
              ${action.label}
            </button>
          `
        )}
        <button
          class="battles-btn battles-btn--dismiss"
          title="Dismiss"
          @click=${() => handleDismiss(providerId, battle.id)}
        >
          <span class="codicon codicon-close"></span>
        </button>
      </div>
    </article>
  `;
}

function renderProviderSection(providerState: BattleProviderState) {
  const collapsed = isCollapsed(providerState.providerId);
  const battles = filteredBattles(providerState.battles);
  const activeCount = providerState.battles.filter((b) => b.status === "active").length;
  const chevron = collapsed ? "chevron-right" : "chevron-down";
  const iconEl = providerState.providerIcon
    ? html`<span class="codicon codicon-${providerState.providerIcon}" style=${providerState.providerColor ? `color:${providerState.providerColor}` : ""}></span>`
    : nothing;

  return html`
    <section class="battles-provider" data-provider-id=${providerState.providerId}>
      <div
        class="battles-provider__header"
        @click=${() => toggleCollapse(providerState.providerId)}
      >
        <span class="codicon codicon-${chevron} battles-provider__chevron"></span>
        ${iconEl}
        <span class="battles-provider__name">${providerState.providerName}</span>
        <span class="battles-provider__count">(${activeCount})</span>
        ${providerState.isLoading
          ? html`<span class="battles-provider__loading">⟳</span>`
          : html`<span class="battles-provider__time">${formatRelativeTime(providerState.lastRefreshedAt)}</span>`}
        <button
          class="battles-btn battles-btn--icon"
          title="Refresh"
          @click=${(e: Event) => {
            e.stopPropagation();
            vscode.postMessage({ command: "refreshProvider", providerId: providerState.providerId });
          }}
        >
          <span class="codicon codicon-refresh"></span>
        </button>
      </div>
      ${providerState.lastError
        ? html`<div class="battles-provider__error">
            <span class="codicon codicon-warning"></span> ${providerState.lastError}
          </div>`
        : nothing}
      ${!collapsed
        ? html`
            <div class="battles-provider__list">
              ${battles.length === 0
                ? html`<div class="battles-empty">All clear! No battles pending.</div>`
                : battles.map((b) => renderBattleCard(b, providerState.providerId))}
            </div>
          `
        : nothing}
    </section>
  `;
}

function renderView() {
  if (!root) return;

  const hasProviders = state.providers.length > 0;

  render(
    html`
      <style>
        :host { color: var(--vscode-foreground); }
        .battles-shell {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .battles-search {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid var(--vscode-input-border, transparent);
          background: var(--vscode-input-background);
          color: var(--vscode-input-foreground);
          padding: 8px 10px;
          border-radius: 6px;
        }

        /* Provider sections */
        .battles-provider {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .battles-provider__header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 4px;
          cursor: pointer;
          user-select: none;
          border-radius: 4px;
          font-weight: 600;
        }
        .battles-provider__header:hover {
          background: var(--vscode-list-hoverBackground);
        }
        .battles-provider__chevron { font-size: 14px; }
        .battles-provider__count {
          color: var(--vscode-descriptionForeground);
          font-weight: 400;
          font-size: 12px;
        }
        .battles-provider__time {
          margin-left: auto;
          font-weight: 400;
          font-size: 11px;
          color: var(--vscode-descriptionForeground);
        }
        .battles-provider__loading {
          margin-left: auto;
          font-size: 14px;
          animation: battles-spin 1s linear infinite;
        }
        @keyframes battles-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .battles-provider__error {
          padding: 6px 10px;
          background: var(--vscode-inputValidation-errorBackground, #5a1d1d);
          border: 1px solid var(--vscode-inputValidation-errorBorder, #be1100);
          border-radius: 6px;
          font-size: 12px;
          color: var(--vscode-errorForeground, #f48771);
        }
        .battles-provider__list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-left: 4px;
          content-visibility: auto;
        }

        /* Battle cards */
        .battles-card {
          border: 1px solid var(--vscode-panel-border, rgba(127,127,127,0.2));
          background: var(--vscode-sideBar-background);
          border-radius: 8px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .battles-card__header {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .battles-card__status { font-size: 12px; }
        .battles-card__title { font-weight: 600; flex: 1; }
        .battles-card__desc {
          font-size: 12px;
          color: var(--vscode-descriptionForeground);
          line-height: 1.4;
        }
        .battles-card__tags {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        .battles-tag {
          background: var(--vscode-badge-background);
          color: var(--vscode-badge-foreground);
          border-radius: 999px;
          padding: 1px 8px;
          font-size: 10px;
        }
        .battles-card__actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          align-items: center;
        }

        /* Badges */
        .battles-badge {
          border-radius: 4px;
          padding: 1px 6px;
          font-size: 10px;
          font-weight: 700;
        }
        .battles-priority--critical {
          background: var(--vscode-charts-red, #f44336);
          color: #fff;
        }
        .battles-priority--high {
          background: var(--vscode-charts-orange, #ff9800);
          color: #1a1a1a;
        }
        .battles-priority--medium {
          background: var(--vscode-charts-yellow, #e2c45a);
          color: #1a1a1a;
        }
        .battles-priority--low {
          background: var(--vscode-charts-blue, #2196f3);
          color: #fff;
        }

        /* Buttons */
        .battles-btn {
          border: 1px solid var(--vscode-button-border, transparent);
          background: var(--vscode-button-secondaryBackground, var(--vscode-button-background));
          color: var(--vscode-button-secondaryForeground, var(--vscode-button-foreground));
          border-radius: 6px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 12px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .battles-btn:hover {
          background: var(--vscode-button-secondaryHoverBackground, var(--vscode-button-hoverBackground));
        }
        .battles-btn--icon {
          padding: 2px 4px;
          background: transparent;
          border: none;
        }
        .battles-btn--dismiss {
          margin-left: auto;
          background: transparent;
          border: none;
          opacity: 0.6;
        }
        .battles-btn--dismiss:hover { opacity: 1; }

        /* Empty states */
        .battles-empty {
          border: 1px dashed var(--vscode-panel-border, rgba(127,127,127,0.2));
          border-radius: 8px;
          padding: 12px;
          color: var(--vscode-descriptionForeground);
          text-align: center;
          font-size: 13px;
        }
        .battles-zero {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 32px 16px;
          text-align: center;
          color: var(--vscode-descriptionForeground);
        }
        .battles-zero__icon { font-size: 32px; }
        .battles-zero__title { font-size: 14px; font-weight: 600; }
        .battles-zero__desc { font-size: 12px; max-width: 260px; }
      </style>
      <div class="battles-shell">
        ${hasProviders
          ? html`
              <input
                class="battles-search"
                type="search"
                placeholder="Search battles..."
                .value=${state.searchQuery}
                @input=${(event: InputEvent) => {
                  state.searchQuery = (event.target as HTMLInputElement).value;
                  renderView();
                }}
              />
              ${state.providers.map((p) => renderProviderSection(p))}
            `
          : html`
              <div class="battles-zero">
                <div class="battles-zero__icon">⚔️</div>
                <div class="battles-zero__title">No Battle Providers</div>
                <div class="battles-zero__desc">
                  Add a battle provider to start tracking work items from external tools.
                </div>
                <button
                  class="battles-btn"
                  @click=${() => vscode.postMessage({ command: "addBattleProvider" })}
                >
                  <span class="codicon codicon-add"></span> Add Provider
                </button>
              </div>
            `}
      </div>
    `,
    root
  );
}

// --- Message handling ---

window.addEventListener("message", (event) => {
  const msg = event.data;
  if (msg.type === "update") {
    state.providers = msg.data.providers || [];
    renderView();
  }
});

renderView();
