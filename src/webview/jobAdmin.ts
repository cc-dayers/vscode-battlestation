import { html, render } from "lit";
import type { JobRunRecord, JobRuntimeSnapshot } from "../types";

interface JobAdminState {
  snapshot: JobRuntimeSnapshot | null;
  recentRuns: JobRunRecord[];
}

declare global {
  interface Window {
    __JOB_ADMIN_DATA__?: Partial<JobAdminState>;
    acquireVsCodeApi: () => {
      postMessage: (message: unknown) => void;
      getState: () => unknown;
      setState: (state: unknown) => void;
    };
  }
}

const vscode = window.acquireVsCodeApi();
const root = document.getElementById("root");

const state: JobAdminState = {
  snapshot: window.__JOB_ADMIN_DATA__?.snapshot ?? null,
  recentRuns: window.__JOB_ADMIN_DATA__?.recentRuns ?? [],
};

function formatDateTime(timestamp?: number): string {
  if (!timestamp) { return "-"; }
  return new Date(timestamp).toLocaleString();
}

function formatRelative(timestamp?: number): string {
  if (!timestamp) { return "Never"; }
  const delta = Math.max(Date.now() - timestamp, 0);
  const seconds = Math.floor(delta / 1000);
  if (seconds < 60) { return `${seconds}s ago`; }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) { return `${minutes}m ago`; }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) { return `${hours}h ago`; }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatLabel(value?: string): string {
  if (!value) { return "Unknown"; }
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isProviderSync(snapshot: JobRuntimeSnapshot): boolean {
  return snapshot.sourceKind === "providerSync" || snapshot.targetKind === "providerSync";
}

function getKindLabel(snapshot: JobRuntimeSnapshot): string {
  return isProviderSync(snapshot) ? "Provider Sync" : "Job";
}

function getTargetLabel(snapshot: JobRuntimeSnapshot): string {
  const targetKind = snapshot.targetKind === "providerSync"
    ? "Provider Sync"
    : formatLabel(snapshot.targetKind);
  return snapshot.targetLabel ? `${targetKind} (${snapshot.targetLabel})` : targetKind;
}

function getProviderName(snapshot: JobRuntimeSnapshot): string | undefined {
  if (!isProviderSync(snapshot)) {
    return undefined;
  }

  return snapshot.name.replace(/\s*\(Provider Sync\)\s*$/u, "").trim() || snapshot.providerId || snapshot.targetLabel;
}

function formatOutcome(outcome?: string): string {
  return outcome ? formatLabel(outcome) : "Never";
}

function formatRefreshInterval(snapshot: JobRuntimeSnapshot): string {
  if (!snapshot.intervalSeconds) {
    return snapshot.schedule;
  }

  return `${snapshot.schedule} (${snapshot.intervalSeconds}s)`;
}

function formatLogName(logPath?: string): string {
  if (!logPath) { return "No log yet"; }
  const normalized = logPath.replace(/\\/g, "/");
  const segments = normalized.split("/");
  return segments[segments.length - 1] || logPath;
}

function outcomeClass(outcome?: string): string {
  if (outcome === "success") { return "admin-outcome--success"; }
  if (outcome === "failure") { return "admin-outcome--failure"; }
  return "admin-outcome--blocked";
}

function renderView() {
  if (!root) { return; }
  const { snapshot, recentRuns } = state;

  if (!snapshot) {
    render(
      html`<div class="admin-shell"><p class="admin-empty">No job data available.</p></div>`,
      root
    );
    return;
  }

  const isPaused = snapshot.status === "paused";

  render(
    html`
      <style>
        .admin-shell { padding: 16px; display: flex; flex-direction: column; gap: 16px; max-width: 700px; }
        .admin-header { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; flex-wrap: wrap; }
        .admin-header__title-group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .admin-title { font-size: 18px; font-weight: 700; }
        .admin-badge { border-radius: 999px; padding: 3px 10px; font-size: 11px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }
        .admin-badge--kind { background: color-mix(in srgb, var(--vscode-button-secondaryBackground, var(--vscode-badge-background)) 75%, transparent); color: var(--vscode-button-secondaryForeground, var(--vscode-badge-foreground)); }
        .admin-section { border: 1px solid var(--vscode-panel-border, rgba(127,127,127,0.2)); border-radius: 8px; padding: 12px; }
        .admin-section__title { font-weight: 600; margin-bottom: 8px; font-size: 11px; color: var(--vscode-descriptionForeground); text-transform: uppercase; letter-spacing: 0.06em; }
        .admin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px 16px; }
        .admin-field__label { font-size: 11px; color: var(--vscode-descriptionForeground); margin-bottom: 2px; }
        .admin-field__value { font-size: 13px; word-break: break-all; }
        .admin-inputs { display: flex; flex-direction: column; gap: 4px; font-size: 13px; font-family: var(--vscode-editor-font-family, monospace); }
        .admin-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .admin-btn { border: 1px solid var(--vscode-button-border, transparent); background: var(--vscode-button-secondaryBackground, var(--vscode-button-background)); color: var(--vscode-button-secondaryForeground, var(--vscode-button-foreground)); border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: 13px; }
        .admin-btn--primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
        .admin-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .admin-runs { display: flex; flex-direction: column; gap: 6px; }
        .admin-run { display: grid; grid-template-columns: auto 1fr auto auto; gap: 8px; align-items: center; font-size: 12px; padding: 6px 8px; border-radius: 6px; background: var(--vscode-list-hoverBackground, rgba(127,127,127,0.05)); }
        .admin-outcome { border-radius: 4px; padding: 2px 6px; font-size: 11px; white-space: nowrap; }
        .admin-outcome--success { background: rgba(0,128,0,0.2); color: var(--vscode-testing-iconPassed, #7ec87e); }
        .admin-outcome--failure { background: rgba(200,0,0,0.15); color: var(--vscode-testing-iconFailed, #c87e7e); }
        .admin-outcome--blocked { background: rgba(200,180,0,0.15); color: var(--vscode-testing-iconSkipped, #c8c87e); }
        .admin-run__time { color: var(--vscode-descriptionForeground); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .admin-run__exit { color: var(--vscode-descriptionForeground); font-family: monospace; white-space: nowrap; }
        .admin-log-link { background: transparent; border: none; color: var(--vscode-textLink-foreground); cursor: pointer; padding: 0; font-size: 12px; text-decoration: underline; white-space: nowrap; }
        .admin-log-link:disabled { color: var(--vscode-descriptionForeground); text-decoration: none; cursor: not-allowed; }
        .admin-empty { color: var(--vscode-descriptionForeground); }
        .admin-blocked { color: var(--vscode-errorForeground); font-size: 12px; padding: 8px; background: var(--vscode-inputValidation-errorBackground, rgba(200,0,0,0.1)); border-radius: 4px; }
      </style>
      <div class="admin-shell">
        <div class="admin-header">
          <div class="admin-header__title-group">
            <span class="admin-title">${snapshot.name}</span>
            <span class="admin-badge admin-badge--kind" data-testid="kind-badge">${getKindLabel(snapshot)}</span>
          </div>
          <span class="admin-badge" data-testid="status-badge">${snapshot.status}</span>
        </div>

        ${snapshot.blockedReason
          ? html`<div class="admin-blocked" data-testid="blocked-reason">${snapshot.blockedReason}</div>`
          : null}

        <div class="admin-section" data-testid="definition-section">
          <div class="admin-section__title">Definition</div>
          <div class="admin-grid">
            <div>
              <div class="admin-field__label">Kind</div>
              <div class="admin-field__value" data-testid="field-kind">${getKindLabel(snapshot)}</div>
            </div>
            <div>
              <div class="admin-field__label">Schedule</div>
              <div class="admin-field__value" data-testid="field-schedule">${snapshot.schedule}</div>
            </div>
            ${snapshot.timezone ? html`
              <div>
                <div class="admin-field__label">Timezone</div>
                <div class="admin-field__value" data-testid="field-timezone">${snapshot.timezone}</div>
              </div>` : null}
            <div>
              <div class="admin-field__label">Target</div>
              <div class="admin-field__value" data-testid="field-target">${getTargetLabel(snapshot)}</div>
            </div>
            ${isProviderSync(snapshot) ? html`
              <div>
                <div class="admin-field__label">Provider</div>
                <div class="admin-field__value" data-testid="field-provider">${getProviderName(snapshot) ?? "Unknown provider"}</div>
              </div>
              <div>
                <div class="admin-field__label">Refresh Interval</div>
                <div class="admin-field__value" data-testid="field-refresh">${formatRefreshInterval(snapshot)}</div>
              </div>
            ` : null}
            <div>
              <div class="admin-field__label">Next Run</div>
              <div class="admin-field__value" data-testid="field-next-run">${formatDateTime(snapshot.nextRunAt)}</div>
            </div>
            <div>
              <div class="admin-field__label">Last Run</div>
              <div class="admin-field__value" data-testid="field-last-run">${formatRelative(snapshot.lastFinishedAt)}</div>
            </div>
            <div>
              <div class="admin-field__label">Last Outcome</div>
              <div class="admin-field__value" data-testid="field-last-outcome">${formatOutcome(snapshot.lastOutcome)}</div>
            </div>
            <div>
              <div class="admin-field__label">Latest Log</div>
              <div class="admin-field__value" data-testid="field-last-log" title=${snapshot.lastLogPath ?? "No log yet"}>
                ${formatLogName(snapshot.lastLogPath)}
              </div>
            </div>
            ${snapshot.lastExitCode !== undefined ? html`
              <div>
                <div class="admin-field__label">Last Exit Code</div>
                <div class="admin-field__value" data-testid="field-exit-code">${snapshot.lastExitCode}</div>
              </div>` : null}
          </div>
        </div>

        ${recentRuns.length > 0 && recentRuns[0].inputs && Object.keys(recentRuns[0].inputs).length > 0 ? html`
          <div class="admin-section" data-testid="inputs-section">
            <div class="admin-section__title">Saved Inputs</div>
            <div class="admin-inputs">
              ${Object.entries(recentRuns[0].inputs!).map(([key, value]) => html`
                <div><strong>${key}</strong>: ${value}</div>
              `)}
            </div>
          </div>
        ` : null}

        <div class="admin-section" data-testid="actions-section">
          <div class="admin-section__title">Actions</div>
          <div class="admin-actions">
            <button class="admin-btn admin-btn--primary" data-testid="btn-run-now" @click=${() => vscode.postMessage({ command: "runJobNow", jobId: snapshot.jobId })}>Run Now</button>
            ${isPaused
              ? html`<button class="admin-btn" data-testid="btn-resume" @click=${() => vscode.postMessage({ command: "resumeJob", jobId: snapshot.jobId })}>Resume</button>`
              : html`<button class="admin-btn" data-testid="btn-pause" @click=${() => vscode.postMessage({ command: "pauseJob", jobId: snapshot.jobId })}>Pause</button>`}
            <button class="admin-btn" data-testid="btn-open-log" ?disabled=${!snapshot.lastLogPath} @click=${() => vscode.postMessage({ command: "openJobLog", jobId: snapshot.jobId })}>Open Latest Log</button>
          </div>
        </div>

        <div class="admin-section" data-testid="runs-section">
          <div class="admin-section__title">Recent Runs (last ${recentRuns.length})</div>
          <div class="admin-runs">
            ${recentRuns.length === 0
              ? html`<p class="admin-empty">No runs recorded yet.</p>`
              : recentRuns.map((run) => html`
                <div class="admin-run" data-run-id=${run.runId}>
                  <span class="admin-outcome ${outcomeClass(run.outcome)}">${run.outcome}</span>
                  <span class="admin-run__time">${formatDateTime(run.startedAt)}</span>
                  <span class="admin-run__exit">${run.exitCode !== undefined ? `exit ${run.exitCode}` : ""}</span>
                  <button class="admin-log-link" ?disabled=${!run.logPath} @click=${() => vscode.postMessage({ command: "openRunLog", runId: run.runId, logPath: run.logPath, logLine: run.logLine })}>Log</button>
                </div>
              `)}
          </div>
        </div>
      </div>
    `,
    root
  );
}

window.addEventListener("message", (event) => {
  const msg = event.data;
  if (msg.type === "update") {
    if (msg.data.snapshot !== undefined) { state.snapshot = msg.data.snapshot; }
    if (msg.data.recentRuns !== undefined) { state.recentRuns = msg.data.recentRuns; }
    renderView();
  }
});

renderView();