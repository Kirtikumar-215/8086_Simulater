import { describe, expect, it } from 'vitest';
import { createMachine, parse, run } from './emulator';
import { encode } from './encoder';

describe('8086 subset', () => {
  it('parses labels and instructions', () => { const p = parse('start: MOV AX, 1\nJMP start'); expect(p.labels.START).toBe(0); expect(p.instructions).toHaveLength(2); });
  it('executes arithmetic', () => { const { cpu } = run('MOV AX, 2\nADD AX, 3\nHLT'); expect(cpu.regs.AX).toBe(5); expect(cpu.halted).toBe(true); });
  it('executes programs from non-zero ORG addresses', () => { const { cpu } = run('ORG 100H\nMOV AX, 1\nHLT'); expect(cpu.regs.AX).toBe(1); expect(cpu.halted).toBe(true); expect(cpu.ip).toBe(0x103); });
  it('branches on zero', () => { const { cpu } = run('MOV AX, 1\nSUB AX, 1\nJZ done\nMOV BX, 9\ndone: HLT'); expect(cpu.regs.BX).toBe(0); });
  it('tracks carry through ADC and SBB', () => {
    const { cpu } = run('MOV AX, 0FFFFH\nMOV BX, 0002H\nADD AX, BX\nMOV CX, 0005H\nMOV DX, 0003H\nADC CX, DX\nMOV AX, 0000H\nMOV BX, 0001H\nSBB AX, BX\nINT 03H');
    expect(cpu.regs.CX).toBe(9);
    expect(cpu.regs.AX).toBe(0xffff);
    expect(cpu.flags.CF).toBe(true);
  });
  it('multiplies AL in the AX destination register', () => {
    const { cpu } = run('MOV AL, 05H\nMUL AL\nINT 03H');
    expect(cpu.regs.AX).toBe(0x0019);
    expect(cpu.flags.CF).toBe(false);
    expect(cpu.flags.OF).toBe(false);
  });
  it('creates a genuine byte listing', () => { expect(encode('HLT')).toEqual([0xf4]); });
  it('does not encode the non-executable END directive', () => { expect(encode('MOV AX, 1\nEND')).toEqual([0xb8, 1, 0]); });
  it('accepts MASM hex, directives, byte registers and real encodings', () => {
    const p = parse('ORG 100H\nvalue EQU 2AH\nMOV AL, value\nDB 03H\nDW 1234H');
    expect(p.errors).toEqual([]);
    expect(encode('MOV AL, 03H')).toEqual([0xb0, 3]);
    expect(encode('ADD AX, BX')).toEqual([0x01, 0xd8]);
    expect(run('ORG 20H\nDB 0AAH\nDW 1234H\nHLT').cpu.memory.slice(0x20, 0x23)).toEqual(new Uint8Array([0xaa, 0x34, 0x12]));
  });
  it('rejects invalid data values before execution', () => {
    expect(() => createMachine('DB NOT_A_VALUE')).toThrow('Invalid value: NOT_A_VALUE');
  });
  it('models stack, segments, bytes, flags and breakpoint interrupt', () => {
    const { cpu } = run('MOV AL, 0FFH\nMOV AH, 02H\nPUSH AX\nPOP BX\nADD BL, AL\nINT 03H');
    expect(cpu.regs.BX).toBe(0x02fe);
    expect(cpu.flags.CF).toBe(true);
    expect(cpu.interrupted).toBe(true);
    expect(cpu.memory.length).toBe(1024 * 1024);
  });
  it('encodes the requested instruction forms', () => {
    expect(encode('ADC AX, BX')).toEqual([0x11, 0xd8]);
    expect(encode('SBB AL, BL')).toEqual([0x18, 0xd8]);
    expect(encode('XCHG AX, CX')).toEqual([0x91]);
    expect(encode('PUSH AX')).toEqual([0x50]);
    expect(encode('POP BX')).toEqual([0x5b]);
    expect(encode('MUL AL')).toEqual([0xf6, 0xe0]);
    expect(encode('INT 03H')).toEqual([0xcc]);
  });
  it('assigns instruction addresses using encoded sizes', () => {
    const p = parse('ORG 100H\nMOV AX, 1\nMOV AL, 2\nADD AX, BX\nHLT');
    expect(p.instructions.map(x => x.address)).toEqual([0x100, 0x103, 0x105, 0x107]);
  });
});
