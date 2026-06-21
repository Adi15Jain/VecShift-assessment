// menu/menuItems.js
// Builds the context-menu item lists. Centralised so the right-click handler and
// a node's "⋯" button produce an identical menu.

import { useStore } from "../store";
import { UI } from "../icons";

// Actions for a specific node.
export const nodeMenuItems = (id) => {
    const s = useStore.getState();
    const node = s.nodes.find((n) => n.id === id);
    const disabled = !!node?.data?.disabled;
    const collapsed = !!node?.data?.collapsed;

    return [
        {
            label: "Rename",
            icon: UI.edit,
            shortcut: "F2",
            onClick: () => s.requestRename(id),
        },
        {
            label: collapsed ? "Expand" : "Collapse",
            icon: collapsed ? UI.expand : UI.collapse,
            onClick: () => s.toggleNodeCollapsed(id),
        },
        {
            label: "Duplicate",
            icon: UI.copy,
            shortcut: "⌘D",
            onClick: () => s.duplicateNode(id),
        },
        {
            label: disabled ? "Enable" : "Disable",
            icon: disabled ? UI.play : UI.power,
            onClick: () => s.toggleNodeDisabled(id),
        },
        { divider: true },
        {
            label: "Delete",
            icon: UI.trash,
            shortcut: "⌫",
            danger: true,
            onClick: () => s.deleteNode(id),
        },
    ];
};

// Actions for the empty canvas. `ctx` provides view helpers from ui.js.
export const paneMenuItems = ({ onTidyUp, onFitView }) => {
    const s = useStore.getState();
    return [
        {
            label: "Tidy up workflow",
            icon: UI.layout,
            shortcut: "⇧T",
            onClick: onTidyUp,
        },
        { label: "Fit to view", icon: UI.maximize, onClick: onFitView },
        { divider: true },
        {
            label: "Select all",
            icon: UI.grid,
            shortcut: "⌘A",
            onClick: () => s.selectAllNodes(),
        },
        {
            label: "Clear selection",
            icon: UI.close,
            onClick: () => s.clearSelection(),
        },
    ];
};
