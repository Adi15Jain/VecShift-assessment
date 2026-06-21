// components/DeletableEdge.js
// A smoothstep edge that reveals a delete (×) button at its midpoint on hover
// or selection — so a connection can be removed straight from the canvas,
// without selecting it and pressing Delete.

import { useState } from "react";
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from "reactflow";
import { useStore } from "../store";
import { UI } from "../icons";

export const DeletableEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    style,
    selected,
}) => {
    const deleteEdge = useStore((s) => s.deleteEdge);
    const [hovered, setHovered] = useState(false);

    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const show = hovered || selected;

    return (
        <>
            <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />

            {/* A fat, invisible path makes the edge easy to hover. */}
            <path
                d={edgePath}
                fill="none"
                strokeWidth={18}
                stroke="transparent"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            />

            <EdgeLabelRenderer>
                <button
                    className={`vs-edge-delete nodrag nopan ${
                        show ? "vs-edge-delete--show" : ""
                    }`}
                    style={{
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                    }}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    onClick={(e) => {
                        e.stopPropagation();
                        deleteEdge(id);
                    }}
                    title="Delete connection"
                >
                    <UI.close size={12} />
                </button>
            </EdgeLabelRenderer>
        </>
    );
};
