import { CheckFlagFor } from '../index.js';
import Util from './../../util.js';

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
    return 16;
  },

  jpIfZ: ({ mmu, map }, condition) => {
    const flag = new CheckFlagFor(map.f());
    if (flag.isZero() === condition) {
      doJump({ map, mmu });
      return 16;
    }
    map.pc(map.pc() + 2);
    return 12;
  },

  jpIfC: ({ mmu, map }, condition) => {
    const flag = new CheckFlagFor(map.f());
    if (flag.isCarry() === condition) {
      doJump({ map, mmu });
      return 16;
    }

    map.pc(map.pc() + 2);
    return 12;
  },

  jpHL: ({ map }) => {
    map.pc(map.hl());
    return 4;
  },

  jr: (cpu) => {
    addImmediateToPc(cpu);
    return 12;
  },

  jrIfZ: ({ mmu, map }, condition) => {
    const flag = new CheckFlagFor(map.f());
    if (flag.isZero() === condition) {
      addImmediateToPc({ map, mmu });
      return 12;
    }

    map.pc(map.pc() + 1);
    return 8;
  },

  jrIfC: ({ mmu, map }, condition) => {
    const flag = new CheckFlagFor(map.f());
    if (flag.isCarry() === condition) {
      addImmediateToPc({ map, mmu });
      return 12;
    }

    map.pc(map.pc() + 1);
    return 8;
  },
};
