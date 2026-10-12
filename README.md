# 8086 Visualizer

Minimal React/Vite educational 8086 emulator. Edit MASM-style assembly, then **Step** or **Run** and inspect registers, flags, segments, stack, memory-backed state, and history.

## Run
`npm install` then `npm run dev`; tests: `npm test`; production check: `npm run build`; local production server: `npm run preview`.

For a sub-path deployment such as GitHub Pages, build with `$env:VITE_BASE_PATH='/Vea/'; npm run build` in PowerShell or `VITE_BASE_PATH=/Vea/ npm run build` in a POSIX shell. The default base path remains `/` for local development.

## Supported subset
`MOV reg,imm`, `ADD/SUB/ADC/SBB reg,reg`, `XCHG`, `PUSH`, `POP`, `MUL AL`, `INT 03H`, and `HLT`; 16-bit and 8-bit registers, `CS/DS/SS/ES`, MASM hex (`03H`), `EQU`, `ORG`, `DB`, `DW`, labels, and comments. `src/encoder.js` emits genuine 8086 bytes for these forms. The model has 1 MiB memory and a real SS:SP stack, but is intentionally not cycle-accurate and does not implement general memory operands, interrupts other than breakpoint `INT 03H`, or the full MASM language.

## Verified runtime behavior

The emulator now executes at true instruction addresses, maintains consistent flag updates for arithmetic instructions, preserves deep-copy execution history snapshots, and continues to pass the automated Vitest suite and production build.

Integration and release evidence is recorded in [docs/PHASE_4_INTEGRATION_REPORT.md](./docs/PHASE_4_INTEGRATION_REPORT.md), [docs/PHASE_5_FINAL_AUDIT.md](./docs/PHASE_5_FINAL_AUDIT.md), and [docs/RELEASE_CHECKLIST.md](./docs/RELEASE_CHECKLIST.md). GitHub Pages deployment automation is not included; use `VITE_BASE_PATH=/Vea/` when building for the project sub-path.

Phase 6 evidence is recorded in [docs/PHASE_6_FINAL_REPORT.md](./docs/PHASE_6_FINAL_REPORT.md), [docs/PHASE_6_ACCEPTANCE_TESTS.md](./docs/PHASE_6_ACCEPTANCE_TESTS.md), and [docs/PRODUCTION_RELEASE_CHECKLIST.md](./docs/PRODUCTION_RELEASE_CHECKLIST.md).
