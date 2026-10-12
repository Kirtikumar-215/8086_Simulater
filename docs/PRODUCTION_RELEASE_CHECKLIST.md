# Production Release Checklist

## Decision

**READY WITH DOCUMENTED LIMITATIONS**

## Completed

- [x] Clean dependency installation with `npm ci`
- [x] Lockfile-based install validation
- [x] `npm test` passes: 19 tests
- [x] `npm run build` passes
- [x] Local production preview verified
- [x] `/Vea/` base-path build verified
- [x] AMP A-F acceptance tests verified
- [x] Browser workflow and responsive checks verified
- [x] Malformed data input is surfaced safely
- [x] Runtime dependency audit reports zero vulnerabilities
- [x] Security review completed
- [x] SBB borrow/flag regression coverage
- [x] Pre-execution validation prevents unencodable instructions
- [x] Signed short jump encoding and range validation
- [x] Copy-on-write memory history behavior covered by regression test

## Final defect-fix verification (2026-10-12)

- `npm ci`: **PASS**; installed from the lockfile, with the existing development advisory warnings.
- `npm test`: **PASS**; 19 tests passed.
- `npm run build`: **PASS**; Vite production bundle generated.
- `npm audit --omit=dev --audit-level=high`: **PASS**; 0 runtime vulnerabilities.
- `npm audit --audit-level=high`: **FAIL / OPEN**; 6 development-tooling advisories remain (3 moderate, 1 high, 2 critical). Automatic remediation requires breaking upgrades, so no upgrade was applied.
- Browser tests: **NOT RUN in this pass**; prior local browser evidence remains documented separately.
- Live deployment: **NOT RUN**; no deployment was authorized.

## Open or not configured

- [ ] Full development dependency audit clean; currently 6 advisories remain
- [ ] Pause control
- [ ] Dedicated Playwright suite
- [ ] Linting
- [ ] GitHub Pages workflow
- [ ] Live deployment verification
- [ ] Current-instruction source highlighting

## Final verification commands

Run after the final defect fixes:

- `npm ci`
- `npm test`
- `npm run build`
- `npm audit --omit=dev --audit-level=high`
- `npm audit --audit-level=high`

Record the actual output and any advisory limitations in the Phase 6 final report before release.

## Deployment steps

1. Add a repository-approved GitHub Pages workflow.
2. Build with `VITE_BASE_PATH=/Vea/`.
3. Publish the generated `dist/` directory.
4. Open the deployed project URL and repeat the Phase 6 browser checks.
5. Do not expose the Vite development server to untrusted networks until the development-tool advisories are addressed.
