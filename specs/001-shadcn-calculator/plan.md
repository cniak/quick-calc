# Implementation Plan: Scoped Web Calculator

**Branch**: `001-shadcn-calculator` | **Date**: 2026-01-10 | **Spec**: specs/001-shadcn-calculator/spec.md

## Summary

Build a modern, fast calculator with named scopes. Each scope contains ordered lines (variables and expressions) with inline results, plus a functions pane with collapsible colored inputs and a Save indicator. UI uses shadcn/ui; app runs entirely as static assets; persistence is local (browser storage). Evaluations run in main thread with careful batching to keep the UI responsive.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: React 19, Vite 7, Tailwind CSS 4, shadcn/ui (Radix UI + Tailwind), Zustand 5 (state), lucide-react (icons)  
**Storage**: LocalStorage (scopes, lines, functions); optional in‑memory cache  
**Testing**: Vitest (unit), React Testing Library; optional Playwright for basic E2E flows  
**Target Platform**: Modern evergreen browsers (Chrome, Edge, Firefox, Safari)  
**Project Type**: web (static build)  
**Performance Goals**: Inline updates ≤200 ms for ≤100 lines per scope; scope switch perceived ≤150 ms  
**Constraints**: Static hosting only; no backend. Main‑thread evaluation for functions; avoid blocking via batching and diff‑based recompute.  
**Scale/Scope**: 10–50 scopes typical; up to 100 lines per scope; functions per scope: 1–10.

## Constitution Check

Gate result: PASS

- Static‑Only Delivery: Output is static assets (Vite build to `dist/`).
- Minimal Footprint: Limited deps; shadcn/ui justified by design requirement.
- Accessibility Basics: Radix primitives + Tailwind patterns; keyboard operability enforced.
- Build & Deploy Simplicity: Single static build; deploy to any static host.

## Project Structure

### Documentation (this feature)

```text
specs/001-shadcn-calculator/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── providers.tsx
│   └── styles.css
├── components/
│   ├── scope-list/
│   ├── calculator-lines/
│   ├── functions-pane/
│   └── ui/            # shadcn/ui components (generated)
├── features/
│   └── scoped-calculator/
│       ├── state/
│       ├── hooks/
│       ├── utils/
│       └── views/
├── state/              # global store (Zustand)
├── utils/
└── main.tsx

tests/
├── unit/
├── integration/
└── e2e/ (optional)

public/
└── index.html
```

**Structure Decision**: Single static web app using Vite. Feature‑centric folders (`features/scoped-calculator`) separate domain logic; `components/ui` holds shadcn/ui generated components.

## Complexity Tracking

No violations requiring justification.
