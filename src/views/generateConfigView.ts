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
}

export function renderGenerateConfigView(ctx: GenerateConfigContext): string {
  const heading = ctx.showWelcome
    ? `<div class="lp-setup">
        <h2>Welcome to Battlestation</h2>
        <p>No <code>battle.json</code> found.</p>
        <p style="margin-bottom: 20px;">Create one automatically or manually to get started.</p>
      </div>`
    : '<h2>🚀 Generate Configuration</h2><p>Auto-detect commands from your workspace.</p>';

  const actions = ctx.showWelcome
    ? `<div class="lp-form-actions" style="margin-top: 20px;">
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
        <div class="lp-sources" style="border-bottom: 1px solid var(--vscode-widget-border); padding-bottom: 10px; margin-bottom: 10px;">
          <div class="lp-sources-title">Detection Method:</div>
          <div style="display: flex; flex-direction: column; gap: 2px; margin-top: 4px;">
            <label class="lp-checkbox-row">
              <input type="radio" name="detectionMethod" value="hybrid" checked style="cursor: pointer;" id="hybridRadio">
              <span>Hybrid (File + Command) - Recommended</span>
            </label>
            <label class="lp-checkbox-row">
              <input type="radio" name="detectionMethod" value="file" style="cursor: pointer;" id="fileRadio">
              <span>File-based (Fast)</span>
            </label>
            <label class="lp-checkbox-row">
              <input type="radio" name="detectionMethod" value="command" style="cursor: pointer;" id="commandRadio">
              <span>Command-based (Accurate)</span>
            </label>
          </div>
          <div style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 6px; font-style: italic;">
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
      ${checkboxStyles}
      ${optionCardStyles}
      .lp-form-actions { display: flex; gap: 8px; }
      ${buttonStyles}
    `,
    body: `
      ${heading}
      
      <label class="lp-option-card" id="showOptionsLabel" for="showOptionsCheck">
        <div class="lp-option-header">
          <input type="checkbox" id="showOptionsCheck" style="cursor: pointer; margin: 0;">
          <span class="lp-option-title">Show generation options</span>
        </div>
        <div class="lp-option-desc">
          When unchecked, all available sources are automatically included
        </div>
      </label>

      <div id="optionsContainer" style="display: none;">
        <div class="lp-sources">
          <div class="lp-sources-title">Auto-detect from:</div>
          ${renderCheckbox("npmCheck", "npm scripts (package.json)", ctx.hasNpm)}
          ${renderCheckbox("tasksCheck", "VS Code tasks (tasks.json)", ctx.hasTasks)}
          ${renderCheckbox("launchCheck", "Launch configs (launch.json)", ctx.hasLaunch)}
        </div>
        ${enhancedSection}
        <div class="lp-sources">
          <div class="lp-sources-title">Global Options:</div>
          ${renderCheckbox("groupCheck", "Group by type", ctx.hasNpm || ctx.hasTasks || ctx.hasLaunch)}
          ${renderCheckbox("colorCheck", "Auto-colorize groups", false)}
        </div>
      </div>
      
      ${actions}
    `,
    script: `
      (function () {
        const vscode = acquireVsCodeApi();
        
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
        
        document.getElementById('createBlankBtn')?.addEventListener('click', () => {
          vscode.postMessage({ command: 'createBlankConfig' });
        });

        function collectSources(optionsVisible) {
          const sources = {};
          
          if (optionsVisible) {
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
          } else {
            // Default to all basic sources enabled if options hidden
            sources.npm = true;
            sources.tasks = true;
            sources.launch = true;
          }
          
          return sources;
        }

        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
          generateBtn.addEventListener('click', () => {
            const optionsVisible = showOptionsCheck?.checked || false;
            const sources = collectSources(optionsVisible);
            const enableGrouping = optionsVisible ? document.getElementById('groupCheck').checked : true;
            const enableColoring = optionsVisible ? document.getElementById('colorCheck').checked : false;
            
            // Get detection method (only if options visible)
            const detectionMethodRadio = document.querySelector('input[name="detectionMethod"]:checked');
            const detectionMethod = (optionsVisible && detectionMethodRadio) ? detectionMethodRadio.value : 'hybrid';
            
            vscode.postMessage({
              command: 'createConfig',
              sources,
              detectionMethod,
              enableGrouping,
              enableColoring
            });
          });
        }

        const createBtn = document.getElementById('createBtn');
        if (createBtn) {
          createBtn.addEventListener('click', () => {
            // createBtn is "Generate" in non-welcome view (options always visible/available in DOM but hidden by default)
            // But actually createBtn is used in the "Generate Configuration" view which is renderGenerateConfigView
            // The logic above handles showOptionsCheck for visibility.
            // Wait, the original code had two blocks. Let's see. 
            // The original code had:
            // generateBtn (welcome view) -> checks showOptionsCheck
            // createBtn (normal view) -> assumes options are available to read?
            
            // Actually in renderGenerateConfigView, both use the same HTML structure for options.
            // The difference is just the button ID.
            
            const optionsVisible = showOptionsCheck?.checked || false; 
            // In the "normal" view (not welcome), optionsContainer is hidden by default too.
            // But we should probably respect the checkboxes regardless of visibility if the user hasn't toggled them?
            // Or maybe just do the same logic.
            
            const sources = collectSources(optionsVisible);
            const enableGrouping = document.getElementById('groupCheck')?.checked ?? true;
            const enableColoring = document.getElementById('colorCheck')?.checked ?? false;

            const detectionMethodRadio = document.querySelector('input[name="detectionMethod"]:checked');
            const detectionMethod = detectionMethodRadio ? detectionMethodRadio.value : 'hybrid';

            vscode.postMessage({
              command: 'createConfig',
              sources,
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
