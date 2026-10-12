export const WORD_REGS = ['AX', 'BX', 'CX', 'DX', 'SP', 'BP', 'SI', 'DI'];
export const BYTE_REGS = ['AL', 'CL', 'DL', 'BL', 'AH', 'CH', 'DH', 'BH'];
export const SEG_REGS = ['CS', 'DS', 'SS', 'ES'];
export const REGISTERS = [...WORD_REGS, ...BYTE_REGS, ...SEG_REGS];
export const EXAMPLES = {
  'Arithmetic': `MOV AX, 1234H\nMOV BX, 10H\nADD AX, BX\nPUSH AX\nPOP CX\nHLT`,
  'Stack and bytes': `MOV AL, 7FH\nMOV AH, 02H\nXCHG AL, AH\nPUSH AX\nPOP BX\nHLT`,
  'Interrupt': `MOV AX, 0\nINT 03H\nHLT`
};
const OPS = new Set(['MOV', 'ADD', 'SUB', 'ADC', 'SBB', 'XCHG', 'PUSH', 'POP', 'MUL', 'INT', 'HLT', 'JMP', 'JZ', 'JNZ']);
const clean = s => s.replace(/;.*$/, '').trim();
const WORD_CODES = { AX: 0, CX: 1, DX: 2, BX: 3, SP: 4, BP: 5, SI: 6, DI: 7 };
const BYTE_CODES = { AL: 0, CL: 1, DL: 2, BL: 3, AH: 4, CH: 5, DH: 6, BH: 7 };
const cloneCpuState = cpu => ({
  ...cpu,
  regs: { ...cpu.regs },
  flags: { ...cpu.flags },
  segments: { ...cpu.segments },
  memory: new Uint8Array(cpu.memory),
  output: [...cpu.output],
  program: [...cpu.program],
});
const u16 = n => n & 0xffff;
const phys = (seg, off) => (((seg << 4) + off) & 0xfffff);
const read16 = (m, a) => m[a] | (m[(a + 1) & 0xfffff] << 8);
const write16 = (m, a, v) => { m[a] = v & 255; m[(a + 1) & 0xfffff] = (v >> 8) & 255; };
const parity = n => { let count = 0; for (let x = n & 255; x; x &= x - 1) count++; return count % 2 === 0; };

export function instructionSize(statement) {
  const [a, b] = statement.args, A = a?.toUpperCase(), B = b?.toUpperCase();
  if (statement.op === 'DB') return statement.args.length;
  if (statement.op === 'DW') return statement.args.length * 2;
  if (statement.op === 'MOV') return WORD_CODES[A] !== undefined ? 3 : BYTE_CODES[A] !== undefined ? 2 : 1;
  if (['ADD', 'SUB', 'ADC', 'SBB'].includes(statement.op)) return 2;
  if (statement.op === 'XCHG' && (A === 'AX' || B === 'AX')) return 1;
  if (statement.op === 'XCHG') return 2;
  if (['PUSH', 'POP', 'INT'].includes(statement.op)) return 1;
  if (statement.op === 'MUL') return 2;
  if (statement.op === 'HLT') return 1;
  if (['JMP', 'JZ', 'JNZ'].includes(statement.op)) return 2;
  return 2;
}

export function number(text, symbols = {}) {
  const t = text.trim().toUpperCase();
  if (t in symbols) return symbols[t];
  if (/^[0-9A-F]+H$/.test(t)) return parseInt(t.slice(0, -1), 16);
  if (/^0X[0-9A-F]+$/.test(t)) return parseInt(t, 16);
  if (/^-?\d+$/.test(t)) return Number(t);
  if (/^'[^\']'$/.test(t) || /^"[^"]"$/.test(t)) return t.charCodeAt(1);
  throw Error(`Invalid value: ${text}`);
}

export function parse(source) {
  const lines = source.split(/\r?\n/), labels = {}, symbols = {}, statements = [], errors = [];
  let address = 0;
  for (let index = 0; index < lines.length; index++) {
    const raw = lines[index];
    let text = clean(raw); if (!text) continue;
    const label = text.match(/^([A-Za-z_.$?][\w.$?]*):/);
    if (label) {
      const key = label[1].toUpperCase();
      if (key in labels) errors.push(`Line ${index + 1}: duplicate label ${key}`);
      labels[key] = address;
      symbols[key] = address;
      text = text.slice(label[0].length).trim();
      if (!text) continue;
    }
    const equ = text.match(/^([A-Za-z_.$?][\w.$?]*)\s+EQU\s+(.+)$/i);
    if (equ) {
      const name = equ[1].toUpperCase();
      try { symbols[name] = number(equ[2], symbols); } catch (e) { errors.push(`Line ${index + 1}: ${e.message}`); }
      continue;
    }
    const [token, ...rest] = text.split(/\s+/), op = token.toUpperCase();
    const args = rest.join(' ').split(',').map(x => x.trim()).filter(Boolean);
    if (op === 'ORG') {
      try { address = number(args[0], symbols); } catch (e) { errors.push(`Line ${index + 1}: ${e.message}`); }
      continue;
    }
    if (op === 'END') {
      const statement = { op, args, line: index + 1, text, address };
      statements.push(statement);
      break;
    }
    if (!OPS.has(op) && !['DB', 'DW'].includes(op)) {
      errors.push(`Line ${index + 1}: unsupported instruction/directive ${token}`);
    }
    const statement = { op, args, line: index + 1, text, address };
    statements.push(statement);
    if (op === 'DB') address += args.length;
    else if (op === 'DW') address += args.length * 2;
    else address += instructionSize(statement);
  }
  return { instructions: statements.filter(s => OPS.has(s.op)), labels, symbols, errors, statements };
}

function getReg(cpu, name) {
  const r = name.toUpperCase();
  if (BYTE_REGS.includes(r)) {
    const base = r[0] + 'X';
    const value = cpu.regs[base];
    return r[1] === 'L' ? value & 255 : (value >> 8) & 255;
  }
  if (r in cpu.regs) return cpu.regs[r];
  throw Error(`Unknown register: ${name}`);
}

function setReg(cpu, name, value) {
  const r = name.toUpperCase();
  const v = u16(value);
  if (BYTE_REGS.includes(r)) {
    const base = r[0] + 'X';
    const old = cpu.regs[base];
    if (r[1] === 'L') cpu.regs[base] = (old & 0xff00) | (v & 255);
    else cpu.regs[base] = (old & 255) | ((v & 255) << 8);
    return;
  }
  if (r in cpu.regs) { cpu.regs[r] = v; return; }
  throw Error(`Unknown register: ${name}`);
}

function applyArithFlags(cpu, lhs, rhs, result, subtract = false, carryIn = 0, width = 16) {
  const mask = width === 8 ? 0xff : 0xffff;
  const signBitMask = width === 8 ? 0x80 : 0x8000;
  const low = result & mask;
  const carry = subtract ? (lhs < (rhs + carryIn)) : ((lhs + rhs + carryIn) > mask);
  cpu.flags.CF = carry;
  cpu.flags.ZF = low === 0;
  cpu.flags.SF = !!(low & signBitMask);
  cpu.flags.PF = parity(low);
  cpu.flags.AF = ((lhs ^ rhs ^ low) & 0x10) !== 0;
  if (!subtract) cpu.flags.OF = (((lhs ^ low) & ~(lhs ^ rhs) & signBitMask) !== 0);
  else cpu.flags.OF = (((lhs ^ rhs) & (lhs ^ low) & signBitMask) !== 0);
}

export function createCpu(program = [], memory = new Uint8Array(1024 * 1024)) {
  const cpu = {
    regs: Object.fromEntries(REGISTERS.map(r => [r, r === 'SP' ? 0xfffe : 0])),
    ip: 0,
    flags: { CF: false, PF: false, AF: false, ZF: false, SF: false, OF: false, IF: true, DF: false },
    segments: { CS: 0, DS: 0, SS: 0, ES: 0 },
    memory,
    halted: false,
    interrupted: false,
    output: [],
    program,
  };
  if (program.length) cpu.ip = program[0].address;
  return cpu;
}

function findInstructionAt(program, ip) {
  return program.find(ins => ins.address === ip) ?? null;
}

export function step(cpu, parsed = { labels: {}, symbols: {} }) {
  if (cpu.halted || cpu.interrupted) return cloneCpuState(cpu);
  const ins = findInstructionAt(cpu.program, cpu.ip);
  if (!ins) {
    const next = cloneCpuState(cpu);
    next.halted = true;
    return next;
  }
  const next = cloneCpuState(cpu);
  const [a, b] = ins.args;
  const width = a && BYTE_REGS.includes(a.toUpperCase()) ? 8 : 16;
  const valueOf = x => {
    const name = x?.toUpperCase();
    if (name && REGISTERS.includes(name)) return getReg(next, name);
    return number(x, parsed.symbols);
  };
  try {
    if (ins.op === 'MOV') {
      setReg(next, a, valueOf(b));
    } else if (['ADD', 'SUB', 'ADC', 'SBB'].includes(ins.op)) {
      const av = getReg(next, a);
      const bv = valueOf(b);
      const subtract = ins.op === 'SUB' || ins.op === 'SBB';
      const carryIn = (ins.op === 'ADC' || ins.op === 'SBB') && next.flags.CF ? 1 : 0;
      const result = subtract ? (av - bv - carryIn) : (av + bv + carryIn);
      setReg(next, a, result);
      applyArithFlags(next, av, bv + (subtract ? carryIn : 0), result, subtract, carryIn, width);
    } else if (ins.op === 'XCHG') {
      const av = getReg(next, a);
      setReg(next, a, getReg(next, b));
      setReg(next, b, av);
    } else if (ins.op === 'PUSH') {
      next.regs.SP = u16(next.regs.SP - 2);
      write16(next.memory, phys(next.segments.SS, next.regs.SP), getReg(next, a));
    } else if (ins.op === 'POP') {
      const addr = phys(next.segments.SS, next.regs.SP);
      setReg(next, a, read16(next.memory, addr));
      next.regs.SP = u16(next.regs.SP + 2);
    } else if (ins.op === 'MUL') {
      const operand = valueOf(a);
      const product = (next.regs.AX & 0xff) * operand;
      next.regs.AX = product & 0xffff;
      next.flags.CF = next.flags.OF = (product > 0xff);
    } else if (ins.op === 'INT') {
      const vector = valueOf(a);
      if (vector === 3) {
        next.interrupted = true;
        next.output.push('INT 3 breakpoint');
      } else {
        throw Error(`Unsupported interrupt: ${vector}`);
      }
    } else if (ins.op === 'JMP') {
      const target = parsed.labels[a.toUpperCase()];
      if (target === undefined) throw Error(`Unknown label: ${a}`);
      next.ip = target;
      return next;
    } else if (ins.op === 'JZ') {
      const target = parsed.labels[a.toUpperCase()];
      if (target === undefined) throw Error(`Unknown label: ${a}`);
      if (next.flags.ZF) next.ip = target;
      else next.ip = ins.address + instructionSize(ins);
      return next;
    } else if (ins.op === 'JNZ') {
      const target = parsed.labels[a.toUpperCase()];
      if (target === undefined) throw Error(`Unknown label: ${a}`);
      if (!next.flags.ZF) next.ip = target;
      else next.ip = ins.address + instructionSize(ins);
      return next;
    } else if (ins.op === 'HLT') {
      next.halted = true;
      return next;
    }
    if (!next.halted && !next.interrupted && ins.op !== 'JMP' && ins.op !== 'JZ' && ins.op !== 'JNZ') {
      next.ip = ins.address + instructionSize(ins);
    }
  } catch (e) {
    next.halted = true;
    next.output.push(e.message);
  }
  return next;
}

function loadData(cpu, parsed) {
  for (const statement of parsed.statements) {
    if (statement.op !== 'DB' && statement.op !== 'DW') continue;
    let address = phys(cpu.segments.DS, statement.address);
    for (const item of statement.args) {
      const n = number(item, parsed.symbols);
      if (statement.op === 'DB') cpu.memory[address++ & 0xfffff] = n & 255;
      else { write16(cpu.memory, address, n); address += 2; }
    }
  }
}

export function createMachine(source) {
  const parsed = parse(source);
  const cpu = createCpu(parsed.instructions);
  loadData(cpu, parsed);
  return { parsed, cpu };
}

export function run(source, max = 1000) {
  const { parsed, cpu: initial } = createMachine(source);
  let cpu = cloneCpuState(initial);
  const history = [cloneCpuState(cpu)];
  for (let i = 0; i < max && !cpu.halted && !cpu.interrupted; i++) {
    cpu = step(cpu, parsed);
    history.push(cloneCpuState(cpu));
  }
  return { cpu, parsed, history };
}
