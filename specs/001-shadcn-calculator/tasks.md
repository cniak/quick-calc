# Tasks: Scoped Web Calculator

## Status: ✅ Phases 1-6 IMPLEMENTED

## Phase 1: Setup (Shared Infrastructure) ✅ COMPLETE

- [x] T001 Initialize Vite React TS app scaffold in `.`
- [x] T002 Add Tailwind CSS setup (postcss, config) in `.`
- [x] T003 [P] Install shadcn/ui and generate base components into `src/components/ui`
- [x] T004 [P] Configure ESLint + Prettier with TypeScript rules in `.`
- [x] T005 Add base `public/index.html` and `src/main.tsx` per plan
- [x] T006 Create global styles `src/app/styles.css` and provider `src/app/providers.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites) ✅ COMPLETE

- [x] T007 Create global store setup with Zustand in `src/state/store.ts`
- [x] T008 [P] Implement LocalStorage persistence helpers in `src/utils/storage.ts`
- [x] T009 Implement evaluation core (parser + safe eval harness) in `src/features/scoped-calculator/utils/evaluator.ts`
- [x] T010 [P] Implement dependency graph builder in `src/features/scoped-calculator/utils/deps.ts`
- [x] T011 Create app layout shell (left scopes panel, right content) in `src/features/scoped-calculator/views/Layout.tsx`
- [x] T012 [P] Configure shadcn/ui base theme tokens and import in `src/app/providers.tsx`

---

## Phase 3: User Story 1 (P1) ✅ COMPLETE

**Story Goal**: Calculate within a named scope with ordered lines and inline results

- [x] T013 [US1] Create calculator lines component in `src/components/calculator-lines/Lines.tsx`
- [x] T014 [P] [US1] Implement line model and types in `src/features/scoped-calculator/state/types.ts`
- [x] T015 [US1] Implement line parsing and validation in `src/features/scoped-calculator/utils/parser.ts`
- [x] T016 [US1] Wire evaluation to render inline results in `src/components/calculator-lines/Lines.tsx`
- [x] T017 [P] [US1] Add error display states for undefined variables/order issues in `src/components/calculator-lines/LineItem.tsx`
- [x] T018 [US1] Persist scope lines locally via helpers in `src/features/scoped-calculator/state/persistence.ts`

---

## Phase 4: User Story 2 (P1) ✅ COMPLETE

**Story Goal**: Switch between scopes via left panel; retain per-scope data

- [x] T019 [US2] Create scope list component in `src/components/scope-list/ScopeList.tsx`
- [x] T020 [P] [US2] Implement scope CRUD (create, rename, delete) in `src/features/scoped-calculator/state/scopes.store.ts`
- [x] T021 [US2] Wire selected scope to layout/content in `src/features/scoped-calculator/views/Layout.tsx`
- [x] T022 [P] [US2] Persist scopes list and selection in `src/features/scoped-calculator/state/persistence.ts`
- [x] T023 [US2] Ensure instant switch performance (memoization) in `src/features/scoped-calculator/hooks/useActiveScope.ts`

---

## Phase 5: User Story 3 (P2) ✅ COMPLETE

**Story Goal**: Define/manage functions with collapse, colored inputs, Save indicator

- [x] T024 [US3] Create functions pane component in `src/components/functions-pane/FunctionsPane.tsx`
- [x] T025 [P] [US3] Implement function model/types in `src/features/scoped-calculator/state/functions.types.ts`
- [x] T026 [US3] Implement Save/unsaved state with `*` indicator in `src/components/functions-pane/FunctionItem.tsx`
- [x] T027 [P] [US3] Add collapse/expand with shadcn/ui components in `src/components/functions-pane/FunctionItem.tsx`
- [x] T028 [US3] Integrate functions into evaluator (callable by name) in `src/features/scoped-calculator/utils/evaluator.ts`
- [x] T029 [P] [US3] Color-tag inputs mapping to styles in `src/components/functions-pane/styles.css`

---

## Phase 6: User Story 4 (P1) ✅ COMPLETE

**Story Goal**: Auto recalculation on input change or function save

- [x] T030 [US4] Wire change detection in calculator lines to trigger recompute in `src/components/calculator-lines/Lines.tsx`
- [x] T031 [P] [US4] Implement recompute batching to avoid UI blocking in `src/features/scoped-calculator/utils/evaluator.ts`
- [x] T032 [US4] Implement dependency-aware downstream updates in `src/features/scoped-calculator/utils/deps.ts`
- [x] T033 [P] [US4] Hook function Save to trigger full recompute in `src/components/functions-pane/FunctionsPane.tsx`
- [x] T034 [US4] Add perf guardrails (simple timing + console warn) in `src/features/scoped-calculator/utils/perf.ts`

---

## Final Phase: Polish & Cross-Cutting Concerns ⏳ PENDING

- [ ] T035 Add keyboard navigation (Enter add line, Tab move, Space collapse) in `src/components/*`
- [ ] T036 [P] A11y checks: focus states, labels, roles in `src/components/*`
- [ ] T037 [P] Responsive layout verification in `src/features/scoped-calculator/views/Layout.tsx`
- [ ] T038 Document quickstart and usage in `README.md`
- [ ] T039 [P] Run Lighthouse and address major issues (manual) in `.`

---

## Implementation Notes

**Completed**: All core functionality is implemented
- Scopes with CRUD operations
- Calculator lines with inline results
- Variable dependencies and evaluation
- Custom functions with save states
- Auto-recalculation
- LocalStorage persistence
- Modern UI with Tailwind

**Note**: Requires Node.js 20.19+ to run (version enforcement active)
