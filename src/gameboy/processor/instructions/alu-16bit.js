import { CheckFlagFor } from '../';
import Util from './../../util';
import { createOpTime } from '../clock-util';
/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */

export default {
  addRegHLReg: ({ map }, regX) => {
    const prevFlag = map.f();

    const val = map.hl() + regX();
    map.hl(val);

    const flag = new CheckFlagFor(prevFlag).notSubtraction().halfCarry16(val).carry16(val).get();
    map.f(flag);

    return createOpTime(2, 8);
  },

  inc: (_, regX) => {
    const val = regX();
    regX(val + 1);
    return createOpTime(2, 8);
  },

  dec: (_, regX) => {
    const val = regX();
    regX(val - 1);
    return createOpTime(2, 8);
  },

  addRegSPImmediate: ({ mmu, map }) => {
    const pc = map.pc();
    const immediateSigned = Util.convertSignedByte(mmu.readByte(pc));
    map.pc(pc + 1);
    const val = map.sp() + immediateSigned;
    map.sp(val);
    const flag = new CheckFlagFor().carry16(val).halfCarry16(val).get();
    map.f(flag);
    return createOpTime(4, 16);
  },
};
