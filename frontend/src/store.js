// store.js
// The single source of truth for the pipeline: nodes, edges, the id counters,
// which screen is showing, the workflow name, and an undo/redo history stack.

import { create } from "zustand";
import {
    addEdge,
    updateEdge,
    applyNodeChanges,
    applyEdgeChanges,
    MarkerType,
} from "reactflow";
import { toast } from "./toast/toastStore";

const HISTORY_LIMIT = 100;

// A shallow snapshot of just the graph (what undo/redo restores).
const snapshot = (state) => ({
    nodes: state.nodes,
    edges: state.edges,
});

export const useStore = create((set, get) => ({
    nodes: [],
    edges: [],
    nodeIDs: {},

    // Workflow metadata shown in the title bar.
    pipelineName: "Untitled Pipeline",
    setPipelineName: (pipelineName) => set({ pipelineName }),

    // Undo/redo history (stacks of {nodes, edges} snapshots).
    past: [],
    future: [],
    _snapScheduled: false,

    // Capture the current graph before a mutating action so it can be undone.
    // Clears the redo stack because a new action invalidates redone futures.
    //
    // Coalesces snapshots taken within the same event tick: deleting a node
    // makes ReactFlow fire a node-remove AND an edge-remove change back-to-back;
    // without this guard that would be two history entries (and a broken
    // intermediate state on undo). The flag resets on the next microtask, so
    // genuinely separate user actions still snapshot independently.
    takeSnapshot: () => {
        if (get()._snapScheduled) return;
        const { past } = get();
        set({
            past: [...past, snapshot(get())].slice(-HISTORY_LIMIT),
            future: [],
            _snapScheduled: true,
        });
        Promise.resolve().then(() => set({ _snapScheduled: false }));
    },
    undo: () => {
        const { past, future } = get();
        if (past.length === 0) return;
        const previous = past[past.length - 1];
        set({
            ...previous,
            past: past.slice(0, -1),
            future: [snapshot(get()), ...future],
        });
    },
    redo: () => {
        const { past, future } = get();
        if (future.length === 0) return;
        const next = future[0];
        set({
            ...next,
            past: [...past, snapshot(get())],
            future: future.slice(1),
        });
    },

    // ----- screen / lifecycle -----
    view: "gallery",
    openGallery: () => set({ view: "gallery" }),

    startBlank: () =>
        set({
            nodes: [],
            edges: [],
            nodeIDs: {},
            past: [],
            future: [],
            pipelineName: "Untitled Pipeline",
            view: "builder",
        }),

    // Load a prebuilt template. Seeds id counters from the template's node ids so
    // newly dragged nodes don't collide, and resets the undo history.
    loadPipeline: (nodes, edges, pipelineName = "Untitled Pipeline") => {
        const nodeIDs = {};
        nodes.forEach((n) => {
            const num = parseInt(String(n.id).split("-").pop(), 10);
            if (!Number.isNaN(num)) {
                nodeIDs[n.type] = Math.max(nodeIDs[n.type] || 0, num);
            }
        });
        set({
            nodes,
            edges,
            nodeIDs,
            past: [],
            future: [],
            pipelineName,
            view: "builder",
        });
    },

    // ----- nodes -----
    getNodeID: (type) => {
        const newIDs = { ...get().nodeIDs };
        if (newIDs[type] === undefined) newIDs[type] = 0;
        newIDs[type] += 1;
        set({ nodeIDs: newIDs });
        return `${type}-${newIDs[type]}`;
    },
    addNode: (node) => {
        get().takeSnapshot();
        set({ nodes: [...get().nodes, node] });
    },
    // Remove a node and any edges attached to it (from the hover toolbar).
    deleteNode: (id) => {
        get().takeSnapshot();
        set({
            nodes: get().nodes.filter((n) => n.id !== id),
            edges: get().edges.filter(
                (e) => e.source !== id && e.target !== id,
            ),
        });
        toast.info("Node deleted", "Press Ctrl/Cmd+Z to undo.");
    },
    // Clone a node next to itself with a fresh id (hover toolbar).
    duplicateNode: (id) => {
        const node = get().nodes.find((n) => n.id === id);
        if (!node) return;
        get().takeSnapshot();
        const newId = get().getNodeID(node.type);
        const clone = {
            ...node,
            id: newId,
            position: {
                x: node.position.x + 40,
                y: node.position.y + 40,
            },
            data: { ...node.data, id: newId },
            selected: false,
        };
        set({ nodes: [...get().nodes, clone] });
        toast.success("Node duplicated", "A copy was placed on the canvas.");
    },
    // Collapse a node to a compact icon tile (n8n-style) or expand it back.
    toggleNodeCollapsed: (id) => {
        set({
            nodes: get().nodes.map((n) =>
                n.id === id
                    ? {
                          ...n,
                          data: { ...n.data, collapsed: !n.data?.collapsed },
                      }
                    : n,
            ),
        });
    },
    // Collapse/expand every node at once (the top-bar "Compact" toggle).
    setAllCollapsed: (collapsed) => {
        set({
            nodes: get().nodes.map((n) => ({
                ...n,
                data: { ...n.data, collapsed },
            })),
        });
        toast.info(
            collapsed ? "Compact view" : "Expanded view",
            collapsed
                ? "All nodes collapsed to tiles."
                : "All nodes expanded.",
        );
    },

    // Toggle a node's enabled/disabled state (dimmed, excluded conceptually).
    toggleNodeDisabled: (id) => {
        const node = get().nodes.find((n) => n.id === id);
        const willDisable = !node?.data?.disabled;
        get().takeSnapshot();
        set({
            nodes: get().nodes.map((n) =>
                n.id === id
                    ? { ...n, data: { ...n.data, disabled: !n.data?.disabled } }
                    : n,
            ),
        });
        if (willDisable) {
            toast.warning(
                "Node turned off",
                "It will be skipped when you run the pipeline.",
            );
        } else {
            toast.success("Node turned on", "It's back in the pipeline.");
        }
    },

    // ----- rename (custom node labels) -----
    // A node id flagged to enter inline-edit mode (set from the context menu);
    // BaseNode watches this and focuses its title input.
    renameNodeId: null,
    requestRename: (id) => set({ renameNodeId: id }),
    clearRename: () => set({ renameNodeId: null }),

    // ----- selection helpers -----
    selectAllNodes: () =>
        set({ nodes: get().nodes.map((n) => ({ ...n, selected: true })) }),
    clearSelection: () =>
        set({
            nodes: get().nodes.map((n) => ({ ...n, selected: false })),
            edges: get().edges.map((e) => ({ ...e, selected: false })),
        }),

    // ----- tidy up (auto-layout) -----
    // Arrange nodes left-to-right in topological layers (longest-path), so a
    // tangled graph snaps into a readable flow. One click; great for keeping a
    // workflow maintainable.
    tidyUp: () => {
        const { nodes, edges } = get();
        if (nodes.length === 0) return;
        get().takeSnapshot();

        const indegree = {};
        const adjacency = {};
        nodes.forEach((n) => {
            indegree[n.id] = 0;
            adjacency[n.id] = [];
        });
        edges.forEach((e) => {
            if (adjacency[e.source] && indegree[e.target] !== undefined) {
                adjacency[e.source].push(e.target);
                indegree[e.target] += 1;
            }
        });

        // Longest-path layering via a Kahn-style sweep.
        const layer = {};
        const remaining = { ...indegree };
        const queue = nodes
            .filter((n) => indegree[n.id] === 0)
            .map((n) => n.id);
        queue.forEach((id) => (layer[id] = 0));

        while (queue.length) {
            const u = queue.shift();
            adjacency[u].forEach((v) => {
                layer[v] = Math.max(layer[v] || 0, (layer[u] || 0) + 1);
                remaining[v] -= 1;
                if (remaining[v] === 0) queue.push(v);
            });
        }
        // Nodes stuck in a cycle never got a layer; park them at layer 0.
        nodes.forEach((n) => {
            if (layer[n.id] === undefined) layer[n.id] = 0;
        });

        const byLayer = {};
        nodes.forEach((n) => {
            const l = layer[n.id];
            byLayer[l] = byLayer[l] || [];
            byLayer[l].push(n.id);
        });

        const COL_GAP = 360;
        const ROW_GAP = 200;
        const X0 = 80;
        const Y0 = 80;
        const pos = {};
        Object.keys(byLayer)
            .map(Number)
            .sort((a, b) => a - b)
            .forEach((l) => {
                byLayer[l].forEach((id, i) => {
                    pos[id] = { x: X0 + l * COL_GAP, y: Y0 + i * ROW_GAP };
                });
            });

        set({
            nodes: nodes.map((n) => ({
                ...n,
                position: pos[n.id] || n.position,
            })),
        });
        toast.success("Workflow tidied up", "Nodes arranged into clean columns.");
    },
    onNodesChange: (changes) => {
        // Snapshot before a destructive change (delete) so it can be undone.
        if (changes.some((c) => c.type === "remove")) get().takeSnapshot();
        set({ nodes: applyNodeChanges(changes, get().nodes) });
    },

    // ----- edges -----
    onEdgesChange: (changes) => {
        if (changes.some((c) => c.type === "remove")) get().takeSnapshot();
        set({ edges: applyEdgeChanges(changes, get().edges) });
    },
    onConnect: (connection) => {
        // Disallow self-connections and duplicate edges between the same ports.
        if (connection.source === connection.target) return;
        const exists = get().edges.some(
            (e) =>
                e.source === connection.source &&
                e.target === connection.target &&
                e.sourceHandle === connection.sourceHandle &&
                e.targetHandle === connection.targetHandle,
        );
        if (exists) return;

        get().takeSnapshot();
        set({
            edges: addEdge(
                {
                    ...connection,
                    type: "deletable",
                    animated: true,
                    markerEnd: {
                        type: MarkerType.Arrow,
                        height: "20px",
                        width: "20px",
                    },
                },
                get().edges,
            ),
        });
    },
    // Dragging an edge endpoint onto a new handle reconnects it.
    onReconnect: (oldEdge, newConnection) => {
        get().takeSnapshot();
        set({ edges: updateEdge(oldEdge, newConnection, get().edges) });
    },
    // Dropping an edge endpoint on empty space deletes (disconnects) it.
    deleteEdge: (edgeId) => {
        get().takeSnapshot();
        set({ edges: get().edges.filter((e) => e.id !== edgeId) });
        toast.info("Connection removed");
    },

    // ----- per-node field edits -----
    updateNodeField: (nodeId, fieldName, fieldValue) => {
        set({
            nodes: get().nodes.map((node) =>
                node.id === nodeId
                    ? {
                          ...node,
                          data: { ...node.data, [fieldName]: fieldValue },
                      }
                    : node,
            ),
        });
    },
}));
