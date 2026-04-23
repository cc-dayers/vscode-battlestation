import { html, render } from "lit";
import type { JobRuntimeSnapshot } from "../types";

interface JobsViewState {
  jobs: JobRuntimeSnapshot[];
  searchQuery: string;
}

declare global {
  interface Window {
    __JOBS_INITIAL_DATA__?: Partial<JobsViewState>;
    acquireVsCodeApi: () => {
      postMessage: (message: unknown) => void;
      getState: () => unknown;
      setState: (state: unknown) => void;
    };
  }
}

const vscode = window.acquireVsCodeApi();
const root = document.getElementById("root");

const state: JobsViewState = {
  jobs: window.__JOBS_INITIAL_DATA__?.jobs || [],
  searchQuery: "",
};

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

function formatNextRun(timestamp?: number): string {
  if (!timestamp) {
    return "Not scheduled";
  }

  const delta = Math.max(timestamp - Date.now(), 0);
  const seconds = Math.floor(delta / 1000);
  if (seconds < 60) return `in ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `in ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `in ${hours}h`;
  const days = Math.floor(hours / 24);
  return `in ${days}d`;
}

function formatLabel(value?: string): string {
  if (!value) {
    return "Unknown";
  }

  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isProviderSync(job: JobRuntimeSnapshot): boolean {
  return job.sourceKind === "providerSync" || job.targetKind === "providerSync";
}

function getJobKindLabel(job: JobRuntimeSnapshot): string {
  return isProviderSync(job) ? "Provider Sync" : "Job";
}

function getTargetLabel(job: JobRuntimeSnapshot): string {
  const targetKind = job.targetKind === "providerSync" ? "Provider Sync" : formatLabel(job.targetKind);
  return job.targetLabel ? `${targetKind} (${job.targetLabel})` : targetKind;
}

function getProviderName(job: JobRuntimeSnapshot): string | undefined {
  if (!isProviderSync(job)) {
    return undefined;
  }

  return job.name.replace(/\s*\(Provider Sync\)\s*$/u, "").trim() || job.providerId || job.targetLabel;
}

function formatOutcome(job: JobRuntimeSnapshot): string {
  return job.lastOutcome ? formatLabel(job.lastOutcome) : "Never";
}

function formatRefreshInterval(job: JobRuntimeSnapshot): string {
  if (!job.intervalSeconds) {
    return job.schedule;
  }

  return `${job.schedule} (${job.intervalSeconds}s)`;
}

function formatLogName(logPath?: string): string {
  if (!logPath) {
    return "No log yet";
  }

  const normalized = logPath.replace(/\\/g, "/");
  const segments = normalized.split("/");
  return segments[segments.length - 1] || logPath;
}

function filteredJobs(): JobRuntimeSnapshot[] {
  const query = state.searchQuery.trim().toLowerCase();
  if (!query) {
    return state.jobs;
  }

  return state.jobs.filter((job) =>
    [
      job.name,
      job.schedule,
      job.targetKind,
      job.targetLabel,
      job.status,
      job.sourceKind,
      job.providerId,
      getProviderName(job),
      job.lastOutcome,
      formatLogName(job.lastLogPath),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  );
}

function actionButtons(job: JobRuntimeSnapshot) {
  const paused = job.status === "paused" || job.paused === true;
  return html`
    <div class="jobs-card__actions">
      <button class="jobs-btn" @click=${() => vscode.postMessage({ command: "runJobNow", jobId: job.jobId })}>
        Run Now
      </button>
      ${paused
        ? html`<button class="jobs-btn" @click=${() => vscode.postMessage({ command: "resumeJob", jobId: job.jobId })}>Resume</button>`
        : html`<button class="jobs-btn" @click=${() => vscode.postMessage({ command: "pauseJob", jobId: job.jobId })}>Pause</button>`}
      <button
        class="jobs-btn"
        ?disabled=${!job.lastLogPath}
        @click=${() => vscode.postMessage({ command: "openJobLog", jobId: job.jobId })}
      >
        Open Log
      </button>
      <button
        class="jobs-btn jobs-btn--details"
        @click=${() => vscode.postMessage({ command: "openJobAdmin", jobId: job.jobId })}
      >
        Details
      </button>
    </div>
  `;
}

function renderView() {
  if (!root) {
    return;
  }

  const jobs = filteredJobs();

  render(
    html`
      <style>
        :host { color: var(--vscode-foreground); }
        .jobs-shell { padding: 12px; display: flex; flex-direction: column; gap: 12px; }
        .jobs-search { width: 100%; box-sizing: border-box; border: 1px solid var(--vscode-input-border, transparent); background: var(--vscode-input-background); color: var(--vscode-input-foreground); padding: 8px 10px; border-radius: 6px; }
        .jobs-list { display: flex; flex-direction: column; gap: 10px; content-visibility: auto; }
        .jobs-card { border: 1px solid var(--vscode-panel-border, rgba(127,127,127,0.2)); background: var(--vscode-sideBar-background); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
        .jobs-card__header { display: flex; gap: 8px; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; }
        .jobs-card__title { font-weight: 600; }
        .jobs-card__badges { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
        .jobs-badge { border-radius: 999px; padding: 2px 8px; font-size: 11px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }
        .jobs-badge--kind { background: color-mix(in srgb, var(--vscode-button-secondaryBackground, var(--vscode-badge-background)) 75%, transparent); color: var(--vscode-button-secondaryForeground, var(--vscode-badge-foreground)); }
        .jobs-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 6px 10px; font-size: 12px; color: var(--vscode-descriptionForeground); }
        .jobs-meta strong { color: var(--vscode-foreground); }
        .jobs-blocked { color: var(--vscode-errorForeground); font-size: 12px; padding: 8px 10px; border-radius: 6px; background: var(--vscode-inputValidation-errorBackground, rgba(200,0,0,0.1)); }
        .jobs-card__actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .jobs-btn { border: 1px solid var(--vscode-button-border, transparent); background: var(--vscode-button-secondaryBackground, var(--vscode-button-background)); color: var(--vscode-button-secondaryForeground, var(--vscode-button-foreground)); border-radius: 6px; padding: 6px 10px; cursor: pointer; }
        .jobs-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .jobs-empty { border: 1px dashed var(--vscode-panel-border, rgba(127,127,127,0.2)); border-radius: 8px; padding: 16px; color: var(--vscode-descriptionForeground); text-align: center; }
      </style>
      <div class="jobs-shell">
        <input class="jobs-search" type="search" placeholder="Search jobs" .value=${state.searchQuery} @input=${(event: InputEvent) => { state.searchQuery = (event.target as HTMLInputElement).value; renderView(); }} />
        <div class="jobs-list">
          ${jobs.length === 0
            ? html`<div class="jobs-empty">No jobs match the current search.</div>`
            : jobs.map(
                (job) => html`
                  <article class="jobs-card" data-job-id=${job.jobId}>
                    <div class="jobs-card__header">
                      <span class="jobs-card__title">${job.name}</span>
                      <div class="jobs-card__badges">
                        <span class="jobs-badge jobs-badge--kind" data-testid="job-kind-badge">${getJobKindLabel(job)}</span>
                        <span class="jobs-badge">${job.status}</span>
                      </div>
                    </div>
                    <div class="jobs-meta">
                      <span data-testid="job-field-target">Target: <strong>${getTargetLabel(job)}</strong></span>
                      ${isProviderSync(job)
                        ? html`
                            <span data-testid="job-field-provider">Provider: <strong>${getProviderName(job) ?? "Unknown provider"}</strong></span>
                            <span data-testid="job-field-refresh">Refresh interval: <strong>${formatRefreshInterval(job)}</strong></span>
                          `
                        : html`<span>Schedule: <strong>${job.schedule}</strong></span>`}
                      <span>Next run: ${formatNextRun(job.nextRunAt)}</span>
                      <span>Last run: ${formatRelativeTime(job.lastFinishedAt)}</span>
                      <span data-testid="job-field-last-outcome">Last outcome: <strong>${formatOutcome(job)}</strong></span>
                      <span data-testid="job-field-last-log">Latest log: <strong>${formatLogName(job.lastLogPath)}</strong></span>
                    </div>
                    ${job.blockedReason ? html`<div class="jobs-blocked">${job.blockedReason}</div>` : null}
                    ${actionButtons(job)}
                  </article>
                `
              )}
        </div>
      </div>
    `,
    root
  );
}

window.addEventListener("message", (event) => {
  const msg = event.data;
  if (msg.type === "update") {
    state.jobs = msg.data.jobs || [];
    renderView();
  }
});

renderView();