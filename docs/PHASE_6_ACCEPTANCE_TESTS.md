# Phase 6 Acceptance Tests

All programs below were executed through the actual parser, encoder, CPU engine, and history path. Expected values are independent 8086 register/stack results.

| Test | Initial state | Expected bytes | Actual bytes | Intermediate/final result | Status |
|---|---|---|---|---|---|
| A Addition | AX=0, BX=0 | `b8 43 43 bb 11 01 01 d8 cc` | Same | After ADD AX=`4454H`; stopped at INT 03H | PASS |
| B Subtraction | AX=0, BX=0 | `b8 22 22 bb 01 00 29 d8 cc` | Same | After SUB AX=`2221H`; stopped at INT 03H | PASS |
| C Carry and ADC | AX=0, BX=0, CX=0, DX=0 | `b8 ff ff bb 02 00 01 d8 b9 05 00 ba 03 00 11 d1 cc` | Same | After ADD AX=`0001H`, CF=1; after ADC CX=`0009H`; stopped at INT 03H | PASS |
| D Register exchange | AX=0, BX=0 | `b8 34 12 bb 78 56 93 cc` | Same | After XCHG AX=`5678H`, BX=`1234H`; stopped at INT 03H | PASS |
| E PUSH/POP | AX=0, BX=0, SP=`FFFEH` | `b8 11 11 bb 22 22 50 53 59 5a cc` | Same | CX=`2222H`, DX=`1111H`, SP restored; stopped at INT 03H | PASS |
| F Multiplication | AX=0 | `b0 05 f6 e0 cc` | Same | MUL AL produces AX=`0019H`, CF=0, OF=0; stopped at INT 03H | PASS |

Additional checks:

- `ORG 100H` execution starts at IP=`0100H` and reaches HLT at the correct address: PASS.
- `DB NOT_A_VALUE` reports `Invalid value: NOT_A_VALUE` without crashing the UI: PASS.
- `loop: JMP loop` is bounded at 1000 executed steps: PASS.
- `END` does not produce an instruction encoding: PASS.
