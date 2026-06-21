// nodes/definitions.js
// The single catalog of every node in the app. Each entry is pure data; the
// registry turns it into a working canvas node + a sidebar palette item.
//
// Factory helpers (llm, integration) keep families of nodes to one line each —
// this is the node abstraction paying off at scale (30+ nodes, almost no code).

import { renderTextBody, textHandles } from "./textNode";

// ---- handle shorthands -------------------------------------------------
const tIn = (id, label, dataType = "Text") => ({
    id,
    type: "target",
    label,
    dataType,
});
const sOut = (id, label, dataType = "Text") => ({
    id,
    type: "source",
    label,
    dataType,
});

// ---- factories ---------------------------------------------------------
// A chat-model node: system + prompt in, response out, with a model picker.
const llm = (type, label, iconKey, accent, models) => ({
    type,
    label,
    group: "LLMs",
    iconKey,
    accent,
    subtitle: "Language model",
    fields: [{ key: "model", label: "Model", type: "select", options: models }],
    handles: [
        tIn("system", "system"),
        tIn("prompt", "prompt"),
        sOut("response", "response"),
    ],
});

// A typical SaaS integration: pick an action, take an input, emit a result.
const integration = (
    type,
    label,
    iconKey,
    accent,
    actions,
    dataType = "JSON",
) => ({
    type,
    label,
    group: "Integrations",
    iconKey,
    accent,
    subtitle: actions[0],
    fields: [
        { key: "action", label: "Action", type: "select", options: actions },
    ],
    handles: [tIn("input", "input", "Any"), sOut("output", "output", dataType)],
});

// ---- the catalog -------------------------------------------------------
export const NODE_DEFINITIONS = [
    // ===== General =====
    {
        type: "customInput",
        label: "Input",
        group: "General",
        iconKey: "input",
        accent: "#10b981",
        subtitle: "Pipeline entry",
        fields: [
            {
                key: "inputName",
                label: "Name",
                type: "text",
                default: (id) => id.replace("customInput-", "input_"),
            },
            {
                key: "inputType",
                label: "Type",
                type: "select",
                options: ["Text", "File"],
                default: "Text",
            },
        ],
        handles: (v) => [
            sOut("value", null, v.inputType === "File" ? "File" : "Text"),
        ],
    },
    {
        type: "customOutput",
        label: "Output",
        group: "General",
        iconKey: "output",
        accent: "#f43f5e",
        subtitle: "Pipeline result",
        fields: [
            {
                key: "outputName",
                label: "Name",
                type: "text",
                default: (id) => id.replace("customOutput-", "output_"),
            },
            {
                key: "outputType",
                label: "Type",
                type: "select",
                options: ["Text", "Image"],
                default: "Text",
            },
        ],
        handles: (v) => [
            tIn("value", null, v.outputType === "Image" ? "Image" : "Text"),
        ],
    },
    {
        type: "text",
        label: "Text",
        group: "General",
        iconKey: "text",
        accent: "#6366f1",
        subtitle: "Templated text",
        fields: [{ key: "text", type: "hidden", default: "{{input}}" }],
        handles: textHandles,
        render: renderTextBody,
    },
    {
        type: "note",
        label: "Note",
        group: "General",
        iconKey: "file",
        accent: "#94a3b8",
        subtitle: "Sticky note",
        fields: [
            {
                key: "note",
                label: "Note",
                type: "text",
                default: "Add context…",
            },
        ],
        handles: [],
    },

    // ===== LLMs =====
    llm("llm", "OpenAI", "openai", "#10A37F", ["gpt-4o", "gpt-4o-mini", "o3"]),
    llm("anthropic", "Anthropic", "anthropic", "#D97757", [
        "claude-opus-4",
        "claude-sonnet-4",
        "claude-haiku-4",
    ]),
    llm("gemini", "Gemini", "gemini", "#4285F4", [
        "gemini-2.5-pro",
        "gemini-2.5-flash",
    ]),
    llm("huggingface", "Hugging Face", "huggingface", "#FF9D00", [
        "llama-3.1-70b",
        "mistral-large",
        "qwen-2.5",
    ]),

    // ===== Knowledge & Data =====
    {
        type: "knowledgeBase",
        label: "Knowledge Base",
        group: "Knowledge",
        iconKey: "knowledgeBase",
        accent: "#0ea5e9",
        subtitle: "Retrieval (RAG)",
        description: "Semantic search over your indexed documents.",
        fields: [
            {
                key: "index",
                label: "Index",
                type: "select",
                options: ["Company Docs", "Support Tickets", "Product Wiki"],
            },
            { key: "topK", label: "Top K", type: "text", default: "5" },
        ],
        handles: [
            tIn("query", "query"),
            sOut("results", "results", "KnowledgeBase"),
        ],
    },
    {
        type: "fileLoader",
        label: "File Loader",
        group: "Knowledge",
        iconKey: "file",
        accent: "#f59e0b",
        subtitle: "Parse a file",
        fields: [
            {
                key: "format",
                label: "Format",
                type: "select",
                options: ["Auto", "PDF", "DOCX", "CSV", "TXT"],
            },
        ],
        handles: [tIn("file", "file", "File"), sOut("text", "text")],
    },
    {
        type: "webSearch",
        label: "Web Search",
        group: "Knowledge",
        iconKey: "webSearch",
        accent: "#f59e0b",
        subtitle: "Live grounding",
        fields: [
            {
                key: "engine",
                label: "Engine",
                type: "select",
                options: ["Google", "Bing", "DuckDuckGo"],
            },
            { key: "numResults", label: "Results", type: "text", default: "3" },
        ],
        handles: [tIn("query", "query"), sOut("results", "results", "JSON")],
    },
    {
        type: "webScraper",
        label: "Web Scraper",
        group: "Knowledge",
        iconKey: "webSearch",
        accent: "#0ea5e9",
        subtitle: "Extract a page",
        fields: [
            { key: "url", label: "URL", type: "text", default: "https://" },
        ],
        handles: [tIn("url", "url"), sOut("content", "content")],
    },

    // ===== Integrations (brand) =====
    integration("slack", "Slack", "slack", "#611f69", [
        "Send message",
        "Read channel",
    ]),
    integration("gmail", "Gmail", "gmail", "#EA4335", [
        "Send email",
        "Read inbox",
        "Search",
    ]),
    integration("notion", "Notion", "notion", "#111111", [
        "Create page",
        "Query database",
    ]),
    integration("googledrive", "Google Drive", "googledrive", "#0F9D58", [
        "List files",
        "Read file",
        "Upload",
    ]),
    integration("googlesheets", "Google Sheets", "googlesheets", "#0F9D58", [
        "Read rows",
        "Append row",
    ]),
    integration(
        "googlecalendar",
        "Google Calendar",
        "googlecalendar",
        "#4285F4",
        ["List events", "Create event"],
    ),
    integration("airtable", "Airtable", "airtable", "#18BFFF", [
        "List records",
        "Create record",
    ]),
    integration("hubspot", "HubSpot", "hubspot", "#FF7A59", [
        "Create contact",
        "Search deals",
    ]),
    integration("salesforce", "Salesforce", "salesforce", "#00A1E0", [
        "Query SOQL",
        "Create lead",
    ]),
    integration("discord", "Discord", "discord", "#5865F2", [
        "Send message",
        "Read channel",
    ]),
    integration("github", "GitHub", "github", "#24292e", [
        "Create issue",
        "List PRs",
        "Read file",
    ]),
    integration("linear", "Linear", "linear", "#5E6AD2", [
        "Create issue",
        "List issues",
    ]),
    integration("twilio", "Twilio", "twilio", "#F22F46", ["Send SMS"]),
    integration("telegram", "Telegram", "telegram", "#26A5E4", [
        "Send message",
    ]),
    integration("whatsapp", "WhatsApp", "whatsapp", "#25D366", [
        "Send message",
        "Read messages",
    ]),
    integration("stripe", "Stripe", "stripe", "#635BFF", [
        "Create charge",
        "List customers",
    ]),

    // ===== Data stores =====
    integration("postgres", "Postgres", "postgres", "#4169E1", [
        "Run query",
        "Insert",
    ]),
    integration("mongodb", "MongoDB", "mongodb", "#47A248", ["Find", "Insert"]),
    {
        type: "api",
        label: "API Request",
        group: "Data",
        iconKey: "api",
        accent: "#14b8a6",
        subtitle: "HTTP integration",
        fields: [
            {
                key: "method",
                label: "Method",
                type: "select",
                options: ["GET", "POST", "PUT", "DELETE"],
            },
            {
                key: "url",
                label: "URL",
                type: "text",
                default: "https://api.example.com",
            },
        ],
        handles: [
            tIn("body", "body", "JSON"),
            sOut("response", "response", "JSON"),
        ],
    },

    // ===== Logic =====
    {
        type: "condition",
        label: "Condition",
        group: "Logic",
        iconKey: "condition",
        accent: "#eab308",
        subtitle: "Branch / route",
        fields: [
            {
                key: "expression",
                label: "If",
                type: "text",
                default: "score > 0.8",
            },
        ],
        handles: [
            tIn("input", "in", "Any"),
            sOut("true", "true", "Any"),
            sOut("false", "false", "Any"),
        ],
    },
    {
        type: "math",
        label: "Math",
        group: "Logic",
        iconKey: "math",
        accent: "#ec4899",
        subtitle: "Numerical Operation",
        fields: [
            {
                key: "operation",
                label: "Operation",
                type: "select",
                options: ["add", "subtract", "multiply", "divide"],
            },
        ],
        handles: [
            tIn("a", "a", "Number"),
            tIn("b", "b", "Number"),
            sOut("result", "result", "Number"),
        ],
    },
    {
        type: "transform",
        label: "Transform",
        group: "Logic",
        iconKey: "transform",
        accent: "#8b5cf6",
        subtitle: "Map / format",
        fields: [
            {
                key: "code",
                label: "Expression",
                type: "text",
                default: "value.trim()",
            },
        ],
        handles: [tIn("input", "in", "Any"), sOut("output", "out", "Any")],
    },
];
