// nodes/BaseNode.js
// The single shared shell every node renders into. It owns:
//   - the card chrome (header with icon + title, body, hover state)
//   - typed, colour-coded handles that auto-distribute along an edge
// A new node never re-implements any of this; it just declares its handles
// and content. This is the abstraction the assessment asks for.

import { useEffect, useMemo, useState } from "react";
import { Handle, Position, useUpdateNodeInternals } from "reactflow";
import { handleColor } from "../theme/theme";
import { useStore } from "../store";
import { useMenuStore } from "../menu/menuStore";
import { nodeMenuItems } from "../menu/menuItems";
import { toast } from "../toast/toastStore";
import { UI } from "../icons";

const SIDE = {
    left: Position.Left,
    right: Position.Right,
    top: Position.Top,
    bottom: Position.Bottom,
};

// Place N handles along one side. A single handle centres; multiple handles
// spread across a band that sits BELOW the header (40%–82%) so the dots line up
// beside the body content rather than colliding with the title row.
const distribute = (index, count) => {
    if (count <= 1) return "50%";
    const TOP = 40;
    const BOTTOM = 82;
    const t = index / (count - 1);
    return `${TOP + t * (BOTTOM - TOP)}%`;
};

export const BaseNode = ({
    id,
    title,
    subtitle,
    icon,
    accent = "#6366f1",
    handles = [],
    children,
    minWidth = 240,
    disabled = false,
    collapsed = false,
    style = {},
}) => {
    const Icon = icon;
    const deleteNode = useStore((s) => s.deleteNode);
    const duplicateNode = useStore((s) => s.duplicateNode);
    const updateNodeField = useStore((s) => s.updateNodeField);
    const renameNodeId = useStore((s) => s.renameNodeId);
    const clearRename = useStore((s) => s.clearRename);
    const toggleNodeCollapsed = useStore((s) => s.toggleNodeCollapsed);
    const toggleNodeDisabled = useStore((s) => s.toggleNodeDisabled);
    const openMenu = useMenuStore((s) => s.openMenu);

    // Simulated single-node execution (there's no real execution backend; this is
    // the UX of n8n's "execute step"). Briefly pulses the node, then toasts.
    const [running, setRunning] = useState(false);
    const runNode = (e) => {
        e.stopPropagation();
        if (running) return;
        if (disabled) {
            toast.warning(
                "Node is off",
                "Turn it on with the power button to run it.",
            );
            return;
        }
        setRunning(true);
        toast.info(`Running "${title}"`, "Executing this node…", {
            duration: 1100,
        });
        setTimeout(() => {
            setRunning(false);
            toast.success(`"${title}" executed`, "Node ran successfully.");
        }, 1000);
    };

    // Inline rename: triggered by double-click or the context menu (which sets
    // renameNodeId in the store).
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState("");
    useEffect(() => {
        if (renameNodeId === id) {
            setDraft(title);
            setEditing(true);
            clearRename();
        }
    }, [renameNodeId, id, title, clearRename]);
    const commitRename = () => {
        updateNodeField(id, "label", draft.trim());
        setEditing(false);
    };

    // When the set of handles changes (e.g. a {{variable}} is added/removed, or
    // a typed handle's identity shifts), ReactFlow needs to re-measure the node
    // so existing edges stay anchored to the right spots.
    const updateNodeInternals = useUpdateNodeInternals();
    const handleSignature = handles
        .map((h) => `${h.id}:${h.type}:${h.side || ""}:${h.dataType || ""}`)
        .join("|");
    // `collapsed` is included because switching to/from the compact tile changes
    // the node's size, so ReactFlow must re-measure to keep edges anchored.
    useEffect(() => {
        updateNodeInternals(id);
    }, [id, handleSignature, collapsed, updateNodeInternals]);

    // The title is the same in both layouts; only the wrapping element differs.
    const titleEl = editing ? (
        <input
            className="vs-node__title-edit nodrag"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    commitRename();
                } else if (e.key === "Escape") {
                    setEditing(false);
                }
            }}
        />
    ) : null;

    // Group handles by side so we can space each side independently.
    const positioned = useMemo(() => {
        const bySide = {};
        handles.forEach((h) => {
            const side = h.side || (h.type === "target" ? "left" : "right");
            (bySide[side] = bySide[side] || []).push(h);
        });
        return handles.map((h) => {
            const side = h.side || (h.type === "target" ? "left" : "right");
            const group = bySide[side];
            const idx = group.indexOf(h);
            const vertical = side === "left" || side === "right";
            return {
                ...h,
                position: SIDE[side],
                offset: vertical ? distribute(idx, group.length) : undefined,
                offsetX: !vertical ? distribute(idx, group.length) : undefined,
            };
        });
    }, [handles]);

    return (
        // Outer wrapper: overflow-visible so the gutter port labels show.
        // Inner card: overflow-hidden so the accent stripe is clipped to the
        // rounded corners (otherwise a 3px bar pokes out past a 14px radius).
        <div className="vs-node">
            {/* n8n-style hover toolbar: quick actions without the keyboard. */}
            <div className="vs-node__toolbar nodrag nopan">
                <button
                    className={disabled ? "vs-node__toolbar-muted" : ""}
                    title={disabled ? "Node is off" : "Execute this node"}
                    onClick={runNode}
                    disabled={running}
                >
                    <UI.play size={14} />
                </button>
                <button
                    className={disabled ? "vs-node__toolbar-active" : ""}
                    title={disabled ? "Turn node on" : "Turn node off"}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleNodeDisabled(id);
                    }}
                >
                    <UI.power size={14} />
                </button>
                <span className="vs-node__toolbar-sep" />
                <button
                    title="Duplicate"
                    onClick={(e) => {
                        e.stopPropagation();
                        duplicateNode(id);
                    }}
                >
                    <UI.copy size={14} />
                </button>
                <button
                    title="More"
                    onClick={(e) => {
                        e.stopPropagation();
                        openMenu({
                            x: e.clientX,
                            y: e.clientY,
                            items: nodeMenuItems(id),
                        });
                    }}
                >
                    <UI.more size={14} />
                </button>
                <button
                    className="vs-node__toolbar-danger"
                    title="Delete"
                    onClick={(e) => {
                        e.stopPropagation();
                        deleteNode(id);
                    }}
                >
                    <UI.trash size={14} />
                </button>
            </div>

            {positioned.map((h) => {
                const color = handleColor(h.dataType);
                const isVertical =
                    h.position === Position.Left ||
                    h.position === Position.Right;
                return (
                    <Handle
                        key={h.id}
                        type={h.type}
                        position={h.position}
                        id={`${id}-${h.id}`}
                        className="vs-handle"
                        style={{
                            background: color,
                            boxShadow: `0 0 0 3px ${color}22`,
                            ...(isVertical
                                ? { top: h.offset }
                                : { left: h.offsetX }),
                        }}
                    >
                        {h.label && (
                            <span
                                className={`vs-handle__label vs-handle__label--${
                                    h.type === "target" ? "in" : "out"
                                }`}
                            >
                                {h.label}
                            </span>
                        )}
                    </Handle>
                );
            })}

            {collapsed ? (
                // ----- Compact tile (n8n-style): icon square + caption below -----
                <>
                    <div
                        className={`vs-node__card vs-node__tile ${
                            disabled ? "vs-node__card--disabled" : ""
                        } ${running ? "vs-node__card--running" : ""}`}
                        onDoubleClick={() => toggleNodeCollapsed(id)}
                        title="Double-click to expand"
                    >
                        <span
                            className="vs-node__tile-icon"
                            style={{ color: accent }}
                        >
                            {Icon ? <Icon size={26} /> : null}
                        </span>
                    </div>
                    <div className="vs-node__caption">
                        {editing ? (
                            titleEl
                        ) : (
                            <span
                                className="vs-node__caption-title"
                                title="Double-click to rename"
                                onDoubleClick={() => {
                                    setDraft(title);
                                    setEditing(true);
                                }}
                            >
                                {title}
                            </span>
                        )}
                        {subtitle && (
                            <span className="vs-node__caption-sub">
                                {subtitle}
                            </span>
                        )}
                    </div>
                </>
            ) : (
                // ----- Full card with editable fields -----
                <div
                    className={`vs-node__card ${
                        disabled ? "vs-node__card--disabled" : ""
                    } ${running ? "vs-node__card--running" : ""}`}
                    style={{ minWidth, ...style }}
                >
                    <div
                        className="vs-node__accent"
                        style={{ background: accent }}
                    />

                    <header className="vs-node__header">
                        <span
                            className="vs-node__icon"
                            style={{
                                color: accent,
                                background: `${accent}14`,
                                borderColor: `${accent}33`,
                            }}
                        >
                            {Icon ? <Icon size={15} /> : null}
                        </span>
                        <div className="vs-node__titles">
                            {editing ? (
                                titleEl
                            ) : (
                                <span
                                    className="vs-node__title"
                                    title="Double-click to rename"
                                    onDoubleClick={() => {
                                        setDraft(title);
                                        setEditing(true);
                                    }}
                                >
                                    {title}
                                </span>
                            )}
                            {subtitle && (
                                <span className="vs-node__subtitle">
                                    {subtitle}
                                </span>
                            )}
                        </div>
                        <button
                            className="vs-node__collapse nodrag"
                            title="Collapse"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleNodeCollapsed(id);
                            }}
                        >
                            <UI.collapse size={13} />
                        </button>
                    </header>

                    {children != null && (
                        <div className="vs-node__body">{children}</div>
                    )}
                </div>
            )}
        </div>
    );
};
