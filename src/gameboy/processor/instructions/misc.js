import { CheckFlagFor, RegMap } from '../';

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */
/* eslint no-param-reassign: 0 */

const createOpTime = (m, t) => ({ m, t });

const swapNibbles = (val) => {
  const newfirstNibble = val << 4;
  const newLastNibble = val >>> 4;
  return newfirstNibble + newLastNibble;
};

export default {
  nop: () => createOpTime(1, 4),

  // TODO: Halt until interupt somewhere. Not here
  halt: () => createOpTime(1, 4),

  swap: ({ reg }, addr) => {
    const val = reg.reg(addr);
    const newVal = swapNibbles(val);
    const flag = new CheckFlagFor().zero(newVal).get();
    reg.reg(addr, newVal);
    reg.reg(RegMap.f, flag);
    return createOpTime(2, 8);
  },

  swapMemHL: ({ reg, mmu }) => {
    const memAddr = reg.reg(RegMap.hl);
    const val = mmu.readByte(memAddr);
    const newVal = swapNibbles(val);
    const flag = new CheckFlagFor().zero(newVal).get();
    mmu.writeByte(memAddr, newVal);
    reg.reg(RegMap.f, flag);
    return createOpTime(4, 16);
  },

  daa: ({ reg }) => {
    // TODO: figure out what this does?
    // packed BCD
    // https://en.wikipedia.org/wiki/Binary-coded_decimal
    return createOpTime(1, 4);
  },

  cpl: ({ reg }) => {
    let val = reg.reg(RegMap.a);
    val ^= 0xFF;
    reg.reg(RegMap.a, val);
    const flag = new CheckFlagFor(reg.flags()).halfCarry(0xFF).subtraction().get();
    reg.reg(RegMap.f, flag);

    return createOpTime(1, 4);
  },

  ccf: ({ reg }) => {
    const flagChecker = new CheckFlagFor(reg.flags());
    const isCarry = flagChecker.isCarry();
    const flag = flagChecker.setHalfCarry(false).notSubtraction().setCarry(!isCarry).get();
    reg.reg(RegMap.f, flag);
    return createOpTime(1, 4);
  },

  scf: ({ reg }) => {
    const flagChecker = new CheckFlagFor(reg.flags());
    const flag = flagChecker.setHalfCarry(false).notSubtraction().setCarry(true).get();
    reg.reg(RegMap.f, flag);
    return createOpTime(1, 4);
  },

  // TODO: See if further actions is neccessary for di, ei, stop and halt.
  stop: () => createOpTime(1, 4),

  di: ({ interupts }) => {
    // TODO: maybe return clock info AND new state?
    interupts.enable = false;
    return createOpTime(1, 4);
  },

  ei: ({ interupts }) => {
    interupts.enable = true;
    return createOpTime(1, 4);
  },
};
