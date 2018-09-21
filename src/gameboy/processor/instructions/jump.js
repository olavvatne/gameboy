import { CheckFlagFor, RegMap } from '..';
import Util from './../../util';
import { createOpTime } from '../clock-util';

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */
/* eslint no-param-reassign: 0 */

const doJump = ({ map, mmu }) => {
  const pcAddr = map.pc();
  const newPc = mmu.readWord(pcAddr);
  map.pc(newPc);
};

const addImmediateToPc = ({ map, mmu }) => {
  const pcAddr = map.pc();
  const signedByte = Util.convertSignedByte(mmu.readByte(pcAddr));
  map.pc((pcAddr + signedByte + 1) & 0xFFFF);
};

export default {
  jp: (cpu) => {
    doJump(cpu);
    return createOpTime(3, 12);
  },

  jpIfZ: ({ mmu, map }, condition) => {
    const flag = new CheckFlagFor(map.f());
    if (flag.isZero() === condition) doJump({ map, mmu });
    else map.pc(map.pc() + 2);
    return createOpTime(3, 12);
  },

  jpIfC: ({ mmu, map }, condition) => {
    const flag = new CheckFlagFor(map.f());
    if (flag.isCarry() === condition) doJump({ map, mmu });
    else map.pc(map.pc() + 2);
    return createOpTime(3, 12);
  },

  jpHL: ({ reg, map }) => {
    reg.pc(map.hl());
    return createOpTime(1, 4);
  },

  jr: (cpu) => {
    addImmediateToPc(cpu);
    return createOpTime(2, 8);
  },

  jrIfZ: ({ mmu, map }, condition) => {
    const flag = new CheckFlagFor(map.f());
    if (flag.isZero() === condition) addImmediateToPc({ map, mmu });
    else map.pc(map.pc() + 1);
    return createOpTime(3, 12);
  },

  jrIfC: ({ mmu, map }, condition) => {
    const flag = new CheckFlagFor(map.f());
    if (flag.isCarry() === condition) addImmediateToPc({ map, mmu });
    else map.pc(map.pc() + 1);
    return createOpTime(3, 12);
  },
};
