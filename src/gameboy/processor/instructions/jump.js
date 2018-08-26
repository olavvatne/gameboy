import { CheckFlagFor, RegMap } from '..';

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */
/* eslint no-param-reassign: 0 */
const createOpTime = (m, t) => ({ m, t });

const doJump = ({ reg, mmu }) => {
  const pcAddr = reg.pc();
  const newPc = mmu.readWord(pcAddr);
  reg.pc(newPc);
};

const addImmediateToPc = ({ reg, mmu }) => {
  const pcAddr = reg.pc();
  const val = mmu.readByte(pcAddr);
  reg.pc((pcAddr + val) & 0xFFFF);
};

export default {
  jp: (cpu) => {
    doJump(cpu);
    return createOpTime(3, 12);
  },

  jpIfZ: ({ reg, mmu }, condition) => {
    const flag = new CheckFlagFor(reg.flags());
    if (flag.isZero() === condition) doJump({ reg, mmu });
    return createOpTime(3, 12);
  },

  jpIfC: ({ reg, mmu }, condition) => {
    const flag = new CheckFlagFor(reg.flags());
    if (flag.isCarry() === condition) doJump({ reg, mmu });
    return createOpTime(3, 12);
  },

  jpHL: ({ reg }) => {
    reg.pc(reg.reg(RegMap.hl));
    return createOpTime(1, 4);
  },

  jr: (cpu) => {
    addImmediateToPc(cpu);
    return createOpTime(2, 8);
  },

  jrIfZ: ({ reg, mmu }, condition) => {
    const flag = new CheckFlagFor(reg.flags());
    if (flag.isZero() === condition) addImmediateToPc({ reg, mmu });
    return createOpTime(3, 12);
  },

  jrIfC: ({ reg, mmu }, condition) => {
    const flag = new CheckFlagFor(reg.flags());
    if (flag.isCarry() === condition) addImmediateToPc({ reg, mmu });
    return createOpTime(3, 12);
  },
};