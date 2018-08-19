import { Z80, RegMap } from './';

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */
const opcodes = {
  0xCB: () => { throw Error('A opcode modifier should not be called'); },
  // -------- 8 bit load --------
  // 1. LD nn n
  0x06: cpu => Z80.load8.ldImmediate(cpu, RegMap.b),
  0x0E: cpu => Z80.load8.ldImmediate(cpu, RegMap.c),
  0x16: cpu => Z80.load8.ldImmediate(cpu, RegMap.d),
  0x1E: cpu => Z80.load8.ldImmediate(cpu, RegMap.e),
  0x26: cpu => Z80.load8.ldImmediate(cpu, RegMap.h),
  0x2E: cpu => Z80.load8.ldImmediate(cpu, RegMap.l),

  // 2. LD r1 r2
  0x7F: cpu => Z80.load8.ld(cpu, RegMap.a, RegMap.a),
  0x78: cpu => Z80.load8.ld(cpu, RegMap.a, RegMap.b),
  0x79: cpu => Z80.load8.ld(cpu, RegMap.a, RegMap.c),
  0x7A: cpu => Z80.load8.ld(cpu, RegMap.a, RegMap.d),
  0x7B: cpu => Z80.load8.ld(cpu, RegMap.a, RegMap.e),
  0x7C: cpu => Z80.load8.ld(cpu, RegMap.a, RegMap.h),
  0x7D: cpu => Z80.load8.ld(cpu, RegMap.a, RegMap.l),
  0x40: cpu => Z80.load8.ld(cpu, RegMap.b, RegMap.b),
  0x41: cpu => Z80.load8.ld(cpu, RegMap.b, RegMap.c),
  0x42: cpu => Z80.load8.ld(cpu, RegMap.b, RegMap.d),
  0x43: cpu => Z80.load8.ld(cpu, RegMap.b, RegMap.e),
  0x44: cpu => Z80.load8.ld(cpu, RegMap.b, RegMap.h),
  0x45: cpu => Z80.load8.ld(cpu, RegMap.b, RegMap.l),
  0x46: cpu => Z80.load8.ldMemHL(cpu, RegMap.b),
  0x48: cpu => Z80.load8.ld(cpu, RegMap.c, RegMap.b),
  0x49: cpu => Z80.load8.ld(cpu, RegMap.c, RegMap.c),
  0x4A: cpu => Z80.load8.ld(cpu, RegMap.c, RegMap.d),
  0x4B: cpu => Z80.load8.ld(cpu, RegMap.c, RegMap.e),
  0x4C: cpu => Z80.load8.ld(cpu, RegMap.c, RegMap.h),
  0x4D: cpu => Z80.load8.ld(cpu, RegMap.c, RegMap.l),
  0x4E: cpu => Z80.load8.ldMemHL(cpu, RegMap.c),
  0x50: cpu => Z80.load8.ld(cpu, RegMap.d, RegMap.b),
  0x51: cpu => Z80.load8.ld(cpu, RegMap.d, RegMap.c),
  0x52: cpu => Z80.load8.ld(cpu, RegMap.d, RegMap.d),
  0x53: cpu => Z80.load8.ld(cpu, RegMap.d, RegMap.e),
  0x54: cpu => Z80.load8.ld(cpu, RegMap.d, RegMap.h),
  0x55: cpu => Z80.load8.ld(cpu, RegMap.d, RegMap.l),
  0x56: cpu => Z80.load8.ldMemHL(cpu, RegMap.d),
  0x58: cpu => Z80.load8.ld(cpu, RegMap.e, RegMap.b),
  0x59: cpu => Z80.load8.ld(cpu, RegMap.e, RegMap.c),
  0x5A: cpu => Z80.load8.ld(cpu, RegMap.e, RegMap.d),
  0x5B: cpu => Z80.load8.ld(cpu, RegMap.e, RegMap.e),
  0x5C: cpu => Z80.load8.ld(cpu, RegMap.e, RegMap.h),
  0x5D: cpu => Z80.load8.ld(cpu, RegMap.e, RegMap.l),
  0x5E: cpu => Z80.load8.ldMemHL(cpu, RegMap.e),
  0x60: cpu => Z80.load8.ld(cpu, RegMap.h, RegMap.b),
  0x61: cpu => Z80.load8.ld(cpu, RegMap.h, RegMap.c),
  0x62: cpu => Z80.load8.ld(cpu, RegMap.h, RegMap.d),
  0x63: cpu => Z80.load8.ld(cpu, RegMap.h, RegMap.e),
  0x64: cpu => Z80.load8.ld(cpu, RegMap.h, RegMap.h),
  0x65: cpu => Z80.load8.ld(cpu, RegMap.h, RegMap.l),
  0x66: cpu => Z80.load8.ldMemHL(cpu, RegMap.h),
  0x68: cpu => Z80.load8.ld(cpu, RegMap.l, RegMap.b),
  0x69: cpu => Z80.load8.ld(cpu, RegMap.l, RegMap.c),
  0x6A: cpu => Z80.load8.ld(cpu, RegMap.l, RegMap.d),
  0x6B: cpu => Z80.load8.ld(cpu, RegMap.l, RegMap.e),
  0x6C: cpu => Z80.load8.ld(cpu, RegMap.l, RegMap.h),
  0x6D: cpu => Z80.load8.ld(cpu, RegMap.l, RegMap.l),
  0x6E: cpu => Z80.load8.ldMemHL(cpu, RegMap.l),
  0x70: cpu => Z80.load8.ldMemHLReg(cpu, RegMap.b),
  0x71: cpu => Z80.load8.ldMemHLReg(cpu, RegMap.c),
  0x72: cpu => Z80.load8.ldMemHLReg(cpu, RegMap.d),
  0x73: cpu => Z80.load8.ldMemHLReg(cpu, RegMap.e),
  0x74: cpu => Z80.load8.ldMemHLReg(cpu, RegMap.h),
  0x75: cpu => Z80.load8.ldMemHLReg(cpu, RegMap.l),
  0x36: cpu => Z80.load8.ldMemHLImmediate(cpu),

  // 3. LD A, n
  0x0A: cpu => Z80.load8.ldRegAMem(cpu, RegMap.bc),
  0x1A: cpu => Z80.load8.ldRegAMem(cpu, RegMap.de),
  0x7E: cpu => Z80.load8.ldRegAMem(cpu, RegMap.hl),
  0xFA: cpu => Z80.load8.ldRegAImmediateWord(cpu),
  0x3E: cpu => Z80.load8.ldAImmediate(cpu),

  // 4. LD n, A
  0x47: cpu => Z80.load8.ld(cpu, RegMap.b, RegMap.a),
  0x4F: cpu => Z80.load8.ld(cpu, RegMap.c, RegMap.a),
  0x57: cpu => Z80.load8.ld(cpu, RegMap.d, RegMap.a),
  0x5F: cpu => Z80.load8.ld(cpu, RegMap.e, RegMap.a),
  0x67: cpu => Z80.load8.ld(cpu, RegMap.h, RegMap.a),
  0x6F: cpu => Z80.load8.ld(cpu, RegMap.l, RegMap.a),
  0x02: cpu => Z80.load8.ldMemRegA(cpu, RegMap.bc, RegMap.a),
  0x12: cpu => Z80.load8.ldMemRegA(cpu, RegMap.de, RegMap.a),
  0x77: cpu => Z80.load8.ldMemRegA(cpu, RegMap.hl, RegMap.a),
  0xEA: cpu => Z80.load8.ldImmediateA(cpu),

  // 5/6. LD A, (C) value at address FF00 + reg c into a and opposite
  0xF2: cpu => Z80.load8.ldRegARegCPlusConst(cpu),
  0xE2: cpu => Z80.load8.ldRegCPlusConstRegA(cpu),

  // 7/8/9 LDD A, (HL)
  0x3A: cpu => Z80.load8.lddRegAMemHL(cpu),

  // 10/11/12 LDD (HL), A
  0x32: cpu => Z80.load8.lddMemHLRegA(cpu),

  // 13/13/15 LDI A, (HL)
  0x2A: cpu => Z80.load8.ldiRegAMemHL(cpu),

  // 16/17/18 LDI (HL), A
  0x22: cpu => Z80.load8.ldiMemHLRegA(cpu),

  // 19 LDH (n), A
  0xE0: cpu => Z80.load8.ldhMemFF00PlusImmediateRegA(cpu),

  // 20 LDH A, (n)
  0xF0: cpu => Z80.load8.ldhRegAMemFF00PlusImmediate(cpu),

  // -------- 16 bit load --------
  // 1. LD n,nn
  0x01: cpu => Z80.load16.ldImmediateIntoReg(cpu, RegMap.BC),
  0x11: cpu => Z80.load16.ldImmediateIntoReg(cpu, RegMap.DE),
  0x21: cpu => Z80.load16.ldImmediateIntoReg(cpu, RegMap.HL),
  0x31: cpu => Z80.load16.ldImmediateIntoReg(cpu, RegMap.SP),

  // 2. LD SP,HL
  0xF9: cpu => Z80.load16.ldRegToReg(cpu, RegMap.hl, RegMap.sp),

  // 3/4. LD HL,SP+n
  0xF8: cpu => Z80.load16.ldHLFromSPPlusImmediate(cpu),

  // 5. LD (nn), SP
  0x08: cpu => Z80.load16.ldSPIntoImmediate(cpu),

  // 6. Push nn
  0xF5: cpu => Z80.load16.push(cpu, RegMap.af),
  0xC5: cpu => Z80.load16.push(cpu, RegMap.bc),
  0xD5: cpu => Z80.load16.push(cpu, RegMap.de),
  0xE5: cpu => Z80.load16.push(cpu, RegMap.hl),

  // 7. Popnn
  0xF1: cpu => Z80.load16.pop(cpu, RegMap.af),
  0xC1: cpu => Z80.load16.pop(cpu, RegMap.bc),
  0xD1: cpu => Z80.load16.pop(cpu, RegMap.de),
  0xE1: cpu => Z80.load16.pop(cpu, RegMap.hl),

  // -------- 8 bit ALU --------
  // 1. Add A, n
  0x87: cpu => Z80.alu8.add(cpu, RegMap.a),
  0x80: cpu => Z80.alu8.add(cpu, RegMap.b),
  0x81: cpu => Z80.alu8.add(cpu, RegMap.c),
  0x82: cpu => Z80.alu8.add(cpu, RegMap.d),
  0x83: cpu => Z80.alu8.add(cpu, RegMap.e),
  0x84: cpu => Z80.alu8.add(cpu, RegMap.h),
  0x85: cpu => Z80.alu8.add(cpu, RegMap.l),
  0x86: cpu => Z80.alu8.addMemHL(cpu),
  0xC6: cpu => Z80.alu8.addImmediate(cpu),

  // 2. ADC A,n
  0x8F: cpu => Z80.alu8.adcPlusCarry(cpu, RegMap.a),
  0x88: cpu => Z80.alu8.adcPlusCarry(cpu, RegMap.b),
  0x89: cpu => Z80.alu8.adcPlusCarry(cpu, RegMap.c),
  0x8A: cpu => Z80.alu8.adcPlusCarry(cpu, RegMap.d),
  0x8B: cpu => Z80.alu8.adcPlusCarry(cpu, RegMap.e),
  0x8C: cpu => Z80.alu8.adcPlusCarry(cpu, RegMap.h),
  0x8D: cpu => Z80.alu8.adcPlusCarry(cpu, RegMap.l),
  0x8E: cpu => Z80.alu8.adcMemHLPlusCarry(cpu),
  0xCE: cpu => Z80.alu8.adcImmediatePlusCarry(cpu),

  // 3. SUB n
  0x97: cpu => Z80.alu8.sub(cpu, RegMap.a),
  0x90: cpu => Z80.alu8.sub(cpu, RegMap.b),
  0x91: cpu => Z80.alu8.sub(cpu, RegMap.c),
  0x92: cpu => Z80.alu8.sub(cpu, RegMap.d),
  0x93: cpu => Z80.alu8.sub(cpu, RegMap.e),
  0x94: cpu => Z80.alu8.sub(cpu, RegMap.h),
  0x95: cpu => Z80.alu8.sub(cpu, RegMap.l),
  0x96: cpu => Z80.alu8.subMemHL(cpu),
  0xD6: cpu => Z80.alu8.subImmediate(cpu),

  // 4. SBC A,n
  0x9F: cpu => Z80.alu8.sbc(cpu, RegMap.a),
  0x98: cpu => Z80.alu8.sbc(cpu, RegMap.b),
  0x99: cpu => Z80.alu8.sbc(cpu, RegMap.c),
  0x9A: cpu => Z80.alu8.sbc(cpu, RegMap.d),
  0x9B: cpu => Z80.alu8.sbc(cpu, RegMap.e),
  0x9C: cpu => Z80.alu8.sbc(cpu, RegMap.h),
  0x9D: cpu => Z80.alu8.sbc(cpu, RegMap.l),
  0x9E: cpu => Z80.alu8.sbcMemHL(cpu),

  // 5. AND n
  0xA7: cpu => Z80.alu8.and(cpu, RegMap.a),
  0xA0: cpu => Z80.alu8.and(cpu, RegMap.b),
  0xA1: cpu => Z80.alu8.and(cpu, RegMap.c),
  0xA2: cpu => Z80.alu8.and(cpu, RegMap.d),
  0xA3: cpu => Z80.alu8.and(cpu, RegMap.e),
  0xA4: cpu => Z80.alu8.and(cpu, RegMap.h),
  0xA5: cpu => Z80.alu8.and(cpu, RegMap.l),
  0xA6: cpu => Z80.alu8.andMemHL(cpu),
  0xE6: cpu => Z80.alu8.andImmediate(cpu),

  // 6. OR n
  0xB7: cpu => Z80.alu8.or(cpu, RegMap.a),
  0xB0: cpu => Z80.alu8.or(cpu, RegMap.b),
  0xB1: cpu => Z80.alu8.or(cpu, RegMap.c),
  0xB2: cpu => Z80.alu8.or(cpu, RegMap.d),
  0xB3: cpu => Z80.alu8.or(cpu, RegMap.e),
  0xB4: cpu => Z80.alu8.or(cpu, RegMap.H),
  0xB5: cpu => Z80.alu8.or(cpu, RegMap.l),
  0xB6: cpu => Z80.alu8.orMemHL(cpu),
  0xF6: cpu => Z80.alu8.orImmediate(cpu),

  // 7. XOR n
  0xAF: cpu => Z80.alu8.xor(cpu, RegMap.a),
  0xA8: cpu => Z80.alu8.xor(cpu, RegMap.b),
  0xA9: cpu => Z80.alu8.xor(cpu, RegMap.c),
  0xAA: cpu => Z80.alu8.xor(cpu, RegMap.d),
  0xAB: cpu => Z80.alu8.xor(cpu, RegMap.e),
  0xAC: cpu => Z80.alu8.xor(cpu, RegMap.H),
  0xAD: cpu => Z80.alu8.xor(cpu, RegMap.l),
  0xAE: cpu => Z80.alu8.xorMemHL(cpu),
  0xEE: cpu => Z80.alu8.xorImmediate(cpu),

  // 8 CP n
  0xBF: cpu => Z80.alu8.cp(cpu, RegMap.a),
  0xB8: cpu => Z80.alu8.cp(cpu, RegMap.b),
  0xB9: cpu => Z80.alu8.cp(cpu, RegMap.c),
  0xBA: cpu => Z80.alu8.cp(cpu, RegMap.d),
  0xBB: cpu => Z80.alu8.cp(cpu, RegMap.e),
  0xBC: cpu => Z80.alu8.cp(cpu, RegMap.h),
  0xBD: cpu => Z80.alu8.cp(cpu, RegMap.l),
  0xBE: cpu => Z80.alu8.cpMemHL(cpu),
  0xFE: cpu => Z80.alu8.cpImmediate(cpu),

  // 9 INC n
  0x3C: cpu => Z80.alu8.inc(cpu, RegMap.a),
  0x04: cpu => Z80.alu8.inc(cpu, RegMap.b),
  0x0c: cpu => Z80.alu8.inc(cpu, RegMap.c),
  0x14: cpu => Z80.alu8.inc(cpu, RegMap.d),
  0x1C: cpu => Z80.alu8.inc(cpu, RegMap.e),
  0x24: cpu => Z80.alu8.inc(cpu, RegMap.h),
  0x2C: cpu => Z80.alu8.inc(cpu, RegMap.l),
  0x34: cpu => Z80.alu8.incMemHL(cpu, RegMap.a),

  // 10 INC n
  0x3D: cpu => Z80.alu8.dec(cpu, RegMap.a),
  0x05: cpu => Z80.alu8.dec(cpu, RegMap.b),
  0x0D: cpu => Z80.alu8.dec(cpu, RegMap.c),
  0x15: cpu => Z80.alu8.dec(cpu, RegMap.d),
  0x1D: cpu => Z80.alu8.dec(cpu, RegMap.e),
  0x25: cpu => Z80.alu8.dec(cpu, RegMap.h),
  0x2D: cpu => Z80.alu8.dec(cpu, RegMap.l),
  0x35: cpu => Z80.alu8.decMemHL(cpu, RegMap.a),

  // -------- 16 bit ALU --------
  // 1. Add HL, n
  0x09: cpu => Z80.alu16.addRegHLReg(cpu, RegMap.bc),
  0x19: cpu => Z80.alu16.addRegHLReg(cpu, RegMap.de),
  0x29: cpu => Z80.alu16.addRegHLReg(cpu, RegMap.hl),
  0x39: cpu => Z80.alu16.addRegHLReg(cpu, RegMap.sp),

  // 2. ADD SP, n
  0xE8: cpu => Z80.alu16.addRegSPImmediate(cpu),

  // 3 INC nn (16 bit reg)
  0x03: cpu => Z80.alu16.inc(cpu, RegMap.bc),
  0x13: cpu => Z80.alu16.inc(cpu, RegMap.de),
  0x23: cpu => Z80.alu16.inc(cpu, RegMap.hl),
  0x33: cpu => Z80.alu16.inc(cpu, RegMap.sp),

  // 4. DEC nn (16 bit reg)
  0x0B: cpu => Z80.alu16.dec(cpu, RegMap.bc),
  0x1B: cpu => Z80.alu16.dec(cpu, RegMap.de),
  0x2B: cpu => Z80.alu16.dec(cpu, RegMap.hl),
  0x3B: cpu => Z80.alu16.dec(cpu, RegMap.sp),

  // -------- Misc --------
  // 1. SWAP
  // CB: displacement opcode
  0xCB37: cpu => Z80.misc.swap(cpu, RegMap.a),
  0xCB30: cpu => Z80.misc.swap(cpu, RegMap.b),
  0xCB31: cpu => Z80.misc.swap(cpu, RegMap.c),
  0xCB32: cpu => Z80.misc.swap(cpu, RegMap.d),
  0xCB33: cpu => Z80.misc.swap(cpu, RegMap.e),
  0xCB34: cpu => Z80.misc.swap(cpu, RegMap.h),
  0xCB35: cpu => Z80.misc.swap(cpu, RegMap.l),
  0xCB36: cpu => Z80.misc.swapMemHL(cpu),

  // 2. DAA
  // TODO: Convert to Binary coded decimal operation
  0x27: cpu => Z80.misc.daa(cpu),

  // 3. CPL
  0x2F: cpu => Z80.misc.cpl(cpu),

  // 4. CCF
  0x3F: cpu => Z80.misc.ccf(cpu),

  // 5. SCF
  0x37: cpu => Z80.misc.scf(cpu),

  // 6. NOP
  0x00: () => Z80.misc.nop(),

  // 7. HALT
  0x76: () => Z80.misc.halt(),

  // 8. STOP
  0x1000: () => Z80.misc.stop(),

  // 9. DI
  0xF3: cpu => Z80.misc.di(cpu),
  0xFB: cpu => Z80.misc.ei(cpu),
};

export default opcodes;
