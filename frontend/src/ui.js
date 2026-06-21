// ui.js
// Displays the drag-and-drop UI
// --------------------------------------------------

import { useState, useRef, useCallback, useEffect } from "react";
import ReactFlow, {
    Controls,
    ControlButton,
    Background,
    MiniMap,
} from "reactflow";
import { useStore } from "./store";
import { useThemeStore } from "./theme/themeStore";
import { useMenuStore } from "./menu/menuStore";
import { nodeMenuItems, paneMenuItems } from "./menu/menuItems";
import { shallow } from "zustand/shallow";
import { nodeTypes } from "./nodes/registry";
import { DeletableEdge } from "./components/DeletableEdge";
import { UI } from "./icons";

import "reactflow/dist/style.css";

const gridSize = 20;
const proOptions = { hideAttribution: true };
const edgeTypes = { deletable: DeletableEdge };

const selector = (state) => ({
    nodes: state.nodes,
    edges: state.edges,
    getNodeID: state.getNodeID,
    addNode: state.addNode,
    onNodesChange: state.onNodesChange,
    onEdgesChange: state.onEdgesChange,
    onConnect: state.onConnect,
    onReconnect: state.onReconnect,
    deleteEdge: state.deleteEdge,
    takeSnapshot: state.takeSnapshot,
});

export const PipelineUI = () => {
    const reactFlowWrapper = useRef(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const isDark = useThemeStore((s) => s.theme === "dark");

    // The minimap only appears while the cursor is moving over the canvas, then
    // fades out after a short idle period — keeps the canvas clean (n8n-style).
    const [mapVisible, setMapVisible] = useState(false);
    const hideTimer = useRef(null);
    const pingMinimap = useCallback(() => {
        setMapVisible(true);
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setMapVisible(false), 1400);
    }, []);
    useEffect(() => () => clearTimeout(hideTimer.current), []);
    const {
        nodes,
        edges,
        getNodeID,
        addNode,
        onNodesChange,
        onEdgesChange,
        onConnect,
        onReconnect,
        deleteEdge,
        takeSnapshot,
    } = useStore(selector, shallow);

    // Tracks whether an edge reconnect landed on a valid handle. If the user
    // drops the dragged endpoint on empty space, we delete the edge instead —
    // this is how you "disconnect" a handle.
    const reconnectDone = useRef(true);

    const onReconnectStart = useCallback(() => {
        reconnectDone.current = false;
    }, []);

    const handleReconnect = useCallback(
        (oldEdge, newConnection) => {
            reconnectDone.current = true;
            onReconnect(oldEdge, newConnection);
        },
        [onReconnect],
    );

    const onReconnectEnd = useCallback(
        (_event, edge) => {
            if (!reconnectDone.current) deleteEdge(edge.id);
            reconnectDone.current = true;
        },
        [deleteEdge],
    );

    // Block self-connections (a node wiring into itself) at the UI level so the
    // connection line won't even snap.
    const isValidConnection = useCallback(
        (connection) => connection.source !== connection.target,
        [],
    );

    const openMenu = useMenuStore((s) => s.openMenu);

    const tidyUp = useCallback(() => {
        useStore.getState().tidyUp();
        // Re-fit after layout so the tidied graph is fully in view.
        setTimeout(() => reactFlowInstance?.fitView({ duration: 400 }), 50);
    }, [reactFlowInstance]);

    const onNodeContextMenu = useCallback(
        (event, node) => {
            event.preventDefault();
            openMenu({
                x: event.clientX,
                y: event.clientY,
                items: nodeMenuItems(node.id),
            });
        },
        [openMenu],
    );

    const onPaneContextMenu = useCallback(
        (event) => {
            event.preventDefault();
            openMenu({
                x: event.clientX,
                y: event.clientY,
                items: paneMenuItems({
                    onTidyUp: tidyUp,
                    onFitView: () =>
                        reactFlowInstance?.fitView({ duration: 400 }),
                }),
            });
        },
        [openMenu, tidyUp, reactFlowInstance],
    );

    const getInitNodeData = (nodeID, type) => {
        let nodeData = { id: nodeID, nodeType: `${type}` };
        return nodeData;
    };

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const reactFlowBounds =
                reactFlowWrapper.current.getBoundingClientRect();
            if (event?.dataTransfer?.getData("application/reactflow")) {
                const appData = JSON.parse(
                    event.dataTransfer.getData("application/reactflow"),
                );
                const type = appData?.nodeType;

                // check if the dropped element is valid
                if (typeof type === "undefined" || !type) {
                    return;
                }

                const position = reactFlowInstance.project({
                    x: event.clientX - reactFlowBounds.left,
                    y: event.clientY - reactFlowBounds.top,
                });

                const nodeID = getNodeID(type);
                const newNode = {
                    id: nodeID,
                    type,
                    position,
                    data: getInitNodeData(nodeID, type),
                };

                addNode(newNode);
            }
        },
        [reactFlowInstance, getNodeID, addNode],
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    return (
        <div
            ref={reactFlowWrapper}
            className="vs-canvas"
            onMouseMove={pingMinimap}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeDragStart={takeSnapshot}
                onEdgeUpdate={handleReconnect}
                onEdgeUpdateStart={onReconnectStart}
                onEdgeUpdateEnd={onReconnectEnd}
                isValidConnection={isValidConnection}
                onNodeContextMenu={onNodeContextMenu}
                onPaneContextMenu={onPaneContextMenu}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onInit={setReactFlowInstance}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                proOptions={proOptions}
                snapGrid={[gridSize, gridSize]}
                connectionLineType="smoothstep"
                defaultEdgeOptions={{ type: "deletable" }}
                deleteKeyCode={["Backspace", "Delete"]}
                fitView
            >
                <Background
                    color={isDark ? "#2a3346" : "#c7ccd9"}
                    gap={gridSize}
                    size={1.4}
                />
                <Controls>
                    <ControlButton onClick={tidyUp} title="Tidy up workflow">
                        <UI.layout className="vs-control-icon" />
                    </ControlButton>
                </Controls>
                <MiniMap
                    zoomable
                    pannable
                    className={mapVisible ? "" : "vs-minimap--hidden"}
                    style={{ backgroundColor: isDark ? "#0f1626" : "#ffffff" }}
                    nodeColor={isDark ? "#3b4664" : "#c7d2fe"}
                    nodeStrokeColor={isDark ? "#55617f" : "#a5b4fc"}
                    maskColor={
                        isDark
                            ? "rgba(0,0,0,0.55)"
                            : "rgba(15,23,42,0.06)"
                    }
                />
            </ReactFlow>
        </div>
    );
};
