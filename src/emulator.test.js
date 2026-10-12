import { describe, expect, it } from 'vitest';
import { createMachine, parse, run } from './emulator';
import { encode } from './encoder';

describe('8086 subset', () => {
  it('parses labels and instructions', () => { const p = parse('start: MOV AX, 1\nJMP start'); expect(p.labels.START).toBe(0); expect(p.instructions).toHaveLength(2); });
  it('executes arithmetic', () => { const { cpu } = run('MOV AX, 2\nMOV BX, 3\nADD AX, BX\nHLT'); expect(cpu.regs.AX).toBe(5); expect(cpu.halted).toBe(true); });
  it('executes programs from non-zero ORG addresses', () => { const { cpu } = run('ORG 100H\nMOV AX, 1\nHLT'); expect(cpu.regs.AX).toBe(1); expect(cpu.halted).toBe(true); expect(cpu.ip).toBe(0x103); });
  it('branches on zero', () => { const { cpu } = run('MOV AX, 1\nMOV BX, 1\nSUB AX, BX\nJZ done\nMOV CX, 9\ndone: HLT'); expect(cpu.regs.CX).toBe(0); });
  it('tracks carry through ADC and SBB', () => {
    const { cpu } = run('MOV AX, 0FFFFH\nMOV BX, 0002H\nADD AX, BX\nMOV CX, 0005H\nMOV DX, 0003H\nADC CX, DX\nMOV AX, 0000H\nMOV BX, 0001H\nSBB AX, BX\nINT 03H');
    expect(cpu.regs.CX).toBe(9);
    expect(cpu.regs.AX).toBe(0xffff);
    expect(cpu.flags.CF).toBe(true);
  });
  it('handles SBB borrow without counting CF twice', () => {
    const noBorrow = run('MOV AX, 1\nMOV BX, 0\nSBB AX, BX\nINT 03H').cpu;
    expect(noBorrow.regs.AX).toBe(1);
    expect(noBorrow.flags.CF).toBe(false);
    const word = run('MOV AX, 0\nMOV BX, 1\nSUB AX, BX\nMOV AX, 0\nMOV BX, 0\nSBB AX, BX\nINT 03H').cpu;
    expect(word.regs.AX).toBe(0xffff);
    expect(word.flags.CF).toBe(true);
    const byte = run('MOV AL, 0\nMOV BL, 1\nSUB AL, BL\nMOV AL, 0\nMOV BL, 0\nSBB AL, BL\nINT 03H').cpu;
    expect(byte.regs.AX).toBe(0xff);
    expect(byte.flags.CF).toBe(true);
  });
  it('preserves AF and OF for SBB boundary values', () => {
    const { cpu } = run('MOV AX, 8000H\nMOV BX, 1\nSBB AX, BX\nINT 03H');
    expect(cpu.flags.AF).toBe(true);
    expect(cpu.flags.OF).toBe(true);
    const byte = run('MOV AL, 80H\nMOV BL, 1\nSBB AL, BL\nINT 03H').cpu;
    expect(byte.regs.AX).toBe(0x007f);
    expect(byte.flags.AF).toBe(true);
    expect(byte.flags.OF).toBe(true);
  });
  it('multiplies AL in the AX destination register', () => {
    const { cpu } = run('MOV AL, 05H\nMUL AL\nINT 03H');
    expect(cpu.regs.AX).toBe(0x0019);
    expect(cpu.flags.CF).toBe(false);
    expect(cpu.flags.OF).toBe(false);
  });
  it('creates a genuine byte listing', () => { expect(encode('HLT')).toEqual([0xf4]); });
  it('encodes short conditional and unconditional jumps', () => {
    expect(encode('JMP done\nHLT\ndone: JZ done')).toEqual([0xeb, 0x01, 0xf4, 0x74, 0xfe]);
  });
  it('rejects short jumps outside the signed displacement range', () => {
    const source = `JMP far\n${'HLT\n'.repeat(130)}far: HLT`;
    expect(() => encode(source)).toThrow('out of short-jump range');
    expect(() => createMachine(source)).toThrow('out of short-jump range');
  });
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
  it('rejects instructions that the encoder cannot represent', () => {
    for (const source of ['MOV AX, BX', 'PUSH AL', 'ADD AX, AL']) {
      expect(() => createMachine(source)).toThrow(/requires|unsupported/);
      expect(() => encode(source)).toThrow(/requires|unsupported/);
    }
  });
  it('reverses stack memory changes without copying every history state', () => {
    const { history } = run('MOV AX, 1234H\nPUSH AX\nPOP BX\nHLT');
    expect(history[0].memory[0xfffc]).toBe(0);
    expect(history[2].memory[0xfffc]).toBe(0x34);
    expect(history[2].memory[0xfffd]).toBe(0x12);
    expect(history[3].memory[0xfffc]).toBe(0x34);
    expect(history[4].memory[0xfffc]).toBe(0x34);
    expect(history[4].regs.SP).toBe(0xfffe);
  });
});
