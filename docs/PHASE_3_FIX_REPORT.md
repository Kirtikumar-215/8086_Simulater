# Phase 3 Fix Report

## Confirmed defects fixed

1. Fixed instruction-address tracking so the CPU executes using real instruction addresses rather than array indexes. This corrected stepping, run loops, and label-based jumps when programs did not start at address 0.
2. Corrected arithmetic flag handling for addition, subtraction, ADC, and SBB, including carry/borrow, parity, zero, sign, auxiliary carry, and overflow updates.
3. Hardened execution history snapshots so they keep full CPU state and deep-copy memory rather than sharing mutable arrays.
4. Added regression tests covering branch conditions, carry propagation, and multiplication semantics.

## Files changed

- `src/emulator.js`
- `src/emulator.test.js`
- `docs/PHASE_2_AUDIT.md`
- `docs/PROGRESS.md`
- `docs/TESTING.md`
- `README.md`

## Regression tests added

- Carry propagation through ADC and SBB
- Zero-branch execution with labels
- MUL AL regression covering AX destination behavior
- Explicit verification that the project still supports the practical 8086 acceptance tests

## Tests run

- `npm test` — passed
- `npm run build` — passed

## Tests failed or unavailable

No tests failed after the repair. No browser automation was configured in this repository, so UI browser-level validation was limited to the automated Node-based checks and production build.

## Remaining known issues

- The project intentionally does not implement general memory operands or full MASM feature coverage.
- This remains a focused educational emulator rather than a cycle-accurate 8086 implementation.

## Unsupported instruction forms

The emulator still intentionally omits general memory operands, wider interrupt handling, and full MASM syntax outside the project contract.

## Recommended next phase

The next phase should focus on optional UI polish and broader example coverage only after the 8086 execution engine remains stable and fully verified.
