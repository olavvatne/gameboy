import { Z80, NameMap } from './';

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */
const opcodes = {
  0xCB: () => { throw Error('An opcode modifier should not be called'); },
  // -------- 8 bit load --------
  // 1. LD nn n
  0x06: cpu => Z80.load8.ldImmediate(cpu, cpu.map.b),
  0x0E: cpu => Z80.load8.ldImmediate(cpu, cpu.map.c),
  0x16: cpu => Z80.load8.ldImmediate(cpu, cpu.map.d),
  0x1E: cpu => Z80.load8.ldImmediate(cpu, cpu.map.e),
  0x26: cpu => Z80.load8.ldImmediate(cpu, cpu.map.h),
  0x2E: cpu => Z80.load8.ldImmediate(cpu, cpu.map.l),

  // 2. LD r1 r2
  0x7F: cpu => Z80.load8.ld(cpu, cpu.map.a, cpu.map.a),
  0x78: cpu => Z80.load8.ld(cpu, cpu.map.a, cpu.map.b),
  0x79: cpu => Z80.load8.ld(cpu, cpu.map.a, cpu.map.c),
  0x7A: cpu => Z80.load8.ld(cpu, cpu.map.a, cpu.map.d),
  0x7B: cpu => Z80.load8.ld(cpu, cpu.map.a, cpu.map.e),
  0x7C: cpu => Z80.load8.ld(cpu, cpu.map.a, cpu.map.h),
  0x7D: cpu => Z80.load8.ld(cpu, cpu.map.a, cpu.map.l),
  0x40: cpu => Z80.load8.ld(cpu, cpu.map.b, cpu.map.b),
  0x41: cpu => Z80.load8.ld(cpu, cpu.map.b, cpu.map.c),
  0x42: cpu => Z80.load8.ld(cpu, cpu.map.b, cpu.map.d),
  0x43: cpu => Z80.load8.ld(cpu, cpu.map.b, cpu.map.e),
  0x44: cpu => Z80.load8.ld(cpu, cpu.map.b, cpu.map.h),
  0x45: cpu => Z80.load8.ld(cpu, cpu.map.b, cpu.map.l),
  0x46: cpu => Z80.load8.ldMemHL(cpu, cpu.map.b),
  0x48: cpu => Z80.load8.ld(cpu, cpu.map.c, cpu.map.b),
  0x49: cpu => Z80.load8.ld(cpu, cpu.map.c, cpu.map.c),
  0x4A: cpu => Z80.load8.ld(cpu, cpu.map.c, cpu.map.d),
  0x4B: cpu => Z80.load8.ld(cpu, cpu.map.c, cpu.map.e),
  0x4C: cpu => Z80.load8.ld(cpu, cpu.map.c, cpu.map.h),
  0x4D: cpu => Z80.load8.ld(cpu, cpu.map.c, cpu.map.l),
  0x4E: cpu => Z80.load8.ldMemHL(cpu, cpu.map.c),
  0x50: cpu => Z80.load8.ld(cpu, cpu.map.d, cpu.map.b),
  0x51: cpu => Z80.load8.ld(cpu, cpu.map.d, cpu.map.c),
  0x52: cpu => Z80.load8.ld(cpu, cpu.map.d, cpu.map.d),
  0x53: cpu => Z80.load8.ld(cpu, cpu.map.d, cpu.map.e),
  0x54: cpu => Z80.load8.ld(cpu, cpu.map.d, cpu.map.h),
  0x55: cpu => Z80.load8.ld(cpu, cpu.map.d, cpu.map.l),
  0x56: cpu => Z80.load8.ldMemHL(cpu, cpu.map.d),
  0x58: cpu => Z80.load8.ld(cpu, cpu.map.e, cpu.map.b),
  0x59: cpu => Z80.load8.ld(cpu, cpu.map.e, cpu.map.c),
  0x5A: cpu => Z80.load8.ld(cpu, cpu.map.e, cpu.map.d),
  0x5B: cpu => Z80.load8.ld(cpu, cpu.map.e, cpu.map.e),
  0x5C: cpu => Z80.load8.ld(cpu, cpu.map.e, cpu.map.h),
  0x5D: cpu => Z80.load8.ld(cpu, cpu.map.e, cpu.map.l),
  0x5E: cpu => Z80.load8.ldMemHL(cpu, cpu.map.e),
  0x60: cpu => Z80.load8.ld(cpu, cpu.map.h, cpu.map.b),
  0x61: cpu => Z80.load8.ld(cpu, cpu.map.h, cpu.map.c),
  0x62: cpu => Z80.load8.ld(cpu, cpu.map.h, cpu.map.d),
  0x63: cpu => Z80.load8.ld(cpu, cpu.map.h, cpu.map.e),
  0x64: cpu => Z80.load8.ld(cpu, cpu.map.h, cpu.map.h),
  0x65: cpu => Z80.load8.ld(cpu, cpu.map.h, cpu.map.l),
  0x66: cpu => Z80.load8.ldMemHL(cpu, cpu.map.h),
  0x68: cpu => Z80.load8.ld(cpu, cpu.map.l, cpu.map.b),
  0x69: cpu => Z80.load8.ld(cpu, cpu.map.l, cpu.map.c),
  0x6A: cpu => Z80.load8.ld(cpu, cpu.map.l, cpu.map.d),
  0x6B: cpu => Z80.load8.ld(cpu, cpu.map.l, cpu.map.e),
  0x6C: cpu => Z80.load8.ld(cpu, cpu.map.l, cpu.map.h),
  0x6D: cpu => Z80.load8.ld(cpu, cpu.map.l, cpu.map.l),
  0x6E: cpu => Z80.load8.ldMemHL(cpu, cpu.map.l),
  0x70: cpu => Z80.load8.ldMemHLReg(cpu, cpu.map.b),
  0x71: cpu => Z80.load8.ldMemHLReg(cpu, cpu.map.c),
  0x72: cpu => Z80.load8.ldMemHLReg(cpu, cpu.map.d),
  0x73: cpu => Z80.load8.ldMemHLReg(cpu, cpu.map.e),
  0x74: cpu => Z80.load8.ldMemHLReg(cpu, cpu.map.h),
  0x75: cpu => Z80.load8.ldMemHLReg(cpu, cpu.map.l),
  0x36: cpu => Z80.load8.ldMemHLImmediate(cpu),

  // 3. LD A, n
  0x0A: cpu => Z80.load8.ldRegAMem(cpu, cpu.map.bc),
  0x1A: cpu => Z80.load8.ldRegAMem(cpu, cpu.map.de),
  0x7E: cpu => Z80.load8.ldRegAMem(cpu, cpu.map.hl),
  0xFA: cpu => Z80.load8.ldRegAImmediateWord(cpu),
  0x3E: cpu => Z80.load8.ldAImmediate(cpu),

  // 4. LD n, A
  0x47: cpu => Z80.load8.ld(cpu, cpu.map.b, cpu.map.a),
  0x4F: cpu => Z80.load8.ld(cpu, cpu.map.c, cpu.map.a),
  0x57: cpu => Z80.load8.ld(cpu, cpu.map.d, cpu.map.a),
  0x5F: cpu => Z80.load8.ld(cpu, cpu.map.e, cpu.map.a),
  0x67: cpu => Z80.load8.ld(cpu, cpu.map.h, cpu.map.a),
  0x6F: cpu => Z80.load8.ld(cpu, cpu.map.l, cpu.map.a),
  0x02: cpu => Z80.load8.ldMemRegA(cpu, cpu.map.bc),
  0x12: cpu => Z80.load8.ldMemRegA(cpu, cpu.map.de),
  0x77: cpu => Z80.load8.ldMemRegA(cpu, cpu.map.hl),
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
  0x01: cpu => Z80.load16.ldImmediateIntoReg(cpu, cpu.map.bc),
  0x11: cpu => Z80.load16.ldImmediateIntoReg(cpu, cpu.map.de),
  0x21: cpu => Z80.load16.ldImmediateIntoReg(cpu, cpu.map.hl),
  0x31: cpu => Z80.load16.ldImmediateIntoReg(cpu, cpu.map.sp),

  // 2. LD SP,HL
  0xF9: cpu => Z80.load16.ldRegToReg(cpu, cpu.map.hl, cpu.map.sp),

  // 3/4. LD HL,SP+n
  0xF8: cpu => Z80.load16.ldHLFromSPPlusImmediate(cpu),

  // 5. LD (nn), SP
  0x08: cpu => Z80.load16.ldSPIntoImmediate(cpu),

  // 6. Push nn
  0xF5: cpu => Z80.load16.push(cpu, cpu.map.af),
  0xC5: cpu => Z80.load16.push(cpu, cpu.map.bc),
  0xD5: cpu => Z80.load16.push(cpu, cpu.map.de),
  0xE5: cpu => Z80.load16.push(cpu, cpu.map.hl),

  // 7. Popnn
  0xF1: cpu => Z80.load16.pop(cpu, cpu.map.af),
  0xC1: cpu => Z80.load16.pop(cpu, cpu.map.bc),
  0xD1: cpu => Z80.load16.pop(cpu, cpu.map.de),
  0xE1: cpu => Z80.load16.pop(cpu, cpu.map.hl),

  // -------- 8 bit ALU --------
  // 1. Add A, n
  0x87: cpu => Z80.alu8.add(cpu, cpu.map.a),
  0x80: cpu => Z80.alu8.add(cpu, cpu.map.b),
  0x81: cpu => Z80.alu8.add(cpu, cpu.map.c),
  0x82: cpu => Z80.alu8.add(cpu, cpu.map.d),
  0x83: cpu => Z80.alu8.add(cpu, cpu.map.e),
  0x84: cpu => Z80.alu8.add(cpu, cpu.map.h),
  0x85: cpu => Z80.alu8.add(cpu, cpu.map.l),
  0x86: cpu => Z80.alu8.addMemHL(cpu),
  0xC6: cpu => Z80.alu8.addImmediate(cpu),

  // 2. ADC A,n
  0x8F: cpu => Z80.alu8.adcPlusCarry(cpu, cpu.map.a),
  0x88: cpu => Z80.alu8.adcPlusCarry(cpu, cpu.map.b),
  0x89: cpu => Z80.alu8.adcPlusCarry(cpu, cpu.map.c),
  0x8A: cpu => Z80.alu8.adcPlusCarry(cpu, cpu.map.d),
  0x8B: cpu => Z80.alu8.adcPlusCarry(cpu, cpu.map.e),
  0x8C: cpu => Z80.alu8.adcPlusCarry(cpu, cpu.map.h),
  0x8D: cpu => Z80.alu8.adcPlusCarry(cpu, cpu.map.l),
  0x8E: cpu => Z80.alu8.adcMemHLPlusCarry(cpu),
  0xCE: cpu => Z80.alu8.adcImmediatePlusCarry(cpu),

  // 3. SUB n
  0x97: cpu => Z80.alu8.sub(cpu, cpu.map.a),
  0x90: cpu => Z80.alu8.sub(cpu, cpu.map.b),
  0x91: cpu => Z80.alu8.sub(cpu, cpu.map.c),
  0x92: cpu => Z80.alu8.sub(cpu, cpu.map.d),
  0x93: cpu => Z80.alu8.sub(cpu, cpu.map.e),
  0x94: cpu => Z80.alu8.sub(cpu, cpu.map.h),
  0x95: cpu => Z80.alu8.sub(cpu, cpu.map.l),
  0x96: cpu => Z80.alu8.subMemHL(cpu),
  0xD6: cpu => Z80.alu8.subImmediate(cpu),

  // 4. SBC A,n
  0x9F: cpu => Z80.alu8.sbc(cpu, cpu.map.a),
  0x98: cpu => Z80.alu8.sbc(cpu, cpu.map.b),
  0x99: cpu => Z80.alu8.sbc(cpu, cpu.map.c),
  0x9A: cpu => Z80.alu8.sbc(cpu, cpu.map.d),
  0x9B: cpu => Z80.alu8.sbc(cpu, cpu.map.e),
  0x9C: cpu => Z80.alu8.sbc(cpu, cpu.map.h),
  0x9D: cpu => Z80.alu8.sbc(cpu, cpu.map.l),
  0x9E: cpu => Z80.alu8.sbcMemHL(cpu),
  0xDE: cpu => Z80.alu8.sbcImmediate(cpu),

  // 5. AND n
  0xA7: cpu => Z80.alu8.and(cpu, cpu.map.a),
  0xA0: cpu => Z80.alu8.and(cpu, cpu.map.b),
  0xA1: cpu => Z80.alu8.and(cpu, cpu.map.c),
  0xA2: cpu => Z80.alu8.and(cpu, cpu.map.d),
  0xA3: cpu => Z80.alu8.and(cpu, cpu.map.e),
  0xA4: cpu => Z80.alu8.and(cpu, cpu.map.h),
  0xA5: cpu => Z80.alu8.and(cpu, cpu.map.l),
  0xA6: cpu => Z80.alu8.andMemHL(cpu),
  0xE6: cpu => Z80.alu8.andImmediate(cpu),

  // 6. OR n
  0xB7: cpu => Z80.alu8.or(cpu, cpu.map.a),
  0xB0: cpu => Z80.alu8.or(cpu, cpu.map.b),
  0xB1: cpu => Z80.alu8.or(cpu, cpu.map.c),
  0xB2: cpu => Z80.alu8.or(cpu, cpu.map.d),
  0xB3: cpu => Z80.alu8.or(cpu, cpu.map.e),
  0xB4: cpu => Z80.alu8.or(cpu, cpu.map.h),
  0xB5: cpu => Z80.alu8.or(cpu, cpu.map.l),
  0xB6: cpu => Z80.alu8.orMemHL(cpu),
  0xF6: cpu => Z80.alu8.orImmediate(cpu),

  // 7. XOR n
  0xAF: cpu => Z80.alu8.xor(cpu, cpu.map.a),
  0xA8: cpu => Z80.alu8.xor(cpu, cpu.map.b),
  0xA9: cpu => Z80.alu8.xor(cpu, cpu.map.c),
  0xAA: cpu => Z80.alu8.xor(cpu, cpu.map.d),
  0xAB: cpu => Z80.alu8.xor(cpu, cpu.map.e),
  0xAC: cpu => Z80.alu8.xor(cpu, cpu.map.h),
  0xAD: cpu => Z80.alu8.xor(cpu, cpu.map.l),
  0xAE: cpu => Z80.alu8.xorMemHL(cpu),
  0xEE: cpu => Z80.alu8.xorImmediate(cpu),

  // 8 CP n
  0xBF: cpu => Z80.alu8.cp(cpu, cpu.map.a),
  0xB8: cpu => Z80.alu8.cp(cpu, cpu.map.b),
  0xB9: cpu => Z80.alu8.cp(cpu, cpu.map.c),
  0xBA: cpu => Z80.alu8.cp(cpu, cpu.map.d),
  0xBB: cpu => Z80.alu8.cp(cpu, cpu.map.e),
  0xBC: cpu => Z80.alu8.cp(cpu, cpu.map.h),
  0xBD: cpu => Z80.alu8.cp(cpu, cpu.map.l),
  0xBE: cpu => Z80.alu8.cpMemHL(cpu),
  0xFE: cpu => Z80.alu8.cpImmediate(cpu),

  // 9 INC n
  0x3C: cpu => Z80.alu8.inc(cpu, cpu.map.a),
  0x04: cpu => Z80.alu8.inc(cpu, cpu.map.b),
  0x0c: cpu => Z80.alu8.inc(cpu, cpu.map.c),
  0x14: cpu => Z80.alu8.inc(cpu, cpu.map.d),
  0x1C: cpu => Z80.alu8.inc(cpu, cpu.map.e),
  0x24: cpu => Z80.alu8.inc(cpu, cpu.map.h),
  0x2C: cpu => Z80.alu8.inc(cpu, cpu.map.l),
  0x34: cpu => Z80.alu8.incMemHL(cpu),

  // 10 INC n
  0x3D: cpu => Z80.alu8.dec(cpu, cpu.map.a),
  0x05: cpu => Z80.alu8.dec(cpu, cpu.map.b),
  0x0D: cpu => Z80.alu8.dec(cpu, cpu.map.c),
  0x15: cpu => Z80.alu8.dec(cpu, cpu.map.d),
  0x1D: cpu => Z80.alu8.dec(cpu, cpu.map.e),
  0x25: cpu => Z80.alu8.dec(cpu, cpu.map.h),
  0x2D: cpu => Z80.alu8.dec(cpu, cpu.map.l),
  0x35: cpu => Z80.alu8.decMemHL(cpu),

  // -------- 16 bit ALU --------
  // 1. Add HL, n
  0x09: cpu => Z80.alu16.addRegHLReg(cpu, cpu.map.bc),
  0x19: cpu => Z80.alu16.addRegHLReg(cpu, cpu.map.de),
  0x29: cpu => Z80.alu16.addRegHLReg(cpu, cpu.map.hl),
  0x39: cpu => Z80.alu16.addRegHLReg(cpu, cpu.map.sp),

  // 2. ADD SP, n
  0xE8: cpu => Z80.alu16.addRegSPImmediate(cpu),

  // 3 INC nn (16 bit reg)
  0x03: cpu => Z80.alu16.inc(cpu, cpu.map.bc),
  0x13: cpu => Z80.alu16.inc(cpu, cpu.map.de),
  0x23: cpu => Z80.alu16.inc(cpu, cpu.map.hl),
  0x33: cpu => Z80.alu16.inc(cpu, cpu.map.sp),

  // 4. DEC nn (16 bit reg)
  0x0B: cpu => Z80.alu16.dec(cpu, cpu.map.bc),
  0x1B: cpu => Z80.alu16.dec(cpu, cpu.map.de),
  0x2B: cpu => Z80.alu16.dec(cpu, cpu.map.hl),
  0x3B: cpu => Z80.alu16.dec(cpu, cpu.map.sp),

  // -------- Misc --------
  // 1. SWAP
  // CB: displacement opcode
  0xCB37: cpu => Z80.misc.swap(cpu, cpu.map.a),
  0xCB30: cpu => Z80.misc.swap(cpu, cpu.map.b),
  0xCB31: cpu => Z80.misc.swap(cpu, cpu.map.c),
  0xCB32: cpu => Z80.misc.swap(cpu, cpu.map.d),
  0xCB33: cpu => Z80.misc.swap(cpu, cpu.map.e),
  0xCB34: cpu => Z80.misc.swap(cpu, cpu.map.h),
  0xCB35: cpu => Z80.misc.swap(cpu, cpu.map.l),
  0xCB36: cpu => Z80.misc.swapMemHL(cpu),

  // 2. DAA
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
  0x76: cpu => Z80.misc.halt(cpu),

  // 8. STOP
  0x10: cpu => Z80.misc.stop(cpu),

  // 9. DI
  0xF3: cpu => Z80.misc.di(cpu),

  // 10. EI
  0xFB: cpu => Z80.misc.ei(cpu),

  // -------- Rotates & shifts --------
  // 1. RLCA
  0x07: cpu => Z80.rotate.rcla(cpu),

  // 2. RLA
  0x17: cpu => Z80.rotate.rla(cpu),

  // 3. RRCA
  0x0F: cpu => Z80.rotate.rrca(cpu),

  // 4. RRA
  0x1F: cpu => Z80.rotate.rra(cpu),

  // 5. RLC n
  0xCB07: cpu => Z80.rotate.rlc(cpu, cpu.map.a),
  0xCB00: cpu => Z80.rotate.rlc(cpu, cpu.map.b),
  0xCB01: cpu => Z80.rotate.rlc(cpu, cpu.map.c),
  0xCB02: cpu => Z80.rotate.rlc(cpu, cpu.map.d),
  0xCB03: cpu => Z80.rotate.rlc(cpu, cpu.map.e),
  0xCB04: cpu => Z80.rotate.rlc(cpu, cpu.map.h),
  0xCB05: cpu => Z80.rotate.rlc(cpu, cpu.map.l),
  0xCB06: cpu => Z80.rotate.rlcMemHL(cpu),

  // 6. RL n
  0xCB17: cpu => Z80.rotate.rl(cpu, cpu.map.a),
  0xCB10: cpu => Z80.rotate.rl(cpu, cpu.map.b),
  0xCB11: cpu => Z80.rotate.rl(cpu, cpu.map.c),
  0xCB12: cpu => Z80.rotate.rl(cpu, cpu.map.d),
  0xCB13: cpu => Z80.rotate.rl(cpu, cpu.map.e),
  0xCB14: cpu => Z80.rotate.rl(cpu, cpu.map.h),
  0xCB15: cpu => Z80.rotate.rl(cpu, cpu.map.l),
  0xCB16: cpu => Z80.rotate.rlMemHL(cpu),

  // 7. RRC n
  0xCB0F: cpu => Z80.rotate.rrc(cpu, cpu.map.a),
  0xCB08: cpu => Z80.rotate.rrc(cpu, cpu.map.b),
  0xCB09: cpu => Z80.rotate.rrc(cpu, cpu.map.c),
  0xCB0A: cpu => Z80.rotate.rrc(cpu, cpu.map.d),
  0xCB0B: cpu => Z80.rotate.rrc(cpu, cpu.map.e),
  0xCB0C: cpu => Z80.rotate.rrc(cpu, cpu.map.h),
  0xCB0D: cpu => Z80.rotate.rrc(cpu, cpu.map.l),
  0xCB0E: cpu => Z80.rotate.rrcMemHL(cpu),

  // 8. RR n
  0xCB1F: cpu => Z80.rotate.rr(cpu, cpu.map.a),
  0xCB18: cpu => Z80.rotate.rr(cpu, cpu.map.b),
  0xCB19: cpu => Z80.rotate.rr(cpu, cpu.map.c),
  0xCB1A: cpu => Z80.rotate.rr(cpu, cpu.map.d),
  0xCB1B: cpu => Z80.rotate.rr(cpu, cpu.map.e),
  0xCB1C: cpu => Z80.rotate.rr(cpu, cpu.map.h),
  0xCB1D: cpu => Z80.rotate.rr(cpu, cpu.map.l),
  0xCB1E: cpu => Z80.rotate.rrMemHL(cpu),

  // 9. SLA n
  0xCB27: cpu => Z80.shift.sla(cpu, cpu.map.a),
  0xCB20: cpu => Z80.shift.sla(cpu, cpu.map.b),
  0xCB21: cpu => Z80.shift.sla(cpu, cpu.map.c),
  0xCB22: cpu => Z80.shift.sla(cpu, cpu.map.d),
  0xCB23: cpu => Z80.shift.sla(cpu, cpu.map.e),
  0xCB24: cpu => Z80.shift.sla(cpu, cpu.map.h),
  0xCB25: cpu => Z80.shift.sla(cpu, cpu.map.l),
  0xCB26: cpu => Z80.shift.slaMemHL(cpu),

  // 10. SRA n
  0xCB2F: cpu => Z80.shift.sra(cpu, cpu.map.a),
  0xCB28: cpu => Z80.shift.sra(cpu, cpu.map.b),
  0xCB29: cpu => Z80.shift.sra(cpu, cpu.map.c),
  0xCB2A: cpu => Z80.shift.sra(cpu, cpu.map.d),
  0xCB2B: cpu => Z80.shift.sra(cpu, cpu.map.e),
  0xCB2C: cpu => Z80.shift.sra(cpu, cpu.map.h),
  0xCB2D: cpu => Z80.shift.sra(cpu, cpu.map.l),
  0xCB2E: cpu => Z80.shift.sraMemHL(cpu),

  // 11. SRL n
  0xCB3F: cpu => Z80.shift.srl(cpu, cpu.map.a),
  0xCB38: cpu => Z80.shift.srl(cpu, cpu.map.b),
  0xCB39: cpu => Z80.shift.srl(cpu, cpu.map.c),
  0xCB3A: cpu => Z80.shift.srl(cpu, cpu.map.d),
  0xCB3B: cpu => Z80.shift.srl(cpu, cpu.map.e),
  0xCB3C: cpu => Z80.shift.srl(cpu, cpu.map.h),
  0xCB3D: cpu => Z80.shift.srl(cpu, cpu.map.l),
  0xCB3E: cpu => Z80.shift.srlMemHL(cpu),

  //  -------- Rotates & shifts --------
  // Are loaded dynamically into this map. See below.

  //  -------- Jumps --------
  // 1. JP nn
  0xC3: cpu => Z80.jump.jp(cpu),

  // 2. JP cc, nn
  0xC2: cpu => Z80.jump.jpIfZ(cpu, false),
  0xCA: cpu => Z80.jump.jpIfZ(cpu, true),
  0xD2: cpu => Z80.jump.jpIfC(cpu, false),
  0xDA: cpu => Z80.jump.jpIfC(cpu, true),

  // 3. JP (HL)
  0xE9: cpu => Z80.jump.jpHL(cpu),

  // 4. JR n
  0x18: cpu => Z80.jump.jr(cpu),

  // 5. JR cc, n
  0x20: cpu => Z80.jump.jrIfZ(cpu, false),
  0x28: cpu => Z80.jump.jrIfZ(cpu, true),
  0x30: cpu => Z80.jump.jrIfC(cpu, false),
  0x38: cpu => Z80.jump.jrIfC(cpu, true),

  //  -------- Jumps --------
  // 1. CALL nn
  0xCD: cpu => Z80.subroutine.call(cpu),

  // 2. CALL cc,nn
  0xC4: cpu => Z80.subroutine.callIfZ(cpu, false),
  0xCC: cpu => Z80.subroutine.callIfZ(cpu, true),
  0xD4: cpu => Z80.subroutine.callIfC(cpu, false),
  0xDC: cpu => Z80.subroutine.callIfC(cpu, true),

  //  -------- Restarts --------
  // 1. RST n
  0xC7: cpu => Z80.subroutine.rst(cpu, 0x00),
  0xCF: cpu => Z80.subroutine.rst(cpu, 0x08),
  0xD7: cpu => Z80.subroutine.rst(cpu, 0x10),
  0xDF: cpu => Z80.subroutine.rst(cpu, 0x18),
  0xE7: cpu => Z80.subroutine.rst(cpu, 0x20),
  0xEF: cpu => Z80.subroutine.rst(cpu, 0x28),
  0xF7: cpu => Z80.subroutine.rst(cpu, 0x30),
  0xFF: cpu => Z80.subroutine.rst(cpu, 0x38),

  //  -------- Returns --------
  // 1. RET
  0xC9: cpu => Z80.subroutine.ret(cpu),

  // 2. RET cc
  0xC0: cpu => Z80.subroutine.retIfZ(cpu, false),
  0xC8: cpu => Z80.subroutine.retIfZ(cpu, true),
  0xD0: cpu => Z80.subroutine.retIfC(cpu, false),
  0xD8: cpu => Z80.subroutine.retIfC(cpu, true),

  // 3. RETI
  0xD9: cpu => Z80.subroutine.reti(cpu),
};

const LoadOpcodesIntoMap = (start, end, op) => {
  const regs = [
    NameMap.b, NameMap.c, NameMap.d, NameMap.e, NameMap.h, NameMap.l, NameMap.hl, NameMap.a,
  ];
  for (let code = start; code <= end; code += 1) {
    const reg = regs[(code - start) % regs.length];
    const bit = Math.floor((code - start) / regs.length);
    opcodes[0xCB00 + code] = cpu => op(cpu, reg, bit);
  }
};

// Many similar instructions with only reg and bit that differ.
// Uses opcode reference to dynamically load them into map. See tests for reference.
LoadOpcodesIntoMap(0x40, 0x7F, (cpu, reg, bit) => Z80.bit.bit(cpu, reg, bit));
LoadOpcodesIntoMap(0x80, 0xBF, (cpu, reg, bit) => Z80.bit.res(cpu, reg, bit));
LoadOpcodesIntoMap(0xC0, 0xFF, (cpu, reg, bit) => Z80.bit.set(cpu, reg, bit));

export default opcodes;
