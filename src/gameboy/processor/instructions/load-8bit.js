import { RegMap } from '../';
import { alu16 } from './';

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */

// Each operation is provided with a snapshot state of the processor
// Each operation return a new object containing only state that has been modified.
// Makes instructions modular and easier to test. Only need to test the state.
// Implementation based on explanations given by GBCPUman
// Mention of immediate values treated as using program counter as value
const createOpTime = (m, t) => ({ m, t });

const ldMemHL = ({ reg, mmu }, regAddr) => {
  const hl = reg.reg(RegMap.hl);
  const val = mmu.readByte(hl);
  reg.reg(regAddr, val);

  return createOpTime(2, 8);
};

const ldMemRegA = ({ reg, mmu }, regMemAddr, regAddr) => {
  const memAddr = reg.reg(regMemAddr);
  const val = reg.reg(regAddr);
  mmu.writeByte(memAddr, val);

  return createOpTime(2, 8);
};

export default {
  ld: ({ reg }, addr1, addr2) => {
    reg.reg(addr1, reg.reg(addr2));
    return createOpTime(1, 4);
  },

  ldMemHLReg: ({ reg, mmu }, regAddr) => {
    const val = reg.reg(regAddr);
    const memAddr = reg.reg(RegMap.hl);
    mmu.writeByte(memAddr, val);
    return createOpTime(2, 8);
  },


  ldMemHLImmediate: ({ reg, mmu }) => {
    const val = mmu.readByte(reg.pc());
    reg.incrementPC();
    const memAddr = reg.reg(RegMap.hl);
    mmu.writeByte(memAddr, val);
    return createOpTime(3, 12);
  },

  ldImmediate: ({ reg, mmu }, addr) => {
    const imAddr = reg.pc();
    reg.incrementPC();
    const imVal = mmu.readByte(imAddr);
    reg.reg(addr, imVal);
    return createOpTime(2, 8);
  },
  // Put byte at memory location found in 16 bit registers into A
  ldRegAMem: ({ reg, mmu }, regAddr) => {
    const val = mmu.readByte(reg.reg(regAddr));
    reg.reg(RegMap.a, val);
    return createOpTime(2, 8);
  },

  ldRegARegCPlusConst: ({ reg, mmu }) => {
    const val = mmu.readByte(0xFF00 + reg.reg(RegMap.c));
    reg.reg(RegMap.a, val);

    return createOpTime(2, 8);
  },

  ldRegCPlusConstRegA: ({ reg, mmu }) => {
    const addr = 0xFF00 + reg.reg(RegMap.c);
    const val = reg.reg(RegMap.a);
    mmu.writeByte(addr, val);

    return createOpTime(2, 8);
  },

  ldMemHL,
  ldMemRegA,

  lddRegAMemHL: (cpu) => {
    ldMemHL(cpu, RegMap.a);
    alu16.dec(cpu, RegMap.hl);
    return createOpTime(2, 8);
  },

  lddMemHLRegA: (cpu) => {
    ldMemRegA(cpu, RegMap.hl, RegMap.a);
    alu16.dec(cpu, RegMap.hl);
    return createOpTime(2, 8);
  },

  ldiRegAMemHL: (cpu) => {
    ldMemHL(cpu, RegMap.a);
    alu16.inc(cpu, RegMap.hl);
    return createOpTime(2, 8);
  },

  ldiMemHLRegA: (cpu) => {
    ldMemRegA(cpu, RegMap.hl, RegMap.a);
    alu16.inc(cpu, RegMap.hl);
    return createOpTime(2, 8);
  },

  // Read a byte from absolute location into A (LD A, addr)
  ldRegAImmediateWord: ({ reg, mmu }) => {
    const addr = mmu.readWord(reg.pc());
    reg.incrementPC();
    reg.incrementPC();
    const val = mmu.readByte(addr);
    reg.reg(RegMap.a, val);
    return createOpTime(4, 16);
  },

  ldAImmediate: ({ reg, mmu }) => {
    const val = mmu.readByte(reg.pc());
    reg.incrementPC();
    reg.reg(RegMap.a, val);
    return createOpTime(2, 8);
  },

  ldImmediateA: ({ reg, mmu }) => {
    const valInA = reg.reg(RegMap.a);
    const addr = mmu.readWord(reg.pc());
    reg.incrementPC();
    reg.incrementPC();
    mmu.writeByte(addr, valInA);
    return createOpTime(4, 16);
  },

  ldhMemFF00PlusImmediateRegA: ({ reg, mmu }) => {
    const valInA = reg.reg(RegMap.a);
    const offset = mmu.readByte(reg.pc());
    reg.incrementPC();
    mmu.writeByte(0xFF00 + offset, valInA);
    return createOpTime(3, 12);
  },

  ldhRegAMemFF00PlusImmediate: ({ reg, mmu }) => {
    const offset = mmu.readByte(reg.pc());
    reg.incrementPC();
    const value = mmu.readByte(0xFF00 + offset);
    reg.reg(RegMap.a, value);
    return createOpTime(3, 12);
  },
};
