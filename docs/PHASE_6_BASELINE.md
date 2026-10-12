# Phase 6 Baseline

## Starting state

Baseline was captured from the current workspace before Phase 6 changes.

- Project: React/Vite 8086 emulator and visualizer
- Repository root reported by Git: `C:/Users/kirti`
- Project directory: `C:/Users/kirti/Music/8086`
- Working tree: project files are currently untracked from the reported repository root; no tracked project diff was available to compare
- Node.js: `v26.7.0`
- npm: `11.19.0`

## Existing implementation

- Parser, encoder, CPU, segmented memory, stack, flags, and history are in `src/emulator.js`.
- Supported instruction encodings are in `src/encoder.js`.
- React/CodeMirror integration is in `src/main.jsx`.
- Vitest coverage is in `src/emulator.test.js`.
- Vite has configurable `VITE_BASE_PATH` support and scripts for development, build, preview, and tests.

## Existing verification

The previous Phase 4/5 reports record:

- Unit tests passing
- Production build passing
- Local production preview passing
- AMP A-F examples passing
- Browser integration checks passing
- Default and `/Vea/` base-path builds passing
- Runtime dependency audit reporting zero vulnerabilities

## Outstanding work entering Phase 6

- Produce a final Phase 6 baseline, acceptance-test, browser-test, final-report, and production-checklist set.
- Re-run install, lockfile, unit, build, preview, browser, AMP, and dependency checks against the current source.
- Record that Pause, linting, a dedicated Playwright suite, and GitHub Pages workflow are not configured.
- Record the six development-tool advisories reported by the full npm audit; do not apply breaking upgrades without a separate compatibility decision.
