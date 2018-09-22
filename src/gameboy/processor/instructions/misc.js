import { CheckFlagFor } from '../';
import { createOpTime } from '../clock-util';
/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */
/* eslint no-param-reassign: 0 */

const swapNibbles = (val) => {
  const newfirstNibble = val << 4;
  const newLastNibble = val >>> 4;
  return newfirstNibble + newLastNibble;
};

export default {
  nop: () => createOpTime(1, 4),

  // TODO: Halt until interupt somewhere. Not here
  halt: () => createOpTime(1, 4),

  swap: ({ map }, regX) => {
    const val = regX();
    const newVal = swapNibbles(val);
    const flag = new CheckFlagFor().zero(newVal).get();
    regX(newVal);
    map.f(flag);
    return createOpTime(2, 8);
  },

  swapMemHL: ({ mmu, map }) => {
    const memAddr = map.hl();
    const val = mmu.readByte(memAddr);
    const newVal = swapNibbles(val);
    const flag = new CheckFlagFor().zero(newVal).get();
    mmu.writeByte(memAddr, newVal);
    map.f(flag);
    return createOpTime(4, 16);
  },
  // ensure content in A is in packed Binary coded decimal encoding
  // Intended to be run immediately after an a  dditon or subtraction operations,
  // where the values were BCD encoded.
  daa: ({ map }) => {
    const prevFlag = new CheckFlagFor(map.f());
    let val = map.a();

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
    map.a(val);

    const newFlag = new CheckFlagFor().setCarry(val > 0x99)
      .zero(val).setSubtraction(prevFlag.isSubtraction);
    map.f(newFlag);
    return createOpTime(1, 4);
  },

  cpl: ({ map }) => {
    let val = map.a();
    val ^= 0xFF;
    map.a(val);
    const flag = new CheckFlagFor(map.f()).halfCarry(0xFF).subtraction().get();
    map.f(flag);

    return createOpTime(1, 4);
  },

  ccf: ({ map }) => {
    const flagChecker = new CheckFlagFor(map.f());
    const isCarry = flagChecker.isCarry();
    const flag = flagChecker.setHalfCarry(false).notSubtraction().setCarry(!isCarry).get();
    map.f(flag);
    return createOpTime(1, 4);
  },

  scf: ({ map }) => {
    const flagChecker = new CheckFlagFor(map.f());
    const flag = flagChecker.setHalfCarry(false).notSubtraction().setCarry(true).get();
    map.f(flag);
    return createOpTime(1, 4);
  },

  // TODO: See if further actions is neccessary for di, ei, stop and halt.
  stop: () => createOpTime(1, 4),

  di: ({ interrupt }) => {
    // TODO: maybe return clock info AND new state?
    interrupt.enabled = false;
    return createOpTime(1, 4);
  },

  ei: ({ interrupt }) => {
    interrupt.enabled = true;
    return createOpTime(1, 4);
  },
};
