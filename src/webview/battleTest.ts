import { html, render, nothing } from "lit";
import type { BattleProvider } from "../types";

interface BattleTestData {
  provider: BattleProvider;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  duration: number;
  parsedCount: number | null;
  parseError: string | null;
}

declare global {
  interface Window {
    __BATTLE_TEST_DATA__?: Partial<BattleTestData>;
    acquireVsCodeApi: () => {
      postMessage: (message: unknown) => void;
      getState: () => unknown;
      setState: (state: unknown) => void;
    };
  }
}

const vscode = window.acquireVsCodeApi();
const root = document.getElementById("root");

const state: BattleTestData = {
  provider: window.__BATTLE_TEST_DATA__?.provider ?? { id: "", name: "Unknown", command: "" },
  stdout: window.__BATTLE_TEST_DATA__?.stdout ?? "",
  stderr: window.__BATTLE_TEST_DATA__?.stderr ?? "",
  exitCode: window.__BATTLE_TEST_DATA__?.exitCode ?? null,
  duration: window.__BATTLE_TEST_DATA__?.duration ?? 0,
  parsedCount: window.__BATTLE_TEST_DATA__?.parsedCount ?? null,
  parseError: window.__BATTLE_TEST_DATA__?.parseError ?? null,
};

let isRunning = false;

function renderView() {
  if (!root) return;

  const success = state.exitCode === 0 && state.parsedCount !== null && state.parsedCount >= 0;
  const hasError = state.exitCode !== null && state.exitCode !== 0;
  const hasParseError = state.parseError !== null;

  render(
    html`
      <style>
        .bt-shell {
          padding: 24px;
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
          font-family: var(--vscode-font-family);
        }
        .bt-header {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .bt-header h1 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }
        .bt-provider-info {
          background: var(--vscode-editor-background);
          border: 1px solid var(--vscode-panel-border, rgba(127,127,127,0.2));
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .bt-field { display: flex; gap: 8px; align-items: baseline; }
        .bt-field__label {
          font-weight: 600;
          font-size: 12px;
          color: var(--vscode-descriptionForeground);
          min-width: 80px;
        }
        .bt-field__value {
          font-family: var(--vscode-editor-font-family, monospace);
          font-size: 13px;
          word-break: break-all;
        }
        .bt-actions { display: flex; gap: 8px; align-items: center; }
        .bt-btn {
          border: 1px solid var(--vscode-button-border, transparent);
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border-radius: 6px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .bt-btn:hover { background: var(--vscode-button-hoverBackground); }
        .bt-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .bt-btn--secondary {
          background: var(--vscode-button-secondaryBackground);
          color: var(--vscode-button-secondaryForeground);
        }
        .bt-btn--secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }

        .bt-status {
          padding: 12px 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
        }
        .bt-status--success {
          background: color-mix(in srgb, var(--vscode-charts-green, #4caf50) 15%, transparent);
          border: 1px solid var(--vscode-charts-green, #4caf50);
        }
        .bt-status--error {
          background: color-mix(in srgb, var(--vscode-charts-red, #f44336) 15%, transparent);
          border: 1px solid var(--vscode-charts-red, #f44336);
        }
        .bt-status--parse-error {
          background: color-mix(in srgb, var(--vscode-charts-orange, #ff9800) 15%, transparent);
          border: 1px solid var(--vscode-charts-orange, #ff9800);
        }
        .bt-status--running {
          background: color-mix(in srgb, var(--vscode-charts-blue, #2196f3) 15%, transparent);
          border: 1px solid var(--vscode-charts-blue, #2196f3);
        }

        .bt-output-section { display: flex; flex-direction: column; gap: 6px; }
        .bt-output-label {
          font-weight: 600;
          font-size: 12px;
          color: var(--vscode-descriptionForeground);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .bt-output {
          background: var(--vscode-editor-background);
          border: 1px solid var(--vscode-panel-border, rgba(127,127,127,0.2));
          border-radius: 6px;
          padding: 12px;
          font-family: var(--vscode-editor-font-family, monospace);
          font-size: 12px;
          white-space: pre-wrap;
          word-break: break-all;
          max-height: 400px;
          overflow: auto;
          line-height: 1.5;
        }
        .bt-output--stderr {
          border-color: var(--vscode-charts-red, #f44336);
          color: var(--vscode-errorForeground, #f48771);
        }
        .bt-output--empty {
          color: var(--vscode-descriptionForeground);
          font-style: italic;
        }
        .bt-meta {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: var(--vscode-descriptionForeground);
        }
      </style>
      <div class="bt-shell">
        <div class="bt-header">
          <h1><span class="codicon codicon-beaker"></span> Test Battle Provider</h1>
        </div>

        <div class="bt-provider-info">
          <div class="bt-field">
            <span class="bt-field__label">Provider</span>
            <span class="bt-field__value">${state.provider.name}</span>
          </div>
          <div class="bt-field">
            <span class="bt-field__label">Command</span>
            <span class="bt-field__value">${state.provider.command}</span>
          </div>
          ${state.provider.cwd
            ? html`<div class="bt-field">
                <span class="bt-field__label">CWD</span>
                <span class="bt-field__value">${state.provider.cwd}</span>
              </div>`
            : nothing}
          <div class="bt-field">
            <span class="bt-field__label">Interval</span>
            <span class="bt-field__value">${state.provider.refreshInterval ? `${state.provider.refreshInterval}s` : "Manual only"}</span>
          </div>
        </div>

        <div class="bt-actions">
          <button
            class="bt-btn"
            ?disabled=${isRunning}
            @click=${() => {
              vscode.postMessage({ command: "rerun" });
            }}
          >
            <span class="codicon codicon-play"></span>
            ${isRunning ? "Running..." : "Run Again"}
          </button>
          <button
            class="bt-btn bt-btn--secondary"
            @click=${() => vscode.postMessage({ command: "copyStdout" })}
          >
            <span class="codicon codicon-copy"></span> Copy Output
          </button>
        </div>

        ${isRunning
          ? html`<div class="bt-status bt-status--running">
              <span class="codicon codicon-loading codicon-modifier-spin"></span>
              Running provider command...
            </div>`
          : nothing}

        ${!isRunning && success
          ? html`<div class="bt-status bt-status--success">
              <span class="codicon codicon-check"></span>
              Success — parsed ${state.parsedCount} battle${state.parsedCount === 1 ? "" : "s"} in ${state.duration}ms
            </div>`
          : nothing}

        ${!isRunning && hasError
          ? html`<div class="bt-status bt-status--error">
              <span class="codicon codicon-error"></span>
              Command failed with exit code ${state.exitCode}
            </div>`
          : nothing}

        ${!isRunning && !hasError && hasParseError
          ? html`<div class="bt-status bt-status--parse-error">
              <span class="codicon codicon-warning"></span>
              Command succeeded but JSON parsing failed: ${state.parseError}
            </div>`
          : nothing}

        <div class="bt-meta">
          ${state.exitCode !== null
            ? html`<span>Exit code: ${state.exitCode}</span>`
            : nothing}
          ${state.duration > 0
            ? html`<span>Duration: ${state.duration}ms</span>`
            : nothing}
          ${state.stdout
            ? html`<span>Output size: ${(state.stdout.length / 1024).toFixed(1)} KB</span>`
            : nothing}
        </div>

        <div class="bt-output-section">
          <span class="bt-output-label">stdout</span>
          <div class="bt-output ${!state.stdout ? 'bt-output--empty' : ''}">
            ${state.stdout || "(no output)"}
          </div>
        </div>

        ${state.stderr
          ? html`
              <div class="bt-output-section">
                <span class="bt-output-label">stderr</span>
                <div class="bt-output bt-output--stderr">${state.stderr}</div>
              </div>
            `
          : nothing}
      </div>
    `,
    root
  );
}

window.addEventListener("message", (event) => {
  const msg = event.data;
  if (msg.type === "update") {
    Object.assign(state, msg.data);
    isRunning = false;
    renderView();
  }
  if (msg.type === "running") {
    isRunning = true;
    renderView();
  }
});

renderView();
