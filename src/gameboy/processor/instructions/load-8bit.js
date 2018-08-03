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

const LDrHL = ({ reg, mmu }, regAddr) => {
  const hl = reg.reg(RegMap.hl);
  const val = mmu.readByte(hl);
  reg.reg(regAddr, val);

  return createOpTime(2, 8);
};

const LDrmr = ({ reg, mmu }, regMemAddr, regAddr) => {
  const memAddr = reg.reg(regMemAddr);
  const val = reg.reg(regAddr);
  mmu.writeByte(memAddr, val);

  return createOpTime(2, 8);
};

export default {
  LDrr: ({ reg }, addr1, addr2) => {
    reg.reg(addr1, reg.reg(addr2));
    return createOpTime(1, 4);
  },

  LDHLr: ({ reg, mmu }, regAddr) => {
    const val = reg.reg(regAddr);
    const memAddr = reg.reg(RegMap.hl);
    mmu.writeByte(memAddr, val);
    return createOpTime(2, 8);
  },


  LDHLn: ({ reg, mmu }) => {
    const val = mmu.readByte(reg.pc());
    reg.incrementPC();
    const memAddr = reg.reg(RegMap.hl);
    mmu.writeByte(memAddr, val);
    return createOpTime(3, 12);
  },

  LDnnn: ({ reg, mmu }, addr) => {
    mmu.writeByte(reg.pc(), reg.reg(addr));
    return createOpTime(2, 8);
  },
  // Put byte at memory location found in 16 bit registers into A
  LDAm: ({ reg, mmu }, regAddr) => {
    const memAddr = mmu.readWord(reg.reg(regAddr));
    const val = mmu.readByte(memAddr);
    reg.reg(RegMap.a, val);
    return createOpTime(2, 8);
  },

  LDACPlusConst: ({ reg, mmu }) => {
    const val = mmu.readByte(0xFF00 + reg.reg(RegMap.c));
    reg.reg(RegMap.a, val);

    return createOpTime(2, 8);
  },

  LDCPlusConstA: ({ reg, mmu }) => {
    const addr = 0xFF00 + reg.reg(RegMap.c);
    const val = reg.reg(RegMap.a);
    mmu.writeByte(addr, val);

    return createOpTime(2, 8);
  },

  LDrHL,
  LDrmr,

  LDDAHL: (cpu) => {
    LDrHL(cpu, RegMap.a);
    alu16.DECnn(cpu, RegMap.hl);
    return createOpTime(2, 8);
  },

  LDDHLA: (cpu) => {
    LDrmr(cpu, RegMap.hl, RegMap.a);
    alu16.DECnn(cpu, RegMap.hl);
    return createOpTime(2, 8);
  },

  LDIAHL: (cpu) => {
    LDrHL(cpu, RegMap.a);
    alu16.INCnn(cpu, RegMap.hl);
    return createOpTime(2, 8);
  },

  LDIHLA: (cpu) => {
    LDrmr(cpu, RegMap.hl, RegMap.a);
    alu16.INCnn(cpu, RegMap.hl);
    return createOpTime(2, 8);
  },

  // Read a byte from absolute location into A (LD A, addr)
  LDAMemoryFromImmediate: ({ reg, mmu }) => {
    const addr = mmu.readWord(reg.pc());
    reg.incrementPC();
    reg.incrementPC();
    const val = mmu.readByte(addr);
    reg.reg(RegMap.a, val);
    return createOpTime(4, 16);
  },

  LDAImmediate: ({ reg, mmu }) => {
    const val = mmu.readByte(reg.pc());
    reg.incrementPC();
    reg.reg(RegMap.a, val);
    return createOpTime(2, 8);
  },

  LDMemoryFromImmediateA: ({ reg, mmu }) => {
    const valInA = reg.reg(RegMap.a);
    const addr = mmu.readWord(reg.pc());
    mmu.writeByte(addr, valInA);
    return createOpTime(4, 16);
  },

  LDHImmediateMemA: ({ reg, mmu }) => {
    const valInA = reg.reg(RegMap.a);
    const offset = mmu.readByte(reg.pc());
    reg.incrementPC();
    mmu.writeByte(0xFF00 + offset, valInA);
    return createOpTime(3, 12);
  },

  LDHMemFF00PlusImmediateIntoA: ({ reg, mmu }) => {
    const offset = mmu.readByte(reg.pc());
    reg.incrementPC();
    const value = mmu.readByte(0xFF00 + offset);
    reg.reg(RegMap.a, value);
    return createOpTime(3, 12);
  },
};
