import { CheckFlagFor } from '..';
import { jump } from './';
// Consists of Call, restart and return instructions which modify stack.

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */
/* eslint no-param-reassign: 0 */

const addToStack = (map, mmu, val) => {
  const newSp = map.sp() - 2;
  map.sp(newSp);
  mmu.writeWord(newSp, val);
};

const popFromStack = (map, mmu) => {
  const regVal = mmu.readWord(map.sp());
  map.sp(map.sp() + 2);
  return regVal;
};

const doCall = (map, mmu) => {
  const nextInstruction = (map.pc() + 2) & 0xFFFF;
  addToStack(map, mmu, nextInstruction);
  jump.jp({ mmu, map });
};

export default {
  call: ({ mmu, map }) => {
    doCall(map, mmu);
    return 24;
  },

  callIfZ: ({ mmu, map }, condition) => {
    const flag = new CheckFlagFor(map.f());
    if (flag.isZero() === condition) {
      doCall(map, mmu);
      return 24;
    }

    map.pc(map.pc() + 2);
    return 12;
  },

  callIfC: ({ mmu, map }, condition) => {
    const flag = new CheckFlagFor(map.f());
    if (flag.isCarry() === condition) {
      doCall(map, mmu);
      return 24;
    }

    map.pc(map.pc() + 2);
    return 12;
  },

  rst: ({ mmu, map }, addr) => {
    addToStack(map, mmu, map.pc());
    map.pc(addr);
    return 16;
  },

  ret: ({ mmu, map }) => {
    const val = popFromStack(map, mmu);
    map.pc(val);
    return 16;
  },

  retIfZ: ({ mmu, map }, condition) => {
    const flag = new CheckFlagFor(map.f());
    if (flag.isZero() === condition) {
      const val = popFromStack(map, mmu);
      map.pc(val);
      return 20;
    }
    return 8;
  },

  retIfC: ({ mmu, map }, condition) => {
    const flag = new CheckFlagFor(map.f());
    if (flag.isCarry() === condition) {
      const val = popFromStack(map, mmu);
      map.pc(val);
      return 20;
    }
    return 8;
  },

  reti: ({ mmu, map, interrupt }) => {
    const val = popFromStack(map, mmu);
    map.pc(val);
    interrupt.enabled = true;
    return 16;
  },
};
