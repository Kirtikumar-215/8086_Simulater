# Project specification

## Goal
Provide a small, understandable 8086-inspired visualizer for stepping through beginner assembly.

## Contract
Source is parsed into instructions, labels, symbols, and MASM data directives. CPU state has 16-bit and 8-bit aliases, IP, CS/DS/SS/ES, 1 MiB memory, SS:SP stack behavior, CF/PF/AF/ZF/SF/OF/IF/DF, halted/breakpoint state, and immutable states in execution history. Each Step executes at most one instruction; Run is bounded at 1000 steps. Encoder output uses Intel 8086 encodings for the specified forms.

## Limitations
This intentionally omits general memory operands, full interrupt/vector handling, timing, and complete Intel/MASM syntax. `INT 03H` is modeled as a debugger breakpoint. Invalid operands halt execution and appear in output.
