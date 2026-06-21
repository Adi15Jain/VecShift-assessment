# VectorShift — Pipeline Builder (Frontend Technical Assessment)

A no-code, drag-and-drop **AI pipeline builder**: drag nodes onto a canvas, wire
their typed ports together, and submit the graph to a backend that validates it.
Built for VectorShift's frontend technical assessment — but engineered to look
and behave like the real product, not a throwaway demo.

> **TL;DR for a reviewer**
> The assessment had 4 parts (node abstraction, styling, text-node logic, backend
> integration). I completed all four, then raised the bar: a real app shell, 30+
> nodes including authentic brand integrations, a typed/colour-coded data-flow
> system (VectorShift's actual differentiator), a **"Create Pipeline" template
> gallery with 13 prebuilt workflows** (several modelled on VectorShift's own
> tutorials), custom toasts, onboarding, and a **hardened, unit-tested backend**
> with input limits and health checks — not a demo endpoint.

---

## 1. Why this project exists (the motive)

VectorShift is a **no-code AI workflow automation** platform. The assessment ships
a deliberately bare-bones version of their pipeline editor and asks the candidate
to grow it. So before writing code I researched **what actually makes VectorShift
different**, and let that drive every decision.

|           | n8n (generic automation)                | **VectorShift**                                            |
| --------- | --------------------------------------- | ---------------------------------------------------------- |
| Focus     | 500+ app integrations, automation-first | **AI-native** — LLMs, RAG, agents are first-class          |
| AI        | One node type, bolted on                | The whole point of the product                             |
| Data flow | Generic JSON between steps              | **Typed, type-checked handles** (errors caught before run) |
| Output    | A workflow result                       | Deploy as **chatbot / assistant / API** in minutes         |

**My north star:** make the submission _read like a VectorShift pipeline_. That's
why the handles are **typed and colour-coded**, the node library leans into
**AI/RAG + real integrations**, and the chrome mirrors their \*\*node-menu + canvas

- Run/Deploy/Export\*\* layout.

---

## 2. The assessment, and how each part was approached

| Part                | Ask                                  | My approach                                                                        |
| ------------------- | ------------------------------------ | ---------------------------------------------------------------------------------- |
| **1 — Abstraction** | Stop copy-pasting node code          | A **config-driven factory**: a node is now a _data object_, not a component.       |
| **2 — Styling**     | Make it look good                    | A token-based design system (`:root` variables) → one place re-skins everything.   |
| **3 — Text node**   | Auto-resize + `{{variable}}` handles | Custom body + **handles derived from the text itself**.                            |
| **4 — Backend**     | Count nodes/edges + DAG check        | FastAPI endpoint using **Kahn's algorithm**; friendly toast + modal on the client. |

---

## 3. System architecture

**One-line mental model:** _data flows down_ (`definitions → registry → canvas`)
and _user actions flow up into Zustand_ (`drag/connect → store`), with the backend
consulted only on **Run**.

---

## 4. The heart of it — the node abstraction (Part 1)

The original code had four near-identical node files. Adding a fifth meant
copy-pasting handles, state wiring, and markup. That doesn't scale.

**My solution: a node is pure data.** You describe it; a factory builds it.

**Adding a brand-new node is now one object** — no new component, no boilerplate:

```js
// A full working node. Typed ports, synced state, styling — all handled.
{
  type: "knowledgeBase",
  label: "Knowledge Base",
  group: "Knowledge",
  iconKey: "knowledgeBase",
  accent: "#0ea5e9",
  fields: [{ key: "topK", label: "Top K", type: "text", default: "5" }],
  handles: [
    { id: "query",   type: "target", label: "query",   dataType: "Text" },
    { id: "results", type: "source", label: "results", dataType: "KnowledgeBase" },
  ],
}
```

Families of nodes collapse even further. Brand integrations and LLMs are generated
by small **factory helpers** so each is literally one line:

```js
integration("slack", "Slack", "slack", "#611f69", [
    "Send message",
    "Read channel",
]);
llm("anthropic", "Anthropic", "anthropic", "#D97757", [
    "claude-opus-4",
    "claude-sonnet-4",
]);
```

That's how the library grew to **30+ nodes** without 30 files. **This is the
abstraction the assessment asked for — proven at scale.**

### Why a factory and not a base component you extend?

| Option                          | Trade-off                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------- |
| Copy-paste per node             | Original problem. Doesn't scale.                                                |
| `BaseNode` + subclass each node | Still one component per node; shared logic leaks.                               |
| **Config + factory (chosen)**   | A node is data; behaviour lives in one tested place; new nodes are declarative. |

The escape hatch matters too: a config can supply a custom `render` (the Text node
uses it) and a **function** for `handles` (handles that react to live input). So
the abstraction stays simple for 90% of nodes without boxing in the hard 10%.

---

## 5. Typed data flow — VectorShift's actual USP, in the UI

Every handle declares a `dataType`; `theme.js` maps each type to a colour. The
same map drives validation later. This is the single most "VectorShift" thing in
the build.

---

## 6. Text node logic (Part 3)

Two behaviours, both built on the same abstraction:

1. **Auto-resize** — a `useLayoutEffect` re-fits the textarea height to its
   content; the card width tracks the longest line.
2. **Dynamic `{{variable}}` handles** — the text is the source of truth for the
   node's input ports.

The subtle bit: when handle **count** changes, ReactFlow must be told to recompute
node internals or existing edges detach. `BaseNode` watches a "handle signature"
and calls `useUpdateNodeInternals` — so this works for _every_ node with dynamic
handles, not just Text.

---

## 7. Backend integration (Part 4)

### Run sequence

### DAG check (Kahn's algorithm)

A valid pipeline must be a **Directed Acyclic Graph** — no node should
(transitively) feed back into itself. I detect cycles by repeatedly removing
nodes that have no remaining incoming edges; if any remain, there's a cycle.

### Built for load, not just a demo

The backend is structured to behave well in production, not just pass the happy
path:

- **Pure logic, isolated & tested** — the DAG algorithm lives in `graph.py` with
  **zero framework dependencies**, covered by a **17-case pytest suite**
  (`test_main.py`) including a 10,000-node chain to prove it scales linearly.
- **Input limits (DoS guard)** — payloads above `MAX_NODES` / `MAX_EDGES`
  (env-configurable) are rejected with **413** _before_ any graph work, so a
  malicious or runaway request can't pin the CPU.
- **Linear complexity** — Kahn's algorithm is **O(V + E)** time and space, so
  latency grows predictably with pipeline size.
- **Operability** — a `/health` liveness endpoint for load balancers/containers,
  structured request logging, env-configurable CORS origins, and a typed
  response model (`PipelineAnalysis`).

```bash
cd backend && pip install -r requirements.txt && pytest   # 17 passed
```

---

## 8. Template gallery & prebuilt workflows

The app opens on a **"Create Pipeline"** screen modelled on VectorShift's own —
a searchable, categorised gallery of ready-made workflows plus a _start from
scratch_ card. Picking a template **loads a complete, pre-wired pipeline** onto
the canvas so a user goes from zero to a working graph in one click.

**13 templates**, spanning the gallery's categories and integrations. The last
five are modelled directly on **VectorShift's own YouTube tutorials**:

| Template                       | Pipeline                                               | Category         |
| ------------------------------ | ------------------------------------------------------ | ---------------- |
| Blog Article Generator         | Input → Text(`{{topic}}`) → LLM → Output               | Content Creation |
| Search a CSV                   | File Loader + Input → LLM → Output                     | Search           |
| Chatbot                        | Text(persona) + Input → LLM → Output                   | Chatbots         |
| Search a Knowledge Base        | Input → Knowledge Base → LLM → Output                  | Search · RAG     |
| Lead Collection Chatbot        | Input → LLM → Condition → HubSpot / Output             | Sales            |
| Web Research Assistant         | Input → Web Search → LLM → Output                      | Search           |
| Slack Daily Summary            | Input → LLM → Slack → Output                           | Productivity     |
| Email Responder                | Gmail → LLM → Gmail → Output                           | Customer Support |
| **AI Agent** 🎥                | Input → (KB + Web) → Text → LLM → Output               | Assistants       |
| **AI Chatbot with Form** 🎥    | Input×2 → Text(`{{name}} {{question}}`) → LLM → Output | Chatbots         |
| **WhatsApp Chatbot** 🎥        | WhatsApp → LLM → WhatsApp → Output                     | Customer Support |
| **Web Scraping Automation** 🎥 | Input → Web Scraper → LLM → Sheets → Output            | Productivity     |
| **Conditional Chatbot** 🎥     | Input → LLM → Condition → LLM / LLM → Output           | Chatbots         |

🎥 = inspired by a tutorial on [VectorShift's YouTube channel](https://www.youtube.com/@VectorShiftAI/videos).

Each template is **pure data**: metadata for its card plus a `build()` that
returns positioned `nodes` and `edges` (wired to the exact typed handle ids the
nodes expose). `store.loadPipeline()` also seeds the node-id counters so a node
dragged in _after_ loading a template never collides with the template's ids.

## 9. Beyond the brief — the product experience

To make it feel like a shipped product:

- **App shell** mirroring VectorShift: dark top bar showing the **live workflow
  name** (editable; auto-set from the chosen template) + Run · Deploy · **Export**
  · Templates, a left **node menu** with **search** and collapsible categories.
- **Export** downloads the pipeline as a faithful, re-importable JSON file
  (`{ name, nodes, edges }`) — the same shape the backend consumes.
- **30+ nodes with real brand logos** (`react-icons`): OpenAI, Anthropic, Gemini,
  Hugging Face; Slack, Gmail, Notion, Google Drive/Sheets/Calendar, Airtable,
  HubSpot, Salesforce, Discord, GitHub, Linear, Twilio, Telegram, WhatsApp,
  Stripe; Postgres, MongoDB; plus Knowledge Base, Web Search/Scraper, File Loader,
  API, Condition, Math, Transform.
- **Full graph editing** — a **node hover toolbar** (run · shut off · duplicate ·
  more · delete) and an **in-canvas edge delete button** (× on hover) so nothing
  needs the keyboard; plus **undo/redo** (buttons + Ctrl/Cmd+Z / Shift+Z), **drag a
  handle off an edge to disconnect it**, reconnect edges, and connection guards (no
  self-loops or duplicate edges).
- **Per-node execution & shut-off** — a **Play** button runs a single node
  independently (a pulsing "executing" state, n8n's "execute step"); a **Power**
  button **shuts a node off**, and shut-off nodes (and their edges) are **excluded
  from the Run** payload, so the analysis reflects only what actually executes.
- **Workflow-management conveniences (n8n-style)** — a **right-click context menu**
  (node: Rename · Collapse · Duplicate · Disable · Delete; canvas: Tidy up · Fit
  view · Select all); **rename nodes** with custom labels (double-click the title)
  for readable, self-documenting pipelines; **enable/disable** nodes (dimmed);
  **Tidy up** auto-layout that snaps a tangled graph into clean topological
  columns; and shortcuts (Ctrl/Cmd+A select all, Ctrl/Cmd+D duplicate).
- **Compact view (minimalistic, n8n-style)** — collapse any node to a small icon
  tile with its label below (per-node, or a top-bar **Compact all** toggle), so a
  large pipeline reads as a clean overview; expand to edit fields. Fields stay
  visible by default so the assessment's editing is never hidden.
- **Auto-hiding minimap** — the minimap only appears while the cursor is moving
  over the canvas and fades out when idle, keeping the workspace uncluttered.
- **Light / dark theme** toggle — every surface is driven by CSS tokens, so one
  `data-theme` switch recolours the whole app; the choice persists and respects
  the OS preference.
- **Custom toasts** instead of `window.alert`, plus a detailed result modal.
- **First-load tutorial** (welcome carousel, shown once via localStorage).
- **Interactive onboarding tour** — a spotlight over the real sidebar/canvas/Run/
  history/theme controls, replayable from the Help menu.

---

## 10. Project structure

```
assessment/
├── README.md                  ← you are here
├── SOLUTION.md                ← concise per-part write-up
├── backend/
│   ├── main.py                ← FastAPI app: routes, models, limits, CORS
│   ├── graph.py               ← pure Kahn's-algorithm DAG check (framework-free)
│   ├── test_main.py           ← 17-case pytest suite (logic + HTTP)
│   └── requirements.txt
└── frontend/
    ├── public/                ← index.html + favicon.svg (VS brand)
    └── src/
        ├── App.js             ← shell + view switch + keyboard shortcuts
        ├── store.js           ← Zustand: nodes, edges, view, name, history,
        │                        edge/node ops, tidy, compact, select
        ├── ui.js              ← ReactFlow canvas: drag-drop, edge reconnect,
        │                        context menu, minimap auto-hide, tidy control
        ├── submit.js          ← useRunPipeline() (excludes shut-off nodes)
        ├── export.js          ← download the pipeline as JSON
        ├── templates.js       ← 13 prebuilt workflows (data + build())
        ├── icons.js           ← central icon registry (react-icons)
        ├── theme/theme.js     ← typed-handle colours (JS-side)
        ├── theme/themeStore.js← light/dark state (persist + OS pref)
        ├── nodes/
        │   ├── definitions.js ← THE node catalog (pure data, 30+ nodes)
        │   ├── createNode.js  ← the factory
        │   ├── BaseNode.js    ← shared shell: handles, toolbar, rename,
        │   │                    disable, compact, run/shutoff
        │   ├── nodeFields.js  ← reusable field controls
        │   ├── textNode.js    ← Part 3 custom logic
        │   └── registry.js    ← builds nodeTypes + palette from definitions
        ├── components/
        │   ├── TopBar.js  Sidebar.js  TemplateGallery.js
        │   ├── ToastHost.js  ResultModal.js  Onboarding.js
        │   ├── ContextMenu.js  DeletableEdge.js
        ├── menu/              ← menuStore.js + menuItems.js (context menu)
        ├── toast/toastStore.js
        └── onboarding/guideStore.js
```

---

## 11. Design decisions & trade-offs (interview talking points)

- **Config-over-components** for nodes — optimises for the real cost (adding
  nodes), keeps shared behaviour in one tested place.
- **Single source of truth** (`definitions.js` → `registry.js`) — register a node
  once; it appears on the canvas _and_ in the sidebar. No drift.
- **Typed handles** — chosen specifically because it's VectorShift's
  differentiator; it's also the foundation for future connection-validation.
- **Zustand, kept** — the starter used it; small, no boilerplate. I added separate
  tiny stores for toasts and onboarding to keep concerns isolated.
- **`react-icons`** — authentic brand logos make the integration story credible
  with minimal weight; UI glyphs come from the same library.
- **Tour via `data-tour` attributes** — decouples the tour from component
  internals; highlighting works off the live DOM rect, resilient to layout.
- **`window.alert` → toasts/modal** — the brief said "alert"; I read the _intent_
  (user-friendly feedback) and delivered a better version.
- **Templates as data, not snapshots** — each template `build()`s its graph from
  the live node types, so templates can't drift from the nodes they use.
- **Port labels in the side gutters** — handle labels render _outside_ the card
  (left for inputs, right for outputs) as small pills, so they can never overlap
  the node's own field labels (`MODEL`, `ACTION`, `TEXT`); multi-input dots also
  distribute in a band below the header for clean alignment.
- **Theming via CSS variables, not JS** — all colours are `:root` tokens; dark
  mode is a single `[data-theme="dark"]` override block. No component knows about
  themes, so nothing can be "missed" when toggling.
- **Undo history snapshots the graph, coalesced per tick** — deleting a node fires
  two ReactFlow change events (node + its edges); a one-microtask guard collapses
  them into a single undo step so undo never lands on a broken intermediate state.

### What I'd do next

Type-aware connection validation (reject _mismatched-type_ edges using the same
colour map — self-loop/duplicate guards are already in), node-level run results,
and save/load pipelines to the backend.

---

## 12. Running it

**Quickest path — frontend only, talking to the live backend on Render:**

```bash
cd frontend && npm i && npm start      # → http://localhost:3001
```

`frontend/.env` points the app at the deployed backend
(`REACT_APP_API_URL=https://vecshift-assessment.onrender.com`) and pins the dev
server to **port 3001** (the origin the deployed backend's CORS allows). So
`npm start`, then **Run** — no local backend needed. Render's free tier sleeps
when idle, so the first Run can take ~50s to wake (the app shows a toast; retry).

**Or run the backend locally** (set `REACT_APP_API_URL=http://localhost:8000` in
`frontend/.env`):

```bash
# Backend  → http://localhost:8000
cd backend && pip install -r requirements.txt && uvicorn main:app --reload

# Backend tests
cd backend && pytest                   # 17 passed
```

The app opens on the **Create Pipeline** gallery (welcome tutorial on first
load). Pick a template — or start from scratch, drag nodes, connect them — and
hit **Run** to see the node/edge counts and DAG validation.

_Env knobs: `REACT_APP_API_URL` / `PORT` (frontend); `MAX_NODES` / `MAX_EDGES` /
`CORS_ORIGINS` (backend — set `CORS_ORIGINS` on Render to your frontend origin,
or `*`, if you deploy the frontend)._
