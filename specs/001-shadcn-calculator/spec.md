# Feature Specification: Scoped Web Calculator

**Feature Branch**: `001-shadcn-calculator`  
**Created**: 2026-01-10  
**Status**: Draft  

## User Scenarios & Testing

### User Story 1 - Calculate within a named scope (Priority: P1)

User creates or selects a scope, enters ordered calculation lines (variables and expressions) and sees inline results next to each line.

**Why this priority**: Core value of the app is fast, inline calculation with ordered dependencies.

**Independent Test**: In a single scope, enter:
- `1+1` → shows `2` inline
- `a = 1` → shows `1` inline
- `b = a + 1` → shows `2` inline (depends on earlier `a`)

**Acceptance Scenarios**:
1. **Given** a selected scope, **When** the user enters `1+1`, **Then** `2` appears inline on the same row.
2. **Given** `a = 1` is entered before `b = a + 1`, **When** `b = a + 1` is entered, **Then** the result `2` appears inline next to `b`.
3. **Given** a variable references an undefined or later variable, **When** evaluated, **Then** the line shows a clear error indicator and does not crash the page.

---

### User Story 2 - Switch between scopes (Priority: P1)

User switches scopes via a left panel list; each scope retains its lines, functions, and state.

**Why this priority**: Enables organizing calculations by context; necessary for real‑world use.

**Independent Test**: Create two scopes (e.g., "Salary" and "Budget"), enter distinct lines in each, switch between them and verify data remains intact.

**Acceptance Scenarios**:
1. **Given** two scopes exist, **When** the user selects another scope from the left panel, **Then** the right pane updates to that scope's calculator and functions without losing the other scope's data.
2. **Given** a scope is renamed, **When** switching back and forth, **Then** the new name is shown consistently in the panel and header.

---

### User Story 3 - Define and manage functions (Priority: P2)

User adds simple functions (e.g., `function sum(a, b) { return a + b; }`), collapses/expands them, sees colored inputs for clarity, and uses a Save button to mark saved state.

**Why this priority**: Reusability and clarity for complex calculations.

**Independent Test**: Add a `sum` function, reference it in calculation lines, collapse/expand, toggle Save to mark persisted state, and verify recalculation on save.

**Acceptance Scenarios**:
1. **Given** an unsaved function, **When** the user edits code, **Then** a `*` appears next to the function name until saved.
2. **Given** the user clicks Save on a function, **When** save completes, **Then** recalculation runs and `*` disappears.
3. **Given** functions are collapsed, **When** expanded, **Then** the colored inputs remain consistent for readability.

---

### User Story 4 - Auto recalculation on change (Priority: P1)

Any change in calculator input or function save triggers a full recalculation in correct order.

**Why this priority**: Ensures immediate feedback and correctness.

**Independent Test**: Modify `a` from `1` to `2` and verify all dependent results update instantly.

**Acceptance Scenarios**:
1. **Given** a scope with dependent variables, **When** an earlier variable changes, **Then** all downstream lines show updated results within acceptable performance bounds.

### Edge Cases

- Circular dependency between variables is detected and reported inline without page crash.
- Referencing undefined variables yields a clear inline error state.
- Duplicate variable names within the same scope are disallowed or clearly overridden with user confirmation.
- Large scopes (e.g., 100+ lines) maintain responsive updates and inline rendering.
- Function execution errors (exceptions) are caught and displayed at the function and referencing lines.

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow users to create, name, and switch between scopes via a left panel list.
- **FR-002**: Within a scope, users MUST enter ordered calculation lines supporting literals, assignments (e.g., `a = 1`), and expressions referencing previously defined variables (e.g., `b = a + 1`).
- **FR-003**: System MUST evaluate lines top‑to‑bottom; variables referenced MUST have been defined on prior lines; violations MUST produce a clear inline error.
- **FR-004**: System MUST display each line's computed result inline on the same row.
- **FR-005**: System MUST auto‑recalculate all results whenever a calculator input value changes.
- **FR-006**: System MUST provide a functions pane per scope where users can define simple reusable functions and reference them in expressions.
- **FR-007**: Each function MUST support collapse/expand; inputs MUST be visually distinguishable (colored) for clarity.
- **FR-008**: Each function MUST have a Save control; unsaved changes MUST be indicated with a `*` until saved; saving MUST trigger a full recalculation.
- **FR-009**: System MUST catch and present errors from function execution or expression evaluation without breaking the entire page.
- **FR-010**: System MUST persist scopes, lines, and functions locally in the user's browser (no server dependency) so sessions are recoverable.
- **FR-011**: System SHOULD support basic keyboard navigation for inputs and actions (Enter to add line, Tab to move, Space/Enter to toggle collapse).
- **FR-012**: UI MUST remain responsive on modern browsers and scale to typical laptop/mobile viewports.
- **FR-013**: UI MUST use shadcn/ui as the design system; components and styling MUST adhere to shadcn/ui patterns and accessibility defaults.
- **FR-014**: User‑defined functions MUST execute on the main thread; evaluations MUST avoid perceptible UI blocking by batching updates and limiting heavy computation per tick.

### Key Entities

- **Scope**: id, name, `variables[]`, `functions[]`, createdAt, updatedAt.
- **VariableLine**: lineIndex, name (optional for pure expressions), expression (string), value (computed), error (optional), dependsOn[] (derived).
- **FunctionDef**: name, code (string), isSaved (boolean), isCollapsed (boolean), colorTag (string).
- **EvaluationResult**: lineIndex, output (string/number), error (optional).

## Success Criteria

### Measurable Outcomes

- **SC-001**: Inline results update within 200 ms for scopes up to 100 lines on a typical modern laptop.
- **SC-002**: 95% of valid expressions produce correct results on first evaluation under standard test data sets.
- **SC-003**: Scope switching shows previous content instantly (under 150 ms perceived), with no data loss.
- **SC-004**: Users successfully define and save functions with a visible state change (`*` disappears) and see dependent calculations refresh immediately.
