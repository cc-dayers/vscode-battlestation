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
        actionToolbar: string[];
    };
    iconMap: Record<string, string>;
    collapsedGroups: string[];
    // Transients
    showSearch: boolean;
    showHidden?: boolean;
    selectionMode: boolean;
    selectedItems: Action[]; // References to items in actions
    openActionMenuFor: Action | null;
    // Session-only run status (never persisted to disk)
    runStatus: Record<string, { exitCode: number; timestamp: number }>;
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
        actionToolbar: ["hide", "setColor", "edit", "delete"],
    },
    iconMap: {},
    collapsedGroups: [],
    showSearch: false,
    showHidden: false, // Default
    selectionMode: false,
    selectedItems: [],
    openActionMenuFor: null,
    runStatus: {},
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
let dragOverGroupName: string | null = null; // group header being hovered during drag

// Color picker popout state
let colorPickerOpenFor: string | null = null; // actionMenuId of the open picker
let colorPickerColor = '';
let colorPickerApplyToPlay = true;
let colorPickerApplyToRow = false;

// Group color picker state
let groupColorPickerOpenFor: string | null = null;
let groupColorPickerApplyToAccent = true;
let groupColorPickerApplyToBg = false;
let groupColorPickerApplyToBorder = false;

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

    // Build updated src adopting the target item's group (handles cross-group drops)
    const updatedSrc: Action = { ...dragSrcAction };
    if (item.group !== undefined) {
        updatedSrc.group = item.group;
    } else {
        delete updatedSrc.group;
    }

    const newActions = state.actions.map(a => a === dragSrcAction ? updatedSrc : a);
    const srcIdx = newActions.indexOf(updatedSrc);
    const tgtIdx = newActions.indexOf(item);
    if (srcIdx === -1 || tgtIdx === -1) {
        dragSrcAction = null;
        dragOverAction = null;
        dragOverGroupName = null;
        return;
    }
    newActions.splice(srcIdx, 1);
    const adjustedTgt = newActions.indexOf(item);
    const insertIdx = dragOverTop ? adjustedTgt : adjustedTgt + 1;
    newActions.splice(insertIdx, 0, updatedSrc);
    dragSrcAction = null;
    dragOverAction = null;
    dragOverGroupName = null;
    state.actions = newActions;
    vscode.postMessage({ command: 'reorderActions', actions: newActions });
};

const handleDragEnd = () => {
    dragSrcAction = null;
    dragOverAction = null;
    dragOverGroupName = null;
    requestRender();
};

const handleDragOverGroupHeader = (e: DragEvent, group: Group) => {
    if (!dragSrcAction) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer!.dropEffect = 'move';
    if (dragOverGroupName !== group.name) {
        dragOverAction = null;
        dragOverGroupName = group.name;
        requestRender();
    }
};

const handleDragLeaveGroupHeader = (e: DragEvent, group: Group) => {
    if (dragOverGroupName !== group.name) return;
    dragOverGroupName = null;
    requestRender();
};

const handleDropOnGroupHeader = (e: DragEvent, group: Group) => {
    e.preventDefault();
    e.stopPropagation();
    const src = dragSrcAction;
    if (!src) return;

    const updatedSrc: Action = { ...src, group: group.name };
    const withoutSrc = state.actions.filter(a => a !== src);

    // Insert after the last action already in this group, or at the end
    let insertIdx = withoutSrc.length;
    for (let i = withoutSrc.length - 1; i >= 0; i--) {
        if (withoutSrc[i].group === group.name) {
            insertIdx = i + 1;
            break;
        }
    }

    const newActions = [
        ...withoutSrc.slice(0, insertIdx),
        updatedSrc,
        ...withoutSrc.slice(insertIdx),
    ];

    dragSrcAction = null;
    dragOverAction = null;
    dragOverGroupName = null;
    state.actions = newActions;
    vscode.postMessage({ command: 'reorderActions', actions: newActions });
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

const setActionColor = (item: Action, menuId: string) => {
    closeActionMenu(); // Close ellipsis if open
    groupColorPickerOpenFor = null; // Close group color picker if open
    if (colorPickerOpenFor === menuId) {
        colorPickerOpenFor = null;
    } else {
        colorPickerOpenFor = menuId;
        colorPickerApplyToPlay = true;
        colorPickerApplyToRow = !!item.rowBackgroundColor;
    }
    renderView();
};

const deleteAction = (item: Action) => {
    vscode.postMessage({ command: "deleteAction", item });
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
    colorPickerOpenFor = null; // Close color picker if open
    groupColorPickerOpenFor = null; // Close group color picker if open
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

const getGroupMenuId = (group: Group): string => `grp-${encodeURIComponent(group.name)}`;

const setGroupColorAction = (group: Group, menuId: string) => {
    closeActionMenu();
    colorPickerOpenFor = null; // close action color picker
    if (groupColorPickerOpenFor === menuId) {
        groupColorPickerOpenFor = null;
    } else {
        groupColorPickerOpenFor = menuId;
        groupColorPickerApplyToAccent = true;
        groupColorPickerApplyToBg = !!group.backgroundColor;
        groupColorPickerApplyToBorder = !!group.borderColor;
    }
    renderView();
};

const renderGroupColorPickerPopout = (group: Group) => {
    const currentColor = group.color || group.backgroundColor || group.borderColor || '';

    const applyNow = (color: string) => {
        vscode.postMessage({ command: "setGroupColor", group, color,
            applyToAccent: groupColorPickerApplyToAccent, applyToBg: groupColorPickerApplyToBg, applyToBorder: groupColorPickerApplyToBorder });
    };

    const onNativeInput = (e: Event) => applyNow((e.target as HTMLInputElement).value);
    const onTextChange = (e: Event) => { const v = (e.target as HTMLInputElement).value.trim(); if (v) applyNow(v); };

    return html`
        <div class="lp-cp-popout" @click=${(e: Event) => e.stopPropagation()}>
            <div class="lp-cp-swatches">
                ${THEME_COLORS.map(c => html`
                    <button class="lp-cp-swatch ${currentColor === c.value ? 'lp-cp-swatch--active' : ''}"
                        style="background:${c.value}" title=${c.name}
                        @click=${() => applyNow(c.value)}></button>
                `)}
                <button class="lp-cp-swatch lp-cp-swatch--clear" title="Clear color"
                    @click=${() => applyNow('')}>
                    <span class="codicon codicon-circle-slash"></span>
                </button>
            </div>
            <div class="lp-cp-custom-row">
                <div class="lp-cp-preview" style="background:${currentColor || 'transparent'}"></div>
                <input class="lp-cp-text" type="text" placeholder="#hex or var(--color)"
                    value=${currentColor}
                    @change=${onTextChange}>
                <label class="lp-cp-native-wrap" title="Open color wheel">
                    <input type="color" value=${currentColor.startsWith('#') ? currentColor : '#000000'}
                        @input=${onNativeInput}>
                    <span class="codicon codicon-color-mode"></span>
                </label>
            </div>
            <div class="lp-cp-targets">
                <label class="lp-cp-target-label">
                    <input type="checkbox" .checked=${groupColorPickerApplyToAccent}
                        @change=${(e: Event) => {
                            groupColorPickerApplyToAccent = (e.target as HTMLInputElement).checked;
                            if (groupColorPickerApplyToAccent) {
                                if (currentColor) applyNow(currentColor);
                            } else {
                                vscode.postMessage({ command: "setGroupColor", group, color: '', applyToAccent: true, applyToBg: false, applyToBorder: false });
                            }
                        }}>
                    Header accent
                </label>
                <label class="lp-cp-target-label">
                    <input type="checkbox" .checked=${groupColorPickerApplyToBg}
                        @change=${(e: Event) => {
                            groupColorPickerApplyToBg = (e.target as HTMLInputElement).checked;
                            if (groupColorPickerApplyToBg) {
                                if (currentColor) applyNow(currentColor);
                            } else {
                                vscode.postMessage({ command: "setGroupColor", group, color: '', applyToAccent: false, applyToBg: true, applyToBorder: false });
                            }
                        }}>
                    Items background
                </label>
                <label class="lp-cp-target-label">
                    <input type="checkbox" .checked=${groupColorPickerApplyToBorder}
                        @change=${(e: Event) => {
                            groupColorPickerApplyToBorder = (e.target as HTMLInputElement).checked;
                            if (groupColorPickerApplyToBorder) {
                                if (currentColor) applyNow(currentColor);
                            } else {
                                vscode.postMessage({ command: "setGroupColor", group, color: '', applyToAccent: false, applyToBg: false, applyToBorder: true });
                            }
                        }}>
                    Border accent
                </label>
            </div>
        </div>
    `;
};

const formatRelativeTime = (timestamp: number): string => {
    const secs = Math.floor((Date.now() - timestamp) / 1000);
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
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

const THEME_COLORS = [
    { name: "Red",      value: "var(--vscode-charts-red)" },
    { name: "Orange",   value: "var(--vscode-charts-orange)" },
    { name: "Yellow",   value: "var(--vscode-charts-yellow)" },
    { name: "Green",    value: "var(--vscode-charts-green)" },
    { name: "Blue",     value: "var(--vscode-charts-blue)" },
    { name: "Purple",   value: "var(--vscode-charts-purple)" },
    { name: "Pink",     value: "var(--vscode-charts-pink)" },
    { name: "Error",    value: "var(--vscode-errorForeground)" },
    { name: "Warning",  value: "var(--vscode-editorWarning-foreground)" },
    { name: "Info",     value: "var(--vscode-editorInfo-foreground)" },
    { name: "Success",  value: "var(--vscode-testing-iconPassed)" },
];

const renderColorPickerPopout = (item: Action, menuId: string) => {
    const currentColor = item.backgroundColor || '';

    const applyNow = (color: string) => {
        vscode.postMessage({ command: "setActionColor", item, color, applyToPlay: colorPickerApplyToPlay, applyToRow: colorPickerApplyToRow });
    };

    const clearColor = () => {
        vscode.postMessage({ command: "setActionColor", item, color: '', applyToPlay: colorPickerApplyToPlay, applyToRow: colorPickerApplyToRow });
    };

    const onNativeInput = (e: Event) => applyNow((e.target as HTMLInputElement).value);
    const onTextChange = (e: Event) => { const v = (e.target as HTMLInputElement).value.trim(); if (v) applyNow(v); };

    return html`
        <div class="lp-cp-popout" @click=${(e: Event) => e.stopPropagation()}>
            <div class="lp-cp-swatches">
                ${THEME_COLORS.map(c => html`
                    <button class="lp-cp-swatch ${currentColor === c.value ? 'lp-cp-swatch--active' : ''}"
                        style="background:${c.value}" title=${c.name}
                        @click=${() => applyNow(c.value)}></button>
                `)}
                <button class="lp-cp-swatch lp-cp-swatch--clear" title="Clear color"
                    @click=${clearColor}>
                    <span class="codicon codicon-circle-slash"></span>
                </button>
            </div>
            <div class="lp-cp-custom-row">
                <div class="lp-cp-preview" style="background:${currentColor || 'transparent'}"></div>
                <input class="lp-cp-text" type="text" placeholder="#hex or var(--color)"
                    value=${currentColor}
                    @change=${onTextChange}>
                <label class="lp-cp-native-wrap" title="Open color wheel">
                    <input type="color" value=${currentColor.startsWith('#') ? currentColor : '#000000'}
                        @input=${onNativeInput}>
                    <span class="codicon codicon-color-mode"></span>
                </label>
            </div>
            <div class="lp-cp-targets">
                <label class="lp-cp-target-label">
                    <input type="checkbox" .checked=${colorPickerApplyToPlay}
                        @change=${(e: Event) => {
                            colorPickerApplyToPlay = (e.target as HTMLInputElement).checked;
                            if (colorPickerApplyToPlay) {
                                if (currentColor) applyNow(currentColor);
                            } else {
                                vscode.postMessage({ command: "setActionColor", item, color: '', applyToPlay: true, applyToRow: false });
                            }
                        }}>
                    Play button
                </label>
                <label class="lp-cp-target-label">
                    <input type="checkbox" .checked=${colorPickerApplyToRow}
                        @change=${(e: Event) => {
                            colorPickerApplyToRow = (e.target as HTMLInputElement).checked;
                            if (colorPickerApplyToRow) {
                                if (currentColor) applyNow(currentColor);
                            } else {
                                vscode.postMessage({ command: "setActionColor", item, color: '', applyToPlay: false, applyToRow: true });
                            }
                        }}>
                    Row background
                </label>
            </div>
        </div>
    `;
};

const renderButton = (item: Action) => {
    const isHidden = item.hidden;
    const { display, iconMap } = state;

    const icon = display.showIcon ? (iconMap[item.type] || "") : "";

    // Determine meta parts (can be strings or HTML templates)
    const metaParts = [];

    if (item.workspace) {
        metaParts.push(html`<span class="lp-workspace-label">${item.workspace}</span>`);
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
    const isDragging = dragSrcAction === item;
    const isDragOver = dragOverAction === item;
    const wrapperClass = [
        'lp-btn-wrapper',
        isHidden ? 'lp-hidden-item' : '',
        isDragging ? 'lp-dragging' : '',
        isDragOver && dragOverTop ? 'lp-drag-over-top' : '',
        isDragOver && !dragOverTop ? 'lp-drag-over-bottom' : '',
    ].filter(Boolean).join(' ');

    const runEntry = state.runStatus[item.name];
    const statusDot = runEntry
        ? html`<span
            class="lp-status-dot ${runEntry.exitCode === 0 ? 'lp-status-ok' : 'lp-status-fail'}"
            title="Last run: ${formatRelativeTime(runEntry.timestamp)} — Exit ${runEntry.exitCode}">
          </span>`
        : null;

    // Build inline toolbar and ellipsis menu from actionToolbar setting
    type StaticBtn = { icon: string; label: string; action: () => void; dangerous?: boolean };
    const staticBtnDefs: Record<string, StaticBtn> = {
        edit:     { icon: 'edit',                              label: 'Edit',                  action: () => editAction(item) },
        setColor: { icon: 'symbol-color',                     label: 'Set color',             action: () => setActionColor(item, actionMenuId) },
        hide:     { icon: isHidden ? 'eye' : display.hideIcon, label: isHidden ? 'Show' : 'Hide', action: () => hideAction(item) },
        delete:   { icon: 'trash',                            label: 'Delete',                action: () => deleteAction(item), dangerous: true },
    };
    const toolbar = display.actionToolbar ?? ['hide', 'setColor', 'edit', 'delete'];
    const inlineBtns = toolbar.filter(id => staticBtnDefs[id]).map(id => ({ id, ...staticBtnDefs[id] }));
    const ellipsisStaticBtns = (Object.keys(staticBtnDefs) as string[])
        .filter(id => !toolbar.includes(id))
        .map(id => ({ id, ...staticBtnDefs[id] }));
    const hasEllipsisContent = ellipsisStaticBtns.length > 0 || showGroupActions;

    return html`
    <div class=${wrapperClass}
        style=${item.rowBackgroundColor ? `--lp-row-bg:${item.rowBackgroundColor}` : ''}
        @dragover=${(e: DragEvent) => handleDragOver(e, item)}
        @dragleave=${(e: DragEvent) => handleDragLeave(e, item)}
        @drop=${(e: DragEvent) => handleDrop(e, item)}>
        ${state.selectionMode ? html`<input type="checkbox" class="lp-btn-checkbox" .checked=${state.selectedItems.includes(item)} @change=${(e: any) => {
            if (e.target.checked) state.selectedItems = [...state.selectedItems, item];
            else state.selectedItems = state.selectedItems.filter(i => i !== item);
        }}>` : null}

        <button
            class="lp-play-btn"
            style="--lp-play-btn-bg: ${item.backgroundColor || display.playButtonBg}"
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

        <div class="lp-btn ${state.selectionMode ? 'has-checkbox' : ''}">
             <span class="lp-btn-name">
                ${icon ? html`<span class="codicon codicon-${icon} lp-icon"></span>` : null}
                ${item.name}
                ${isHidden ? html`<span class="lp-hidden-badge">(hidden)</span>` : null}
                ${statusDot}
                <span class="lp-action-toolbar">
                    ${inlineBtns.map(btn => btn.id === 'setColor' ? html`
                        <div class="lp-cp-container">
                            <button class="lp-inline-action-btn ${colorPickerOpenFor === actionMenuId ? 'lp-cp-active' : ''}"
                                title=${btn.label} aria-label="${btn.label} ${item.name}"
                                @click=${(e: Event) => { e.stopPropagation(); btn.action(); }}>
                                <span class="codicon codicon-${btn.icon}"></span>
                            </button>
                            ${colorPickerOpenFor === actionMenuId ? renderColorPickerPopout(item, actionMenuId) : null}
                        </div>
                    ` : html`
                        <button class="lp-inline-action-btn ${btn.dangerous ? 'lp-btn-dangerous' : ''}"
                            title=${btn.label} aria-label="${btn.label} ${item.name}"
                            @click=${(e: Event) => { e.stopPropagation(); btn.action(); }}>
                            <span class="codicon codicon-${btn.icon}"></span>
                        </button>
                    `)}
                    ${hasEllipsisContent ? renderFlyoutMenu({
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
                            ${ellipsisStaticBtns.map(btn => html`
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem"
                                    @click=${() => onActionMenuAction(() => btn.action())}>
                                    <span class="codicon codicon-${btn.icon}"></span>
                                    ${btn.label}
                                </button>
                            `)}
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
                    }) : null}
                </span>
             </span>
             ${metaParts.length ? html`<span class="lp-btn-meta">${metaParts.map((part, idx) => html`${idx > 0 ? ' · ' : ''}${part}`)}</span>` : null}
        </div>
    </div>
    `;
};

const renderGroup = (group: Group, actions: Action[]) => {
    const isOpen = !state.collapsedGroups.includes(group.name);
    const isHiddenGroup = !!group.hidden;

    // Group styles
    const styles = [];
    // borderColor takes priority for the accent stripe, then color, then theme default
    const accent = group.borderColor || group.color;
    if (accent) {
        if (accent.includes("--vscode-charts-")) {
            styles.push(`--lp-group-accent: ${accent}`);
        } else {
            styles.push(`--lp-group-accent: ${accent}`);
        }
    }
    if (group.color) {
        if (!group.color.includes("--vscode-charts-")) {
            styles.push(`color: ${group.color}`);
        }
    }
    if (group.backgroundColor) styles.push(`background-color: ${group.backgroundColor}`);

    const itemsStyles = [];
    if (group.backgroundColor) itemsStyles.push(`background-color: ${group.backgroundColor}`);

    const groupMenuId = getGroupMenuId(group);

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
        <summary class="lp-group-header ${isHiddenGroup ? 'lp-hidden-group' : ''} ${dragOverGroupName === group.name ? 'lp-drag-over-group' : ''} ${groupColorPickerOpenFor === groupMenuId ? 'lp-group-header--picker-open' : ''}"
            style="${styles.join(';')}"
            @dragover=${(e: DragEvent) => handleDragOverGroupHeader(e, group)}
            @dragleave=${(e: DragEvent) => handleDragLeaveGroupHeader(e, group)}
            @drop=${(e: DragEvent) => handleDropOnGroupHeader(e, group)}>
            <span class="codicon codicon-chevron-down lp-group-chevron"></span>
            <div class="lp-group-header-content">
                ${group.icon ? html`<span class="codicon codicon-${group.icon} lp-group-icon"></span>` : null}
                <span class="lp-group-name">${group.name}</span>
                ${isHiddenGroup ? html`<span class="lp-hidden-badge">(hidden)</span>` : null}
            </div>
            <span class="lp-group-action-toolbar">
                <button class="lp-inline-action-btn"
                    title=${isHiddenGroup ? "Show group" : "Hide group"}
                    aria-label=${isHiddenGroup ? `Show group ${group.name}` : `Hide group ${group.name}`}
                    @click=${(e: Event) => { e.preventDefault(); e.stopPropagation(); hideGroup(group); }}>
                    <span class="codicon codicon-${isHiddenGroup ? 'eye' : state.display.hideIcon}"></span>
                </button>
                <div class="lp-cp-container">
                    <button class="lp-inline-action-btn ${groupColorPickerOpenFor === groupMenuId ? 'lp-cp-active' : ''}"
                        title="Set color"
                        aria-label="Set color for group ${group.name}"
                        @click=${(e: Event) => { e.preventDefault(); e.stopPropagation(); setGroupColorAction(group, groupMenuId); }}>
                        <span class="codicon codicon-symbol-color"></span>
                    </button>
                    ${groupColorPickerOpenFor === groupMenuId ? renderGroupColorPickerPopout(group) : null}
                </div>
                <button class="lp-inline-action-btn"
                    title="Edit group"
                    aria-label="Edit group ${group.name}"
                    @click=${(e: Event) => { e.preventDefault(); e.stopPropagation(); editGroup(group); }}>
                    <span class="codicon codicon-edit"></span>
                </button>
            </span>
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
        if (state.searchQuery) {
            content.push(html`
            <div class="lp-empty-state lp-no-results">
                <span class="codicon codicon-search"></span>
                <span>No results for "<strong>${state.searchQuery}</strong>"</span>
            </div>
          `);
        } else {
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
    }

    render(html`
    <div id="toast" class="lp-toast"></div>
    ${state.loading
            ? html`<div class="lp-loading-overlay"><span class="codicon codicon-loading codicon-modifier-spin"></span></div>`
            : null}
    ${renderSearch()}
    <div class="lp-grid">
        ${content}
    </div>
  `, root);

    // Flip any open menu panels that would overflow the viewport bottom
    requestAnimationFrame(() => {
        document.querySelectorAll<HTMLElement>('.lp-menu-panel--action, .lp-menu-panel--group').forEach(panel => {
            const rect = panel.getBoundingClientRect();
            panel.classList.toggle('lp-menu-flip', rect.bottom > window.innerHeight - 8);
        });
    });
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
    // Targeted status update — no full refresh
    if (msg.command === 'statusUpdate') {
        state.runStatus = { ...state.runStatus, [msg.name]: { exitCode: msg.exitCode, timestamp: msg.timestamp } };
    }
});

// Initial Render
renderView();

document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target?.closest('.lp-menu-container')) {
        closeActionMenu();
    }
    if (!target?.closest('.lp-cp-container')) {
        let changed = false;
        if (colorPickerOpenFor !== null) { colorPickerOpenFor = null; changed = true; }
        if (groupColorPickerOpenFor !== null) { groupColorPickerOpenFor = null; changed = true; }
        if (changed) renderView();
    }
});

document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
        closeActionMenu();
    }
});
