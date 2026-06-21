// theme/theme.js
// Typed-handle colour map. VectorShift's differentiator is a *typed* data flow:
// every handle carries a data type and connections are colour-coded by it
// (mirroring their Text → Decimal/JSON, File → Image/Audio, VSObject →
// KnowledgeBase system). All other styling lives as CSS tokens in index.css.

export const dataTypeColor = {
    Text: "#6366f1",
    JSON: "#10b981",
    Number: "#0ea5e9",
    File: "#f59e0b",
    Image: "#ec4899",
    Audio: "#14b8a6",
    Boolean: "#f43f5e",
    KnowledgeBase: "#8b5cf6",
    Any: "#94a3b8",
};

export const handleColor = (dataType) =>
    dataTypeColor[dataType] || dataTypeColor.Any;
