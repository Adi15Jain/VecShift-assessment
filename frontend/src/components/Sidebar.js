// components/Sidebar.js
// The left node menu, VectorShift-style: a search box over a categorised,
// collapsible palette. Everything is driven by the node registry, so new nodes
// appear here automatically.

import { useMemo, useState } from "react";
import { DraggableNode } from "../draggableNode";
import { nodeGroups } from "../nodes/registry";
import { UI } from "../icons";

export const Sidebar = () => {
    const [query, setQuery] = useState("");
    const [collapsed, setCollapsed] = useState({});

    const q = query.trim().toLowerCase();

    const groups = useMemo(() => {
        if (!q) return nodeGroups;
        return nodeGroups
            .map((g) => ({
                ...g,
                nodes: g.nodes.filter(
                    (n) =>
                        n.label.toLowerCase().includes(q) ||
                        (n.subtitle || "").toLowerCase().includes(q) ||
                        g.group.toLowerCase().includes(q),
                ),
            }))
            .filter((g) => g.nodes.length > 0);
    }, [q]);

    const total = nodeGroups.reduce((n, g) => n + g.nodes.length, 0);

    const toggle = (group) =>
        setCollapsed((c) => ({ ...c, [group]: !c[group] }));

    return (
        <aside className="vs-sidebar" data-tour="sidebar">
            <div className="vs-sidebar__head">
                <h2 className="vs-sidebar__title">Nodes</h2>
                <span className="vs-sidebar__count">{total} blocks</span>
            </div>

            <div className="vs-sidebar__search">
                <UI.search size={15} />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search nodes & integrations…"
                />
                {query && (
                    <button onClick={() => setQuery("")} aria-label="Clear">
                        <UI.close size={14} />
                    </button>
                )}
            </div>

            <div className="vs-sidebar__scroll">
                {groups.length === 0 && (
                    <p className="vs-sidebar__empty">No nodes match “{query}”.</p>
                )}

                {groups.map(({ group, nodes }) => {
                    const isCollapsed = collapsed[group] && !q;
                    return (
                        <section key={group} className="vs-palette-group">
                            <button
                                className="vs-palette-group__head"
                                onClick={() => toggle(group)}
                            >
                                {isCollapsed ? (
                                    <UI.chevronRight size={14} />
                                ) : (
                                    <UI.chevronDown size={14} />
                                )}
                                <span>{group}</span>
                                <span className="vs-palette-group__count">
                                    {nodes.length}
                                </span>
                            </button>
                            {!isCollapsed && (
                                <div className="vs-palette-group__items">
                                    {nodes.map((node) => (
                                        <DraggableNode
                                            key={node.type}
                                            type={node.type}
                                            label={node.label}
                                            subtitle={node.subtitle}
                                            icon={node.icon}
                                            accent={node.accent}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    );
                })}
            </div>

            <div className="vs-sidebar__hint">
                <UI.info size={14} />
                Drag any block onto the canvas
            </div>
        </aside>
    );
};
