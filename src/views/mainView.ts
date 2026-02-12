import { htmlShell } from "../templates/layout";
import { toastStyles } from "../templates/styles";
import { esc } from "./helpers";
import type { Config, Action } from "../types";

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
  showCheckbox = false
): string {
  const icon = showIconSetting ? getIcon(item.type) : "";
  const itemJson = JSON.stringify(item).replace(/'/g, "&#39;");
  const groupOptionsWithItem = groupOptions.replace(/__PLACEHOLDER__/g, itemJson);

  const metaParts: string[] = [];
  if (item.workspace) { metaParts.push(`<span class="lp-workspace-label">${esc(item.workspace)}</span>`); }
  if (showTypeSetting) { metaParts.push(esc(item.type)); }
  if (showCommandSetting) { metaParts.push(esc(item.command)); }
  const metadata = metaParts.length > 0
    ? `<span class="lp-btn-meta">${metaParts.join(" \u00b7 ")}</span>`
    : "";

  const hasGroups = groupOptions.length > 0;
  const isInGroup = !!item.group;
  const showGroupButton = hasGroups || isInGroup;
  const hideIcon = item.hidden ? "eye" : hideIconName;

  return `<div class="lp-btn-wrapper">
    ${showCheckbox ? `<input type="checkbox" class="lp-btn-checkbox" data-item='${itemJson}'>` : ""}
    <button class="lp-btn ${showCheckbox ? "has-checkbox" : ""}" data-item='${itemJson}'>
      <span class="lp-btn-name">
        ${icon ? `<span class="codicon codicon-${icon} lp-icon"></span>` : ""}${esc(item.name)}${item.hidden ? ' <span class="lp-hidden-badge">(hidden)</span>' : ""}
      </span>
      ${metadata}
    </button>
    ${showGroupButton
      ? isInGroup && !hasGroups
        ? `<button class="lp-ungroup-btn" data-item='${itemJson}' title="Remove from group"><span class="codicon codicon-folder-opened"></span></button>`
        : `<button class="lp-group-btn" data-item='${itemJson}' title="${isInGroup ? "Change group" : "Assign to group"}"><span class="codicon codicon-${isInGroup ? "folder-opened" : "folder"}"></span></button>
           <div class="lp-group-dropdown" style="display: none;">
             <div class="lp-group-option" data-item='${itemJson}' data-group="__none__"><span class="codicon codicon-x"></span> Remove from group</div>
             ${groupOptionsWithItem}
           </div>`
      : ""}
    <button class="lp-edit-btn" data-item='${itemJson}' title="Edit this action"><span class="codicon codicon-edit"></span></button>
    <button class="lp-hide-btn" data-item='${itemJson}' title="${item.hidden ? "Show this action" : "Hide this action"}"><span class="codicon codicon-${hideIcon} lp-hide-icon"></span></button>
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

  // Groups
  const groups = config.groups || [];
  const groupOptions = groups
    .map(
      (g) =>
        `<div class="lp-group-option" data-item="__PLACEHOLDER__" data-group="${esc(g.name)}">${g.icon ? g.icon + " " : ""}${esc(g.name)}</div>`
    )
    .join("\n");

  const hasGroups = groups.length > 0;
  const actionsHaveGroups = visibleActions.some((item) => item.group);
  let content = "";

  const btn = (item: Action) =>
    renderButton(item, getIcon, groupOptions, showIconSetting, showTypeSetting, showCommandSetting, hideIconName);

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
        const groupColor = group.color ? `color: ${group.color}; border-color: ${group.color};` : "";
        content += `
          <div class="lp-group">
            <div class="lp-group-header" style="${groupColor}">
              <div class="lp-group-header-content">
                ${groupIconHtml}
                <span class="lp-group-name">${esc(group.name)}</span>
              </div>
              <button class="lp-group-edit-btn" data-group='${groupJson}' title="Edit group"><span class="codicon codicon-settings-gear"></span></button>
            </div>
            <div class="lp-group-items">${buttons}</div>
          </div>`;
      }
    });

    if (ungroupedActions.length > 0) {
      const buttons = ungroupedActions.map(btn).join("\n");
      content += `
        <div class="lp-group">
          <div class="lp-group-header">
            <span class="lp-group-name" style="opacity: 0.6;">Ungrouped</span>
          </div>
          <div class="lp-group-items">${buttons}</div>
        </div>`;
    }
  } else {
    content = visibleActions.map(btn).join("\n");
  }

  if (visibleActions.length === 0) {
    content = '<p class="lp-empty">No actions in battle.config</p>';
  }

  return htmlShell({
    title: "Launchpad",
    cspSource: ctx.cspSource,
    nonce: ctx.nonce,
    codiconStyles: ctx.codiconStyles,
    styles: mainViewStyles,
    body: `
      <div id="toast" class="lp-toast"></div>
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
      ${hiddenCount > 0 ? `<div class="lp-toolbar"><label class="lp-toggle"><input type="checkbox" id="toggleHidden" ${ctx.showHidden ? "checked" : ""}><span>Show hidden (${hiddenCount})</span></label></div>` : ""}
      <div class="lp-grid" id="contentGrid">
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
  .lp-grid { display: flex; flex-direction: column; gap: 8px; }
  .lp-group { margin-bottom: 8px; }
  .lp-group-header { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 4px 8px; margin-bottom: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; opacity: 0.85; border-bottom: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.35)); }
  .lp-group-header-content { display: flex; align-items: center; gap: 6px; flex: 1; }
  .lp-group-edit-btn { opacity: 0; padding: 2px 6px; background: transparent; border: none; color: var(--vscode-foreground); cursor: pointer; font-size: 14px; transition: opacity 0.2s; }
  .lp-group-header:hover .lp-group-edit-btn { opacity: 0.6; }
  .lp-group-edit-btn:hover { opacity: 1 !important; background: var(--vscode-toolbar-hoverBackground); }
  .lp-group-icon { font-size: 14px; }
  .lp-group-name { flex: 1; }
  .lp-group-items { display: flex; flex-direction: column; gap: 6px; }
  .lp-btn-wrapper { position: relative; display: flex; align-items: stretch; }
  .lp-btn-checkbox { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); cursor: pointer; z-index: 1; }
  .lp-btn.has-checkbox { padding-left: 32px; }
  .lp-btn { flex: 1; display: flex; flex-direction: column; align-items: flex-start; padding: 8px 10px; border: 1px solid var(--vscode-button-border, var(--vscode-contrastBorder, transparent)); border-radius: 4px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); cursor: pointer; text-align: left; font-family: inherit; font-size: 12px; box-sizing: border-box; transition: background 0.1s; }
  .lp-btn:hover { background: var(--vscode-button-secondaryHoverBackground); }
  .lp-btn-name { font-weight: 600; display: flex; align-items: center; gap: 6px; }
  .lp-icon { font-size: 16px; line-height: 1; flex-shrink: 0; }
  .lp-hidden-badge { font-size: 9px; opacity: 0.5; font-weight: normal; }
  .lp-btn-meta { font-size: 10px; opacity: 0.7; margin-top: 2px; }
  .lp-workspace-label { padding: 2px 6px; border-radius: 2px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); font-weight: 600; font-size: 9px; }
  .lp-hide-btn { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; padding: 0; border: none; border-radius: 3px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); cursor: pointer; opacity: 0; transition: opacity 0.15s; display: flex; align-items: center; justify-content: center; }
  .lp-edit-btn { position: absolute; right: 26px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; padding: 0; border: none; border-radius: 3px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); cursor: pointer; opacity: 0; transition: opacity 0.15s; display: flex; align-items: center; justify-content: center; font-size: 16px; }
  .lp-group-btn, .lp-ungroup-btn { position: absolute; right: 48px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; padding: 0; border: none; border-radius: 3px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); cursor: pointer; opacity: 0; transition: opacity 0.15s; display: flex; align-items: center; justify-content: center; font-size: 16px; }
  .lp-btn-wrapper:hover .lp-hide-btn, .lp-btn-wrapper:hover .lp-edit-btn, .lp-btn-wrapper:hover .lp-group-btn, .lp-btn-wrapper:hover .lp-ungroup-btn { opacity: 1; }
  .lp-group-btn:hover, .lp-ungroup-btn:hover { background: var(--vscode-button-secondaryHoverBackground); }
  .lp-hide-btn:hover, .lp-edit-btn:hover { background: var(--vscode-inputOption-hoverBackground); }
  .lp-group-dropdown { position: absolute; right: 48px; top: calc(50% + 14px); background: var(--vscode-dropdown-background); border: 1px solid var(--vscode-dropdown-border, var(--vscode-contrastBorder)); border-radius: 3px; padding: 4px 0; z-index: 100; min-width: 150px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); }
  .lp-group-option { padding: 4px 12px; font-size: 11px; cursor: pointer; white-space: nowrap; }
  .lp-group-option:hover { background: var(--vscode-list-hoverBackground); }
  .lp-hide-icon { font-size: 16px; line-height: 1; }
  .lp-empty { opacity: 0.6; font-style: italic; font-size: 12px; }
  .lp-btn-secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
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
      let searchTerm = '';
      let selectionMode = false;
      const allActions = ${JSON.stringify(visibleActions)};
      const iconMap = new Map(Object.entries(${JSON.stringify(Object.fromEntries(iconMap))}));
      const groupMap = ${JSON.stringify((config.groups || []).map((g) => ({ name: g.name, icon: g.icon || "" })))};

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
            if (btn) { visible.push(JSON.parse(btn.getAttribute('data-item'))); }
          }
        });
        return visible;
      };

      const updateSearchActions = (term) => {
        if (!term) { searchActions.style.display = 'none'; selectionActions.style.display = 'none'; return; }
        const vis = getVisibleActions();
        const hasHidden = vis.some(i => i.hidden);
        const hasVisible = vis.some(i => !i.hidden);
        if (selectionMode) { searchActions.style.display = 'none'; selectionActions.style.display = 'flex'; }
        else {
          searchActions.style.display = 'flex'; selectionActions.style.display = 'none';
          hideAllBtn.style.display = hasVisible ? 'block' : 'none';
          showAllBtn.style.display = hasHidden ? 'block' : 'none';
          selectMultipleBtn.style.display = 'block';
        }
      };

      const updateVisibility = (term) => {
        let hasVisible = false;
        document.querySelectorAll('.lp-btn-wrapper').forEach(wrapper => {
          const btn = wrapper.querySelector('.lp-btn');
          if (!btn) return;
          const item = JSON.parse(btn.getAttribute('data-item'));
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

      searchBox.addEventListener('input', (e) => { searchTerm = e.target.value; selectionMode = false; updateVisibility(searchTerm); });
      selectMultipleBtn.addEventListener('click', () => { selectionMode = true; updateVisibility(searchTerm); });
      cancelSelectionBtn.addEventListener('click', () => { selectionMode = false; updateVisibility(searchTerm); });
      hideAllBtn.addEventListener('click', () => { const actions = getVisibleActions().filter(i => !i.hidden); if (actions.length > 0) vscode.postMessage({ command: 'bulkHideActions', items: actions }); });
      showAllBtn.addEventListener('click', () => { const actions = getVisibleActions().filter(i => i.hidden); if (actions.length > 0) vscode.postMessage({ command: 'bulkShowActions', items: actions }); });
      hideSelectedBtn.addEventListener('click', () => { const sel = Array.from(document.querySelectorAll('.lp-btn-checkbox:checked')).map(cb => JSON.parse(cb.getAttribute('data-item'))); if (sel.length > 0) vscode.postMessage({ command: 'bulkHideActions', items: sel }); });
      showSelectedBtn.addEventListener('click', () => { const sel = Array.from(document.querySelectorAll('.lp-btn-checkbox:checked')).map(cb => JSON.parse(cb.getAttribute('data-item'))); if (sel.length > 0) vscode.postMessage({ command: 'bulkShowActions', items: sel }); });

      const toggleHidden = document.getElementById('toggleHidden');
      if (toggleHidden) { toggleHidden.addEventListener('change', () => { vscode.postMessage({ command: 'toggleShowHidden' }); }); }

      document.querySelectorAll('.lp-btn').forEach(btn => {
        btn.addEventListener('click', () => { vscode.postMessage({ command: 'executeCommand', item: JSON.parse(btn.getAttribute('data-item')) }); });
      });
      document.querySelectorAll('.lp-hide-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); vscode.postMessage({ command: 'hideAction', item: JSON.parse(btn.getAttribute('data-item')) }); });
      });
      document.querySelectorAll('.lp-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); vscode.postMessage({ command: 'editAction', item: JSON.parse(btn.getAttribute('data-item')) }); });
      });
      document.querySelectorAll('.lp-group-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); vscode.postMessage({ command: 'editGroup', group: JSON.parse(btn.getAttribute('data-group')) }); });
      });
      document.querySelectorAll('.lp-group-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const dropdown = btn.nextElementSibling;
          document.querySelectorAll('.lp-group-dropdown').forEach(d => { if (d !== dropdown) d.style.display = 'none'; });
          dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });
      });
      document.querySelectorAll('.lp-ungroup-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); vscode.postMessage({ command: 'assignGroup', item: JSON.parse(btn.getAttribute('data-item')), groupName: '__none__' }); });
      });
      document.querySelectorAll('.lp-group-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          vscode.postMessage({ command: 'assignGroup', item: JSON.parse(opt.getAttribute('data-item')), groupName: opt.getAttribute('data-group') });
          opt.parentElement.style.display = 'none';
        });
      });
      document.addEventListener('click', () => { document.querySelectorAll('.lp-group-dropdown').forEach(d => { d.style.display = 'none'; }); });
    })();
  `;
}
