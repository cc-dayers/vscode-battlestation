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
        showCommand: boolean;
        showGroup: boolean;
        hideIcon: string;
        playButtonBg: string;
        actionToolbar: string[];
        secondaryGroupStyle: string;
    };
    iconMap: Record<string, string>;
    collapsedGroups: string[];
    collapsedSubGroups: string[];
    // Transients
    showSearch: boolean;
    showHidden?: boolean;
    selectionMode: boolean;
    selectedItems: Action[]; // References to items in actions
    openActionMenuFor: Action | null;
    // Session-only run status (never persisted to disk)
    runStatus: Record<string, { exitCode: number; timestamp: number }>;
    newActionNames?: string[];
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

function requestRender() {
    if (isBatchingState) {
        hasPendingRender = true;
        return;
    }
    if (hasPendingRender) return;
    
    hasPendingRender = true;
    queueMicrotask(() => {
        if (!hasPendingRender) return;
        hasPendingRender = false;
        renderView();
    });
}

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

window.addEventListener("resize", () => {
    vscode.postMessage({ command: "webviewResized", width: window.innerWidth });
});
// Initial check
setTimeout(() => {
    vscode.postMessage({ command: "webviewResized", width: window.innerWidth });
}, 100);

// Initial State
const startState: MainViewState = {
    actions: [],
    groups: [],
    searchQuery: "",
    loading: false,
    generating: false,
    display: {
        showCommand: true,
        showGroup: true,
        hideIcon: "eye-closed",
        playButtonBg: "transparent",
        actionToolbar: ["hide", "setColor", "edit", "delete"],
        secondaryGroupStyle: "border",
    },
    iconMap: {},
    collapsedGroups: [],
    collapsedSubGroups: [],
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

// Restore transient UI state (survives panel switches within the same session)
const storedState = (vscode.getState() as Partial<MainViewState & { showSearch: boolean; searchQuery: string }>) || {};
if (storedState.collapsedGroups) {
    startState.collapsedGroups = storedState.collapsedGroups;
}
if (storedState.collapsedSubGroups) {
    startState.collapsedSubGroups = storedState.collapsedSubGroups;
}
if (storedState.searchQuery) {
    startState.searchQuery = storedState.searchQuery;
    startState.showSearch = true; // always show bar if there was an active query
} else if (storedState.showSearch) {
    startState.showSearch = storedState.showSearch;
}

// Reactive State Container
const state = new Proxy(startState, {
    set(target, p, value) {
        Reflect.set(target, p, value);
        requestRender();
        // Persist state that should survive panel visibility toggles
        if (p === "collapsedGroups" || p === "collapsedSubGroups" || p === "searchQuery" || p === "showSearch") {
            vscode.setState({
                collapsedGroups: (p === "collapsedGroups" ? value : target.collapsedGroups) as string[],
                collapsedSubGroups: (p === "collapsedSubGroups" ? value : target.collapsedSubGroups) as string[],
                searchQuery: (p === "searchQuery" ? value : target.searchQuery) as string,
                showSearch: (p === "showSearch" ? value : target.showSearch) as boolean,
            });
        }
        return true;
    },
});

// --- Actions ---

// Drag-and-drop reorder state
let dragSrcAction: Action | null = null;
let dragOverAction: Action | null = null;
let dragOverTop = true; // true = insert before target, false = insert after
let dragOverGroupName: string | null = null; // group header being hovered during action drag

// Group drag-and-drop reorder state
let dragSrcGroup: Group | null = null;
let dragOverGroup: Group | null = null;
let dragOverGroupTop = true; // true = insert before target, false = insert after

// Subgroup drag-and-drop reorder state
let dragSrcSubgroup: { group: string, workspace: string } | null = null;
let dragOverSubgroup: { group: string, workspace: string } | null = null;
let dragOverSubgroupTop = true;

// Color picker popout state
let colorPickerOpenFor: string | null = null; // actionMenuId of the open picker

let colorPickerApplyToPlay = false;
let colorPickerApplyToRow = true;
let colorPickerThemeExpanded = false;

// Group color picker state
let groupColorPickerOpenFor: string | null = null;
let groupColorPickerApplyToAccent = true;
let groupColorPickerApplyToBg = false;
let groupColorPickerApplyToBorder = false;

// Reorder mode (transient UI state — not persisted)
let reorderMode = false;

// Search group-assign picker
let searchGroupPickerOpen = false;

const enterReorderMode = () => {
    closeActionMenu();
    colorPickerOpenFor = null;
    groupColorPickerOpenFor = null;
    reorderMode = true;
    requestRender();
};

const exitReorderMode = () => {
    dragSrcAction = null;
    dragOverAction = null;
    dragOverGroupName = null;
    reorderMode = false;
    requestRender();
};

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

const moveAction = (item: Action, direction: 'up' | 'down') => {
    const actions = [...state.actions];
    const idx = actions.indexOf(item);
    if (direction === 'up' && idx <= 0) return;
    if (direction === 'down' && idx >= actions.length - 1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [actions[idx], actions[swapIdx]] = [actions[swapIdx], actions[idx]];
    state.actions = actions;
    vscode.postMessage({ command: 'reorderActions', actions });
};

const handleDragEnd = () => {
    dragSrcAction = null;
    dragOverAction = null;
    dragOverGroupName = null;
    dragSrcGroup = null;
    dragOverGroup = null;
    dragSrcSubgroup = null;
    dragOverSubgroup = null;
    requestRender();
};

const handleGroupDragStart = (e: DragEvent, group: Group) => {
    dragSrcGroup = group;
    e.dataTransfer!.effectAllowed = 'move';
    const summary = (e.currentTarget as HTMLElement).closest('.lp-group-header') as HTMLElement;
    if (summary) {
        const rect = summary.getBoundingClientRect();
        e.dataTransfer!.setDragImage(summary, e.clientX - rect.left, e.clientY - rect.top);
    }
    setTimeout(() => requestRender(), 0);
};

const handleGroupDragEnd = () => {
    dragSrcGroup = null;
    dragOverGroup = null;
    requestRender();
};

const handleDragOverGroupHeader = (e: DragEvent, group: Group) => {
    if (dragSrcGroup) {
        if (dragSrcGroup === group) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer!.dropEffect = 'move';
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const top = e.clientY < rect.top + rect.height / 2;
        if (dragOverGroup !== group || dragOverGroupTop !== top) {
            dragOverGroup = group;
            dragOverGroupTop = top;
            requestRender();
        }
        return;
    }
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
    if (dragSrcGroup) {
        const related = e.relatedTarget as HTMLElement | null;
        const wrapper = e.currentTarget as HTMLElement;
        if (!wrapper.contains(related) && dragOverGroup === group) {
            dragOverGroup = null;
            requestRender();
        }
        return;
    }
    if (dragOverGroupName !== group.name) return;
    dragOverGroupName = null;
    requestRender();
};

const handleDropOnGroupHeader = (e: DragEvent, group: Group) => {
    e.preventDefault();
    e.stopPropagation();

    if (dragSrcGroup) {
        if (dragSrcGroup === group) return;
        const groups = [...state.groups];
        const src = dragSrcGroup;
        const srcIdx = groups.findIndex(g => g === src);
        const tgtIdx = groups.findIndex(g => g === group);
        if (srcIdx === -1 || tgtIdx === -1) {
            dragSrcGroup = null;
            dragOverGroup = null;
            return;
        }
        const [removed] = groups.splice(srcIdx, 1);
        const adjustedTgt = groups.findIndex(g => g === group);
        const insertIdx = dragOverGroupTop ? adjustedTgt : adjustedTgt + 1;
        groups.splice(insertIdx, 0, removed);
        dragSrcGroup = null;
        dragOverGroup = null;
        state.groups = groups;
        vscode.postMessage({ command: 'reorderGroups', groups });
        return;
    }

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

const handleSubgroupDragStart = (e: DragEvent, group: Group, workspace: string) => {
    dragSrcSubgroup = { group: group.name, workspace };
    e.dataTransfer!.effectAllowed = 'move';
    const handle = e.currentTarget as HTMLElement;
    const header = handle.closest('.lp-subgroup-header') as HTMLElement;
    if (header) {
        const rect = header.getBoundingClientRect();
        e.dataTransfer!.setDragImage(header, e.clientX - rect.left, e.clientY - rect.top);
    }
    setTimeout(() => requestRender(), 0);
};

const handleSubgroupDragEnd = () => {
    dragSrcSubgroup = null;
    dragOverSubgroup = null;
    requestRender();
};

const handleDragOverSubgroupHeader = (e: DragEvent, group: Group, workspace: string) => {
    if (dragSrcSubgroup) {
        if (dragSrcSubgroup.group === group.name && dragSrcSubgroup.workspace === workspace) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer!.dropEffect = 'move';
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const top = e.clientY < rect.top + rect.height / 2;
        if (dragOverSubgroup?.workspace !== workspace || dragOverSubgroupTop !== top) {
            dragOverSubgroup = { group: group.name, workspace };
            dragOverSubgroupTop = top;
            requestRender();
        }
    }
};

const handleDragLeaveSubgroupHeader = (e: DragEvent, group: Group, workspace: string) => {
    if (dragSrcSubgroup) {
        const related = e.relatedTarget as HTMLElement | null;
        const wrapper = e.currentTarget as HTMLElement;
        if (!wrapper.contains(related) && dragOverSubgroup?.workspace === workspace) {
            dragOverSubgroup = null;
            requestRender();
        }
    }
};

const handleDropOnSubgroupHeader = (e: DragEvent, group: Group, workspace: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragSrcSubgroup) {
        if (dragSrcSubgroup.group === group.name && dragSrcSubgroup.workspace === workspace) return;
        const srcWksp = dragSrcSubgroup.workspace;
        const srcGroup = dragSrcSubgroup.group;
        const tgtWksp = workspace;
        const tgtGroup = group.name;

        const movingItems = state.actions.filter(a => (a.workspace || "Default") === srcWksp && a.group === srcGroup);
        movingItems.forEach(a => { a.group = tgtGroup; });
        
        let newActions = state.actions.filter(a => !((a.workspace || "Default") === srcWksp && a.group === srcGroup));
        
        const targetSubGroupItems = newActions.filter(a => (a.workspace || "Default") === tgtWksp && a.group === tgtGroup);
        if (targetSubGroupItems.length > 0) {
            const firstTgtIdx = newActions.indexOf(targetSubGroupItems[0]);
            const lastTgtIdx = newActions.indexOf(targetSubGroupItems[targetSubGroupItems.length - 1]);
            const insertIdx = dragOverSubgroupTop ? firstTgtIdx : lastTgtIdx + 1;
            newActions.splice(insertIdx, 0, ...movingItems);
        } else {
            const groupItems = newActions.filter(a => a.group === tgtGroup);
            if (groupItems.length > 0) {
                newActions.splice(newActions.indexOf(groupItems[groupItems.length - 1]) + 1, 0, ...movingItems);
            } else {
                newActions.push(...movingItems);
            }
        }

        state.actions = newActions;
        vscode.postMessage({ command: 'reorderActions', actions: newActions });
        dragSrcSubgroup = null;
        dragOverSubgroup = null;
        return;
    }
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

const toggleSubGroup = (groupName: string, subGroupName: string) => {
    const key = `${groupName}::${subGroupName}`;
    const newCollapsed = new Set(state.collapsedSubGroups);
    if (newCollapsed.has(key)) {
        newCollapsed.delete(key);
    } else {
        newCollapsed.add(key);
    }
    state.collapsedSubGroups = Array.from(newCollapsed);
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
        colorPickerApplyToRow = true;
        colorPickerApplyToPlay = !!item.backgroundColor;
    }
    renderView();
};

const deleteAction = (item: Action) => {
    vscode.postMessage({ command: "deleteAction", item });
};

const assignGroup = (item: Action, groupName: string) => {
    vscode.postMessage({ command: "assignGroup", item, groupName });
};

const bulkAssignToGroup = (items: Action[], groupName: string) => {
    vscode.postMessage({ command: "bulkAssignGroup", items, groupName });
    searchGroupPickerOpen = false;
    renderView();
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
                        @change=${onNativeInput}>
                    <span class="codicon codicon-color-mode"></span>
                </label>
            </div>
            <div class="lp-cp-targets">
                <span class="lp-cp-targets-hd">Apply to</span>
                <div class="lp-cp-target-btns">
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
                        Accent
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
                        BG
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
                        Border
                    </label>
                </div>
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
        return item.command.replace("npm run ", "");
    }

    if (item.type === "task") {
        const taskLabel = item.command.split("|")[1];
        return taskLabel ? taskLabel : "task";
    }

    if (item.type === "launch") {
        const launchLabel = item.command.split("|")[1];
        return launchLabel ? launchLabel : "launch";
    }

    if (item.type === "vscode") {
        const [commandId, commandArg] = item.command.split("|");
        if (commandId === "workbench.action.tasks.runTask") {
            return commandArg ? commandArg : "task";
        }
        if (commandId === "workbench.action.debug.start") {
            return commandArg ? commandArg : "launch";
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
                aria-haspopup="true"
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

// Curated dark-friendly row background presets
const ROW_BG_PRESETS = [
    { name: "Forest",  value: "#162d1e" },
    { name: "Ocean",   value: "#0e1e30" },
    { name: "Dusk",    value: "#1e1030" },
    { name: "Ember",   value: "#2e160a" },
    { name: "Slate",   value: "#141e28" },
    { name: "Olive",   value: "#1e2210" },
    { name: "Teal",    value: "#0e2828" },
    { name: "Crimson", value: "#2e0e0e" },
];

// VSCode theme colors (shown in collapsible section)
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

// Derive 4 harmonious row-background colors from a hex value using HSL rotation
const hexToHsl = (hex: string): [number, number, number] | null => {
    const m = hex.match(/^#([0-9a-f]{6})$/i);
    if (!m) return null;
    let r = parseInt(m[1].slice(0,2), 16) / 255;
    let g = parseInt(m[1].slice(2,4), 16) / 255;
    let b = parseInt(m[1].slice(4,6), 16) / 255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (d > 0) {
        s = d / (l > 0.5 ? 2 - max - min : max + min);
        h = max === r ? (g - b) / d + (g < b ? 6 : 0) :
            max === g ? (b - r) / d + 2 : (r - g) / d + 4;
        h /= 6;
    }
    return [h * 360, s * 100, l * 100];
};

const hslToHex = (h: number, s: number, l: number): string => {
    h /= 360; s /= 100; l /= 100;
    const f = (n: number) => {
        const k = (n + h * 12) % 12;
        const a = s * Math.min(l, 1 - l);
        return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
};

const deriveHarmonies = (hex: string): string[] => {
    const hsl = hexToHsl(hex);
    if (!hsl) return [];
    const [h, s, l] = hsl;
    // Clamp to dark, muted range appropriate for row backgrounds
    const rs = Math.max(Math.min(s, 65), 25);
    const rl = Math.max(Math.min(l, 32), 8);
    return [
        hslToHex((h + 30) % 360, rs, rl),
        hslToHex((h - 30 + 360) % 360, rs, rl),
        hslToHex((h + 150) % 360, rs, rl),
        hslToHex((h + 180) % 360, rs, rl),
    ];
};

const renderColorPickerPopout = (item: Action) => {
    const currentColor = item.rowBackgroundColor || item.backgroundColor || '';
    const harmonies = currentColor.startsWith('#') ? deriveHarmonies(currentColor) : [];

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
                ${ROW_BG_PRESETS.map(c => html`
                    <button class="lp-cp-swatch ${currentColor === c.value ? 'lp-cp-swatch--active' : ''}"
                        style="background:${c.value}" title=${c.name}
                        @click=${() => applyNow(c.value)}></button>
                `)}
                <button class="lp-cp-swatch lp-cp-swatch--clear" title="Clear color"
                    @click=${clearColor}>
                    <span class="codicon codicon-circle-slash"></span>
                </button>
            </div>
            ${harmonies.length ? html`
                <div class="lp-cp-harmonies-row">
                    <span class="lp-cp-harmonies-label">Harmonies</span>
                    <div class="lp-cp-harmonies">
                        ${harmonies.map(c => html`
                            <button class="lp-cp-swatch lp-cp-swatch--sm ${currentColor === c ? 'lp-cp-swatch--active' : ''}"
                                style="background:${c}" title=${c}
                                @click=${() => applyNow(c)}></button>
                        `)}
                    </div>
                </div>
            ` : null}
            <div class="lp-cp-custom-row">
                <div class="lp-cp-preview" style="background:${currentColor || 'transparent'}"></div>
                <input class="lp-cp-text" type="text" placeholder="#hex or var(--color)"
                    value=${currentColor}
                    @change=${onTextChange}>
                <label class="lp-cp-native-wrap" title="Open color wheel">
                    <input type="color" value=${currentColor.startsWith('#') ? currentColor : '#000000'}
                        @change=${onNativeInput}>
                    <span class="codicon codicon-color-mode"></span>
                </label>
            </div>
            <details class="lp-cp-theme-section" .open=${colorPickerThemeExpanded}
                @toggle=${(e: Event) => { colorPickerThemeExpanded = (e.target as HTMLDetailsElement).open; }}>
                <summary class="lp-cp-theme-toggle">
                    <span class="codicon codicon-chevron-right lp-cp-theme-chevron"></span>
                    VSCode theme colors
                </summary>
                <div class="lp-cp-swatches lp-cp-theme-swatches">
                    ${THEME_COLORS.map(c => html`
                        <button class="lp-cp-swatch ${currentColor === c.value ? 'lp-cp-swatch--active' : ''}"
                            style="background:${c.value}" title=${c.name}
                            @click=${() => applyNow(c.value)}></button>
                    `)}
                </div>
            </details>
            <div class="lp-cp-targets">
                <span class="lp-cp-targets-hd">Apply to</span>
                <div class="lp-cp-target-btns">
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
                        <span class="codicon codicon-play"></span>Play
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
                        Row bg
                    </label>
                </div>
            </div>
        </div>
    `;
};

const renderButton = (item: Action, hideWorkspaceBadge: boolean = false) => {
    const isHidden = item.hidden;
    const { display } = state;

    // Determine meta parts (can be strings or HTML templates)
    const metaParts = [];

    let topLabel = null;
    if (item.workspace && !hideWorkspaceBadge) {
        let styleStr = '';
        if (item.workspaceColor) {
            styleStr = `background-color: ${item.workspaceColor}; color: var(--vscode-editor-background); border: 1px solid color-mix(in srgb, var(--vscode-foreground) 20%, transparent); opacity: 0.9;`;
        }
        topLabel = html`<span class="lp-workspace-label" style="${styleStr}">${item.workspace}</span>`;
    }

    if (display.showCommand) {
        const cmdMeta = formatCommandMeta(item);
        const nameLower = item.name.trim().toLowerCase();
        if (cmdMeta.trim().toLowerCase() !== nameLower &&
            item.command.trim().toLowerCase() !== nameLower) {
            metaParts.push(cmdMeta);
        }
    }

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
        colorPickerOpenFor === actionMenuId ? 'lp-cp-open' : '',
        isMenuOpen ? 'lp-menu-open' : '',
        reorderMode ? 'lp-reorder-mode-row' : '',
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
    const canReorder = !state.searchQuery;
    const hasEllipsisContent = !reorderMode && (ellipsisStaticBtns.length > 0 || showGroupActions || canReorder);

    return html`
    <div class=${wrapperClass}
        data-action-name=${item.name}
        style=${item.rowBackgroundColor ? `--lp-row-bg:${item.rowBackgroundColor}` : ''}
        @dragover=${(e: DragEvent) => handleDragOver(e, item)}
        @dragleave=${(e: DragEvent) => handleDragLeave(e, item)}
        @drop=${(e: DragEvent) => handleDrop(e, item)}>
        ${state.selectionMode ? html`<input type="checkbox" class="lp-btn-checkbox" .checked=${state.selectedItems.includes(item)} @change=${(e: Event) => {
            if ((e.target as HTMLInputElement).checked) state.selectedItems = [...state.selectedItems, item];
            else state.selectedItems = state.selectedItems.filter(i => i !== item);
        }}>` : null}

        ${reorderMode ? html`
        <button class="lp-reorder-handle" draggable="true"
            title="Drag to reorder"
            aria-label=${`Drag ${item.name} to reorder`}
            @dragstart=${(e: DragEvent) => handleDragStart(e, item)}
            @dragend=${handleDragEnd}>
            <span class="codicon codicon-gripper"></span>
        </button>` : html`
        <button
            class="lp-play-btn"
            style=${item.backgroundColor ? `--lp-play-btn-bg: ${item.backgroundColor}` : display.playButtonBg && display.playButtonBg !== 'transparent' ? `--lp-play-btn-bg: ${display.playButtonBg}` : ''}
            title="Run"
            aria-label=${`Run ${item.name}`}
            @click=${() => executeAction(item)}>
            <span class="codicon codicon-play"></span>
        </button>`}

        <div class="lp-btn ${state.selectionMode ? 'has-checkbox' : ''}">
             ${topLabel}
             <span class="lp-btn-name">
                ${item.name}
                ${isHidden ? html`<span class="lp-hidden-badge">(hidden)</span>` : null}
                ${statusDot}
                <span class="lp-action-toolbar" style=${reorderMode ? 'display:none' : ''}>
                    ${inlineBtns.map(btn => btn.id === 'setColor' ? html`
                        <div class="lp-cp-container">
                            <button class="lp-inline-action-btn ${colorPickerOpenFor === actionMenuId ? 'lp-cp-active' : ''}"
                                title=${btn.label} aria-label="${btn.label} ${item.name}"
                                @click=${(e: Event) => { e.stopPropagation(); btn.action(); }}>
                                <span class="codicon codicon-${btn.icon}"></span>
                            </button>
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
                            ${canReorder ? html`
                                <div class="lp-menu-divider"></div>
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem"
                                    @click=${() => onActionMenuAction(() => enterReorderMode())}>
                                    <span class="codicon codicon-grabber"></span>
                                    Reorder actions
                                </button>
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem"
                                    ?disabled=${state.actions.indexOf(item) === 0}
                                    @click=${() => onActionMenuAction(() => moveAction(item, 'up'))}>
                                    <span class="codicon codicon-arrow-up"></span>
                                    Move up
                                </button>
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem"
                                    ?disabled=${state.actions.indexOf(item) === state.actions.length - 1}
                                    @click=${() => onActionMenuAction(() => moveAction(item, 'down'))}>
                                    <span class="codicon codicon-arrow-down"></span>
                                    Move down
                                </button>
                            ` : null}
                        `,
                    }) : null}
                </span>
             </span>
             ${metaParts.length ? html`<span class="lp-btn-meta">${metaParts.map((part, idx) => html`${idx > 0 ? ' · ' : ''}${part}`)}</span>` : null}
        </div>
        ${colorPickerOpenFor === actionMenuId ? renderColorPickerPopout(item) : null}
    </div>
    `;
};

const renderSecondaryGroups = (group: Group, actions: Action[], groupByField: string = 'workspace') => {
    const subGroupsMap = new Map<string, Action[]>();
    const subGroupOrder: string[] = [];
    const subGroupColors = new Map<string, string | undefined>();

    // Group by the chosen field, falling back to a sensible default label
    actions.forEach(a => {
        const fieldVal = ((a as unknown as Record<string, string>)[groupByField]) || (groupByField === 'type' ? 'Other' : 'Default');
        if (!subGroupsMap.has(fieldVal)) {
            subGroupsMap.set(fieldVal, []);
            subGroupOrder.push(fieldVal);
        }
        subGroupsMap.get(fieldVal)!.push(a);
        // workspace color is only meaningful for workspace grouping
        if (groupByField === 'workspace' && !subGroupColors.has(fieldVal)) {
            subGroupColors.set(fieldVal, a.workspaceColor);
        }
    });

    return subGroupOrder.map(label => {
        const subActs = subGroupsMap.get(label)!;
        const color = subGroupColors.get(label);
        const subGroupKey = `${group.name}::${label}`;
        const isCollapsed = !state.searchQuery && state.collapsedSubGroups.includes(subGroupKey);

        const isDraggingThis = dragSrcSubgroup?.group === group.name && dragSrcSubgroup?.workspace === label;
        const isDragOverTop = dragOverSubgroup?.group === group.name && dragOverSubgroup?.workspace === label && dragOverSubgroupTop;
        const isDragOverBottom = dragOverSubgroup?.group === group.name && dragOverSubgroup?.workspace === label && !dragOverSubgroupTop;
        
        const isBordered = state.display.secondaryGroupStyle === "border";
        const dragClasses = [
            "lp-subgroup",
            isBordered ? "lp-subgroup--bordered" : "",
            isCollapsed ? "lp-subgroup--collapsed" : "",
            isDraggingThis ? "lp-dragging-group" : "",
            isDragOverTop ? "lp-drag-over-top-group" : "",
            isDragOverBottom ? "lp-drag-over-bottom-group" : "",
        ].filter(Boolean).join(" ");

        // For the border color: prefer the workspace-specific color, then fall back
        // to the parent group's color (group.color). Without this fallback the CSS
        // variable was never set and the border always rendered as the grey widget border.
        const borderColor = color || group.color;
        let badgeStyle = color ? `color:${color};` : '';
        // Use color-mix to apply 60% opacity — works for both hex and CSS var() colors.
        // Appending "99" to a hex string is not safe when the value is a var(--token).
        const wrapperStyle = isBordered && borderColor
            ? `--lp-subgroup-border-color: color-mix(in srgb, ${borderColor} 60%, transparent);`
            : '';
        if (isBordered) {
             badgeStyle += `background-color:transparent; border-color:transparent;`; 
        } else {
             badgeStyle += color ? `background-color:${color}22; border-color:${color}55;` : '';
        }

        return html`
        <div class=${dragClasses} style=${wrapperStyle}
            @dragover=${(e: DragEvent) => handleDragOverSubgroupHeader(e, group, label)}
            @dragleave=${(e: DragEvent) => handleDragLeaveSubgroupHeader(e, group, label)}
            @drop=${(e: DragEvent) => handleDropOnSubgroupHeader(e, group, label)}>
            <div class="lp-subgroup-header"
                @click=${() => toggleSubGroup(group.name, label)}>
                <button class="lp-group-drag-handle" draggable="true"
                    title="Drag to reorder subgroup" aria-label=${`Drag subgroup ${label} to reorder`}
                    @click=${(e:Event) => { e.preventDefault(); e.stopPropagation(); }}
                    @dragstart=${(e: DragEvent) => handleSubgroupDragStart(e, group, label)}
                    @dragend=${handleSubgroupDragEnd}>
                    <span class="codicon codicon-gripper"></span>
                </button>
                <div class="lp-subgroup-badge" style=${badgeStyle}>
                   ${isBordered ? '' : html`<span class="codicon codicon-briefcase lp-subgroup-icon"></span>`}
                   <span class="lp-subgroup-label-text">${label}</span>
                </div>
            </div>
            ${isCollapsed ? null : html`
                <div class="lp-subgroup-items">
                    ${subActs.map(a => renderButton(a, true))}
                </div>
            `}
        </div>
        `;
    });
};

const renderGroup = (group: Group, actions: Action[]) => {
    const isOpen = !!state.searchQuery || !state.collapsedGroups.includes(group.name);
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

    const isDraggingGroup = dragSrcGroup === group;
    const isDragOverGroupTop = dragOverGroup === group && dragOverGroupTop;
    const isDragOverGroupBottom = dragOverGroup === group && !dragOverGroupTop;

    return html`
    <details class="lp-group ${isDraggingGroup ? 'lp-dragging-group' : ''} ${isDragOverGroupTop ? 'lp-drag-over-top-group' : ''} ${isDragOverGroupBottom ? 'lp-drag-over-bottom-group' : ''}" ?open=${isOpen} @toggle=${(e: Event) => {
            // Prevent mutating user preference when search automatically expands the group
            if (state.searchQuery) return;
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
            <button class="lp-group-drag-handle" draggable="true"
                title="Drag to reorder group" aria-label=${`Drag ${group.name} to reorder`}
                @click=${(e: Event) => { e.preventDefault(); e.stopPropagation(); }}
                @dragstart=${(e: DragEvent) => handleGroupDragStart(e, group)}
                @dragend=${handleGroupDragEnd}>
                <span class="codicon codicon-gripper"></span>
            </button>
            <div class="lp-group-header-content">
                ${group.icon ? html`<span class="codicon codicon-${group.icon} lp-group-icon"></span>` : null}
                <span class="lp-group-name">${group.name}</span>
                ${isHiddenGroup ? html`<span class="lp-hidden-badge"><span class="codicon codicon-eye-closed"></span>hidden</span>` : null}
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
                </div>
                <button class="lp-inline-action-btn"
                    title="Edit group"
                    aria-label="Edit group ${group.name}"
                    @click=${(e: Event) => { e.preventDefault(); e.stopPropagation(); editGroup(group); }}>
                    <span class="codicon codicon-edit"></span>
                </button>
            </span>
            ${groupColorPickerOpenFor === groupMenuId ? renderGroupColorPickerPopout(group) : null}
        </summary>
        <div class="lp-group-items" style="${itemsStyles.join(';')}">
            ${(group.secondaryGroupBy === 'workspace' || group.secondaryGroupBy === 'type')
                ? renderSecondaryGroups(group, actions, group.secondaryGroupBy) 
                : actions.map((a) => renderButton(a))}
        </div>
    </details>
    `;
};

const renderSearch = (visibleActions: Action[]) => {
    if (!state.showSearch && !state.searchQuery) return null;

    const hasGroupsAndResults = state.groups.length > 0 && !!state.searchQuery && visibleActions.length > 0;

    return html`
    <div id="searchContainer" class="lp-search-container">
        <div class="lp-search-row">
            <input type="text" class="lp-search-box" 
                placeholder="🔍 Search actions..." 
                .value=${state.searchQuery}
                @input=${(e: Event) => { state.searchQuery = (e.target as HTMLInputElement).value; searchGroupPickerOpen = false; }}
            >
            ${hasGroupsAndResults ? html`
                <div class="lp-search-assign-wrap">
                    <button class="lp-search-assign-btn ${searchGroupPickerOpen ? 'lp-search-assign-btn--open' : ''}"
                        title="Assign all ${visibleActions.length} result(s) to a group"
                        aria-label="Assign all search results to a group"
                        id="searchAssignBtn"
                        @click=${(e: Event) => {
                            e.stopPropagation();
                            searchGroupPickerOpen = !searchGroupPickerOpen;
                            renderView();
                        }}>
                        <span class="codicon codicon-folder-opened"></span>
                    </button>
                    ${searchGroupPickerOpen ? html`
                        <div class="lp-search-assign-picker" @click=${(e: Event) => e.stopPropagation()}>
                            <div class="lp-search-assign-picker-label">Assign ${visibleActions.length} result(s) to:</div>
                            ${state.groups.map(g => html`
                                <button class="lp-search-assign-picker-item"
                                    @click=${() => bulkAssignToGroup(visibleActions, g.name)}>
                                    ${g.icon ? html`<span class="codicon codicon-${g.icon}"></span>` : html`<span class="codicon codicon-folder"></span>`}
                                    ${g.name}
                                </button>
                            `)}
                        </div>
                    ` : null}
                </div>
            ` : null}
        </div>
    </div>
    `;
};

/**
 * Main render function for the entire view.
 * Uses Lit-html to update the DOM efficiently based on reactive state.
 */
function renderView() {
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
    ${renderSearch(visibleActions)}
    ${reorderMode ? html`
    <div class="lp-reorder-banner">
        <span class="lp-reorder-banner-label">
            <span class="codicon codicon-grabber"></span>
            Drag rows to reorder
        </span>
        <button class="lp-reorder-banner-done" @click=${exitReorderMode}>
            <span class="codicon codicon-check"></span>
            Done
        </button>
    </div>` : null}
    <div class="lp-grid">
        ${content}
    </div>
  `, root);

    // After render, check if there are new actions to highlight
    if (state.newActionNames && state.newActionNames.length > 0) {
        const namesToHighlight = [...state.newActionNames];
        // Clear state immediately to avoid re-triggering highlight on next render
        state.newActionNames = [];
        
        requestAnimationFrame(() => {
            let firstScrolled = false;
            for (const name of namesToHighlight) {
                // Find element using exact match on data-action-name 
                // Using CSS.escape or careful selector to handle quotes/spaces
                const escapedName = name.replace(/"/g, '\\"');
                const el = document.querySelector(`[data-action-name="${escapedName}"]`);
                if (el) {
                    if (!firstScrolled) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        firstScrolled = true;
                    }
                    el.classList.add('lp-highlight-new');
                    // Remove class after animation finishes (2s + buffer)
                    setTimeout(() => {
                        el.classList.remove('lp-highlight-new');
                    }, 2200);
                }
            }
        });
    }

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
    if (!target?.closest('.lp-search-assign-wrap') && searchGroupPickerOpen) {
        searchGroupPickerOpen = false;
        renderView();
    }
});

document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
        closeActionMenu();
        if (searchGroupPickerOpen) {
            searchGroupPickerOpen = false;
            renderView();
        }
    }
});

// ── Auto-scroll while dragging near viewport edges ───────────────────────────
let autoScrollRAF: number | null = null;
let autoScrollSpeed = 0;

const stopAutoScroll = () => {
    if (autoScrollRAF !== null) {
        cancelAnimationFrame(autoScrollRAF);
        autoScrollRAF = null;
    }
    autoScrollSpeed = 0;
};

const runAutoScroll = () => {
    if (autoScrollSpeed === 0) { autoScrollRAF = null; return; }
    document.documentElement.scrollTop += autoScrollSpeed;
    autoScrollRAF = requestAnimationFrame(runAutoScroll);
};

document.addEventListener('dragover', (e: DragEvent) => {
    if (!dragSrcAction && !dragSrcGroup) return;
    const ZONE = 80;    // px from viewport edge that activates scroll
    const MAX_PX = 14;  // max scroll pixels per frame at the very edge
    const { clientY } = e;
    const vh = window.innerHeight;
    let speed = 0;
    if (clientY < ZONE) {
        speed = -Math.ceil(MAX_PX * (1 - clientY / ZONE));
    } else if (clientY > vh - ZONE) {
        speed = Math.ceil(MAX_PX * (1 - (vh - clientY) / ZONE));
    }
    autoScrollSpeed = speed;
    if (speed !== 0 && autoScrollRAF === null) {
        autoScrollRAF = requestAnimationFrame(runAutoScroll);
    } else if (speed === 0) {
        stopAutoScroll();
    }
});

document.addEventListener('dragend', stopAutoScroll);
document.addEventListener('drop', stopAutoScroll);
