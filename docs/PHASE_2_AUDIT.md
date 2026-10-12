# Phase 2 Audit

## Workspace and dependency findings

- Project type: Vite + React + Vitest, package.json defines a minimal educational 8086 emulator.
- Dependencies are lightweight and aligned with the scope: React, CodeMirror, Vite, Vitest, and jsdom.
- The workspace includes a built `dist/` bundle, but the source of truth remains in `src/`.
- `npm test` and `npm run build` were both executed and the project is buildable in the current environment.

## Architecture review

The project has a clear split between parser, encoder, and emulator logic:

- `src/emulator.js` contains parsing, instruction sizing, memory, register alias behavior, flags, stepping, and execution history snapshots.
- `src/encoder.js` emits byte sequences for supported instruction forms.
- `src/main.jsx` is a UI shell that wires the editor, state, and execution controls to the core engine.

The main architectural risk was not a duplicate CPU implementation in the UI, but inconsistent execution state management: instruction addresses were being treated as array indexes in some flows instead of actual instruction addresses. This could break stepping, run loops, and label-based jumps when the program did not start at address 0.

## Missing or incomplete files

No critical source files were missing. The project already had the required app shell and test file. The missing deliverables were the audit and repair reports required by the Phase 2/3 workflow.

## Supported and unsupported features

Supported:

- MOV immediate to word and byte registers
- ADD/SUB/ADC/SBB with register/register semantics in the supported subset
- XCHG, PUSH/POP, MUL AL, INT 03H, HLT
- MASM-style hex immediates, ORG, EQU, DB, DW, comments, labels
- 1 MiB memory, segmented address model, and SS:SP stack behavior

Unsupported or intentionally out of scope:

- General memory operands
- Full 8086 interrupt vector handling
- Full MASM language coverage
- Cycle-accurate timing
- Complete flag semantics for every opcode outside the supported subset

## Confirmed defects and severity

### Confirmed defects

1. Critical: instruction pointer behavior was not tied to true instruction addresses; stepping and jumps could drift when ORG or labels were involved.
2. High: arithmetic flag updates were not consistently modeled for carry/borrow and signed overflow behavior.
3. Medium: run/history snapshots did not reliably preserve the full machine state across stepped execution when the code executed from non-zero addresses.
4. Medium: no regression tests covered critical carry and branch edge cases.

### Suspected issues that were not confirmed

- Detailed browser UI bugs beyond the engine core were not reproduced in automated tests.
- Unsupported instruction families outside the project scope were deliberately left out rather than implemented.

## Test commands and actual results

Commands run:

- `npm test` → passed
- `npm run build` → passed

The project had a passing baseline suite, but the initial emulator still had latent defects in execution-address tracking and arithmetic semantics. Those defects were repaired and additional regression tests were added to guard the affected logic.

## Instruction encoding verification results

Verified against the supported subset:

- `HLT` → `[0xf4]`
- `MOV AL, 03H` → `[0xb0, 0x03]`
- `ADD AX, BX` → `[0x01, 0xd8]`
- `ADC AX, BX` → `[0x11, 0xd8]`
- `SBB AL, BL` → `[0x18, 0xd8]`
- `XCHG AX, CX` → `[0x91]`
- `PUSH AX` → `[0x50]`
- `POP BX` → `[0x5b]`
- `MUL AL` → `[0xf6, 0xe0]`
- `INT 03H` → `[0xcc]`

## AMP practical acceptance-test results

### Test A — Addition

Program:

```
MOV AX, 4343H
MOV BX, 0111H
ADD AX, BX
INT 03H
```

Expected result: AX = `4454H`; verified.

### Test B — Subtraction

Program:

```
MOV AX, 2222H
MOV BX, 0001H
SUB AX, BX
INT 03H
```

Expected result: AX = `2221H`; verified.

### Test C — Carry and ADC

Program:

```
MOV AX, 0FFFFH
MOV BX, 0002H
ADD AX, BX
MOV CX, 0005H
MOV DX, 0003H
ADC CX, DX
INT 03H
```

Verified: AX = `0001H`, CF after ADD = 1, CX = `0009H` after ADC.

### Test D — XCHG

Program:

```
MOV AX, 1234H
MOV BX, 5678H
XCHG AX, BX
INT 03H
```

Verified: AX = `5678H`, BX = `1234H`.

### Test E — Stack

Program:

```
PUSH AX
PUSH BX
POP CX
POP DX
INT 03H
```

Verified using initialized AX/BX values: CX = `2222H`, DX = `1111H`.

### Test F — Square

Program:

```
MOV AL, 05H
MUL AL
INT 03H
```

Verified: AX = `0019H`.

## Security and dependency concerns

- No direct security issue was found in the current build.
- Dependencies are narrow and standard for a lightweight Vite app.
- The highest-risk issue was correctness of CPU execution semantics, not external exposure or unsafe code paths.

## Recommended Phase 3 repair order

1. Fix instruction-address mapping and branch semantics.
2. Correct arithmetic and flag behavior.
3. Harden execution history and memory snapshotting.
4. Add regression tests for offset/branch/carry edge cases.
5. Re-run the full test suite and build validation.

## Final Phase 2 verdict

The repository was viable but not fully hardened against incorrect execution semantics. The confirmed defects were addressed in Phase 3 with targeted fixes and regression coverage, while unsupported language features remain deliberately out of scope.
