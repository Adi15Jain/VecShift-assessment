// nodes/textNode.js
// The Text node's custom behaviour (Part 3), exposed as composable pieces the
// node definition wires together: variable extraction, dynamic handles, and an
// auto-resizing textarea body.

import { useLayoutEffect, useRef } from "react";

// Matches {{ name }} where `name` is a valid JS identifier. Whitespace inside
// the braces is tolerated; duplicates are collapsed by the caller.
const VARIABLE_RE = /\{\{\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\}\}/g;

export const extractVariables = (text = "") => {
    const seen = [];
    let match;
    while ((match = VARIABLE_RE.exec(text)) !== null) {
        if (!seen.includes(match[1])) seen.push(match[1]);
    }
    return seen;
};

// One typed input handle per unique {{variable}}, plus the single text output.
export const textHandles = (values) => {
    const inputs = extractVariables(values.text).map((name) => ({
        id: `var-${name}`,
        type: "target",
        label: name,
        dataType: "Text",
    }));
    return [...inputs, { id: "output", type: "source", dataType: "Text" }];
};

// Rough width estimate so the card hugs the longest line.
const measure = (text) => {
    const longest = text
        .split("\n")
        .reduce((m, l) => Math.max(m, l.length), 0);
    return Math.min(Math.max(longest * 7.7 + 56, 240), 480);
};

const AutoResizeTextArea = ({ value, onChange }) => {
    const ref = useRef(null);

    // Re-fit height to content on every change.
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    }, [value]);

    return (
        <label className="vs-field">
            <span className="vs-field__label">Text</span>
            <textarea
                ref={ref}
                className="vs-input vs-textarea"
                value={value}
                rows={1}
                placeholder="Write text, use {{ variables }} to add inputs…"
                style={{ width: measure(value) }}
                onChange={(e) => onChange(e.target.value)}
            />
        </label>
    );
};

// Used as the Text node definition's custom `render`.
export const renderTextBody = ({ values, setField }) => (
    <AutoResizeTextArea
        value={values.text}
        onChange={(v) => setField("text", v)}
    />
);
