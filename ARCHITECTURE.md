# Architecture

`src/emulator.js` contains the MASM parser/directives, 1 MiB memory, segmented physical addressing, 8/16-bit register access, flags, SS:SP stack, single-step interpreter, bounded runner, and immutable history snapshots. `src/encoder.js` emits real 8086 opcodes for the supported register/immediate and register/register forms. `src/main.jsx` is the UI shell with a small CodeMirror 6 assembly mode.
