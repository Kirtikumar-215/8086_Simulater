# Production Release Checklist

## Decision

**READY WITH DOCUMENTED LIMITATIONS**

## Completed

- [x] Clean dependency installation with `npm ci`
- [x] Lockfile-based install validation
- [x] `npm test` passes: 13 tests
- [x] `npm run build` passes
- [x] Local production preview verified
- [x] `/Vea/` base-path build verified
- [x] AMP A-F acceptance tests verified
- [x] Browser workflow and responsive checks verified
- [x] Malformed data input is surfaced safely
- [x] Runtime dependency audit reports zero vulnerabilities
- [x] Security review completed

## Open or not configured

- [ ] Full development dependency audit clean; currently 6 advisories remain
- [ ] Pause control
- [ ] Dedicated Playwright suite
- [ ] Linting
- [ ] GitHub Pages workflow
- [ ] Live deployment verification
- [ ] Current-instruction source highlighting

## Deployment steps

1. Add a repository-approved GitHub Pages workflow.
2. Build with `VITE_BASE_PATH=/Vea/`.
3. Publish the generated `dist/` directory.
4. Open the deployed project URL and repeat the Phase 6 browser checks.
5. Do not expose the Vite development server to untrusted networks until the development-tool advisories are addressed.
