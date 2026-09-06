# QuantNiti UI Redesign — Team Collaboration & Workflow Guide

**Repository:** `https://github.com/jayaditya/majorproject`  
**Feature Scope:** Frontend React + Vite Migration, Violet Theme, Guided Flows & PWA Mobile Polish  
**Specification:** [`.scratch/ui-redesign/spec.md`](spec.md)  
**Ticket Directory:** [`.scratch/ui-redesign/issues/`](issues/)

---

## 1. Quick Start for Collaborators

### Prerequisites
- **Git**
- **Node.js 18+** & **npm**
- **Python 3.12+** & **uv** (for running backend API services)

### Setup Steps
```bash
# 1. Clone repository
git clone https://github.com/jayaditya/majorproject.git
cd majorproject

# 2. Set up Python virtualenv & backend dependencies
uv sync

# 3. Read the core documentation
# - Domain vocabulary: CONTEXT.md
# - Redesign spec: .scratch/ui-redesign/spec.md
```

---

## 2. Dependency Architecture & Sequencing Rules

Do **not** attempt all tickets in parallel on Day 1. The work is organized into 3 sequential phases:

```
[Phase 1: Foundation]
Ticket 01: React + Vite Scaffold (MUST BE COMPLETED & MERGED FIRST)
   │
   ├── Ticket 02: App Layout Shell & Tab Navigation (Parallel Track A)
   ├── Ticket 03: Shared UI Component Library       (Parallel Track B)
   └── Ticket 04: Async Lifecycle & Abort Registry  (Parallel Track C)
   │
   ▼
[Phase 2: Independent Feature Pages (Can run fully parallel)]
   ├── Ticket 05: Hero Onboarding & Quiz
   ├── Ticket 06: Home Tab
   ├── Ticket 07: Explore Tab & Pro Tools
   ├── Ticket 08: Grow Tab Guided Wizard
   ├── Ticket 09: Portfolio Tab & Demo Portfolio
   └── Ticket 10: Modals & Overlays
   │
   ▼
[Phase 3: Integration & Wrap-Up]
Ticket 11: PWA Finalization & Full Integration Test Suite
```

> [!IMPORTANT]
> **Ticket 01 is the Keystone:**  
> Nobody can branch for Tickets 02–10 until Ticket 01 is merged into `main`. Ticket 01 creates the `package.json`, Vite configuration, and `tailwind.config.js` design tokens.

---

## 3. Parallel Assignment Matrix (Recommended 2-Person Split)

If splitting the work between Developer 1 and Developer 2:

| Phase | Developer 1 | Developer 2 |
| :--- | :--- | :--- |
| **Milestone 1** | **Ticket 01**: React + Vite Scaffold (Pair or single) | Review & test build locally |
| **Milestone 2** | **Ticket 02**: Layout Shell & Bottom Nav<br>**Ticket 04**: Async Lifecycle Hook | **Ticket 03**: Shared Component Library (`GlassCard`, `SegmentedControl`, etc.) |
| **Milestone 3** | **Ticket 05**: Hero Onboarding & Quiz<br>**Ticket 08**: Grow Tab Guided Wizard | **Ticket 06**: Home Tab<br>**Ticket 07**: Explore Tab |
| **Milestone 4** | **Ticket 09**: Portfolio Tab & Demo Mode | **Ticket 10**: Modals & Sheet Overlays |
| **Milestone 5** | **Ticket 11**: PWA Service Worker & Audits | **Ticket 11**: Vitest Integration Test Suite |

---

## 4. Git Branching & PR Workflow

### A. Claiming a Ticket
1. Navigate to `.scratch/ui-redesign/issues/`.
2. Inspect the ticket to verify all items in `Blocked by:` are already merged into `main`.
3. Change `Status: ready-for-agent` to `Status: claimed` (or add your handle).

### B. Creating a Feature Branch
Always start from the freshest `main`:
```bash
git checkout main
git pull origin main
git checkout -b feat/ticket-<NN>-<short-slug>

# Example:
git checkout -b feat/ticket-03-shared-components
```

### C. Design & Code Constraints to Follow
- **Primary Accent**: Electric Violet (`#7C3AED` / `from-violet-500 to-indigo-500`).
- **Financial Semantics**: Keep green (`#10B981`) for profit/positive and red (`#EB5B3C`) for loss/drawdown.
- **Card Aesthetics**: Non-boxy squircles (`rounded-2xl` or `rounded-3xl`), hairline borders (`border-violet-400/20`), no harsh black drop shadows.
- **Async Safety**: Every data fetch must pass the `AbortSignal` from Ticket 04 so changing tabs cancels the request.
- **Domain Names**: Use the exact names in `CONTEXT.md` (*Portfolio Basket*, *Market Regime*, *Trust Card*, *Demo Portfolio*, *Virtual Paper Portfolio*).

### D. Testing Before Submitting PR
```bash
# Run unit & component tests
npm run test

# Check formatting/build
npm run build
```

### E. Opening the Pull Request
1. Push branch to GitHub:
   ```bash
   git push origin feat/ticket-<NN>-<short-slug>
   ```
2. Open a Pull Request into `main`.
3. Title format: `feat(ui): [Ticket <NN>] <Short Title>`
4. In the PR description, link the ticket file:
   ```markdown
   Closes .scratch/ui-redesign/issues/<NN>-<slug>.md

   ### Changes
   - Implemented X component with Framer Motion transitions
   - Added unit tests verifying Y behavior
   ```
5. Once merged, update the ticket status in the file to `Status: resolved`.

---

## 5. Local Development Commands Reference

| Action | Command |
| :--- | :--- |
| **Start FastAPI backend** | `uv run uvicorn src.app.api.app:app --reload --port 8000` |
| **Start Vite frontend dev server** | `npm run dev` |
| **Build frontend for production** | `npm run build` |
| **Run frontend test suite** | `npm run test` |
