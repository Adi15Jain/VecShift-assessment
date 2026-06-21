// nodes/createNode.js
// The factory at the heart of the node abstraction.
//
// Pass a declarative config and get back a fully-working ReactFlow node:
//   - field state is initialised from `data` and synced to the global store
//   - handles can be static OR a function of the current field values
//     (this is what powers dynamic handles: Input's typed output, the LLM's
//      ports, and the Text node's {{variable}} inputs)
//
// Creating a brand-new node is now just an object literal — see the catalog in
// ./definitions.js. No boilerplate, no copy-paste.

import { useState, useCallback } from "react";
import { useStore } from "../store";
import { BaseNode } from "./BaseNode";
import { FIELD_COMPONENTS } from "./nodeFields";

const initialValue = (field, id, data) => {
    if (data?.[field.key] !== undefined) return data[field.key];
    if (typeof field.default === "function") return field.default(id);
    return field.default ?? "";
};

export const createNode = (config) => {
    const NodeComponent = ({ id, data }) => {
        const updateNodeField = useStore((s) => s.updateNodeField);
        const fields = config.fields || [];

        const [values, setValues] = useState(() => {
            const init = {};
            fields.forEach((f) => {
                init[f.key] = initialValue(f, id, data);
            });
            return init;
        });

        const setField = useCallback(
            (key, value) => {
                setValues((prev) => ({ ...prev, [key]: value }));
                updateNodeField(id, key, value);
            },
            [id, updateNodeField],
        );

        // Resolve handles: a function gets the live field values so handles can
        // react to user input (typed ports, parsed variables, etc.).
        const handles =
            typeof config.handles === "function"
                ? config.handles(values, { id, data })
                : config.handles || [];

        return (
            <BaseNode
                id={id}
                title={(data && data.label) || config.title}
                subtitle={config.subtitle}
                icon={config.icon}
                accent={config.accent}
                handles={handles}
                minWidth={config.minWidth}
                disabled={!!(data && data.disabled)}
                collapsed={!!(data && data.collapsed)}
            >
                {config.description && (
                    <p className="vs-node__desc">{config.description}</p>
                )}

                {fields.map((f) => {
                    const Field = FIELD_COMPONENTS[f.type];
                    if (!Field) return null;
                    return (
                        <Field
                            key={f.key}
                            label={f.label}
                            placeholder={f.placeholder}
                            options={f.options}
                            value={values[f.key]}
                            onChange={(v) => setField(f.key, v)}
                        />
                    );
                })}

                {/* Escape hatch for fully custom content (e.g. the Text node). */}
                {config.render &&
                    config.render({ id, data, values, setField })}
            </BaseNode>
        );
    };

    NodeComponent.displayName = config.title || "Node";
    return NodeComponent;
};
