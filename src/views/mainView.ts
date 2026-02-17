
import { htmlShell } from "../templates/layout";
import { toastStyles } from "../templates/styles";
import { esc } from "./helpers";
import type { Config, Action, SecondaryGroup } from "../types";

export interface MainViewContext {
  cspSource: string;
  nonce: string;
  codiconStyles: string;
  config: Config;
  showHidden: boolean;
}

/* ─── renderButton ─── */
function renderButton(
  item: Action,
  getIcon: (type: string) => string,
  groupOptions: string,
  showIconSetting: boolean,
  showTypeSetting: boolean,
  showCommandSetting: boolean,
  hideIconName: string,
  secondaryGroups: Record<string, SecondaryGroup> = {},
  showCheckbox = false
): string {
  const icon = showIconSetting ? getIcon(item.type) : "";
  const itemJson = JSON.stringify(item).replace(/'/g, "&#39;");
  const groupOptionsWithItem = groupOptions.replace(/__PLACEHOLDER__/g, itemJson);

  // Smart metadata display - reduce redundancy
  const metaParts: string[] = [];

  // Always show workspace badge if present
  if (item.workspace) {
    const sg = secondaryGroups[item.workspace];
    let badgeStyle = "";
    if (sg) {
      if (sg.color) badgeStyle += `color: ${sg.color};`;
      if (sg.backgroundColor) badgeStyle += `background-color: ${sg.backgroundColor};`;
      if (sg.borderColor) badgeStyle += `border: 1px solid ${sg.borderColor};`;
    }
    const sgIcon = sg?.icon ? `<span class="codicon codicon-${sg.icon}" style="font-size: 10px; margin-right: 3px;"></span>` : "";
    metaParts.push(`<span class="lp-workspace-label" style="${badgeStyle}">${sgIcon}${esc(item.workspace)}</span>`);
  }

  // Smart type/command display logic
  const commandLower = item.command.toLowerCase();
  const typeLower = item.type.toLowerCase();

  // Check if command starts with type (e.g., "npm run..." and type is "npm")
  const commandStartsWithType = commandLower.startsWith(typeLower + ' ') ||
    commandLower.startsWith(typeLower + ':');

  // For npm scripts, extract script name for cleaner display
  const isNpmScript = item.type === 'npm' && item.command.match(/^npm\s+run\s+(.+)$/);

  // Clean up debug commands: workbench.action.debug.start?name=...
  // Usually comes via toolDetectionService as a raw command string
  const isDebugStart = item.command.includes('workbench.action.debug.start');
  let debugConfigName = "";
  if (isDebugStart) {
    // Try to extract name from query param
    // format might be `workbench.action.debug.start?{"configName":"Foo"}` or simpler
    // But our tool detection builds command like `workbench.action.debug.start?${encodeURIComponent(JSON.stringify(args))}`
    // Let's look for a name pattern or just rely on the item name if available
    // Actually, usually the item.name IS the config name + type prefix.
    // The user wants to hide the ugly command string in the metadata.
  }

  if (showTypeSetting && showCommandSetting) {
    // Both enabled - avoid redundancy
    if (isNpmScript && showCommandSetting) {
      // Show just the script name for npm run commands
      const scriptName = item.command.match(/^npm\s+run\s+(.+)$/)?.[1];
      if (scriptName) {
        metaParts.push(`npm script: ${esc(scriptName)}`);
      } else {
        metaParts.push(esc(item.command));
      }
    } else if (isDebugStart) {
      // Hide the ugly command string entirely for debug start actions
      // Just show "Debug Configuration" or similar if we want context
      // Or if we can parse the name, show it.
      // But typically the name is already the config name.
      // So maybe we show nothing for command string?
      // Or "Launch Configuration"
      metaParts.push("Launch Configuration");
    } else if (commandStartsWithType) {
      // Command already shows type, just show command
      metaParts.push(esc(item.command));
    } else {
      // Different info, show both
      metaParts.push(esc(item.type));
      metaParts.push(esc(item.command));
    }
  } else if (showTypeSetting) {
    metaParts.push(esc(item.type));
  } else if (showCommandSetting) {
    // Just command - use smart display for npm
    if (isNpmScript) {
      const scriptName = item.command.match(/^npm\s+run\s+(.+)$/)?.[1];
      metaParts.push(scriptName ? `npm: ${esc(scriptName)}` : esc(item.command));
    } else if (isDebugStart) {
      metaParts.push("Launch Configuration");
    } else {
      metaParts.push(esc(item.command));
    }
  }

  const metadata = metaParts.length > 0
    ? `<span class="lp-btn-meta">${metaParts.join(" \u00b7 ")}</span>`
    : "";

  const hasGroups = groupOptions.length > 0;
  const isInGroup = !!item.group;
  const showGroupButton = hasGroups || isInGroup;
  const hideIcon = item.hidden ? "eye" : hideIconName;

  // Apply action background color if set
  const actionStyle = item.backgroundColor ? `background-color: ${item.backgroundColor} !important;` : "";

  return `<div class="lp-btn-wrapper">
    ${showCheckbox ? `<input type="checkbox" class="lp-btn-checkbox" data-item='${itemJson}'>` : ""}
    <button class="lp-play-btn" data-command="executeCommand" data-item='${itemJson}' title="Run this action"><span class="codicon codicon-play"></span></button>
    <div class="lp-btn ${showCheckbox ? "has-checkbox" : ""}" style="${actionStyle}">
      <span class="lp-btn-name">
        ${icon ? `<span class="codicon codicon-${icon} lp-icon"></span>` : ""}${esc(item.name)}${item.hidden ? ' <span class="lp-hidden-badge">(hidden)</span>' : ""}
      </span>
      ${metadata}
    </div>
    ${showGroupButton
      ? isInGroup && !hasGroups
        ? `<button class="lp-ungroup-btn" data-command="assignGroup" data-item='${itemJson}' data-group-name="__none__" title="Remove from group"><span class="codicon codicon-folder-opened"></span></button>`
        : `<button class="lp-group-btn" data-command="toggleGroupDropdown" data-item='${itemJson}' title="${isInGroup ? "Change group" : "Assign to group"}"><span class="codicon codicon-${isInGroup ? "folder-opened" : "folder"}"></span></button>
           <div class="lp-group-dropdown" style="display: none;">
             <div class="lp-group-option" data-command="assignGroup" data-item='${itemJson}' data-group-name="__none__"><span class="codicon codicon-x"></span> Remove from group</div>
             ${groupOptionsWithItem}
           </div>`
      : ""}
    <button class="lp-color-btn" data-command="setActionColor" data-item='${itemJson}' title="Set action color"><span class="codicon codicon-symbol-color"></span></button>
    <button class="lp-edit-btn" data-command="editAction" data-item='${itemJson}' title="Edit this action"><span class="codicon codicon-edit"></span></button>
    <button class="lp-hide-btn" data-command="hideAction" data-item='${itemJson}' title="${item.hidden ? "Show this action" : "Hide this action"}"><span class="codicon codicon-${hideIcon} lp-hide-icon"></span></button>
  </div>`;
}

/* ─── main view ─── */
export function renderMainView(ctx: MainViewContext): string {
  const { config } = ctx;

  const visibleActions = ctx.showHidden
    ? config.actions
    : config.actions.filter((item) => !item.hidden);

  const hiddenCount = config.actions.filter((item) => item.hidden).length;

  // Build icon map
  const iconMap = new Map<string, string>();
  if (config.icons) {
    config.icons.forEach((m) => iconMap.set(m.type, m.icon));
  }
  // NOTE: customMappings from workspace settings are merged by the caller
  //       into config.icons before this function is called.
  const getIcon = (type: string): string => iconMap.get(type) || "";

  // Display settings (passed via config meta or read externally)
  // We accept them from the caller for testability, but provide defaults.
  const showIconSetting = (config as any).__showIcon ?? true;
  const showTypeSetting = (config as any).__showType ?? true;
  const showCommandSetting = (config as any).__showCommand ?? true;
  const hideIconName: string = (config as any).__hideIcon ?? "eye-closed";
  const showGroupsSetting = (config as any).__showGroup ?? true;
  const playButtonBg = (config as any).__playButtonBackgroundColor ?? "transparent";
  const density = config.density || "comfortable"; // Default to comfortable

  const secondaryGroups = config.secondaryGroups || {};

  // Groups
  const groups = config.groups || [];

  // Inject CSS variable
  const dynamicStyles = `
    .lp-play-btn { --lp-play-btn-bg: ${playButtonBg}; }
  `;
  const groupOptions = groups
    .map(
      (g) =>
        `<div class="lp-group-option" data-command="assignGroup" data-item="__PLACEHOLDER__" data-group-name="${esc(g.name)}">${g.icon ? g.icon + " " : ""}${esc(g.name)}</div>`
    )
    .join("\n");

  const hasGroups = groups.length > 0;
  const actionsHaveGroups = visibleActions.some((item) => item.group);
  let content = "";

  const btn = (item: Action) =>
    renderButton(item, getIcon, groupOptions, showIconSetting, showTypeSetting, showCommandSetting, hideIconName, secondaryGroups);

  if (hasGroups && actionsHaveGroups && showGroupsSetting) {
    const actionsByGroup = new Map<string, Action[]>();
    const ungroupedActions: Action[] = [];

    visibleActions.forEach((item) => {
      if (item.group) {
        if (!actionsByGroup.has(item.group)) { actionsByGroup.set(item.group, []); }
        actionsByGroup.get(item.group)!.push(item);
      } else {
        ungroupedActions.push(item);
      }
    });

    groups.forEach((group) => {
      const groupActions = actionsByGroup.get(group.name) || [];
      if (groupActions.length > 0) {
        const buttons = groupActions.map(btn).join("\n");
        const groupIconHtml = group.icon
          ? /^[a-z0-9-]+$/.test(group.icon)
            ? `<span class="codicon codicon-${group.icon} lp-group-icon"></span>`
            : `<span class="lp-group-icon">${group.icon}</span>`
          : "";
        const groupJson = JSON.stringify(group).replace(/'/g, "&#39;");
        const groupStyles = [];
        if (group.color) groupStyles.push(`color: ${group.color}`);
        if (group.backgroundColor) groupStyles.push(`background-color: ${group.backgroundColor}`);
        if (group.borderColor) groupStyles.push(`border-color: ${group.borderColor}`);
        const groupStyle = groupStyles.length > 0 ? `style="${groupStyles.join('; ')}"` : "";

        const groupItemsStyles = [];
        if (group.backgroundColor) groupItemsStyles.push(`background-color: ${group.backgroundColor}`);
        if (group.borderColor) {
          groupItemsStyles.push(`border: 1px solid ${group.borderColor}`);
          groupItemsStyles.push(`border-radius: 4px`);
          groupItemsStyles.push(`padding: 8px`);
        }
        const groupItemsStyle = groupItemsStyles.length > 0 ? `style="${groupItemsStyles.join('; ')}"` : "";

        content += `
          <details class="lp-group" data-group="${esc(group.name)}" open>
            <summary class="lp-group-header" ${groupStyle}>
              <span class="codicon codicon-chevron-down lp-group-chevron"></span>
              <div class="lp-group-header-content">
                ${groupIconHtml}
                <span class="lp-group-name">${esc(group.name)}</span>
              </div>
              <button class="lp-group-edit-btn" data-command="editGroup" data-group='${groupJson}' title="Edit group" type="button"><span class="codicon codicon-settings-gear"></span></button>
            </summary>
            <div class="lp-group-items" ${groupItemsStyle}>${buttons}</div>
          </details>`;
      }
    });

    if (ungroupedActions.length > 0) {
      const buttons = ungroupedActions.map(btn).join("\n");
      content += `
        <details class="lp-group" data-group="__ungrouped__" open>
          <summary class="lp-group-header">
            <span class="codicon codicon-chevron-down lp-group-chevron"></span>
            <span class="lp-group-name" style="opacity: 0.6;">Ungrouped</span>
          </summary>
          <div class="lp-group-items">${buttons}</div>
        </details>`;
    }
  } else {
    content = visibleActions.map(btn).join("\n");
  }

  if (visibleActions.length === 0) {
    content = `
      <div class="lp-empty-state">
        <div class="lp-welcome">
          <h2 class="lp-welcome-title">Welcome to Battlestation</h2>
          <p class="lp-welcome-text">Quick command launcher for your workspace</p>
        </div>
        <div class="lp-empty-actions">
          <button class="lp-empty-btn lp-empty-primary" id="generateConfigBtn">
            <span class="codicon codicon-sparkle"></span>
            <span class="lp-btn-label">Auto-detect</span>
            <span class="lp-btn-hint">Scan workspace for npm scripts, tasks, and launch configs</span>
          </button>
          <button class="lp-empty-btn lp-empty-secondary" id="exampleConfigBtn">
            <span class="codicon codicon-bracket"></span>
            <span class="lp-btn-label">Example Config</span>
            <span class="lp-btn-hint">Start with a template you can customize</span>
          </button>
        </div>
      </div>`;
  }

  return htmlShell({
    title: "Launchpad",
    cspSource: ctx.cspSource,
    nonce: ctx.nonce,
    codiconStyles: ctx.codiconStyles,
    styles: mainViewStyles + dynamicStyles,
    body: `
      <div id="toast" class="lp-toast"></div>
      ${visibleActions.length > 0 ? `
        <input type="text" class="lp-search-box" id="searchBox" placeholder="🔍 Search (try: workspace:coordinator, group:npm, -type:shell, -test)..." autocomplete="off">
        <div id="searchActions" style="display: none;" class="lp-search-actions">
          <button class="lp-search-btn" id="hideAllBtn" style="display: none;">Hide All</button>
          <button class="lp-search-btn" id="showAllBtn" style="display: none;">Show All</button>
          <button class="lp-search-btn" id="selectMultipleBtn" style="display: none;">Select Multiple</button>
        </div>
        <div id="selectionActions" style="display: none;" class="lp-search-actions">
          <button class="lp-search-btn" id="hideSelectedBtn">Hide Selected</button>
          <button class="lp-search-btn" id="showSelectedBtn">Show Selected</button>
          <button class="lp-search-btn lp-btn-secondary" id="cancelSelectionBtn">Cancel</button>
        </div>
      ` : ''}
      ${hiddenCount > 0 ? `<div class="lp-toolbar"><label class="lp-toggle"><input type="checkbox" id="toggleHidden" ${ctx.showHidden ? "checked" : ""}><span>Show hidden (${hiddenCount})</span></label></div>` : ""}
      <div class="lp-grid ${density}" id="contentGrid">
        ${content}
      </div>
    `,
    script: mainViewScript(visibleActions, iconMap, config),
  });
}

/* ─── styles ─── */
const mainViewStyles = `
  * { box-sizing: border-box; }
  body {
    font-family: var(--vscode-font-family);
    color: var(--vscode-foreground);
    background: transparent;
    padding: 8px;
    margin: 0;
    overflow-x: hidden;
  }
  .lp-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; padding: 4px; font-size: 11px; }
  .lp-search-box { width: 100%; padding: 6px 8px; margin-bottom: 8px; font-size: 12px; font-family: inherit; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border, transparent); border-radius: 3px; }
  .lp-search-box:focus { outline: 1px solid var(--vscode-focusBorder); }
  .lp-search-actions { display: flex; gap: 6px; margin-bottom: 8px; }
  .lp-search-btn { flex: 1; padding: 4px 8px; font-size: 11px; font-family: inherit; border: none; border-radius: 3px; cursor: pointer; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
  .lp-search-btn:hover { background: var(--vscode-button-secondaryHoverBackground); }
  .lp-toggle { display: flex; align-items: center; gap: 4px; cursor: pointer; opacity: 0.8; user-select: none; }
  .lp-toggle:hover { opacity: 1; }
  .lp-toggle input[type="checkbox"] { cursor: pointer; }
  .lp-toggle input[type="checkbox"] { cursor: pointer; }
  .lp-grid { display: flex; flex-direction: column; gap: 1px; }
  .lp-group { margin-bottom: 0; }
  .lp-group > summary { list-style: none; }
  .lp-group > summary::-webkit-details-marker { display: none; }
  .lp-group-header { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 4px 8px; margin-bottom: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; opacity: 0.95; border-bottom: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.35)); position: sticky; top: 0; z-index: 5; background: var(--vscode-editor-background); cursor: pointer; }
  .lp-group-chevron { font-size: 14px; opacity: 0.7; transition: transform 150ms ease; flex-shrink: 0; }
  .lp-group:not([open]) .lp-group-chevron { transform: rotate(-90deg); }
  .lp-group-header-content { display: flex; align-items: center; gap: 6px; flex: 1; }
  .lp-group-edit-btn { opacity: 0; padding: 2px 6px; background: transparent; border: none; color: var(--vscode-foreground); cursor: pointer; font-size: 14px; transition: opacity 0.2s; }
  .lp-group-header:hover .lp-group-edit-btn { opacity: 0.6; }
  .lp-group-edit-btn:hover { opacity: 1 !important; background: var(--vscode-toolbar-hoverBackground); }
  .lp-group-icon { font-size: 14px; }
  .lp-group-name { flex: 1; }
  .lp-group-items { display: flex; flex-direction: column; gap: 6px; }
  
  /* Density Styles */
  .lp-grid.comfortable { gap: 6px; }
  .lp-grid.comfortable .lp-group { margin-bottom: 8px; }
  .lp-grid.comfortable .lp-btn-wrapper { min-height: 48px; }
  .lp-grid.compact { gap: 2px; }
  .lp-grid.compact .lp-group { margin-bottom: 2px; }
  .lp-grid.compact .lp-btn-wrapper { min-height: 36px; }
  
  .lp-btn-wrapper { position: relative; display: flex; align-items: stretch; transition: opacity 0.15s; }
  .lp-btn-wrapper:hover { opacity: 1; }
  .lp-btn-checkbox { position: absolute; left: 44px; top: 50%; transform: translateY(-50%); cursor: pointer; z-index: 1; }
  .lp-btn.has-checkbox { padding-left: 32px; }
  .lp-btn { flex: 1; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; padding: 10px 14px; padding-right: 90px; border: 1px solid var(--vscode-button-border, var(--vscode-contrastBorder, transparent)); border-left: none; border-radius: 0 4px 4px 0; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); text-align: left; font-family: inherit; font-size: 13px; box-sizing: border-box; }
  .lp-btn-name { font-weight: 600; display: flex; align-items: center; gap: 8px; }
  .lp-icon { font-size: 18px; line-height: 1; flex-shrink: 0; }
  .lp-hidden-badge { font-size: 9px; opacity: 0.5; font-weight: normal; }
  .lp-btn-meta { font-size: 10px; opacity: 0.7; margin-top: 3px; }
  .lp-workspace-label { padding: 2px 6px; border-radius: 2px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); font-weight: 600; font-size: 9px; }
  .lp-play-btn { width: 36px; align-self: stretch; padding: 0; border: 1px solid var(--vscode-button-border, var(--vscode-contrastBorder, "transparent")); border-right: none; border-radius: 4px 0 0 4px; background: var(--lp-play-btn-bg, transparent); color: var(--vscode-foreground); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease; flex-shrink: 0; }
  .lp-play-btn:hover { background: var(--vscode-toolbar-hoverBackground); color: var(--vscode-charts-green); }
  .lp-hide-btn { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; padding: 0; border: none; border-radius: 3px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); cursor: pointer; opacity: 0; transition: opacity 0.15s; display: flex; align-items: center; justify-content: center; font-size: 14px; }
  .lp-edit-btn { position: absolute; right: 26px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; padding: 0; border: none; border-radius: 3px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); cursor: pointer; opacity: 0; transition: opacity 0.15s; display: flex; align-items: center; justify-content: center; font-size: 14px; }
  .lp-color-btn { position: absolute; right: 48px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; padding: 0; border: none; border-radius: 3px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); cursor: pointer; opacity: 0; transition: opacity 0.15s; display: flex; align-items: center; justify-content: center; font-size: 14px; }
  .lp-group-btn, .lp-ungroup-btn { position: absolute; right: 70px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; padding: 0; border: none; border-radius: 3px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); cursor: pointer; opacity: 0; transition: opacity 0.15s; display: flex; align-items: center; justify-content: center; font-size: 14px; }
  .lp-btn-wrapper:hover .lp-hide-btn, .lp-btn-wrapper:hover .lp-edit-btn, .lp-btn-wrapper:hover .lp-color-btn, .lp-btn-wrapper:hover .lp-group-btn, .lp-btn-wrapper:hover .lp-ungroup-btn { opacity: 1; }
  .lp-group-btn:hover, .lp-ungroup-btn:hover { background: var(--vscode-button-secondaryHoverBackground); }
  .lp-hide-btn:hover, .lp-edit-btn:hover, .lp-color-btn:hover { background: var(--vscode-inputOption-hoverBackground); }
  .lp-group-dropdown { position: absolute; right: 88px; top: calc(50% + 14px); background: var(--vscode-dropdown-background); border: 1px solid var(--vscode-dropdown-border, var(--vscode-contrastBorder)); border-radius: 3px; padding: 4px 0; z-index: 100; min-width: 150px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); }
  .lp-group-option { padding: 4px 12px; font-size: 11px; cursor: pointer; white-space: nowrap; }
  .lp-group-option:hover { background: var(--vscode-list-hoverBackground); }
  .lp-hide-icon { font-size: 14px; line-height: 1; }
  .lp-empty { opacity: 0.6; font-style: italic; font-size: 12px; margin: 0; text-align: center; }
  .lp-btn-secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
  .lp-empty-state { display: flex; flex-direction: column; gap: 12px; padding: 16px; border: 1px dashed var(--vscode-widget-border); border-radius: 4px; background: var(--vscode-editor-background); }
  .lp-welcome { text-align: center; }
  .lp-welcome-title { margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: var(--vscode-foreground); }
  .lp-welcome-text { margin: 0; font-size: 12px; opacity: 0.8; line-height: 1.3; }
  .lp-empty-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
  .lp-empty-btn { padding: 8px 10px; border: 1px solid var(--vscode-button-border, transparent); border-radius: 4px; cursor: pointer; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); transition: all 0.15s ease; display: flex; flex-direction: column; align-items: center; gap: 5px; flex: 1 1 160px; min-width: 0; max-width: 240px; }
  .lp-empty-btn:hover { background: var(--vscode-button-secondaryHoverBackground); border-color: var(--vscode-focusBorder); transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); }
  .lp-empty-primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border-color: var(--vscode-button-background); }
  .lp-empty-primary:hover { background: var(--vscode-button-hoverBackground); border-color: var(--vscode-button-hoverBackground); }
  .lp-empty-secondary { background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border); }
  .lp-empty-secondary:hover { background: var(--vscode-list-hoverBackground); border-color: var(--vscode-focusBorder); }
  .lp-empty-btn .codicon { font-size: 20px; }
  .lp-btn-label { font-size: 12px; font-weight: 600; }
  .lp-btn-hint { font-size: 10px; opacity: 0.7; text-align: center; line-height: 1.2; word-wrap: break-word; }
  ${toastStyles}
`;

/* ─── inline script ─── */
function mainViewScript(
  visibleActions: Action[],
  iconMap: Map<string, string>,
  config: Config
): string {
  return `
    (function () {
      const vscode = acquireVsCodeApi();
      
      // Safe JSON parser helper
      function safeParseJson(json) {
        if (!json) return null;
        try {
          return JSON.parse(json);
        } catch {
          return null;
        }
      }
      
      let searchTerm = '';
      let selectionMode = false;
      const allActions = ${JSON.stringify(visibleActions)};
      const iconMap = new Map(Object.entries(${JSON.stringify(Object.fromEntries(iconMap))}));
      const groupMap = ${JSON.stringify((config.groups || []).map((g) => ({ name: g.name, icon: g.icon || "" })))};
      const storedState = vscode.getState() || {};
      const collapsedGroups = new Set(storedState.collapsedGroups || []);

      const toast = document.getElementById('toast');
      const searchBox = document.getElementById('searchBox');
      const searchActions = document.getElementById('searchActions');
      const selectionActions = document.getElementById('selectionActions');
      const contentGrid = document.getElementById('contentGrid');

      const hideAllBtn = document.getElementById('hideAllBtn');
      const showAllBtn = document.getElementById('showAllBtn');
      const selectMultipleBtn = document.getElementById('selectMultipleBtn');
      const hideSelectedBtn = document.getElementById('hideSelectedBtn');
      const showSelectedBtn = document.getElementById('showSelectedBtn');
      const cancelSelectionBtn = document.getElementById('cancelSelectionBtn');
      const generateConfigBtn = document.getElementById('generateConfigBtn');

      let toastTimeout;
      function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => { toast.classList.remove('show'); }, 2500);
      }

      window.addEventListener('message', event => {
        const message = event.data;
        if (message.command === 'showToast') { showToast(message.message); }
      });
      const updateCollapsedState = () => {
        const current = vscode.getState() || {};
        vscode.setState({ ...current, collapsedGroups: Array.from(collapsedGroups) });
      };

      // Set initial collapsed state for groups
      document.querySelectorAll('.lp-group').forEach((groupEl) => {
        const groupName = groupEl.getAttribute('data-group');
        if (groupName && collapsedGroups.has(groupName)) {
          groupEl.removeAttribute('open');
        }
      });

      // Event delegation for group toggle events
      document.addEventListener('toggle', (e) => {
        const groupEl = e.target.closest('.lp-group');
        if (!groupEl) return;
        const groupName = groupEl.getAttribute('data-group');
        if (!groupName) return;
        if (groupEl.open) { collapsedGroups.delete(groupName); }
        else { collapsedGroups.add(groupName); }
        updateCollapsedState();
      }, true); // Use capture phase for toggle events

      const getIconForType = (type) => iconMap.get(type) || '';

      const matchesSearch = (item, term) => {
        if (!term) return true;
        const positiveFilters = [];
        const negativeFilters = [];
        const positiveTextTerms = [];
        const negativeTextTerms = [];
        const parts = term.split(/\\s+/);
        parts.forEach(part => {
          if (!part.trim()) return;
          const isNegated = part.startsWith('-');
          const cleanPart = isNegated ? part.substring(1) : part;
          const match = cleanPart.match(/^(group|type|workspace):(.+)$/i);
          if (match) {
            const filter = { key: match[1].toLowerCase(), value: match[2].toLowerCase() };
            if (isNegated) { negativeFilters.push(filter); } else { positiveFilters.push(filter); }
          } else if (cleanPart.trim()) {
            if (isNegated) { negativeTextTerms.push(cleanPart.toLowerCase()); } else { positiveTextTerms.push(cleanPart.toLowerCase()); }
          }
        });
        for (const filter of positiveFilters) {
          if (filter.key === 'group') { if (!(item.group || '').toLowerCase().includes(filter.value)) return false; }
          else if (filter.key === 'type') { if (!item.type.toLowerCase().includes(filter.value)) return false; }
          else if (filter.key === 'workspace') { if (!(item.workspace || '').toLowerCase().includes(filter.value)) return false; }
        }
        for (const filter of negativeFilters) {
          if (filter.key === 'group') { if ((item.group || '').toLowerCase().includes(filter.value)) return false; }
          else if (filter.key === 'type') { if (item.type.toLowerCase().includes(filter.value)) return false; }
          else if (filter.key === 'workspace') { if ((item.workspace || '').toLowerCase().includes(filter.value)) return false; }
        }
        const name = item.name.toLowerCase();
        const icon = getIconForType(item.type);
        const group = (item.group || '').toLowerCase();
        const workspace = (item.workspace || '').toLowerCase();
        const groupIcon = groupMap.find(g => g.name === item.group)?.icon || '';
        const searchText = name + ' ' + icon + ' ' + group + ' ' + workspace + ' ' + groupIcon;
        if (!positiveTextTerms.every(t => searchText.includes(t))) return false;
        if (negativeTextTerms.some(t => searchText.includes(t))) return false;
        return true;
      };

      const getVisibleActions = () => {
        const visible = [];
        document.querySelectorAll('.lp-btn-wrapper').forEach(wrapper => {
          if (wrapper.style.display !== 'none') {
            const btn = wrapper.querySelector('.lp-btn');
            if (btn) {
              const item = safeParseJson(btn.getAttribute('data-item'));
              if (item) visible.push(item);
            }
          }
        });
        return visible;
      };

      const updateSearchActions = (term) => {
        if (!searchActions || !selectionActions) return; // Don't update if elements don't exist
        if (!term) { searchActions.style.display = 'none'; selectionActions.style.display = 'none'; return; }
        const vis = getVisibleActions();
        const hasHidden = vis.some(i => i.hidden);
        const hasVisible = vis.some(i => !i.hidden);
        if (selectionMode) { searchActions.style.display = 'none'; selectionActions.style.display = 'flex'; }
        else {
          searchActions.style.display = 'flex'; selectionActions.style.display = 'none';
          if (hideAllBtn) hideAllBtn.style.display = hasVisible ? 'block' : 'none';
          if (showAllBtn) showAllBtn.style.display = hasHidden ? 'block' : 'none';
          if (selectMultipleBtn) selectMultipleBtn.style.display = 'block';
        }
      };

      const updateVisibility = (term) => {
        let hasVisible = false;
        document.querySelectorAll('.lp-btn-wrapper').forEach(wrapper => {
          const btn = wrapper.querySelector('.lp-btn');
          if (!btn) return;
          const item = safeParseJson(btn.getAttribute('data-item'));
          if (!item) return;
          const matches = matchesSearch(item, term);
          wrapper.style.display = matches ? 'flex' : 'none';
          if (matches) hasVisible = true;
          let checkbox = wrapper.querySelector('.lp-btn-checkbox');
          if (selectionMode && matches && !checkbox) {
            checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'lp-btn-checkbox';
            checkbox.setAttribute('data-item', JSON.stringify(item));
            wrapper.insertBefore(checkbox, btn);
            btn.classList.add('has-checkbox');
          } else if (!selectionMode && checkbox) { checkbox.remove(); btn.classList.remove('has-checkbox'); }
        });
        document.querySelectorAll('.lp-group').forEach(group => {
          const vis = Array.from(group.querySelectorAll('.lp-btn-wrapper')).filter(w => w.style.display !== 'none');
          group.style.display = vis.length > 0 ? 'block' : 'none';
        });
        updateSearchActions(term);
      };

      // Use event delegation for better performance and no memory leaks
      document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-command]');
        if (target) {
          e.stopPropagation();
          const command = target.getAttribute('data-command');
          const itemJson = target.getAttribute('data-item');
          const groupJson = target.getAttribute('data-group');
          
          const item = safeParseJson(itemJson);
          const group = safeParseJson(groupJson);
          
          switch (command) {
            case 'executeCommand':
              if (item) vscode.postMessage({ command: 'executeCommand', item });
              break;
            case 'hideAction':
              if (item) vscode.postMessage({ command: 'hideAction', item });
              break;
            case 'editAction':
              if (item) vscode.postMessage({ command: 'editAction', item });
              break;
            case 'setActionColor':
              if (item) vscode.postMessage({ command: 'setActionColor', item });
              break;
            case 'editGroup':
              if (group) vscode.postMessage({ command: 'editGroup', group });
              break;
            case 'assignGroup':
              const groupName = target.getAttribute('data-group-name');
              if (item && groupName) vscode.postMessage({ command: 'assignGroup', item, groupName });
              break;
            case 'toggleGroupDropdown':
              const dropdown = target.nextElementSibling;
              document.querySelectorAll('.lp-group-dropdown').forEach(d => { if (d !== dropdown) d.style.display = 'none'; });
              if (dropdown) dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
              break;
          }
        }
        
        // Close all dropdowns on any click
        document.querySelectorAll('.lp-group-dropdown').forEach(d => { d.style.display = 'none'; });
      });

      // Search and bulk action functionality (only if search box exists)
      if (searchBox) {
        searchBox.addEventListener('input', (e) => { searchTerm = e.target.value; selectionMode = false; updateVisibility(searchTerm); });
      }
      
      if (selectMultipleBtn) {
        selectMultipleBtn.addEventListener('click', () => { selectionMode = true; updateVisibility(searchTerm); });
      }
      
      if (cancelSelectionBtn) {
        cancelSelectionBtn.addEventListener('click', () => { selectionMode = false; updateVisibility(searchTerm); });
      }
      
      if (hideAllBtn) {
        hideAllBtn.addEventListener('click', () => { const actions = getVisibleActions().filter(i => !i.hidden); if (actions.length > 0) vscode.postMessage({ command: 'bulkHideActions', items: actions }); });
      }
      
      if (showAllBtn) {
        showAllBtn.addEventListener('click', () => { const actions = getVisibleActions().filter(i => i.hidden); if (actions.length > 0) vscode.postMessage({ command: 'bulkShowActions', items: actions }); });
      }
      
      if (hideSelectedBtn) {
        hideSelectedBtn.addEventListener('click', () => { 
          const sel = Array.from(document.querySelectorAll('.lp-btn-checkbox:checked'))
            .map(cb => safeParseJson(cb.getAttribute('data-item')))
            .filter(item => item !== null);
          if (sel.length > 0) vscode.postMessage({ command: 'bulkHideActions', items: sel }); 
        });
      }
      
      if (showSelectedBtn) {
        showSelectedBtn.addEventListener('click', () => { 
          const sel = Array.from(document.querySelectorAll('.lp-btn-checkbox:checked'))
            .map(cb => safeParseJson(cb.getAttribute('data-item')))
            .filter(item => item !== null);
          if (sel.length > 0) vscode.postMessage({ command: 'bulkShowActions', items: sel }); 
        });
      }

      if (generateConfigBtn) {
        generateConfigBtn.addEventListener('click', () => {
          vscode.postMessage({ command: 'showGenerateConfig' });
        });
      }

      const exampleConfigBtn = document.getElementById('exampleConfigBtn');
      if (exampleConfigBtn) {
        exampleConfigBtn.addEventListener('click', () => {
          vscode.postMessage({ command: 'createExampleConfig' });
        });
      }

      const toggleHidden = document.getElementById('toggleHidden');
      if (toggleHidden) { toggleHidden.addEventListener('change', () => { vscode.postMessage({ command: 'toggleShowHidden' }); }); }
    })();
  `;
}
