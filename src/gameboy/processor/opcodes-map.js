import { Z80, RegMap } from './';

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */
// TODO: Fix nameing and structure!
const opcodes = {
  0x00: cpu => Z80.other.NOP(),

  // -------- 8 bit load --------
  // 1. LD nn n
  0x06: cpu => Z80.load8.LDnnn(cpu, RegMap.b),
  0x0E: cpu => Z80.load8.LDnnn(cpu, RegMap.c),
  0x16: cpu => Z80.load8.LDnnn(cpu, RegMap.d),
  0x1E: cpu => Z80.load8.LDnnn(cpu, RegMap.e),
  0x26: cpu => Z80.load8.LDnnn(cpu, RegMap.h),
  0x2E: cpu => Z80.load8.LDnnn(cpu, RegMap.l),

  // 2. LD r1 r2
  0x7F: cpu => Z80.load8.LDrr(cpu, RegMap.a, RegMap.a),
  0x78: cpu => Z80.load8.LDrr(cpu, RegMap.a, RegMap.b),
  0x79: cpu => Z80.load8.LDrr(cpu, RegMap.a, RegMap.c),
  0x7A: cpu => Z80.load8.LDrr(cpu, RegMap.a, RegMap.d),
  0x7B: cpu => Z80.load8.LDrr(cpu, RegMap.a, RegMap.e),
  0x7C: cpu => Z80.load8.LDrr(cpu, RegMap.a, RegMap.h),
  0x7D: cpu => Z80.load8.LDrr(cpu, RegMap.a, RegMap.l),
  0x40: cpu => Z80.load8.LDrr(cpu, RegMap.b, RegMap.b),
  0x41: cpu => Z80.load8.LDrr(cpu, RegMap.b, RegMap.c),
  0x42: cpu => Z80.load8.LDrr(cpu, RegMap.b, RegMap.d),
  0x43: cpu => Z80.load8.LDrr(cpu, RegMap.b, RegMap.e),
  0x44: cpu => Z80.load8.LDrr(cpu, RegMap.b, RegMap.h),
  0x45: cpu => Z80.load8.LDrr(cpu, RegMap.b, RegMap.l),
  0x46: cpu => Z80.load8.LDrHL(cpu, RegMap.b),
  0x48: cpu => Z80.load8.LDrr(cpu, RegMap.c, RegMap.b),
  0x49: cpu => Z80.load8.LDrr(cpu, RegMap.c, RegMap.c),
  0x4A: cpu => Z80.load8.LDrr(cpu, RegMap.c, RegMap.d),
  0x4B: cpu => Z80.load8.LDrr(cpu, RegMap.c, RegMap.e),
  0x4C: cpu => Z80.load8.LDrr(cpu, RegMap.c, RegMap.h),
  0x4D: cpu => Z80.load8.LDrr(cpu, RegMap.c, RegMap.l),
  0x4E: cpu => Z80.load8.LDrHL(cpu, RegMap.c),
  0x50: cpu => Z80.load8.LDrr(cpu, RegMap.d, RegMap.b),
  0x51: cpu => Z80.load8.LDrr(cpu, RegMap.d, RegMap.c),
  0x52: cpu => Z80.load8.LDrr(cpu, RegMap.d, RegMap.d),
  0x53: cpu => Z80.load8.LDrr(cpu, RegMap.d, RegMap.e),
  0x54: cpu => Z80.load8.LDrr(cpu, RegMap.d, RegMap.h),
  0x55: cpu => Z80.load8.LDrr(cpu, RegMap.d, RegMap.l),
  0x56: cpu => Z80.load8.LDrHL(cpu, RegMap.d),
  0x58: cpu => Z80.load8.LDrr(cpu, RegMap.e, RegMap.b),
  0x59: cpu => Z80.load8.LDrr(cpu, RegMap.e, RegMap.c),
  0x5A: cpu => Z80.load8.LDrr(cpu, RegMap.e, RegMap.d),
  0x5B: cpu => Z80.load8.LDrr(cpu, RegMap.e, RegMap.e),
  0x5C: cpu => Z80.load8.LDrr(cpu, RegMap.e, RegMap.h),
  0x5D: cpu => Z80.load8.LDrr(cpu, RegMap.e, RegMap.l),
  0x5E: cpu => Z80.load8.LDrHL(cpu, RegMap.e),
  0x60: cpu => Z80.load8.LDrr(cpu, RegMap.h, RegMap.b),
  0x61: cpu => Z80.load8.LDrr(cpu, RegMap.h, RegMap.c),
  0x62: cpu => Z80.load8.LDrr(cpu, RegMap.h, RegMap.d),
  0x63: cpu => Z80.load8.LDrr(cpu, RegMap.h, RegMap.e),
  0x64: cpu => Z80.load8.LDrr(cpu, RegMap.h, RegMap.h),
  0x65: cpu => Z80.load8.LDrr(cpu, RegMap.h, RegMap.l),
  0x66: cpu => Z80.load8.LDrHL(cpu, RegMap.h),
  0x68: cpu => Z80.load8.LDrr(cpu, RegMap.l, RegMap.b),
  0x69: cpu => Z80.load8.LDrr(cpu, RegMap.l, RegMap.c),
  0x6A: cpu => Z80.load8.LDrr(cpu, RegMap.l, RegMap.d),
  0x6B: cpu => Z80.load8.LDrr(cpu, RegMap.l, RegMap.e),
  0x6C: cpu => Z80.load8.LDrr(cpu, RegMap.l, RegMap.h),
  0x6D: cpu => Z80.load8.LDrr(cpu, RegMap.l, RegMap.l),
  0x6E: cpu => Z80.load8.LDrHL(cpu, RegMap.l),
  0x70: cpu => Z80.load8.LDHLr(cpu, RegMap.b),
  0x71: cpu => Z80.load8.LDHLr(cpu, RegMap.c),
  0x72: cpu => Z80.load8.LDHLr(cpu, RegMap.d),
  0x73: cpu => Z80.load8.LDHLr(cpu, RegMap.e),
  0x74: cpu => Z80.load8.LDHLr(cpu, RegMap.h),
  0x75: cpu => Z80.load8.LDHLr(cpu, RegMap.l),
  0x36: cpu => Z80.load8.LDHLn(cpu),

  // 3. LD A, n
  0x0A: cpu => Z80.load8.LDAm(cpu, RegMap.bc),
  0x1A: cpu => Z80.load8.LDAm(cpu, RegMap.de),
  0x7E: cpu => Z80.load8.LDAm(cpu, RegMap.hl),
  0xFA: cpu => Z80.load8.LDAMemoryFromImmediate(cpu),
  0x3E: cpu => Z80.load8.LDAImmediate(cpu),

  // 4. LD n, A
  0x47: cpu => Z80.load8.LDrr(cpu, RegMap.b, RegMap.a),
  0x4F: cpu => Z80.load8.LDrr(cpu, RegMap.c, RegMap.a),
  0x57: cpu => Z80.load8.LDrr(cpu, RegMap.d, RegMap.a),
  0x5F: cpu => Z80.load8.LDrr(cpu, RegMap.e, RegMap.a),
  0x67: cpu => Z80.load8.LDrr(cpu, RegMap.h, RegMap.a),
  0x6F: cpu => Z80.load8.LDrr(cpu, RegMap.l, RegMap.a),
  0x02: cpu => Z80.load8.LDrmr(cpu, RegMap.bc, RegMap.a),
  0x12: cpu => Z80.load8.LDrmr(cpu, RegMap.de, RegMap.a),
  0x77: cpu => Z80.load8.LDrmr(cpu, RegMap.hl, RegMap.a),
  0xEA: cpu => Z80.load8.LDMemoryFromImmediateA(cpu),

  // 5/6. LD A, (C) value at address FF00 + reg c into a and opposite
  0xF2: cpu => Z80.load8.LDACPlusConst(cpu),
  0xE2: cpu => Z80.load8.LDCPlusConstA(cpu),

  // 7/8/9 LDD A, (HL)
  0x3A: cpu => Z80.load8.LDDAHL(cpu),

  // 10/11/12 LDD (HL), A
  0x32: cpu => Z80.load8.LDDHLA(cpu),

  // 13/13/15 LDI A, (HL)
  0x2A: cpu => Z80.load8.LDIAHL(cpu),

  // 16/17/18 LDI (HL), A
  0x22: cpu => Z80.load8.LDIHLA(cpu),

  // 19 LDH (n), A
  0xE0: cpu => Z80.load8.LDHImmediateMemA(cpu),

  // 20 LDH A, (n)
  0xF0: cpu => Z80.load8.LDHImmediateMemA(cpu),

  // -------- 16 bit load --------
  // 1. LD n,nn
  0x01: cpu => Z80.load16.LDImmediateIntoReg(cpu, RegMap.BC),
  0x11: cpu => Z80.load16.LDImmediateIntoReg(cpu, RegMap.DE),
  0x21: cpu => Z80.load16.LDImmediateIntoReg(cpu, RegMap.HL),
  0x31: cpu => Z80.load16.LDImmediateIntoReg(cpu, RegMap.SP),

  // 2. LD SP,HL
  0xF9: cpu => Z80.load16.LDRegToReg(cpu, RegMap.hl, RegMap.sp),

  // 3/4. LD HL,SP+n
  0xF8: cpu => Z80.load16.LDHLFromSPPlusImmediate(cpu),

  // 5. LD (nn), SP
  0x08: cpu => Z80.load16.LDSPIntoImmediate(cpu),

  // 6. Push nn
  0xF5: cpu => Z80.load16.PUSHnn(cpu, RegMap.af),
  0xC5: cpu => Z80.load16.PUSHnn(cpu, RegMap.bc),
  0xD5: cpu => Z80.load16.PUSHnn(cpu, RegMap.de),
  0xE5: cpu => Z80.load16.PUSHnn(cpu, RegMap.hl),

  // 7. Popnn
  0xF1: cpu => Z80.load16.POPnn(cpu, RegMap.af),
  0xC1: cpu => Z80.load16.POPnn(cpu, RegMap.bc),
  0xD1: cpu => Z80.load16.POPnn(cpu, RegMap.de),
  0xE1: cpu => Z80.load16.POPnn(cpu, RegMap.hl),

  // -------- 8 bit ALU --------
  // 1. Add A, n
  0x87: cpu => Z80.alu8.ADDAn(cpu, RegMap.a),
  0x80: cpu => Z80.alu8.ADDAn(cpu, RegMap.b),
  0x81: cpu => Z80.alu8.ADDAn(cpu, RegMap.c),
  0x82: cpu => Z80.alu8.ADDAn(cpu, RegMap.d),
  0x83: cpu => Z80.alu8.ADDAn(cpu, RegMap.e),
  0x84: cpu => Z80.alu8.ADDAn(cpu, RegMap.h),
  0x85: cpu => Z80.alu8.ADDAn(cpu, RegMap.l),
  0x86: cpu => Z80.alu8.ADDAMemHL(cpu),
  0xC6: cpu => Z80.alu8.ADDAImmediate(cpu),

  // 2. ADC A,n
  0x8F: cpu => Z80.alu8.ADCAnPlusC(cpu, RegMap.a),
  0x88: cpu => Z80.alu8.ADCAnPlusC(cpu, RegMap.b),
  0x89: cpu => Z80.alu8.ADCAnPlusC(cpu, RegMap.c),
  0x8A: cpu => Z80.alu8.ADCAnPlusC(cpu, RegMap.d),
  0x8B: cpu => Z80.alu8.ADCAnPlusC(cpu, RegMap.e),
  0x8C: cpu => Z80.alu8.ADCAnPlusC(cpu, RegMap.h),
  0x8D: cpu => Z80.alu8.ADCAnPlusC(cpu, RegMap.l),
  0x8E: cpu => Z80.alu8.ADDAMemHLPlusCarry(cpu),
  0xCE: cpu => Z80.alu8.ADDAImmediatePlusCarry(cpu),

  // 3 INC nn (16 bit reg)
  0x03: cpu => Z80.alu16.INCnn(cpu, RegMap.bc),
  0x13: cpu => Z80.alu16.INCnn(cpu, RegMap.de),
  0x23: cpu => Z80.alu16.INCnn(cpu, RegMap.hl),
  0x33: cpu => Z80.alu16.INCnn(cpu, RegMap.sp),

  // 4. DEC nn (16 bit reg)
  0x0B: cpu => Z80.alu16.DECnn(cpu, RegMap.bc),
  0x1B: cpu => Z80.alu16.DECnn(cpu, RegMap.de),
  0x2B: cpu => Z80.alu16.DECnn(cpu, RegMap.hl),
  0x3B: cpu => Z80.alu16.DECnn(cpu, RegMap.sp),

  // Add HL
  0x09: cpu => Z80.alu8.ADDHLn(cpu, RegMap.bc),
  0x19: cpu => Z80.alu8.ADDHLn(cpu, RegMap.de),
  0x29: cpu => Z80.alu8.ADDHLn(cpu, RegMap.hl),
  0x39: cpu => Z80.alu8.ADDHLn(cpu, RegMap.sp),
};

export default opcodes;
