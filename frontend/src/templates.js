// templates.js
// Prebuilt pipeline workflows for the "Create Pipeline" gallery. Each template
// is data: metadata for its card + a build() that returns positioned nodes and
// edges using the app's existing node types. Selecting one loads it onto the
// canvas via store.loadPipeline().

import { MarkerType } from "reactflow";

// ---- builders ----------------------------------------------------------
const node = (type, n, x, y, data = {}) => ({
    id: `${type}-${n}`,
    type,
    position: { x, y },
    data: { id: `${type}-${n}`, nodeType: type, ...data },
});

const link = (source, sh, target, th) => ({
    id: `e-${source}-${sh}-${target}-${th}`,
    source,
    sourceHandle: `${source}-${sh}`,
    target,
    targetHandle: `${target}-${th}`,
    type: "deletable",
    animated: true,
    markerEnd: { type: MarkerType.Arrow, height: "20px", width: "20px" },
});

// Column x-positions for a tidy left-to-right flow. Generous gaps leave room
// for the node's side-gutter port labels and the auto-widening Text node.
const COL = [40, 600, 1160, 1720, 2280];

// Stacked rows within a column.
const ROW_TOP = 60;
const ROW_MID = 200;
const ROW_BOTTOM = 360;

// ---- the catalog -------------------------------------------------------
export const TEMPLATES = [
    {
        id: "blog-generator",
        name: "Blog Article Generator",
        description: "Turn a topic into a full blog article with an LLM.",
        categories: ["Content Creation", "Marketing"],
        accent: "#ec4899",
        cardIcon: "content",
        build: () => ({
            nodes: [
                node("customInput", 1, COL[0], 160, { inputName: "topic" }),
                node("text", 1, COL[1], 140, {
                    text: "Write a detailed, engaging blog article about {{topic}}.",
                }),
                node("llm", 1, COL[2], 150),
                node("customOutput", 1, COL[3], 160, { outputName: "article" }),
            ],
            edges: [
                link("customInput-1", "value", "text-1", "var-topic"),
                link("text-1", "output", "llm-1", "prompt"),
                link("llm-1", "response", "customOutput-1", "value"),
            ],
        }),
    },
    {
        id: "csv-search",
        name: "Search a CSV",
        description: "Ask questions against the contents of a CSV file.",
        categories: ["Search", "Productivity"],
        accent: "#0ea5e9",
        cardIcon: "monitor",
        build: () => ({
            nodes: [
                node("fileLoader", 1, COL[0], ROW_TOP, { format: "CSV" }),
                node("customInput", 1, COL[0], ROW_BOTTOM, {
                    inputName: "question",
                }),
                node("llm", 1, COL[1], 170),
                node("customOutput", 1, COL[2], 180, { outputName: "answer" }),
            ],
            edges: [
                link("fileLoader-1", "text", "llm-1", "system"),
                link("customInput-1", "value", "llm-1", "prompt"),
                link("llm-1", "response", "customOutput-1", "value"),
            ],
        }),
    },
    {
        id: "chatbot",
        name: "Chatbot",
        description: "A simple chat assistant with a system persona.",
        categories: ["Chatbots", "Assistants", "Basic"],
        accent: "#8b5cf6",
        cardIcon: "chat",
        build: () => ({
            nodes: [
                node("text", 1, COL[0], ROW_TOP, {
                    text: "You are a helpful, friendly assistant.",
                }),
                node("customInput", 1, COL[0], ROW_BOTTOM, {
                    inputName: "message",
                }),
                node("llm", 1, COL[1], 170),
                node("customOutput", 1, COL[2], 180, { outputName: "reply" }),
            ],
            edges: [
                link("text-1", "output", "llm-1", "system"),
                link("customInput-1", "value", "llm-1", "prompt"),
                link("llm-1", "response", "customOutput-1", "value"),
            ],
        }),
    },
    {
        id: "kb-search",
        name: "Search a Knowledge Base",
        description: "Answer questions grounded in your indexed documents (RAG).",
        categories: ["Search", "Assistants"],
        accent: "#0ea5e9",
        cardIcon: "monitor",
        build: () => ({
            nodes: [
                node("customInput", 1, COL[0], 160, { inputName: "query" }),
                node("knowledgeBase", 1, COL[1], 60),
                node("llm", 1, COL[2], 160),
                node("customOutput", 1, COL[3], 170, { outputName: "answer" }),
            ],
            edges: [
                link("customInput-1", "value", "knowledgeBase-1", "query"),
                link("knowledgeBase-1", "results", "llm-1", "system"),
                link("customInput-1", "value", "llm-1", "prompt"),
                link("llm-1", "response", "customOutput-1", "value"),
            ],
        }),
    },
    {
        id: "lead-collection",
        name: "Lead Collection Chatbot",
        description: "Qualify a lead in chat and push it to your CRM.",
        categories: ["Sales", "Chatbots"],
        accent: "#22c55e",
        cardIcon: "sales",
        build: () => ({
            nodes: [
                node("customInput", 1, COL[0], 160, { inputName: "message" }),
                node("llm", 1, COL[1], 150),
                node("condition", 1, COL[2], 200, {
                    expression: "is_qualified",
                }),
                node("hubspot", 1, COL[3], ROW_TOP, {
                    action: "Create contact",
                }),
                node("customOutput", 1, COL[3], ROW_BOTTOM, {
                    outputName: "reply",
                }),
            ],
            edges: [
                link("customInput-1", "value", "llm-1", "prompt"),
                link("llm-1", "response", "condition-1", "input"),
                link("condition-1", "true", "hubspot-1", "input"),
                link("condition-1", "false", "customOutput-1", "value"),
            ],
        }),
    },
    {
        id: "web-research",
        name: "Web Research Assistant",
        description: "Search the live web and synthesize an answer.",
        categories: ["Search", "Marketing"],
        accent: "#f59e0b",
        cardIcon: "search2",
        build: () => ({
            nodes: [
                node("customInput", 1, COL[0], 160, { inputName: "topic" }),
                node("webSearch", 1, COL[1], 60),
                node("llm", 1, COL[2], 160),
                node("customOutput", 1, COL[3], 170, { outputName: "summary" }),
            ],
            edges: [
                link("customInput-1", "value", "webSearch-1", "query"),
                link("webSearch-1", "results", "llm-1", "system"),
                link("customInput-1", "value", "llm-1", "prompt"),
                link("llm-1", "response", "customOutput-1", "value"),
            ],
        }),
    },
    {
        id: "slack-summary",
        name: "Slack Daily Summary",
        description: "Summarize input and post it to a Slack channel.",
        categories: ["Productivity", "Customer Support", "Slack"],
        accent: "#611f69",
        cardIcon: "productivity",
        build: () => ({
            nodes: [
                node("customInput", 1, COL[0], 160, { inputName: "updates" }),
                node("llm", 1, COL[1], 150),
                node("slack", 1, COL[2], 160, { action: "Send message" }),
                node("customOutput", 1, COL[3], 170, { outputName: "posted" }),
            ],
            edges: [
                link("customInput-1", "value", "llm-1", "prompt"),
                link("llm-1", "response", "slack-1", "input"),
                link("slack-1", "output", "customOutput-1", "value"),
            ],
        }),
    },
    {
        id: "email-responder",
        name: "Email Responder",
        description: "Read an email, draft a reply, and send it via Gmail.",
        categories: ["Customer Support", "Sales", "Gmail"],
        accent: "#EA4335",
        cardIcon: "support",
        build: () => ({
            nodes: [
                node("gmail", 1, COL[0], 160, { action: "Read inbox" }),
                node("llm", 1, COL[1], 150),
                node("gmail", 2, COL[2], 160, { action: "Send email" }),
                node("customOutput", 1, COL[3], 170, { outputName: "sent" }),
            ],
            edges: [
                link("gmail-1", "output", "llm-1", "prompt"),
                link("llm-1", "response", "gmail-2", "input"),
                link("gmail-2", "output", "customOutput-1", "value"),
            ],
        }),
    },

    // ===== Inspired by VectorShift's YouTube tutorials =====
    {
        // "Introducing: AI Agents" — an agent that gathers context from tools
        // (knowledge base + live web) before reasoning. Showcases the Text
        // node's {{variable}} inputs as the context-composer.
        id: "ai-agent",
        name: "AI Agent",
        description: "An agent that pulls from a knowledge base and the web, then reasons.",
        categories: ["Assistants", "Search"],
        accent: "#8b5cf6",
        cardIcon: "users",
        build: () => ({
            nodes: [
                node("customInput", 1, COL[0], ROW_MID, { inputName: "task" }),
                node("knowledgeBase", 1, COL[1], ROW_TOP),
                node("webSearch", 1, COL[1], ROW_BOTTOM),
                node("text", 1, COL[2], ROW_MID, {
                    text: "Answer the task using:\nDocs: {{context}}\nWeb: {{web}}",
                }),
                node("llm", 1, COL[3], ROW_MID),
                node("customOutput", 1, COL[4], ROW_MID, {
                    outputName: "answer",
                }),
            ],
            edges: [
                link("customInput-1", "value", "knowledgeBase-1", "query"),
                link("customInput-1", "value", "webSearch-1", "query"),
                link("knowledgeBase-1", "results", "text-1", "var-context"),
                link("webSearch-1", "results", "text-1", "var-web"),
                link("text-1", "output", "llm-1", "system"),
                link("customInput-1", "value", "llm-1", "prompt"),
                link("llm-1", "response", "customOutput-1", "value"),
            ],
        }),
    },
    {
        // "How to build an AI chatbot that uses a form" — multiple form fields
        // feed a templated prompt.
        id: "form-chatbot",
        name: "AI Chatbot with Form",
        description: "Collect form fields and feed them into a templated prompt.",
        categories: ["Chatbots", "Productivity"],
        accent: "#6366f1",
        cardIcon: "chat",
        build: () => ({
            nodes: [
                node("customInput", 1, COL[0], ROW_TOP, { inputName: "name" }),
                node("customInput", 2, COL[0], ROW_BOTTOM, {
                    inputName: "question",
                }),
                node("text", 1, COL[1], ROW_MID, {
                    text: "User {{name}} asks: {{question}}",
                }),
                node("llm", 1, COL[2], ROW_MID),
                node("customOutput", 1, COL[3], ROW_MID, {
                    outputName: "reply",
                }),
            ],
            edges: [
                link("customInput-1", "value", "text-1", "var-name"),
                link("customInput-2", "value", "text-1", "var-question"),
                link("text-1", "output", "llm-1", "prompt"),
                link("llm-1", "response", "customOutput-1", "value"),
            ],
        }),
    },
    {
        // "How to Build an AI WhatsApp Chatbot"
        id: "whatsapp-chatbot",
        name: "WhatsApp Chatbot",
        description: "Reply to incoming WhatsApp messages with an LLM.",
        categories: ["Chatbots", "Customer Support"],
        accent: "#25D366",
        cardIcon: "chat",
        build: () => ({
            nodes: [
                node("whatsapp", 1, COL[0], ROW_MID, {
                    action: "Read messages",
                }),
                node("llm", 1, COL[1], ROW_MID),
                node("whatsapp", 2, COL[2], ROW_MID, {
                    action: "Send message",
                }),
                node("customOutput", 1, COL[3], ROW_MID, {
                    outputName: "sent",
                }),
            ],
            edges: [
                link("whatsapp-1", "output", "llm-1", "prompt"),
                link("llm-1", "response", "whatsapp-2", "input"),
                link("whatsapp-2", "output", "customOutput-1", "value"),
            ],
        }),
    },
    {
        // "How to automate web scraping with AI"
        id: "web-scraping",
        name: "Web Scraping Automation",
        description: "Scrape a page, extract structured data, append it to a sheet.",
        categories: ["Productivity", "Marketing"],
        accent: "#0ea5e9",
        cardIcon: "search2",
        build: () => ({
            nodes: [
                node("customInput", 1, COL[0], ROW_MID, { inputName: "url" }),
                node("webScraper", 1, COL[1], ROW_MID),
                node("llm", 1, COL[2], ROW_MID),
                node("googlesheets", 1, COL[3], ROW_MID, {
                    action: "Append row",
                }),
                node("customOutput", 1, COL[4], ROW_MID, {
                    outputName: "rows",
                }),
            ],
            edges: [
                link("customInput-1", "value", "webScraper-1", "url"),
                link("webScraper-1", "content", "llm-1", "prompt"),
                link("llm-1", "response", "googlesheets-1", "input"),
                link("googlesheets-1", "output", "customOutput-1", "value"),
            ],
        }),
    },
    {
        // "How to build an AI Conditional Chatbot" — classify, then branch to a
        // different model/prompt per path.
        id: "conditional-chatbot",
        name: "Conditional Chatbot",
        description: "Classify the message, then route it down the right branch.",
        categories: ["Chatbots", "Assistants"],
        accent: "#eab308",
        cardIcon: "chat",
        build: () => ({
            nodes: [
                node("customInput", 1, COL[0], ROW_MID, { inputName: "message" }),
                node("llm", 1, COL[1], ROW_MID),
                node("condition", 1, COL[2], ROW_MID, {
                    expression: "intent == 'support'",
                }),
                node("llm", 2, COL[3], ROW_TOP),
                node("llm", 3, COL[3], ROW_BOTTOM),
                node("customOutput", 1, COL[4], ROW_TOP, {
                    outputName: "support_reply",
                }),
                node("customOutput", 2, COL[4], ROW_BOTTOM, {
                    outputName: "sales_reply",
                }),
            ],
            edges: [
                link("customInput-1", "value", "llm-1", "prompt"),
                link("llm-1", "response", "condition-1", "input"),
                link("condition-1", "true", "llm-2", "prompt"),
                link("condition-1", "false", "llm-3", "prompt"),
                link("llm-2", "response", "customOutput-1", "value"),
                link("llm-3", "response", "customOutput-2", "value"),
            ],
        }),
    },
];

// Category lists for the gallery's left panel (mirrors VectorShift's screen).
export const TEMPLATE_CATEGORIES = {
    Features: [
        { label: "Basic", icon: "grid" },
        { label: "Search", icon: "search2" },
        { label: "Assistants", icon: "users" },
        { label: "Chatbots", icon: "chat" },
        { label: "Productivity", icon: "productivity" },
        { label: "Marketing", icon: "marketing" },
        { label: "Sales", icon: "sales" },
        { label: "Content Creation", icon: "content" },
        { label: "Customer Support", icon: "support" },
    ],
    Integrations: [
        { label: "Gmail", iconKey: "gmail" },
        { label: "Slack", iconKey: "slack" },
        { label: "Discord", iconKey: "discord" },
    ],
};
