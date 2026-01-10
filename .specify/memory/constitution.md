<!--
Sync Impact Report

 - Version change: none → 1.0.0
- Modified principles: placeholders → concrete minimal static web principles
- Added sections: Additional Constraints, Development Workflow, Governance finalized
- Removed sections: none
- Templates requiring updates: none (existing templates reference constitution generically)
- Deferred TODOs: none
-->

# Calculator v2 Constitution

## Core Principles

### I. Static-Only Delivery
The application MUST be served as static assets (HTML, CSS, JS, images). No server‑side code, databases, or runtime backends are required or allowed for core functionality. A lightweight local dev server MAY be used for testing but MUST not introduce backend logic.

### II. Minimal Footprint
Prefer vanilla HTML/CSS/JS. Frameworks or build tools are OPTIONAL and MUST be justified by a clear need. Keep dependencies small and simple; avoid heavy client bundles. Scripts SHOULD be loaded with `defer` when possible and styles SHOULD be in a single CSS file for simplicity.

### III. Standards & Accessibility Basics (NON‑NEGOTIABLE)
Use semantic HTML, proper labels for interactive controls, and maintain keyboard operability (Tab/Enter/Space) for primary actions. Include a responsive layout and `meta viewport` for mobile. Basic color contrast and focus visibility MUST be preserved.

### IV. Build & Deploy Simplicity
The project MUST be shippable by serving `index.html`, `styles.css`, `script.js`, and static assets directly on any static host (e.g., GitHub Pages). No mandatory build step. If a bundler is introduced, the output MUST still be static files and the process MUST remain reproducible.

### V. Versioning & Simplicity
Favor clear, readable code and simple structure over abstractions. Errors may be logged via `console` during development but avoid noisy runtime logging in production. Governance follows semantic versioning: MAJOR for breaking governance changes, MINOR for new principles/sections, PATCH for clarifications.

## Additional Constraints

- Minimal file structure: `index.html`, `styles.css`, `script.js`, and optional `assets/`.
- No secrets or credentials in the repository. No analytics/tracking by default.
- Target modern evergreen browsers; degrade gracefully without polyfills unless strictly needed.
- Basic performance hygiene: avoid blocking scripts, unnecessary large images, and unused libraries.

## Development Workflow

- Local run: open `index.html` directly or use a simple static server.
- Basic checks in reviews: semantic HTML, keyboard accessibility for interactive controls, responsive layout, and absence of backend dependencies.
- Optional validation: run Lighthouse or similar for a quick sanity check; fix obvious issues that violate the principles above.

## Governance

This constitution supersedes other practices for this project. Amendments require a pull request with rationale and, if applicable, a migration note. All PRs MUST verify compliance with the Core Principles and Additional Constraints. Any introduction of build tools or new dependencies MUST include justification in the PR description.

**Version**: 1.0.0 | **Ratified**: 2026-01-10 | **Last Amended**: 2026-01-10
