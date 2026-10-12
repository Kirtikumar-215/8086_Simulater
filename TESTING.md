# Testing

Vitest covers labels, MASM hex/directives/data loading, genuine instruction encodings, arithmetic flags, byte registers, stack memory, breakpoint interrupts, halting, label branches, carry propagation, non-zero ORG execution, and the non-executable END directive.

Commands:

- `npm test`
- `npm run build`
- `npm run preview -- --host 127.0.0.1 --port 4173`

For a GitHub Pages-style build, use `$env:VITE_BASE_PATH='/Vea/'; npm run build` in PowerShell or `VITE_BASE_PATH=/Vea/ npm run build` in a POSIX shell. The project currently has no dedicated Playwright suite, lint script, or GitHub Pages workflow. Phase 4 and Phase 6 browser evidence are recorded in [docs/PHASE_4_INTEGRATION_REPORT.md](./docs/PHASE_4_INTEGRATION_REPORT.md), [docs/PHASE_6_BROWSER_TESTS.md](./docs/PHASE_6_BROWSER_TESTS.md), and [docs/PHASE_6_FINAL_REPORT.md](./docs/PHASE_6_FINAL_REPORT.md).
