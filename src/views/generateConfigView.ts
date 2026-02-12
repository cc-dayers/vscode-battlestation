import { htmlShell } from "../templates/layout";
import { buttonStyles, checkboxStyles } from "../templates/styles";
import { renderCheckbox } from "./helpers";

export interface EnhancedModeContext {
  hasDocker: boolean;
  hasDockerCompose: boolean;
  hasPython: boolean;
  hasGo: boolean;
  hasRust: boolean;
  hasMakefile: boolean;
  hasGradle: boolean;
  hasMaven: boolean;
  hasCMake: boolean;
  hasGit: boolean;
}

export interface GenerateConfigContext {
  cspSource: string;
  nonce: string;
  codiconStyles: string;
  hasNpm: boolean;
  hasTasks: boolean;
  hasLaunch: boolean;
  showWelcome: boolean;
  enhancedMode?: EnhancedModeContext;
}

export function renderGenerateConfigView(ctx: GenerateConfigContext): string {
  const heading = ctx.showWelcome
    ? `<div class="lp-setup">
        <h2>Welcome to Battlestation</h2>
        <p>No <code>battle.config</code> found.</p>
        <p>Create one automatically or manually to get started.</p>
      </div>`
    : '<h2>🚀 Generate Configuration</h2><p>Auto-detect commands from your workspace.</p>';

  const actions = ctx.showWelcome
    ? '<button class="lp-btn lp-btn-primary" id="createBtn" style="width: 100%;">Create battle.config</button>'
    : `<div class="lp-form-actions">
        <button type="button" class="lp-btn lp-btn-secondary" id="cancelBtn">Cancel</button>
        <button type="button" class="lp-btn lp-btn-primary" id="createBtn">Generate</button>
      </div>`;

  // Enhanced Mode section (only show if enhancedMode context is provided)
  const enhancedSection = ctx.enhancedMode ? `
    <details class="lp-enhanced-section">
      <summary class="lp-enhanced-header">
        <span class="codicon codicon-sparkle"></span>
        Enhanced Mode (Advanced Options)
      </summary>
      <div class="lp-enhanced-content">
        <div class="lp-sources">
          <div class="lp-sources-title">Container Tools:</div>
          ${renderCheckbox("dockerCheck", "Docker", ctx.enhancedMode.hasDocker)}
          ${renderCheckbox("dockerComposeCheck", "Docker Compose", ctx.enhancedMode.hasDockerCompose)}
        </div>
        <div class="lp-sources">
          <div class="lp-sources-title">Language Runtimes:</div>
          ${renderCheckbox("pythonCheck", "Python", ctx.enhancedMode.hasPython)}
          ${renderCheckbox("goCheck", "Go", ctx.enhancedMode.hasGo)}
          ${renderCheckbox("rustCheck", "Rust", ctx.enhancedMode.hasRust)}
        </div>
        <div class="lp-sources">
          <div class="lp-sources-title">Build Tools:</div>
          ${renderCheckbox("makeCheck", "Make", ctx.enhancedMode.hasMakefile)}
          ${renderCheckbox("gradleCheck", "Gradle", ctx.enhancedMode.hasGradle)}
          ${renderCheckbox("mavenCheck", "Maven", ctx.enhancedMode.hasMaven)}
          ${renderCheckbox("cmakeCheck", "CMake", ctx.enhancedMode.hasCMake)}
        </div>
        <div class="lp-sources">
          <div class="lp-sources-title">Version Control:</div>
          ${renderCheckbox("gitCheck", "Git Operations", ctx.enhancedMode.hasGit)}
        </div>
        <div class="lp-sources">
          <div class="lp-sources-title">Detection Method:</div>
          <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px;">
            <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
              <input type="radio" name="detectionMethod" value="hybrid" checked style="cursor: pointer;">
              <span>Hybrid (File + Command) - Recommended</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
              <input type="radio" name="detectionMethod" value="file" style="cursor: pointer;">
              <span>File-based (Fast)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
              <input type="radio" name="detectionMethod" value="command" style="cursor: pointer;">
              <span>Command-based (Accurate)</span>
            </label>
          </div>
        </div>
      </div>
    </details>
  ` : '';

  return htmlShell({
    title: "Launchpad",
    cspSource: ctx.cspSource,
    nonce: ctx.nonce,
    codiconStyles: ctx.codiconStyles,
    styles: `
      body {
        font-family: var(--vscode-font-family);
        color: var(--vscode-foreground);
        background: transparent;
        padding: 16px 8px;
        margin: 0;
      }
      h2 { font-size: 14px; margin: 0 0 8px; }
      p { font-size: 12px; opacity: 0.8; margin: 0 0 12px; }
      .lp-sources {
        text-align: left;
        margin: 0 0 12px;
        padding: 8px;
        background: var(--vscode-editor-background);
        border-radius: 4px;
      }
      .lp-sources-title {
        font-size: 11px;
        font-weight: 600;
        opacity: 0.7;
        margin: 0 0 8px;
        text-transform: uppercase;
      }
      .lp-enhanced-section {
        margin: 8px 0 12px;
        border: 1px solid var(--vscode-widget-border);
        border-radius: 4px;
        overflow: hidden;
      }
      .lp-enhanced-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        background: var(--vscode-editor-background);
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        user-select: none;
      }
      .lp-enhanced-header:hover {
        background: var(--vscode-list-hoverBackground);
      }
      .lp-enhanced-header .codicon {
        font-size: 14px;
      }
      .lp-enhanced-content {
        padding: 8px;
        background: var(--vscode-editor-background);
      }
      .lp-enhanced-content .lp-sources {
        margin-bottom: 8px;
      }
      .lp-enhanced-content .lp-sources:last-child {
        margin-bottom: 0;
      }
      ${checkboxStyles}
      .lp-form-actions { display: flex; gap: 8px; margin-top: 12px; }
      ${buttonStyles}
    `,
    body: `
      ${heading}
      <div class="lp-sources">
        <div class="lp-sources-title">Auto-detect from:</div>
        ${renderCheckbox("npmCheck", "npm scripts (package.json)", ctx.hasNpm)}
        ${renderCheckbox("tasksCheck", "VS Code tasks (tasks.json)", ctx.hasTasks)}
        ${renderCheckbox("launchCheck", "Launch configs (launch.json)", ctx.hasLaunch)}
      </div>
      ${enhancedSection}
      <div class="lp-sources" style="margin-top: 8px;">
        <div class="lp-sources-title">Options:</div>
        ${renderCheckbox("groupCheck", "Group by type", ctx.hasNpm || ctx.hasTasks || ctx.hasLaunch)}
      </div>
      ${actions}
    `,
    script: `
      (function () {
        const vscode = acquireVsCodeApi();
        document.getElementById('createBtn').addEventListener('click', () => {
          const sources = {
            npm: document.getElementById('npmCheck').checked,
            tasks: document.getElementById('tasksCheck').checked,
            launch: document.getElementById('launchCheck').checked
          };

          // Collect enhanced sources if available
          const enhancedSources = {};
          const dockerCheckbox = document.getElementById('dockerCheck');
          if (dockerCheckbox) {
            enhancedSources.docker = dockerCheckbox.checked;
            enhancedSources.dockerCompose = document.getElementById('dockerComposeCheck').checked;
            enhancedSources.python = document.getElementById('pythonCheck').checked;
            enhancedSources.go = document.getElementById('goCheck').checked;
            enhancedSources.rust = document.getElementById('rustCheck').checked;
            enhancedSources.make = document.getElementById('makeCheck').checked;
            enhancedSources.gradle = document.getElementById('gradleCheck').checked;
            enhancedSources.maven = document.getElementById('mavenCheck').checked;
            enhancedSources.cmake = document.getElementById('cmakeCheck').checked;
            enhancedSources.git = document.getElementById('gitCheck').checked;
          }

          // Get detection method
          const detectionMethodRadio = document.querySelector('input[name="detectionMethod"]:checked');
          const detectionMethod = detectionMethodRadio ? detectionMethodRadio.value : 'hybrid';

          const enableGrouping = document.getElementById('groupCheck').checked;
          vscode.postMessage({
            command: 'createConfig',
            sources,
            enhancedSources,
            detectionMethod,
            enableGrouping
          });
        });
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
          cancelBtn.addEventListener('click', () => {
            vscode.postMessage({ command: 'cancelForm' });
          });
        }
      })();
    `,
  });
}
