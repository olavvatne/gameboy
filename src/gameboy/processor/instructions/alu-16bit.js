import { CheckFlagFor, RegMap } from '../';
import Util from './../../util';
import { createOpTime } from '../clock-util';
/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */

export default {
  addRegHLReg: ({ reg }, addr) => {
    const prevFlag = reg.flags();

    const val = reg.reg(RegMap.hl) + reg.reg(addr);
    reg.reg(RegMap.hl, val);

    const flag = new CheckFlagFor(prevFlag).notSubtraction().halfCarry16(val).carry16(val).get();
    reg.reg(RegMap.f, flag);

    return createOpTime(2, 8);
  },

  inc: ({ reg }, regAddr) => {
    const val = reg.reg(regAddr);
    reg.reg(regAddr, val + 1);
    return createOpTime(2, 8);
  },

  dec: ({ reg }, regAddr) => {
    const val = reg.reg(regAddr);
    reg.reg(regAddr, val - 1);
    return createOpTime(2, 8);
  },

  addRegSPImmediate: ({ reg, mmu }) => {
    const immediateSigned = Util.convertSignedByte(mmu.readByte(reg.pc()));
    reg.incrementPC();
    const val = reg.sp() + immediateSigned;
    reg.sp(val);
    const flag = new CheckFlagFor().carry16(val).halfCarry16(val).get();
    reg.reg(RegMap.f, flag);
    return createOpTime(4, 16);
  },
};
