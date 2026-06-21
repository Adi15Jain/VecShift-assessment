// nodes/registry.js
// Turns the data-only catalog into:
//   - `nodeTypes`  : the map ReactFlow needs to render nodes on the canvas
//   - `nodeGroups` : palette metadata for the sidebar, grouped by category
// Register a node once in definitions.js and it shows up in both places.

import { createNode } from "./createNode";
import { NODE_DEFINITIONS } from "./definitions";
import { getNodeIcon } from "../icons";

// Resolve each definition's icon key to a real component once, up front.
const resolved = NODE_DEFINITIONS.map((def) => ({
    ...def,
    icon: getNodeIcon(def.iconKey),
}));

export const nodeTypes = resolved.reduce((acc, def) => {
    acc[def.type] = createNode(def);
    return acc;
}, {});

// Lightweight metadata for the sidebar (no component, no fields).
export const nodeCatalog = resolved.map((def) => ({
    type: def.type,
    label: def.label,
    group: def.group,
    icon: def.icon,
    accent: def.accent,
    subtitle: def.subtitle,
}));

// Preserve first-seen group order for a stable sidebar.
export const GROUP_ORDER = [
    ...new Set(nodeCatalog.map((n) => n.group)),
];

export const nodeGroups = GROUP_ORDER.map((group) => ({
    group,
    nodes: nodeCatalog.filter((n) => n.group === group),
}));
