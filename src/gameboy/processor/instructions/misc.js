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
  // ensure content in A is in packed Binary coded decimal encoding
  // Intended to be run immediately after an a  dditon or subtraction operations,
  // where the values were BCD encoded.
  daa: ({ reg }) => {
    const prevFlag = new CheckFlagFor(reg.flags());
    let val = reg.reg(RegMap.a);

    const lowerNibble = val & 0b00001111;
    const isAboveMaxUpperNibbleDecimal = lowerNibble > 9 || prevFlag.isHalfCarry();
    if (isAboveMaxUpperNibbleDecimal) {
      if (prevFlag.isSubtraction()) val = (val - 0x06) & 0xFF;
      else val = (val + 0x06) & 0xFF;
    }

    const upperNibble = val >>> 4;
    if (prevFlag.isSubtraction()) {
      // subtraction disregards previous op carry flag.
      if (upperNibble > 9) {
        val = (val - 0x60) & 0xFF;
      }
    } else {
      const isAboveMaxDecimal = upperNibble > 9 || prevFlag.isCarry();
      if (isAboveMaxDecimal) {
        val = (val + 0x60) & 0xFF;
      }
    }
    reg.reg(RegMap.a, val);

    const newFlag = new CheckFlagFor().setCarry(val > 0x99)
      .zero(val).setSubtraction(prevFlag.isSubtraction);
    reg.reg(RegMap.f, newFlag);
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
