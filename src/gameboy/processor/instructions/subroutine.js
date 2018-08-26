import { CheckFlagFor, RegMap } from '..';
import { jump } from './';
// Consists of Call, restart and return instructions which modify stack.

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */
/* eslint no-param-reassign: 0 */
const createOpTime = (m, t) => ({ m, t });

const addToStack = (reg, mmu, val) => {
  reg.sp(reg.sp() - 2);
  mmu.writeWord(reg.reg(RegMap.sp), val);
};

const popFromStack = (reg, mmu, val) => {
  const regVal = mmu.readWord(reg.sp());
  reg.sp(reg.sp() + 2);
  return regVal;
};

const doCall = (reg, mmu) => {
  const nextInstruction = (reg.pc() + 2) & 0xFFFF;
  addToStack(reg, mmu, nextInstruction);
  jump.jp({ reg, mmu });
};

export default {
  call: ({ reg, mmu }) => {
    doCall(reg, mmu);
    return createOpTime(3, 12);
  },

  callIfZ: ({ reg, mmu }, condition) => {
    const flag = new CheckFlagFor(reg.flags());
    if (flag.isZero() === condition) doCall(reg, mmu);
    return createOpTime(3, 12);
  },

  callIfC: ({ reg, mmu }, condition) => {
    const flag = new CheckFlagFor(reg.flags());
    if (flag.isCarry() === condition) doCall(reg, mmu);
    return createOpTime(3, 12);
  },

  rst: ({ reg, mmu }, addr) => {
    addToStack(reg, mmu, reg.pc());
    reg.pc(addr);
    return createOpTime(8, 32);
  },

  ret: ({ reg, mmu }) => {
    const val = popFromStack(reg, mmu);
    reg.pc(val);
    return createOpTime(2, 8);
  },

  retIfZ: ({ reg, mmu }, condition) => {
    const flag = new CheckFlagFor(reg.flags());
    if (flag.isZero() === condition) {
      const val = popFromStack(reg, mmu);
      reg.pc(val);
    }
    return createOpTime(2, 8);
  },

  retIfC: ({ reg, mmu }, condition) => {
    const flag = new CheckFlagFor(reg.flags());
    if (flag.isCarry() === condition) {
      const val = popFromStack(reg, mmu);
      reg.pc(val);
    }
    return createOpTime(2, 8);
  },

  reti: ({ reg, mmu, interupt }) => {
    const val = popFromStack(reg, mmu);
    reg.pc(val);
    interupt.enable = true;
    return createOpTime(2, 8);
  },
};
