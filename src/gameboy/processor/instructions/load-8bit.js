import { alu16 } from './';
import { createOpTime } from '../clock-util';
/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */

// Each operation is provided with a snapshot state of the processor
// Each operation return a new object containing only state that has been modified.
// Makes instructions modular and easier to test. Only need to test the state.
// Implementation based on explanations given by GBCPUman
// Mention of immediate values treated as using program counter as value

const ldMemHL = ({ mmu, map }, regX) => {
  const hl = map.hl();
  const val = mmu.readByte(hl);
  regX(val);

  return createOpTime(2, 8);
};

const ldMemRegA = ({ mmu, map }, regWithMem) => {
  const memAddr = regWithMem();
  const val = map.a();
  mmu.writeByte(memAddr, val);

  return createOpTime(2, 8);
};

export default {
  ld: (_, regX, regY) => {
    regX(regY());
    return createOpTime(1, 4);
  },

  ldMemHLReg: ({ mmu, map }, regX) => {
    const val = regX();
    const memAddr = map.hl();
    mmu.writeByte(memAddr, val);
    return createOpTime(2, 8);
  },


  ldMemHLImmediate: ({ mmu, map }) => {
    const pc = map.pc();
    const val = mmu.readByte(pc);
    map.pc(pc + 1);
    const memAddr = map.hl();
    mmu.writeByte(memAddr, val);
    return createOpTime(3, 12);
  },

  ldImmediate: ({ mmu, map }, regX) => {
    const pc = map.pc();
    const imAddr = pc;
    map.pc(pc + 1);
    const imVal = mmu.readByte(imAddr);
    regX(imVal);
    return createOpTime(2, 8);
  },
  // Put byte at memory location found in 16 bit registers into A
  ldRegAMem: ({ mmu, map }, regX) => {
    const val = mmu.readByte(regX());
    map.a(val);
    return createOpTime(2, 8);
  },

  ldRegARegCPlusConst: ({ mmu, map }) => {
    const val = mmu.readByte(0xFF00 + map.c());
    map.a(val);
    return createOpTime(2, 8);
  },

  ldRegCPlusConstRegA: ({ mmu, map }) => {
    const addr = 0xFF00 + map.c();
    const val = map.a();
    mmu.writeByte(addr, val);

    return createOpTime(2, 8);
  },

  ldMemHL,
  ldMemRegA,

  lddRegAMemHL: (cpu) => {
    ldMemHL(cpu, cpu.map.a);
    alu16.dec(cpu, cpu.map.hl);
    return createOpTime(2, 8);
  },

  lddMemHLRegA: (cpu) => {
    ldMemRegA(cpu, cpu.map.hl);
    alu16.dec(cpu, cpu.map.hl);
    return createOpTime(2, 8);
  },

  ldiRegAMemHL: (cpu) => {
    ldMemHL(cpu, cpu.map.a);
    alu16.inc(cpu, cpu.map.hl);
    return createOpTime(2, 8);
  },

  ldiMemHLRegA: (cpu) => {
    ldMemRegA(cpu, cpu.map.hl);
    alu16.inc(cpu, cpu.map.hl);
    return createOpTime(2, 8);
  },

  // Read a byte from absolute location into A (LD A, addr)
  ldRegAImmediateWord: ({ mmu, map }) => {
    const pc = map.pc();
    const addr = mmu.readWord(pc);
    map.pc(pc + 2);
    const val = mmu.readByte(addr);
    map.a(val);
    return createOpTime(4, 16);
  },

  ldAImmediate: ({ mmu, map }) => {
    const pc = map.pc();
    const val = mmu.readByte(pc);
    map.pc(pc + 1);
    map.a(val);
    return createOpTime(2, 8);
  },

  ldImmediateA: ({ mmu, map }) => {
    const valInA = map.a();
    const pc = map.pc();
    const addr = mmu.readWord(pc);
    map.pc(pc + 2);
    mmu.writeByte(addr, valInA);
    return createOpTime(4, 16);
  },

  ldhMemFF00PlusImmediateRegA: ({ mmu, map }) => {
    const valInA = map.a();
    const pc = map.pc();
    const offset = mmu.readByte(pc);
    map.pc(pc + 1);
    mmu.writeByte(0xFF00 + offset, valInA);
    return createOpTime(3, 12);
  },

  ldhRegAMemFF00PlusImmediate: ({ mmu, map }) => {
    const pc = map.pc();
    const offset = mmu.readByte(pc);
    map.pc(pc + 1);
    const value = mmu.readByte(0xFF00 + offset);
    map.a(value);
    return createOpTime(3, 12);
  },
};
