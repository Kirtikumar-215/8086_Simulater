# Release Checklist

## Status

**READY WITH DOCUMENTED LIMITATIONS**

## Verification

- [x] `npm test` passes: 12 tests
- [x] `npm run build` passes
- [x] `npm run preview` serves the production bundle locally
- [x] Default-root production bundle loads
- [x] `/Vea/` base-path build emits correctly prefixed assets
- [x] AMP examples A-F verified
- [x] Step, Step Back, Run, Reset, example loading, diagnostics, breakpoint output, and termination verified
- [x] Desktop and 375px responsive overflow checks pass
- [x] Production page-error check passes
- [x] Bounded long-running loop verified
- [x] Security/dependency/secrets review completed
- [x] Runtime dependency audit passes with 0 vulnerabilities
- [ ] Development dependency advisories resolved; `npm audit` currently reports 6 advisories requiring breaking upgrades

## Not configured or not applicable

- [ ] Pause control: not implemented
- [ ] Dedicated Playwright suite: not configured
- [ ] Linting: no lint command is defined
- [ ] GitHub Pages workflow: not present

## Manual steps before GitHub Pages release

1. Add a repository-approved GitHub Pages workflow.
2. Set `VITE_BASE_PATH=/Vea/` in that workflow for the `Kirtikumar-215/Vea` project site.
3. Authorize and run deployment.
4. Open the deployed URL and repeat the core browser checks.
5. Plan a controlled Vitest/Vite toolchain upgrade for the reported development-only advisories.
