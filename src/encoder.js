import { BYTE_REGS, WORD_REGS, parse, number } from './emulator.js';
const WORD_CODES = { AX: 0, CX: 1, DX: 2, BX: 3, SP: 4, BP: 5, SI: 6, DI: 7 };
const BYTE_CODES = { AL: 0, CL: 1, DL: 2, BL: 3, AH: 4, CH: 5, DH: 6, BH: 7 };
const w = r => WORD_CODES[r.toUpperCase()] ?? -1, b = r => BYTE_CODES[r.toUpperCase()] ?? -1;
const modrm = (reg, rm) => 0xc0 | (reg << 3) | rm;
export function encode(source) {
  const parsed = parse(source); if (parsed.errors.length) throw Error(parsed.errors.join('\n'));
  return parsed.statements.flatMap(i => {
    const [a, c] = i.args, A = a?.toUpperCase(), C = c?.toUpperCase();
    if (i.op === 'END') return [];
    if (i.op === 'DB') return i.args.map(x => number(x, parsed.symbols) & 255);
    if (i.op === 'DW') return i.args.flatMap(x => { const n = number(x, parsed.symbols); return [n & 255, n >> 8]; });
    if (i.op === 'MOV' && w(A) >= 0 && c) { const n = number(c, parsed.symbols); return [0xb8 + w(A), n & 255, n >> 8]; }
    if (i.op === 'MOV' && b(A) >= 0 && c) return [0xb0 + b(A), number(c, parsed.symbols) & 255];
    if (['ADD', 'SUB', 'ADC', 'SBB'].includes(i.op) && w(A) >= 0 && w(C) >= 0) return [{ ADD: 0x01, SUB: 0x29, ADC: 0x11, SBB: 0x19 }[i.op], modrm(w(C), w(A))];
    if (['ADD', 'SUB', 'ADC', 'SBB'].includes(i.op) && b(A) >= 0 && b(C) >= 0) return [{ ADD: 0x00, SUB: 0x28, ADC: 0x10, SBB: 0x18 }[i.op], modrm(b(C), b(A))];
    if (i.op === 'XCHG' && A === 'AX' && w(C) >= 0) return [0x90 + w(C)];
    if (i.op === 'XCHG' && w(A) >= 0 && w(C) >= 0) return [0x87, modrm(w(C), w(A))];
    if (i.op === 'XCHG' && b(A) >= 0 && b(C) >= 0) return [0x86, modrm(b(C), b(A))];
    if (i.op === 'PUSH' && w(A) >= 0) return [0x50 + w(A)];
    if (i.op === 'POP' && w(A) >= 0) return [0x58 + w(A)];
    if (i.op === 'MUL' && A === 'AL') return [0xf6, 0xe0];
    if (i.op === 'INT' && number(a, parsed.symbols) === 3) return [0xcc];
    if (i.op === 'HLT') return [0xf4];
    if (i.op === 'JMP' || i.op === 'JZ' || i.op === 'JNZ') {
      const displacement = parsed.labels[A] - (i.address + 2);
      return [{ JMP: 0xeb, JZ: 0x74, JNZ: 0x75 }[i.op], displacement & 0xff];
    }
    throw Error(`Cannot encode line ${i.line}: ${i.text}`);
  });
}
