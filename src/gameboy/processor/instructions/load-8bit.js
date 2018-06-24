import { RegMap } from '../';
import { alu16 } from './alu-16bit';

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */

// Each operation is provided with a snapshot state of the processor
// Each operation return a new object containing only state that has been modified.
// Makes instructions modular and easier to test. Only need to test the state.
// Implementation based on explanations given by GBCPUman
// Mention of immediate values treated as using program counter as value
const createOpTime = (m, t) => ({ m, t });

export default {
  // Push register pair to the stack (PUSH HL)
  PUSHnn: ({ reg, mmu }, addr) => {
    mmu.writeWord(reg.reg(RegMap.sp), reg.reg(addr));
    reg.sp(reg.sp() - 2);
    return createOpTime(4, 16);
  },

  // Pop register pair off the stack (POP HL)
  POPnn: ({ reg, mmu }, addr) => {
    const regVal = mmu.readWord(reg.reg(RegMap.sp));
    reg.reg(addr, regVal);
    reg.sp(reg.sp() + 2);
    return createOpTime(3, 12);
  },

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
    reg.pc(reg.pc() + 1);
    const memAddr = reg.reg(RegMap.hl);
    memAddr.writeByte(memAddr, val);
    return createOpTime(3, 12);
  },

  LDnnn: ({ reg, mmu }, addr) => {
    throw Error('Not implemented');
    // return createOpTime(2, 8);
  },
  LDArr: ({ reg, mmu }, addr) => {
    throw Error('Not implemented');
    // return createOpTime(2, 8);
  },

  LDACPlusConst: ({ reg, mmu }) => {
    const addr = mmu.readByte(0xFF00) + reg.reg(RegMap.c);
    const val = mmu.readByte(addr);
    reg.reg(RegMap.a, val);

    return createOpTime(2, 8);
  },

  LDCPlusConstA: ({ reg, mmu }) => {
    const addr = mmu.readByte(0xFF00) + reg.reg(RegMap.c);
    const val = reg.reg(RegMap.a);
    mmu.writeByte(addr, val);

    return createOpTime(2, 8);
  },

  LDrHL: ({ reg, mmu }, regAddr) => {
    const hl = reg.reg(RegMap.hl);
    const val = mmu.readByte(hl);
    reg.reg(regAddr, val);

    return createOpTime(2, 8);
  },

  LDrmr: ({ reg, mmu }, regMemAddr, regAddr) => {
    const memAddr = reg.reg(regMemAddr);
    const val = reg.reg(regAddr);
    mmu.writeByte(memAddr, val);

    return createOpTime(2, 8);
  },

  LDDAHL: (cpu) => {
    this.LDrHL(cpu, RegMap.a);
    alu16.DECnn(cpu, RegMap.hl);
    return createOpTime(2, 8);
  },

  LDDHLA: (cpu) => {
    this.LDrmr(cpu, RegMap.hl, RegMap.a);
    alu16.DECnn(cpu, RegMap.hl);
    return createOpTime(2, 8);
  },

  LDIAHL: (cpu) => {
    this.LDrHL(cpu, RegMap.a);
    alu16.INCnn(cpu, RegMap.hl);
    return createOpTime(2, 8);
  },

  LDIHLA: (cpu) => {
    this.LDrmr(cpu, RegMap.hl, RegMap.a);
    alu16.INCnn(cpu, RegMap.hl);
    return createOpTime(2, 8);
  },

  // Read a byte from absolute location into A (LD A, addr)
  LDAmm: ({ reg, mmu }) => {
    const addr = mmu.readWord(reg.pc());
    reg.pc(reg.pc() + 2);
    const val = mmu.readByte(addr);
    reg.reg(RegMap.a, val);
    return createOpTime(4, 16);
  },
};
