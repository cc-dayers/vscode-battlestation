import { html, render } from "lit";
import type { Action, Group } from "../types";

// State definition
interface MainViewState {
    actions: Action[];
    groups: Group[];
    searchQuery: string;
    loading: boolean;
    generating: boolean;
    // Configuration / Settings
    display: {
        showIcon: boolean;
        showType: boolean;
        showCommand: boolean;
        showGroup: boolean;
        hideIcon: string;
        playButtonBg: string;
        density: string;
        useEmojiLoader: boolean;
        loaderEmoji: string;
    };
    secondaryGroups: Record<string, any>;
    iconMap: Record<string, string>;
    collapsedGroups: string[];
    // Transients
    showSearch: boolean;
    showHidden?: boolean;
    selectionMode: boolean;
    selectedItems: Action[]; // References to items in actions
    openActionMenuFor: Action | null;
}

// Global Types
declare global {
    interface Window {
        __INITIAL_DATA__?: Partial<MainViewState>;
        acquireVsCodeApi: () => {
            postMessage: (message: unknown) => void;
            getState: () => unknown;
            setState: (state: unknown) => void;
        };
    }
}

const vscode = window.acquireVsCodeApi();
const root = document.getElementById("root");
let isBatchingState = false;
let hasPendingRender = false;

const requestRender = () => {
    if (isBatchingState) {
        hasPendingRender = true;
        return;
    }
    renderView();
};

const batchStateUpdates = (updater: () => void) => {
    isBatchingState = true;
    try {
        updater();
    } finally {
        isBatchingState = false;
        if (hasPendingRender) {
            hasPendingRender = false;
            renderView();
        }
    }
};

// Initial State
const startState: MainViewState = {
    actions: [],
    groups: [],
    searchQuery: "",
    loading: false,
    generating: false,
    display: {
        showIcon: true,
        showType: true,
        showCommand: true,
        showGroup: true,
        hideIcon: "eye-closed",
        playButtonBg: "transparent",
        density: "comfortable",
        useEmojiLoader: false,
        loaderEmoji: "🌯",
    },
    secondaryGroups: {},
    iconMap: {},
    collapsedGroups: [],
    showSearch: false,
    showHidden: false, // Default
    selectionMode: false,
    selectedItems: [],
    openActionMenuFor: null,
};


// Merge initial data
if (window.__INITIAL_DATA__) {
    Object.assign(startState, window.__INITIAL_DATA__);
}

// Restore minimal state (collapsed groups)
const storedState = (vscode.getState() as any) || {};
if (storedState.collapsedGroups) {
    startState.collapsedGroups = storedState.collapsedGroups;
}

// Reactive State Container
const state = new Proxy(startState, {
    set(target, p, value) {
        (target as any)[p] = value;
        requestRender();
        // Persist certain state
        if (p === "collapsedGroups") {
            vscode.setState({ ...storedState, collapsedGroups: value });
        }
        return true;
    },
});

// --- Actions ---

// Drag-and-drop reorder state
let dragSrcAction: Action | null = null;
let dragOverAction: Action | null = null;
let dragOverTop = true; // true = insert before target, false = insert after

const handleDragStart = (e: DragEvent, item: Action) => {
    dragSrcAction = item;
    e.dataTransfer!.effectAllowed = 'move';
    // Show the whole row as the drag image
    const wrapper = (e.currentTarget as HTMLElement).closest('.lp-btn-wrapper') as HTMLElement;
    if (wrapper) {
        // Calculate mouse offset relative to the wrapper element
        const rect = wrapper.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        e.dataTransfer!.setDragImage(wrapper, offsetX, offsetY);
    }
    setTimeout(() => requestRender(), 0);
};

const handleDragOver = (e: DragEvent, item: Action) => {
    if (!dragSrcAction || dragSrcAction === item) return;
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const top = e.clientY < rect.top + rect.height / 2;
    if (dragOverAction !== item || dragOverTop !== top) {
        dragOverAction = item;
        dragOverTop = top;
        requestRender();
    }
};

const handleDragLeave = (e: DragEvent, item: Action) => {
    const related = e.relatedTarget as HTMLElement | null;
    const wrapper = e.currentTarget as HTMLElement;
    if (!wrapper.contains(related) && dragOverAction === item) {
        dragOverAction = null;
        requestRender();
    }
};

const handleDrop = (e: DragEvent, item: Action) => {
    e.preventDefault();
    if (!dragSrcAction || dragSrcAction === item) return;
    const newActions = [...state.actions];
    const srcIdx = newActions.indexOf(dragSrcAction);
    const tgtIdx = newActions.indexOf(item);
    if (srcIdx === -1 || tgtIdx === -1) { dragSrcAction = null; dragOverAction = null; return; }
    newActions.splice(srcIdx, 1);
    // After removing src, recompute target index
    const adjustedTgt = newActions.indexOf(item);
    const insertIdx = dragOverTop ? adjustedTgt : adjustedTgt + 1;
    newActions.splice(insertIdx, 0, dragSrcAction);
    dragSrcAction = null;
    dragOverAction = null;
    state.actions = newActions;
    vscode.postMessage({ command: 'reorderActions', actions: newActions });
};

const handleDragEnd = () => {
    dragSrcAction = null;
    dragOverAction = null;
    requestRender();
};

const toggleGroup = (groupName: string) => {
    const newCollapsed = new Set(state.collapsedGroups);
    if (newCollapsed.has(groupName)) {
        newCollapsed.delete(groupName);
    } else {
        newCollapsed.add(groupName);
    }
    state.collapsedGroups = Array.from(newCollapsed);
};

const executeAction = (item: Action) => {
    vscode.postMessage({ command: "executeCommand", item });
};

const editAction = (item: Action) => {
    vscode.postMessage({ command: "editAction", item });
};

const setActionColor = (item: Action) => {
    vscode.postMessage({ command: "setActionColor", item });
};

const assignGroup = (item: Action, groupName: string) => {
    vscode.postMessage({ command: "assignGroup", item, groupName });
};

const getActionMenuId = (item: Action): string => {
    return encodeURIComponent(`${item.name}|${item.command}|${item.type}|${item.workspace ?? ""}`);
};

interface FlyoutMenuKeyboardConfig {
    isOpen: () => boolean;
    open: () => void;
    close: (restoreFocus?: boolean) => void;
    focusFirst: () => void;
    focusLast: () => void;
    getMenuItems: (flyout: HTMLElement) => HTMLButtonElement[];
}

const openMenuAndFocus = (config: FlyoutMenuKeyboardConfig, target: "first" | "last") => {
    if (!config.isOpen()) {
        config.open();
    }
    if (target === "last") {
        config.focusLast();
    } else {
        config.focusFirst();
    }
};

const handleFlyoutTriggerKeydown = (e: KeyboardEvent, config: FlyoutMenuKeyboardConfig) => {
    if (e.key === "Escape" && config.isOpen()) {
        e.preventDefault();
        config.close(true);
        return;
    }

    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        openMenuAndFocus(config, "first");
        return;
    }

    if (e.key === "ArrowUp") {
        e.preventDefault();
        openMenuAndFocus(config, "last");
    }
};

const handleFlyoutMenuKeydown = (e: KeyboardEvent, config: FlyoutMenuKeyboardConfig) => {
    const flyout = e.currentTarget as HTMLElement;
    const menuItems = config.getMenuItems(flyout);
    if (!menuItems.length) return;

    const currentIndex = menuItems.indexOf(document.activeElement as HTMLButtonElement);

    if (e.key === "Escape") {
        e.preventDefault();
        config.close(true);
        return;
    }

    if (e.key === "Tab") {
        config.close();
        return;
    }

    if (e.key === "Home") {
        e.preventDefault();
        menuItems[0].focus();
        return;
    }

    if (e.key === "End") {
        e.preventDefault();
        menuItems[menuItems.length - 1].focus();
        return;
    }

    if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % menuItems.length : 0;
        menuItems[nextIndex].focus();
        return;
    }

    if (e.key === "ArrowUp") {
        e.preventDefault();
        const previousIndex = currentIndex >= 0
            ? (currentIndex - 1 + menuItems.length) % menuItems.length
            : menuItems.length - 1;
        menuItems[previousIndex].focus();
    }
};

const focusActionMenuTrigger = (item: Action) => {
    const actionMenuId = getActionMenuId(item);
    requestAnimationFrame(() => {
        const trigger = document.querySelector(`.lp-menu-trigger[data-action-menu-id="${actionMenuId}"]`) as HTMLButtonElement | null;
        trigger?.focus();
    });
};

const focusActionMenuItem = (item: Action, target: "first" | "last" = "first") => {
    const actionMenuId = getActionMenuId(item);
    requestAnimationFrame(() => {
        const flyout = document.querySelector(`.lp-menu-panel[data-action-menu-id="${actionMenuId}"]`) as HTMLElement | null;
        if (!flyout) return;
        const items = Array.from(flyout.querySelectorAll<HTMLButtonElement>(".lp-menu-item"));
        if (!items.length) return;
        const next = target === "last" ? items[items.length - 1] : items[0];
        next.focus();
    });
};

const getActionMenuKeyboardConfig = (item: Action): FlyoutMenuKeyboardConfig => ({
    isOpen: () => state.openActionMenuFor === item,
    open: () => {
        state.openActionMenuFor = item;
    },
    close: (restoreFocus = false) => closeActionMenu(restoreFocus ? item : undefined),
    focusFirst: () => focusActionMenuItem(item, "first"),
    focusLast: () => focusActionMenuItem(item, "last"),
    getMenuItems: (flyout) => Array.from(flyout.querySelectorAll<HTMLButtonElement>(".lp-menu-item")),
});

const toggleActionMenu = (e: Event, item: Action) => {
    e.stopPropagation();
    state.openActionMenuFor = state.openActionMenuFor === item ? null : item;
};

const closeActionMenu = (itemToRefocus?: Action) => {
    if (state.openActionMenuFor) {
        state.openActionMenuFor = null;
    }
    if (itemToRefocus) {
        focusActionMenuTrigger(itemToRefocus);
    }
};

const onActionMenuAction = (callback: () => void) => {
    callback();
    closeActionMenu();
};

const onActionMenuTriggerKeydown = (e: KeyboardEvent, item: Action) => {
    handleFlyoutTriggerKeydown(e, getActionMenuKeyboardConfig(item));
};

const onActionMenuKeydown = (e: KeyboardEvent, item: Action) => {
    handleFlyoutMenuKeydown(e, getActionMenuKeyboardConfig(item));
};

const hideAction = (item: Action) => {
    vscode.postMessage({ command: "hideAction", item });
};

const editGroup = (group: Group) => {
    vscode.postMessage({ command: "editGroup", group });
};

const hideGroup = (group: Group) => {
    vscode.postMessage({ command: "hideGroup", group });
};

const formatCommandMeta = (item: Action): string => {
    if (item.type === "npm" && item.command.startsWith("npm run ")) {
        return `npm: ${item.command.replace("npm run ", "")}`;
    }

    if (item.type === "task") {
        const taskLabel = item.command.split("|")[1];
        return taskLabel ? `task: ${taskLabel}` : "task";
    }

    if (item.type === "launch") {
        const launchLabel = item.command.split("|")[1];
        return launchLabel ? `launch: ${launchLabel}` : "launch";
    }

    if (item.type === "vscode") {
        const [commandId, commandArg] = item.command.split("|");
        if (commandId === "workbench.action.tasks.runTask") {
            return commandArg ? `task: ${commandArg}` : "task";
        }
        if (commandId === "workbench.action.debug.start") {
            return commandArg ? `launch: ${commandArg}` : "launch";
        }
        return commandArg ? `${commandId} ${commandArg}` : commandId;
    }

    return item.command;
};

// --- Rendering ---

interface FlyoutRenderConfig {
    kind: "action" | "group";
    menuId: string;
    isOpen: boolean;
    triggerTitle: string;
    triggerAriaLabel: string;
    onTriggerClick: (e: Event) => void;
    onTriggerKeydown: (e: KeyboardEvent) => void;
    onMenuClick: (e: Event) => void;
    onMenuKeydown: (e: KeyboardEvent) => void;
    menuContent: unknown;
}

const renderFlyoutMenu = (config: FlyoutRenderConfig) => {
    const containerClass = `lp-menu-container lp-menu-container--${config.kind}`;
    const triggerClass = `lp-menu-trigger lp-menu-trigger--${config.kind}`;
    const flyoutClass = `lp-menu-panel lp-menu-panel--${config.kind}`;

    return html`
        <div
            class=${containerClass}
            data-action-menu-id=${config.kind === "action" ? config.menuId : ""}
            data-group-menu-id=${config.kind === "group" ? config.menuId : ""}>
            <button
                class=${triggerClass}
                title=${config.triggerTitle}
                aria-label=${config.triggerAriaLabel}
                aria-haspopup="menu"
                aria-expanded=${config.isOpen ? "true" : "false"}
                data-action-menu-id=${config.kind === "action" ? config.menuId : ""}
                data-group-menu-id=${config.kind === "group" ? config.menuId : ""}
                @click=${config.onTriggerClick}
                @keydown=${config.onTriggerKeydown}>
                <span class="codicon codicon-ellipsis"></span>
            </button>

            ${config.isOpen ? html`
                <div
                    class=${flyoutClass}
                    data-action-menu-id=${config.kind === "action" ? config.menuId : ""}
                    data-group-menu-id=${config.kind === "group" ? config.menuId : ""}
                    role="menu"
                    @click=${config.onMenuClick}
                    @keydown=${config.onMenuKeydown}>
                    ${config.menuContent}
                </div>
            ` : null}
        </div>
    `;
};

const renderButton = (item: Action) => {
    const isHidden = item.hidden;
    const { display, iconMap, secondaryGroups } = state;

    const icon = display.showIcon ? (iconMap[item.type] || "") : "";

    // Determine meta parts (can be strings or HTML templates)
    const metaParts = [];
    
    if (item.workspace) {
        // Use workspaceColor if available for the workspace label badge
        const workspaceStyle = item.workspaceColor ? `background-color: ${item.workspaceColor};` : '';
        metaParts.push(html`<span class="lp-workspace-label" style="${workspaceStyle}">${item.workspace}</span>`);
    }

    const prettyCommand = formatCommandMeta(item);

    if (display.showType && display.showCommand) {
        metaParts.push(item.type);
        metaParts.push(prettyCommand);
    } else if (display.showType) metaParts.push(item.type);
    else if (display.showCommand) metaParts.push(prettyCommand);

    const isInGroup = !!item.group;
    const hasGroups = state.groups.length > 0;
    const showGroupActions = hasGroups || isInGroup;
    const isMenuOpen = state.openActionMenuFor === item;
    const actionMenuId = getActionMenuId(item);

    const actionStyle = item.backgroundColor ? `background-color: ${item.backgroundColor} !important;` : "";
    const isDragging = dragSrcAction === item;
    const isDragOver = dragOverAction === item;
    const wrapperClass = [
        'lp-btn-wrapper',
        isHidden ? 'lp-hidden-item' : '',
        isDragging ? 'lp-dragging' : '',
        isDragOver && dragOverTop ? 'lp-drag-over-top' : '',
        isDragOver && !dragOverTop ? 'lp-drag-over-bottom' : '',
    ].filter(Boolean).join(' ');

    return html`
    <div class=${wrapperClass}
        @dragover=${(e: DragEvent) => handleDragOver(e, item)}
        @dragleave=${(e: DragEvent) => handleDragLeave(e, item)}
        @drop=${(e: DragEvent) => handleDrop(e, item)}>
        ${state.selectionMode ? html`<input type="checkbox" class="lp-btn-checkbox" .checked=${state.selectedItems.includes(item)} @change=${(e: any) => {
            if (e.target.checked) state.selectedItems = [...state.selectedItems, item];
            else state.selectedItems = state.selectedItems.filter(i => i !== item);
        }}>` : null}
        
        <button
            class="lp-play-btn"
            style="--lp-play-btn-bg: ${display.playButtonBg}"
            title="Run"
            aria-label=${`Run ${item.name}`}
            @click=${() => executeAction(item)}>
            <span class="codicon codicon-play"></span>
        </button>
        ${!state.searchQuery ? html`
        <button class="lp-drag-handle" draggable="true" title="Drag to reorder" aria-label=${`Drag ${item.name} to reorder`}
            @dragstart=${(e: DragEvent) => handleDragStart(e, item)}
            @dragend=${handleDragEnd}>
            <span class="codicon codicon-gripper"></span>
        </button>` : null}
        
        <div class="lp-btn ${state.selectionMode ? 'has-checkbox' : ''}" style="${actionStyle}">
             <span class="lp-btn-name">
                ${icon ? html`<span class="codicon codicon-${icon} lp-icon"></span>` : null}
                ${item.name}
                ${isHidden ? html`<span class="lp-hidden-badge">(hidden)</span>` : null}
             </span>
             ${metaParts.length ? html`<span class="lp-btn-meta">${metaParts.map((part, idx) => html`${idx > 0 ? ' · ' : ''}${part}`)}</span>` : null}
        </div>

        ${renderFlyoutMenu({
            kind: "action",
            menuId: actionMenuId,
            isOpen: isMenuOpen,
            triggerTitle: "More actions",
            triggerAriaLabel: `More actions for ${item.name}`,
            onTriggerClick: (e: Event) => toggleActionMenu(e, item),
            onTriggerKeydown: (e: KeyboardEvent) => onActionMenuTriggerKeydown(e, item),
            onMenuClick: (e: Event) => e.stopPropagation(),
            onMenuKeydown: (e: KeyboardEvent) => onActionMenuKeydown(e, item),
            menuContent: html`
                <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${() => onActionMenuAction(() => editAction(item))}>
                    <span class="codicon codicon-edit"></span>
                    Edit
                </button>
                <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${() => onActionMenuAction(() => setActionColor(item))}>
                    <span class="codicon codicon-symbol-color"></span>
                    Set color
                </button>
                <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${() => onActionMenuAction(() => hideAction(item))}>
                    <span class="codicon codicon-${isHidden ? 'eye' : display.hideIcon}"></span>
                    ${isHidden ? 'Show' : 'Hide'}
                </button>

                ${showGroupActions ? html`
                    <div class="lp-menu-divider"></div>
                    <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${() => onActionMenuAction(() => assignGroup(item, "__none__"))}>
                        <span class="codicon codicon-clear-all"></span>
                        Remove from group
                    </button>
                    ${state.groups.map(g => html`
                        <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${() => onActionMenuAction(() => assignGroup(item, g.name))}>
                            ${g.icon ? html`<span class="codicon codicon-${g.icon}"></span>` : html`<span class="codicon codicon-folder"></span>`}
                            Assign to ${g.name}
                        </button>
                    `)}
                ` : null}
            `,
        })}
    </div>
    `;
};

const renderGroup = (group: Group, actions: Action[]) => {
    const isOpen = !state.collapsedGroups.includes(group.name);
    const isHiddenGroup = !!group.hidden;

    // Group styles
    const styles = [];
    if (group.color) {
        if (group.color.includes("--vscode-charts-")) {
            styles.push(`--lp-group-accent: ${group.color}`);
        } else {
            styles.push(`color: ${group.color}`);
            styles.push(`--lp-group-accent: ${group.color}`);
        }
    }
    if (group.backgroundColor) styles.push(`background-color: ${group.backgroundColor}`);
    if (group.borderColor) styles.push(`border-color: ${group.borderColor}`);

    const itemsStyles = [];
    if (group.backgroundColor) itemsStyles.push(`background-color: ${group.backgroundColor}`);
    if (group.borderColor) {
        itemsStyles.push(`border: 1px solid ${group.borderColor}`);
        itemsStyles.push(`border-radius: 4px`);
        itemsStyles.push(`padding: 8px`);
    }

    return html`
    <details class="lp-group" ?open=${isOpen} @toggle=${(e: Event) => {
            // Prevent default toggle behavior to manage state manually if needed, 
            // but <details> handles open/close natively. We just need to sync state.
            const d = e.target as HTMLDetailsElement;
            if (d.open && state.collapsedGroups.includes(group.name)) {
                toggleGroup(group.name);
            } else if (!d.open && !state.collapsedGroups.includes(group.name)) {
                toggleGroup(group.name);
            }
        }}>
        <summary class="lp-group-header ${isHiddenGroup ? 'lp-hidden-group' : ''}" style="${styles.join(';')}">
            <span class="codicon codicon-chevron-down lp-group-chevron"></span>
            <div class="lp-group-header-content">
                ${group.icon ? html`<span class="codicon codicon-${group.icon} lp-group-icon"></span>` : null}
                <span class="lp-group-name">${group.name}</span>
                ${isHiddenGroup ? html`<span class="lp-hidden-badge">(hidden)</span>` : null}
            </div>
            <div class="lp-menu-container lp-menu-container--group">
                <button
                    class="lp-menu-trigger lp-menu-trigger--group"
                    title=${isHiddenGroup ? "Show group" : "Hide group"}
                    aria-label=${isHiddenGroup ? `Show group ${group.name}` : `Hide group ${group.name}`}
                    @click=${(e: Event) => { e.preventDefault(); e.stopPropagation(); hideGroup(group); }}>
                    <span class="codicon codicon-${isHiddenGroup ? 'eye' : state.display.hideIcon}"></span>
                </button>
                <button
                    class="lp-menu-trigger lp-menu-trigger--group"
                    title="Edit group"
                    aria-label="Edit group ${group.name}"
                    @click=${(e: Event) => { e.preventDefault(); e.stopPropagation(); editGroup(group); }}>
                    <span class="codicon codicon-settings-gear"></span>
                </button>
            </div>
        </summary>
        <div class="lp-group-items" style="${itemsStyles.join(';')}">
            ${actions.map((a) => renderButton(a))}
        </div>
    </details>
    `;
};

const renderSearch = () => {
    if (!state.showSearch && !state.searchQuery) return null;

    return html`
    <div id="searchContainer" class="lp-search-container">
        <input type="text" class="lp-search-box" 
            placeholder="🔍 Search actions..." 
            .value=${state.searchQuery}
            @input=${(e: any) => { state.searchQuery = e.target.value; }}
        >
        <!-- Additional search buttons (Select Multiple, etc) could go here -->
    </div>
    `;
};

const renderMainToolbar = () => {
    const hiddenActionCount = state.actions.filter(a => a.hidden).length;
    const hiddenGroupCount = state.groups.filter(g => g.hidden).length;
    const hiddenTotal = hiddenActionCount + hiddenGroupCount;
    const showCounts = hiddenTotal > 0;

    return html`
    <div class="lp-main-toolbar">
        <button
            class="lp-toolbar-btn"
            title=${state.showHidden ? "Hide hidden actions and groups" : "Show hidden actions and groups"}
            aria-label=${state.showHidden ? "Hide hidden actions and groups" : "Show hidden actions and groups"}
            @click=${() => {
                state.showHidden = !state.showHidden;
                vscode.postMessage({ command: 'toggleShowHidden' });
            }}>
            <span class="codicon codicon-${state.showHidden ? state.display.hideIcon : 'eye'}"></span>
            <span>${state.showHidden ? 'Hide Hidden' : 'Show Hidden'}</span>
            ${showCounts ? html`<span class="lp-hidden-count">${hiddenTotal}</span>` : null}
        </button>
    </div>
  `;
};

const renderView = () => {
    if (!root) return;

    // Filter actions
    let visibleActions = state.actions;

    // Filter hidden items
    if (!state.showHidden) {
        visibleActions = visibleActions.filter(a => !a.hidden);
    }

    // Filter search
    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        visibleActions = visibleActions.filter(a =>
            a.name.toLowerCase().includes(q) ||
            a.command.toLowerCase().includes(q) ||
            (a.group && a.group.toLowerCase().includes(q))
        );
    }

    // Grouping
    const content = [];
    if (state.display.showGroup && state.groups.length > 0) {
        const grouped = new Map<string, Action[]>();
        const ungrouped: Action[] = [];

        visibleActions.forEach(a => {
            if (a.group) {
                if (!grouped.has(a.group)) grouped.set(a.group, []);
                grouped.get(a.group)!.push(a);
            } else {
                ungrouped.push(a);
            }
        });

        state.groups.forEach(g => {
            if (g.hidden && !state.showHidden) {
                return;
            }
            const acts = grouped.get(g.name);
            if (acts && acts.length) {
                content.push(renderGroup(g, acts));
            }
        });

        if (ungrouped.length) {
            content.push(html`
            <details class="lp-group" open>
                <summary class="lp-group-header"><span class="codicon codicon-chevron-down lp-group-chevron"></span> Ungrouped</summary>
                                <div class="lp-group-items">${ungrouped.map((a) => renderButton(a))}</div>
            </details>
          `);
        }
    } else {
                content.push(visibleActions.map((a) => renderButton(a)));
    }

    if (visibleActions.length === 0) {
        // Empty State
        content.push(html`
        <div class="lp-empty-state">
            <div class="lp-welcome"><h2 class="lp-welcome-title">Welcome</h2></div>
            <div class="lp-empty-actions">
                <button class="lp-empty-btn lp-empty-primary" @click=${() => {
                state.generating = true; // Immediate feedback!
                vscode.postMessage({ command: 'showGenerateConfig' });
            }}>
                    <span class="codicon ${state.generating ? 'codicon-loading codicon-modifier-spin' : 'codicon-sparkle'}"></span>
                    <span class="lp-btn-label">${state.generating ? 'Detecting...' : 'Auto-detect'}</span>
                </button>
            </div>
        </div>
      `);
    }

    render(html`
    <div id="toast" class="lp-toast"></div>
    ${state.loading
            ? html`<div class="lp-loading-overlay"><span class="codicon codicon-loading codicon-modifier-spin"></span></div>`
            : null}
    ${renderMainToolbar()}
    ${renderSearch()}
    <div class="lp-grid ${state.display.density}">
        ${content}
    </div>
  `, root);
};

// Handle Messages from Extension
window.addEventListener('message', event => {
    const msg = event.data;
    switch (msg.type) {
        case 'update':
            batchStateUpdates(() => {
                Object.assign(state, msg.data);
                state.loading = false;
                state.generating = false;
            });
            break;
        case 'setLoading':
            state.loading = msg.value;
            break;
        case 'toggleSearch':
            state.showSearch = msg.visible;
            // focus logic if needed, or let renderView handle it
            break;
        case 'collapseAllGroups':
            state.collapsedGroups = state.groups.map(g => g.name);
            requestRender();
            break;
        case 'expandAllGroups':
            state.collapsedGroups = [];
            requestRender();
            break;
        case 'showToast':
            // ... toast logic
            break;
    }
});

// Initial Render
renderView();

document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target?.closest('.lp-menu-container')) {
        closeActionMenu();
    }
});

document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
        closeActionMenu();
    }
});
