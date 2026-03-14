import { htmlShell } from "../templates/layout";
import { buttonStyles, checkboxStyles, optionCardStyles } from "../templates/styles";
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
  hasWorkspace?: boolean;
  isFirstTimer?: boolean;
}

export function renderGenerateConfigView(ctx: GenerateConfigContext): string {
  // No-workspace guard: show a helpful message with Open Folder button
  if (ctx.showWelcome && ctx.hasWorkspace === false) {
    return htmlShell({
      title: 'Battlestation',
      cspSource: ctx.cspSource,
      nonce: ctx.nonce,
      codiconStyles: ctx.codiconStyles,
      body: `
        <div class="lp-setup">
          <h2>Welcome to Battlestation</h2>
          <p>No workspace folder is open.</p>
          <p class="lp-setup-desc">Open a folder to create a <code>battle.json</code> and get started.</p>
          <div class="lp-form-actions lp-form-actions--welcome" style="margin-top: 16px;">
            <button type="button" class="lp-btn lp-btn-primary" id="openFolderBtn">Open Folder</button>
          </div>
        </div>
      `,
      styles: buttonStyles,
      script: `
        (function() {
          const vscode = acquireVsCodeApi();
          document.getElementById('openFolderBtn')?.addEventListener('click', () => {
            vscode.postMessage({ command: 'openFolder' });
          });
        })();
      `,
    });
  }

  const isFirstTimer = ctx.isFirstTimer && ctx.showWelcome;

  if (isFirstTimer) {
    return htmlShell({
      title: "Battlestation",
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
          text-align: center;
          overflow: hidden;
        }
        .lp-anim-container {
          position: relative;
          padding: 60px 16px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 250px;
        }
        .lp-welcome-text {
          margin-bottom: 50px;
          animation: slideDown 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          will-change: transform, opacity;
        }
        .lp-welcome-prefix {
           font-size: 16px;
           font-weight: 400;
           opacity: 0.8;
           text-transform: uppercase;
           letter-spacing: 2px;
        }
        .lp-battle-word {
          font-weight: 900;
          font-size: 42px;
          text-transform: uppercase;
          letter-spacing: 6px;
          color: var(--vscode-textLink-foreground);
          animation: textShake 1.9s cubic-bezier(0.2, 0.8, 0.2, 1) both;
          line-height: 1;
          will-change: transform, opacity, color;
        }
        .lp-emojis {
          position: absolute;
          top: 100%; left: 50%;
          width: 0; height: 0;
          z-index: 10;
          pointer-events: none;
        }
        .lp-emoji {
          position: absolute;
          font-size: 32px;
          margin-top: -16px; margin-left: -16px;
          animation: battleClash 1.5s ease-in-out both;
          will-change: transform, opacity;
          transform: translateZ(0);
        }
        /* Emojis Starting Points & Rotations */
        .e1 { --startX: -160px; --startY: -100px; --rot: 45deg; animation-delay: 0.3s; z-index: 5; }
        .e2 { --startX: 160px; --startY: -80px; --rot: -30deg; animation-delay: 0.4s; z-index: 5; }
        .e3 { --startX: -120px; --startY: 80px; --rot: 15deg; animation-delay: 0.5s; z-index: 5; }
        .e4 { --startX: 120px; --startY: 100px; --rot: -60deg; animation-delay: 0.35s; z-index: 5; }
        .e5 { --startX: 0px;  --startY: -160px; --rot: 90deg; animation-delay: 0.45s; z-index: 5; }
        .e6 { --startX: 80px;  --startY: 120px; --rot: -90deg; animation-delay: 0.55s; z-index: 5; }
        .e7 { --startX: -80px;  --startY: -140px; --rot: -15deg; animation-delay: 0.4s; z-index: 5; }
        
        /* Food pushed to the background - no blur during animation (blur prevents GPU compositing) */
        .e8, .e9, .e10, .e11, .e12 {
          z-index: 1;
          font-size: 20px;
          opacity: 0.65;
        }
        .e8 { --startX: -180px; --startY: 20px; --rot: 60deg; animation-delay: 0.38s; }
        .e9 { --startX: 180px; --startY: 40px; --rot: -45deg; animation-delay: 0.42s; }
        .e10 { --startX: -60px; --startY: 160px; --rot: 120deg; animation-delay: 0.52s; }
        .e11 { --startX: 140px; --startY: -140px; --rot: -75deg; animation-delay: 0.32s; }
        .e12 { --startX: -100px; --startY: -20px; --rot: 30deg; animation-delay: 0.48s; }
        
        .lp-welcome-actions {
          display: flex;
          justify-content: center;
          animation: slideInLeft 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: 1.5s;
          width: 100%;
        }

        @keyframes slideDown {
          0% { transform: translateY(-30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideInLeft {
          0% { transform: translateX(-40px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInRight {
          0% { transform: translateX(40px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes textShake {
          0% { transform: scale(0.5); opacity: 0; }
          15% { transform: scale(1.1); opacity: 1; }
          20% { transform: scale(1); }
          /* Battle time: 15% to 80% */
          35% { transform: translate(-4px, 2px) rotate(-2deg) scale(1.05); color: var(--vscode-errorForeground); }
          40% { transform: translate(4px, -2px) rotate(2deg) scale(1.1); }
          45% { transform: translate(-4px, -2px) rotate(-1deg) scale(1.15); }
          50% { transform: translate(4px, 2px) rotate(2deg) scale(1.05); }
          55% { transform: translate(-3px, 1px) rotate(-2deg) scale(1.1); color: var(--vscode-errorForeground); }
          65% { transform: translate(3px, -1px) rotate(1deg) scale(1.05); }
          85% { transform: translate(0, 0) rotate(0) scale(1); color: var(--vscode-textLink-foreground); }
          100% { transform: translate(0, 0) rotate(0) scale(1); }
        }
        @keyframes battleClash {
          0%   { transform: translate(calc(var(--startX) * 1.5), calc(var(--startY) * 1.5)) scale(0);   opacity: 0; }
          12%  { transform: translate(calc(var(--startX) * 1.1), calc(var(--startY) * 1.1)) scale(0.8); opacity: 1; }
          28%  { transform: translate(calc(var(--startX) * 0.6), calc(var(--startY) * 0.6)) scale(1.1); opacity: 1; }
          44%  { transform: translate(calc(var(--startX) * 0.15), calc(var(--startY) * 0.15)) scale(1.5) rotate(calc(var(--rot) * 0.7)); opacity: 1; }
          55%  { transform: translate(0px, 0px) scale(2) rotate(var(--rot));                             opacity: 1; }
          72%  { transform: translate(0px, 0px) scale(1.4) rotate(calc(var(--rot) * -0.5));             opacity: 0.9; }
          100% { transform: translate(0px, 0px) scale(0);                                               opacity: 0; }
        }

        .lp-btn-autodetect {
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          border-radius: 4px;
          padding: 16px 32px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          width: 80%;
          max-width: 300px;
          transition: background-color 0.2s ease;
        }
        .lp-btn-autodetect:hover {
          background-color: var(--vscode-button-hoverBackground);
        }
        .lp-btn-autodetect .codicon {
          font-size: 24px;
        }
        .lp-welcome-desc {
          font-size: 13px;
          opacity: 0.8;
          margin-top: 16px;
          animation: slideInRight 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: 1.7s;
        }
        .lp-advanced-link {
          font-size: 12px;
          margin-top: 24px;
          color: var(--vscode-textLink-foreground);
          text-decoration: none;
          animation: slideInLeft 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: 1.9s;
          display: inline-block;
          cursor: pointer;
        }
        .lp-advanced-link:hover {
          text-decoration: underline;
        }
        .lp-generation-overlay {
          position: fixed;
          inset: 0;
          display: none;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 24px;
          background: color-mix(in srgb, var(--vscode-editor-background) 86%, transparent);
          backdrop-filter: blur(4px);
          z-index: 100;
          font-size: 15px;
          font-weight: 600;
        }
        .lp-generation-overlay.visible {
          display: flex;
        }
        .lp-generation-pulse {
          position: relative;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lp-generation-pulse::before,
        .lp-generation-pulse::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid var(--vscode-textLink-foreground);
          opacity: 0;
          animation: radarPulse 2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
        .lp-generation-pulse::after {
          animation-delay: 1s;
        }
        @keyframes radarPulse {
          0% { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .lp-generation-icon {
          font-size: 36px !important;
          color: var(--vscode-textLink-foreground);
          z-index: 2;
          animation: iconFloat 2s ease-in-out infinite;
        }
        @keyframes iconFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .lp-generation-text {
          color: var(--vscode-foreground);
          letter-spacing: 2px;
          text-transform: uppercase;
          animation: pulseOpacity 1.5s infinite alternate;
        }
        @keyframes pulseOpacity {
          0% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `,
      body: `
        <div class="lp-anim-container">
          <div class="lp-welcome-text">
            <span class="lp-welcome-prefix">Welcome to the</span>
            <span class="lp-battle-word">BATTLE</span>
            <div class="lp-emojis">
              <span class="lp-emoji e1">⚔️</span>
              <span class="lp-emoji e2">🤖</span>
              <span class="lp-emoji e3">👾</span>
              <span class="lp-emoji e4">🚀</span>
              <span class="lp-emoji e5">💥</span>
              <span class="lp-emoji e6">💣</span>
              <span class="lp-emoji e7">🛡️</span>
              <span class="lp-emoji e8">🍔</span>
              <span class="lp-emoji e9">🌮</span>
              <span class="lp-emoji e10">🌯</span>
              <span class="lp-emoji e11">🍺</span>
              <span class="lp-emoji e12">☕</span>
            </div>
          </div>
          <div class="lp-welcome-actions">
            <button type="button" class="lp-btn-autodetect" id="autoDetectBtn">
              <span class="codicon codicon-sparkle"></span>
              Auto-detect
            </button>
          </div>
          <div class="lp-welcome-desc">
            Instantly detect NPM, Tasks, and Launch configs. Groups and colors included.
          </div>
          <a class="lp-advanced-link" id="advancedOptionsLink">Need more control? View Advanced Options</a>
        </div>
        <div id="generationOverlay" class="lp-generation-overlay" aria-live="polite" aria-hidden="true">
          <div class="lp-generation-pulse">
            <span class="codicon codicon-search lp-generation-icon"></span>
          </div>
          <span class="lp-generation-text">Scanning Battlefield...</span>
        </div>
      `,
      script: `
        (function() {
          const vscode = acquireVsCodeApi();
          const autoDetectBtn = document.getElementById('autoDetectBtn');
          const generationOverlay = document.getElementById('generationOverlay');

          function setGenerationLoading(isLoading) {
            if (generationOverlay) {
              generationOverlay.classList.toggle('visible', isLoading);
              generationOverlay.setAttribute('aria-hidden', isLoading ? 'false' : 'true');
            }
          }

          if (autoDetectBtn) {
            autoDetectBtn.addEventListener('click', () => {
              setGenerationLoading(true);
              autoDetectBtn.disabled = true;
              autoDetectBtn.innerHTML = '<span class="codicon codicon-loading codicon-modifier-spin" style="font-size: 24px; margin-bottom: 8px;"></span><span style="font-size: 14px; font-weight: 600;">Scanning...</span>';
              
              vscode.postMessage({
                command: 'createConfig',
                sources: { npm: true, tasks: true, launch: true },
                detectionMethod: 'hybrid',
                enableGrouping: true,
                enableColoring: true,
                autoOpen: false
              });
            });
          }

          const advancedOptionsLink = document.getElementById('advancedOptionsLink');
          if (advancedOptionsLink) {
            advancedOptionsLink.addEventListener('click', (e) => {
              e.preventDefault();
              vscode.postMessage({ command: 'showAdvancedOptions' });
            });
          }

          window.addEventListener('message', (event) => {
            const message = event.data;
            if (message?.type === 'configGenerationStarted') {
              setGenerationLoading(true);
            }
            if (message?.type === 'configGenerationComplete') {
              setGenerationLoading(false);
              if (autoDetectBtn) {
                autoDetectBtn.disabled = false;
                autoDetectBtn.innerHTML = '<span class="codicon codicon-sparkle" style="font-size: 24px; margin-bottom: 8px;"></span><span style="font-size: 14px; font-weight: 600;">Auto-detect</span>';
              }
            }
          });
        })();
      `
    });
  }

  const heading = ctx.showWelcome
    ? `<div class="lp-setup">
        <h2>Welcome to Battlestation</h2>
        <p>No <code>battle.json</code> found.</p>
        <p class="lp-setup-desc">Create one to get started.</p>
      </div>`
    : '<h2>🚀 Generate Configuration</h2><p>Auto-detect commands from your workspace.</p>';

  const actions = ctx.showWelcome
    ? `<div class="lp-form-actions lp-form-actions--welcome">
        <button type="button" class="lp-btn lp-btn-secondary" id="createBlankBtn">Create Blank</button>
        <button type="button" class="lp-btn lp-btn-primary" id="generateBtn">Generate</button>
      </div>`
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
        <div class="lp-sources lp-sources--detection">
          <div class="lp-sources-title">Detection Method:</div>
          <div class="lp-radio-group">
            <label class="lp-checkbox-row">
              <input type="radio" name="detectionMethod" value="hybrid" checked class="lp-radio-input" id="hybridRadio">
              <span>Hybrid (File + Command) - Recommended</span>
            </label>
            <label class="lp-checkbox-row">
              <input type="radio" name="detectionMethod" value="file" class="lp-radio-input" id="fileRadio">
              <span>File-based (Fast)</span>
            </label>
            <label class="lp-checkbox-row">
              <input type="radio" name="detectionMethod" value="command" class="lp-radio-input" id="commandRadio">
              <span>Command-based (Accurate)</span>
            </label>
          </div>
          <div class="lp-detection-hint">
            ℹ️ Changing detection method will re-scan available tools
          </div>
        </div>
        <div class="lp-sources">
          <div class="lp-sources-title">Container Tools:</div>
          ${renderCheckbox("dockerCheck", "Docker", ctx.enhancedMode.hasDocker, !ctx.enhancedMode.hasDocker)}
          ${renderCheckbox("dockerComposeCheck", "Docker Compose", ctx.enhancedMode.hasDockerCompose, !ctx.enhancedMode.hasDockerCompose)}
        </div>
        <div class="lp-sources">
          <div class="lp-sources-title">Language Runtimes:</div>
          ${renderCheckbox("pythonCheck", "Python", ctx.enhancedMode.hasPython, !ctx.enhancedMode.hasPython)}
          ${renderCheckbox("goCheck", "Go", ctx.enhancedMode.hasGo, !ctx.enhancedMode.hasGo)}
          ${renderCheckbox("rustCheck", "Rust", ctx.enhancedMode.hasRust, !ctx.enhancedMode.hasRust)}
        </div>
        <div class="lp-sources">
          <div class="lp-sources-title">Build Tools:</div>
          ${renderCheckbox("makeCheck", "Make", ctx.enhancedMode.hasMakefile, !ctx.enhancedMode.hasMakefile)}
          ${renderCheckbox("gradleCheck", "Gradle", ctx.enhancedMode.hasGradle, !ctx.enhancedMode.hasGradle)}
          ${renderCheckbox("mavenCheck", "Maven", ctx.enhancedMode.hasMaven, !ctx.enhancedMode.hasMaven)}
          ${renderCheckbox("cmakeCheck", "CMake", ctx.enhancedMode.hasCMake, !ctx.enhancedMode.hasCMake)}
        </div>
        <div class="lp-sources">
          <div class="lp-sources-title">Version Control:</div>
          ${renderCheckbox("gitCheck", "Git Operations", ctx.enhancedMode.hasGit, !ctx.enhancedMode.hasGit)}
        </div>
      </div>
    </details>
  ` : '';

  return htmlShell({
    title: "Battlestation",
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
      .lp-sources--detection {
        border-bottom: 1px solid var(--vscode-widget-border);
        padding-bottom: 10px;
        margin-bottom: 10px;
      }
      .lp-radio-group {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-top: 4px;
      }
      .lp-radio-input {
        cursor: pointer;
      }
      .lp-detection-hint {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        margin-top: 6px;
        font-style: italic;
      }
      .lp-setup-desc {
        margin-bottom: 20px;
      }
      .lp-form-actions--welcome {
        margin-top: 20px;
      }
      .lp-show-options-check {
        cursor: pointer;
        margin: 0;
      }
      .lp-options-hidden {
        display: none;
      }
      .lp-generation-overlay {
        position: fixed;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: color-mix(in srgb, var(--vscode-editor-background) 86%, transparent);
        z-index: 100;
        font-size: 12px;
        font-weight: 600;
      }
      .lp-generation-overlay.visible {
        display: inline-flex;
      }
      ${checkboxStyles}
      ${optionCardStyles}
      .lp-form-actions { display: flex; gap: 8px; }
      ${buttonStyles}
    `,
    body: `
      ${heading}
      
      <label class="lp-option-card" id="showOptionsLabel" for="showOptionsCheck">
        <div class="lp-option-header">
          <input type="checkbox" id="showOptionsCheck" class="lp-show-options-check">
          <span class="lp-option-title">Show generation options</span>
        </div>
        <div class="lp-option-desc">
          When unchecked, all available sources are automatically included
        </div>
      </label>

      <div id="optionsContainer" class="lp-options-hidden">
        <div class="lp-sources">
          <div class="lp-sources-title">Auto-detect from:</div>
          ${renderCheckbox("npmCheck", "npm scripts (package.json)", true)}
          ${renderCheckbox("tasksCheck", "VS Code tasks (tasks.json)", true)}
          ${renderCheckbox("launchCheck", "Launch configs (launch.json)", true)}
          ${renderCheckbox("dockerCheck", "Docker Compose", !!ctx.hasWorkspace)}
          ${renderCheckbox("makeCheck", "Makefiles", !!ctx.hasWorkspace)}
          ${renderCheckbox("rustCheck", "Rust (Cargo)", !!ctx.hasWorkspace)}
          ${renderCheckbox("goCheck", "Go (go.mod)", !!ctx.hasWorkspace)}
        </div>
        ${enhancedSection}
        <div class="lp-sources">
          <div class="lp-sources-title">Global Options:</div>
          ${renderCheckbox("groupCheck", "Group by type", true)}
          ${renderCheckbox("colorCheck", "Auto-colorize groups", true)}
          ${renderCheckbox("autoOpenCheck", "Auto-open config file", false)}
          ${renderCheckbox("deepScanCheck", "Deep Scan (Recursive) - thorough but slower", false)}
        </div>
      </div>
      
      ${actions}
      <div id="generationOverlay" class="lp-generation-overlay" aria-live="polite" aria-hidden="true">
        <span class="codicon codicon-loading codicon-modifier-spin"></span>
        <span>Generating config...</span>
      </div>
    `,
    script: `
      (function () {
        const vscode = acquireVsCodeApi();
        const generationOverlay = document.getElementById('generationOverlay');
        
        // Toggle options visibility with visual state
        const showOptionsCheck = document.getElementById('showOptionsCheck');
        const showOptionsLabel = document.getElementById('showOptionsLabel');
        const optionsContainer = document.getElementById('optionsContainer');

        function updateOptionState() {
          const checked = showOptionsCheck?.checked;
          if (optionsContainer) optionsContainer.style.display = checked ? 'block' : 'none';
          if (showOptionsLabel) {
            if (checked) showOptionsLabel.classList.add('selected');
            else showOptionsLabel.classList.remove('selected');
          }
        }

        showOptionsCheck?.addEventListener('change', updateOptionState);
        // Initialize state
        updateOptionState();
        
        function setButtonLoading(button, isLoading, loadingText = 'Generating...') {
          if (!button) return;
          
          if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            const icon = button.querySelector('.codicon');
            if (icon) {
              icon.className = 'codicon codicon-loading codicon-modifier-spin';
            }
            const textNode = Array.from(button.childNodes).find(n => n.nodeType === 3);
            if (textNode) textNode.textContent = loadingText;
          } else {
            button.disabled = false;
            if (button.dataset.originalText) {
              const textNode = Array.from(button.childNodes).find(n => n.nodeType === 3);
              if (textNode) textNode.textContent = button.dataset.originalText;
            }
          }
        }

        function setGenerationLoading(isLoading) {
          if (generationOverlay) {
            generationOverlay.classList.toggle('visible', isLoading);
            generationOverlay.setAttribute('aria-hidden', isLoading ? 'false' : 'true');
          }
        }

        function clearGenerationLoading() {
          setGenerationLoading(false);
          setButtonLoading(document.getElementById('generateBtn'), false);
          setButtonLoading(document.getElementById('createBtn'), false);
          setButtonLoading(document.getElementById('createBlankBtn'), false);
        }

        window.addEventListener('message', (event) => {
          const message = event.data;
          if (message?.type === 'configGenerationStarted') {
            setGenerationLoading(true);
          }
          if (message?.type === 'configGenerationComplete') {
            clearGenerationLoading();
          }
        });
        
        document.getElementById('createBlankBtn')?.addEventListener('click', () => {
          const btn = document.getElementById('createBlankBtn');
          setGenerationLoading(true);
          setButtonLoading(btn, true, 'Creating...');
          vscode.postMessage({ command: 'createBlankConfig' });
        });

        function collectSources() {
          const sources = {};
          
          const npmCheck = document.getElementById('npmCheck');
          const tasksCheck = document.getElementById('tasksCheck');
          const launchCheck = document.getElementById('launchCheck');
          const dockerCheck = document.getElementById('dockerCheck');
          const makeCheck = document.getElementById('makeCheck');
          const rustCheck = document.getElementById('rustCheck');
          const goCheck = document.getElementById('goCheck');
          
          if (npmCheck) sources.npm = npmCheck.checked;
          if (tasksCheck) sources.tasks = tasksCheck.checked;
          if (launchCheck) sources.launch = launchCheck.checked;
          if (dockerCheck) sources.docker = dockerCheck.checked;
          if (makeCheck) sources.make = makeCheck.checked;
          if (rustCheck) sources.rust = rustCheck.checked;
          if (goCheck) sources.go = goCheck.checked;
          
          return sources;
        }

        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
          generateBtn.addEventListener('click', () => {
            setGenerationLoading(true);
            setButtonLoading(generateBtn, true);
            
            const optionsVisible = showOptionsCheck?.checked || false;
            const sources = collectSources();
            const effectiveSources = optionsVisible
              ? sources
              : { ...sources, npm: true, tasks: true, launch: true, docker: true, make: true, rust: true, go: true };
            const enableGrouping = optionsVisible ? document.getElementById('groupCheck').checked : true;
            const enableColoring = optionsVisible ? document.getElementById('colorCheck').checked : true;
            const autoOpen = optionsVisible ? document.getElementById('autoOpenCheck').checked : false;
            const deepScan = optionsVisible ? document.getElementById('deepScanCheck').checked : false;
            
            vscode.postMessage({
              command: 'createConfig',
              sources: effectiveSources,
              enableGrouping,
              enableColoring,
              autoOpen,
              deepScan
            });
          });
        }

        const createBtn = document.getElementById('createBtn');
        if (createBtn) {
          createBtn.addEventListener('click', () => {
            setGenerationLoading(true);
            setButtonLoading(createBtn, true);
            
            const optionsVisible = showOptionsCheck?.checked || false;
            const sources = collectSources();
            const effectiveSources = optionsVisible
              ? sources
              : { ...sources, npm: true, tasks: true, launch: true, docker: true, make: true, rust: true, go: true };
            const enableGrouping = optionsVisible
              ? (document.getElementById('groupCheck')?.checked ?? true)
              : true;
            const enableColoring = optionsVisible
              ? (document.getElementById('colorCheck')?.checked ?? true)
              : true;
            const autoOpen = optionsVisible
              ? (document.getElementById('autoOpenCheck')?.checked ?? false)
              : false;
            const deepScan = optionsVisible
              ? (document.getElementById('deepScanCheck')?.checked ?? false)
              : false;

            vscode.postMessage({
              command: 'createConfig',
              sources: effectiveSources,
              enableGrouping,
              enableColoring,
              autoOpen,
              deepScan
            });
          });
        }
        
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
          cancelBtn.addEventListener('click', () => {
            vscode.postMessage({ command: 'cancelForm' });
          });
        }

        // Event delegation for detection method changes
        document.addEventListener('change', (e) => {
          if (e.target.matches && e.target.matches('input[name="detectionMethod"]')) {
            const method = e.target.value;
            vscode.postMessage({ command: 'redetectTools', detectionMethod: method });
          }
        });
      })();
    `,
  });
}
