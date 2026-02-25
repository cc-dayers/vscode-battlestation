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
        </div>
        ${enhancedSection}
        <div class="lp-sources">
          <div class="lp-sources-title">Global Options:</div>
          ${renderCheckbox("groupCheck", "Group by type", ctx.hasNpm || ctx.hasTasks || ctx.hasLaunch)}
          ${renderCheckbox("colorCheck", "Auto-colorize groups", false)}
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
          
          // Basic sources
          const npmCheck = document.getElementById('npmCheck');
          const tasksCheck = document.getElementById('tasksCheck');
          const launchCheck = document.getElementById('launchCheck');
          
          if (npmCheck) sources.npm = npmCheck.checked;
          if (tasksCheck) sources.tasks = tasksCheck.checked;
          if (launchCheck) sources.launch = launchCheck.checked;

          // Enhanced sources
          const dockerCheck = document.getElementById('dockerCheck');
          if (dockerCheck) sources.docker = dockerCheck.checked;
          
          const dockerComposeCheck = document.getElementById('dockerComposeCheck');
          if (dockerComposeCheck) sources.dockerCompose = dockerComposeCheck.checked;
          
          const pythonCheck = document.getElementById('pythonCheck');
          if (pythonCheck) sources.python = pythonCheck.checked;
          
          const goCheck = document.getElementById('goCheck');
          if (goCheck) sources.go = goCheck.checked;
          
          const rustCheck = document.getElementById('rustCheck');
          if (rustCheck) sources.rust = rustCheck.checked;
          
          const makeCheck = document.getElementById('makeCheck');
          if (makeCheck) sources.make = makeCheck.checked;
          
          const gradleCheck = document.getElementById('gradleCheck');
          if (gradleCheck) sources.gradle = gradleCheck.checked;
          
          const mavenCheck = document.getElementById('mavenCheck');
          if (mavenCheck) sources.maven = mavenCheck.checked;
          
          const cmakeCheck = document.getElementById('cmakeCheck');
          if (cmakeCheck) sources.cmake = cmakeCheck.checked;
          
          const gitCheck = document.getElementById('gitCheck');
          if (gitCheck) sources.git = gitCheck.checked;
          
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
              : { ...sources, npm: true, tasks: true, launch: true };
            const enableGrouping = optionsVisible ? document.getElementById('groupCheck').checked : true;
            const enableColoring = optionsVisible ? document.getElementById('colorCheck').checked : false;
            
            // Get detection method (only if options visible)
            const detectionMethodRadio = document.querySelector('input[name="detectionMethod"]:checked');
            const detectionMethod = (optionsVisible && detectionMethodRadio) ? detectionMethodRadio.value : 'hybrid';
            
            vscode.postMessage({
              command: 'createConfig',
              sources: effectiveSources,
              detectionMethod,
              enableGrouping,
              enableColoring
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
              : { ...sources, npm: true, tasks: true, launch: true };
            const enableGrouping = optionsVisible
              ? (document.getElementById('groupCheck')?.checked ?? true)
              : true;
            const enableColoring = optionsVisible
              ? (document.getElementById('colorCheck')?.checked ?? false)
              : false;

            const detectionMethodRadio = document.querySelector('input[name="detectionMethod"]:checked');
            const detectionMethod = detectionMethodRadio ? detectionMethodRadio.value : 'hybrid';

            vscode.postMessage({
              command: 'createConfig',
              sources: effectiveSources,
              detectionMethod,
              enableGrouping,
              enableColoring
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
