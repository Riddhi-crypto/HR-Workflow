# Hirelow — HR Workflow Designer

> A visual, drag-and-drop workflow designer for HR hiring pipelines with
> **auto-routing** based on Present/Absent decisions, built-in **ATS Resume
> Checker** that auto-fills candidate information, and a **workflow
> simulation sandbox**.

Built for the **Tredence Studio · Full Stack Engineering Intern** case study.

---

## ✨ Highlights

- 🎯 **Zero manual wiring of the happy/unhappy path.** HR admins flip a chip
  on each stage between `Present`, `Absent`, or `Pending`. The canvas
  auto-highlights the active branch — no dragging edges between conditions.
- 📄 **ATS Resume Checker.** Drop a resume, and the parser auto-fills name,
  email, phone, location, LinkedIn, skills, education, years of experience,
  and computes a keyword-match score against the stages defined on the canvas.
- 🧪 **Live sandbox simulator.** Serializes the graph, walks it step-by-step
  following each stage's decision, and shows a timeline of what would happen
  with validation errors, termination reasons, and final outcome.
- 🧱 **Six node types, easily extensible.** Start, ATS Screen, Task, Approval,
  Automated Step, End — each with its own config form, discriminated union
  types, and a clean extension point.

---

## 🚀 Quick start

```bash
# Install
npm install

# Dev server (http://localhost:5173)
npm run dev

# Type-check
npm run typecheck

# Production build
npm run build
```

**Requirements:** Node 18+, modern browser.

---

## 🏛 Architecture

### Folder structure

```
src/
├── components/
│   ├── canvas/               # React Flow canvas wrapper
│   ├── nodes/                # Custom node renderers (1 file = all kinds)
│   ├── panels/               # Top bar, sidebar, inspector
│   └── ui/                   # Shared primitives (Button, FormPrimitives)
├── features/
│   ├── ats/                  # Resume parser + ATS modal
│   └── simulator/            # Sandbox execution log
├── hooks/                    # (reserved for future custom hooks)
├── lib/
│   ├── api.ts                # Mock API: fetchAutomations, simulateWorkflow
│   ├── graphOps.ts           # Pure graph helpers (auto-relink, etc.)
│   └── nodeFactory.ts        # Default data blob per node kind
├── mocks/
│   └── automations.ts        # Mock catalogue of 7 automated actions
├── store/
│   └── workflowStore.ts      # Zustand: single source of truth
├── types/
│   └── workflow.ts           # Discriminated unions — the contract
├── App.tsx                   # Layout shell
├── main.tsx                  # React Flow provider + root
└── index.css                 # Design tokens + Tailwind layers
```

### Layer separation

| Layer              | Responsibility                                              | Lives in             |
| ------------------ | ----------------------------------------------------------- | -------------------- |
| **Types**          | The graph contract. Node kinds, decisions, API shapes.      | `types/workflow.ts`  |
| **State**          | Nodes, edges, selection, candidate, simulation.             | `store/workflowStore.ts` |
| **Graph ops**      | Pure functions. Cycle detection, auto-relink, validation.   | `lib/graphOps.ts`    |
| **API**            | Mock HTTP surface (`/automations`, `/simulate`).            | `lib/api.ts`         |
| **UI — primitives**| Buttons, inputs, KV list, chip editor.                      | `components/ui/`     |
| **UI — nodes**     | One renderer per `NodeKind`, all via `NodeShell`.           | `components/nodes/`  |
| **UI — panels**    | Sidebar, inspector, top bar.                                | `components/panels/` |
| **Features**       | Self-contained verticals (ATS, simulator).                  | `features/`          |

The dependency graph runs **one way**: UI → store → lib/api. Components
never reach into each other; they communicate through the store.

---

## 🎛 Auto-flow: the core concept

> **No manual connection of present/absent paths is needed.**

Every non-terminal node carries a `decision` field:

```ts
type Decision = 'present' | 'absent' | null;
```

When you drop a Start node, ATS, Task, Approval, Automated, and End onto
the canvas, the **seed graph** already wires two outgoing edges per
non-terminal node: one `present` (green) and one `absent` (red). When an
HR admin flips the chip on a node:

- **Present / Tick** → the green edge lights up and animates; red dims.
- **Absent** → red edge lights up; green dims. Candidate is routed to
  rejection, or the workflow terminates if no `absent` edge exists.
- **Pending (null)** → both edges are visible. The simulator pauses here.

This is done by `autoRelinkOutgoing` in `lib/graphOps.ts` — a pure function
that re-annotates edge `animated` + `className` on every decision change.
Nodes keep their structure; only the *visual path* reflows.

### Simulator contract

`POST /simulate` (mocked in `lib/api.ts`) walks the graph from the Start
node, following these rules:

1. On a **Start** or **End** node → execute and advance.
2. On any other node with `decision === null` → **wait**. Simulation halts.
3. On any other node with `decision === 'absent'`:
   - If an `absent` branch exists → follow it.
   - Otherwise → **terminate** the workflow immediately.
4. On any other node with `decision === 'present'` → follow the `present`
   edge, or the default edge if no branches are defined.

This is what makes "connection purely on the basis of marking" a real
contract, not just a UX convention.

---

## 📄 ATS Resume Checker

Accessible from the **ATS Resume Check** button in the top bar.

**What it does:**

1. Accepts a `.txt` file drop or pasted resume text. (PDF/DOCX parsing
   would be handled by a backend service — in the prototype we stick to
   plain text so the front-end has no heavy deps.)
2. Runs heuristic extraction for:
   - Full name
   - Email, phone, location, LinkedIn URL
   - Skills (from a bank of ~50 technical + soft-skill keywords)
   - Education (degree patterns)
   - Years of experience (explicit mentions + date-range fallback)
   - Current role
3. Computes an **ATS score** by matching the resume against the
   `requiredKeywords` aggregated from **every ATS node on the canvas**.
   Configure the ATS node to change what's being scored for.
4. Stores the `CandidateInfo` on the workflow store so the simulator
   panel shows it in context.

A demo fixture (`Priya Raman`) ships with the app — click **Load demo
resume** to skip the upload step.

### Why keyword aggregation?

The ATS node is the only place where the JD's required skills live.
Putting them on the node means: (a) they're visible on the canvas, (b)
changing them instantly re-scores candidates, and (c) multiple ATS
stages can score against different aspects (e.g. a technical screen
keyword set vs. a culture-fit keyword set).

---

## 🧪 Workflow Simulation Sandbox

Open with the orange **Run Simulation** button.

**Validation runs first** — you get blocking errors for:

- Missing or multiple Start nodes
- Nodes with no outgoing connection
- Cycles in the graph

Warnings for:

- No End node

Then the simulator:

- Renders a step-by-step timeline with a `#01`, `#02`, … counter
- Color-codes each step: green (present), red (absent or terminated),
  amber (waiting)
- Shows the candidate's ATS score as context at the top
- Surfaces the final outcome (`HIRED` / `REJECTED` / `INCOMPLETE`)
- Displays termination reasons when the graph halts early

---

## 🧩 Node types

| Kind            | Purpose                       | Key fields                                                 |
| --------------- | ----------------------------- | ---------------------------------------------------------- |
| **Start**       | Entry point                   | `title`, `requireResume`, `metadata[]`                      |
| **ATS Screen**  | Resume scoring gate           | `title`, `minScore`, `requiredKeywords[]`                   |
| **Task**        | Human action                  | `title`, `description`, `assignee`, `dueDate`, `customFields[]` |
| **Approval**    | Reviewer gate                 | `title`, `approverRole`, `autoApproveThreshold`             |
| **Automated**   | System action                 | `title`, `actionId` (from mock API), `actionParams` (dynamic) |
| **End**         | Terminal state                | `title`, `outcome` (hired/rejected/withdrawn), `endMessage`, `summaryFlag` |

### Adding a new node kind

To add, say, an **Interview** node:

1. Extend `NodeKind` in `types/workflow.ts` and add an `InterviewNodeData` interface to the union.
2. Add defaults in `lib/nodeFactory.ts`.
3. Write a renderer in `components/nodes/index.tsx` using `<NodeShell />`.
4. Add a form in `components/panels/NodeConfigForms.tsx`.
5. Add a palette entry in `components/panels/NodePalette.tsx`.

That's the full extension surface — five edits in five files, no framework
changes.

---

## 🔌 Mock API

All network calls are stubbed in `src/lib/api.ts`. The surface mirrors what
a real backend would expose:

```http
GET  /automations       → AutomationAction[]
POST /simulate          → SimulationResult
     body: { nodes, edges }
```

To swap in a real backend, change the implementations in `api.ts` —
no callers need to change because the types are stable.

### Mock automations

Seven mock actions, each with a typed `params` list that drives the
Automated node's dynamic form:

- Send Email
- Generate Document
- Schedule Interview
- Background Check
- Create IT Ticket
- Notify via Slack
- Re-score Resume

---

## 🎨 Design decisions

### Why Zustand over Context + useReducer?

- The workflow store has ~15 actions and is touched by most of the app.
- Zustand gives us selector-based subscriptions out of the box — fewer
  re-renders than Context.
- No provider tree, no boilerplate reducer/action types. Actions are just
  store methods.

### Why React Flow 12 (`@xyflow/react`)?

- Current, maintained, typed generics (`Node<Data>`, `Edge<Data>`).
- Built-in MiniMap, Controls, background grid.
- Handle positioning and multi-handle source support (which we need for
  present/absent branching on the right edge of nodes).

### Why a discriminated union for node data?

```ts
type WorkflowNodeData =
  | StartNodeData
  | TaskNodeData
  | ApprovalNodeData
  | ...
```

Every consumer (renderer, form, simulator) can `switch (data.kind)` and
TypeScript narrows the type. Adding a new kind becomes a compiler-enforced
checklist — you can't forget to handle it somewhere.

### Typography & color

- **Display:** Fraunces (variable serif) — chosen for a slightly editorial,
  non-generic feel. Used for major headlines.
- **Body:** Geist — modern sans with excellent numeric glyphs for all the
  IDs, scores, and timestamps in the UI.
- **Mono:** JetBrains Mono — IDs and parameter pills.
- **Accent:** A warm orange (`#e85d2f`) that matches Tredence's brand hue
  without copying it exactly.
- **Light theme, calm surface.** Dotted grid on a warm off-white canvas.

### What I'd add with more time

- **Per-candidate simulations.** Right now the ATS candidate is ambient
  context; next step is per-run candidates with a history sidebar.
- **Real PDF/DOCX parsing** via a `/parse-resume` endpoint (`pdfjs` +
  `mammoth` or an LLM call).
- **Undo/redo** via a command pattern on the store.
- **Auto-layout** (dagre or elk) for large workflows.
- **Persistence** — currently in-memory only; a thin IndexedDB adapter
  behind the store would give free session persistence.
- **Storybook** for the node and form components.
- **Tests.** Units for `simulateWorkflow`, `parseResumeText`, and
  `autoRelinkOutgoing` (all pure). E2E for the drag-drop + decision →
  simulation loop with Playwright.
- **Collab-ready primitives.** Yjs-backed shared store for multiplayer
  editing — the store is already event-based.

---

## ✅ What I completed vs. the case study brief

| Requirement                                               | Status |
| --------------------------------------------------------- | :----: |
| Drag-and-drop workflow canvas with React Flow             | ✅ |
| All 5 node types (Start, Task, Approval, Automated, End) + ATS bonus | ✅ |
| Connect nodes with edges                                  | ✅ |
| Select/edit/delete nodes                                  | ✅ |
| Start-node constraint validation                          | ✅ |
| Node config forms with dynamic fields                     | ✅ |
| `GET /automations` mock                                   | ✅ |
| `POST /simulate` mock                                     | ✅ |
| Sandbox with step-by-step execution log                   | ✅ |
| Structural validation (missing connections, cycles)       | ✅ |
| Clean folder structure & separation of concerns           | ✅ |
| Reusable primitives, scalable abstractions                | ✅ |
| **Bonus:** Export/Import workflow as JSON                 | ✅ |
| **Bonus:** Mini-map + zoom controls                       | ✅ |
| **Innovation:** Present/Absent auto-routing (user ask)    | ✅ |
| **Innovation:** ATS Resume Checker with auto-fill         | ✅ |
| Undo/Redo                                                 | ➖ |
| Per-node version history                                  | ➖ |

---

## 📄 License

Built as a case-study prototype. Use freely for evaluation.
