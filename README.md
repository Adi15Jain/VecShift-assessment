# VectorShift — Pipeline Builder

A no-code, drag-and-drop **pipeline builder**: drag nodes onto a canvas, wire
their typed ports together, and submit the graph to a backend that validates it.
Built for the VectorShift frontend technical assessment.

### 🔗 Live demo — **https://vec-shift-assessment-ee9w.vercel.app/**

Just open the link — nothing to install. The frontend (Vercel) talks to a FastAPI
backend (Render). The backend runs on Render's free tier, so the **first Run after
the service has been idle can take ~30–50s to wake** (the app shows a toast; retry
and it's instant thereafter).

---

## The assessment — how each part was met

### Part 1 · Node abstraction (+ 5 new nodes)

A config-driven factory: a node is a **data object**, not a copy-pasted component.

- `nodes/BaseNode.js` — the shared shell: header, body, and typed, colour-coded
  handles that auto-distribute along an edge.
- `nodes/createNode.js` — the factory that turns a config into a working node
  (field state synced to the store; handles can be static **or a function of live
  field values**, which powers the Text node's dynamic ports).
- `nodes/definitions.js` — the single catalog; every node is one object literal.
  `llm()` / `integration()` helpers collapse whole families to one line each.
- `nodes/registry.js` — register a node once → it appears on the canvas **and** in
  the sidebar (they can't drift).

The four original nodes were refactored onto it, plus five new ones —
**Knowledge Base, Web Search, API Request, Condition, Math** — each a different
shape of handles/fields. The library scaled to **30+ nodes** with almost no code.

### Part 2 · Styling

A token-based design system: all colours/spacing/shadows live as `:root` CSS
variables, so one edit re-skins everything — and a single `[data-theme="dark"]`
block delivers a full **light/dark** mode. Polished node cards, a branded top bar,
a searchable node menu, styled canvas/controls/minimap, and animated modals.

### Part 3 · Text node logic

- **Auto-resize** — the textarea grows in height with its content, and the card
  width tracks the longest line.
- **`{{ variable }}` handles** — every valid JS identifier in the text becomes a
  typed input handle on the left, created dynamically and de-duplicated; existing
  edges stay anchored as ports appear/disappear.

### Part 4 · Backend integration

- `submit.js` POSTs `{ nodes, edges }` to `/pipelines/parse`; the result is shown
  as a toast **and** a detailed modal (node count, edge count, DAG validity).
- `backend/main.py` returns `{ num_nodes, num_edges, is_dag }`. DAG detection is
  **Kahn's algorithm** in a pure, framework-free `graph.py` (O(V+E)).
- Hardened: request-size limits (413 on oversized payloads), a `/health` endpoint,
  configurable CORS, a typed response model, and a **17-case pytest suite**.

---

## Additional features

- **Template gallery** — 13 prebuilt workflows; pick one to load a complete,
  pre-wired pipeline.
- **Node toolbar** — run a node, shut it off, duplicate, more (⋯), delete.
- **Right-click context menu** — rename, collapse, duplicate, disable, delete;
  canvas menu for tidy-up / fit-view / select-all.
- **Tidy-up auto-layout**, **compact (icon-tile) view**, **rename nodes** for
  readable pipelines.
- **Undo / redo**, **edge disconnect/reconnect** (drag a handle off, or the × on
  an edge), and connection guards (no self-loops or duplicates).
- **Light / dark theme** (persisted, follows OS), **auto-hiding minimap**,
  **custom toasts** (capped so they never pile up), **onboarding tour**, and
  **JSON export** of the pipeline.

---

## Tech stack

React 18 (Create React App) · ReactFlow · Zustand · react-icons · FastAPI ·
Pydantic · pytest.

## Project structure

```
assessment/
├── backend/
│   ├── main.py            FastAPI: /pipelines/parse, limits, CORS, /health
│   ├── graph.py           pure Kahn's-algorithm DAG check
│   ├── test_main.py       17-case pytest suite
│   └── requirements.txt
└── frontend/
    ├── public/            index.html + favicon
    └── src/
        ├── App.js  store.js  ui.js  submit.js  export.js  templates.js  icons.js
        ├── nodes/      definitions · createNode · BaseNode · nodeFields · textNode · registry
        ├── components/ TopBar · Sidebar · TemplateGallery · ContextMenu · DeletableEdge · …
        ├── menu/  toast/  theme/  onboarding/    (small focused stores)
        └── index.css   design system + dark theme + all component styles
```

---

## Running locally

The live demo needs nothing. To run it yourself:

```bash
# Frontend → http://localhost:3000  (uses the deployed Render backend by default)
cd frontend && npm i && npm start
```

To run the backend locally instead, set `REACT_APP_API_URL=http://localhost:8000`
for the frontend, then:

```bash
cd backend && pip install -r requirements.txt && uvicorn main:app --reload
cd backend && pytest                    # 17 passed
```

Env knobs: `REACT_APP_API_URL` (frontend); `MAX_NODES` / `MAX_EDGES` /
`CORS_ORIGINS` / `CORS_ORIGIN_REGEX` (backend).
