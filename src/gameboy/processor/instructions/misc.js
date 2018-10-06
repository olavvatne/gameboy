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
    regX(newVal);
    const newFlag = new CheckFlagFor().zero(newVal).get();
    map.f(newFlag);
    return createOpTime(2, 8);
  },

  swapMemHL: ({ mmu, map }) => {
    const memAddr = map.hl();
    const val = mmu.readByte(memAddr);
    const newVal = swapNibbles(val);
    mmu.writeByte(memAddr, newVal);
    const newFlag = new CheckFlagFor().zero(newVal).get();
    map.f(newFlag);
    return createOpTime(4, 16);
  },
  // ensure content in A is in packed Binary coded decimal encoding
  // Intended to be run immediately after an a  dditon or subtraction operations,
  // where the values were BCD encoded.
  daa: ({ map }) => {
    const flag = new CheckFlagFor(map.f());
    let val = map.a();

    if (flag.isSubtraction()) {
      if (flag.isHalfCarry()) {
        val = (val - 6) & 0xff;
      }

      if (flag.isCarry()) {
        val = (val - 0x60) & 0xff;
      }
    } else {
      const isLowerNibbleOverNine = (val & 0xF) > 9;
      if (flag.isHalfCarry() || isLowerNibbleOverNine) {
        val += 0x06;
      }
      const isUpperNibbleOverNine = val > 0x9F;
      if (flag.isCarry() || isUpperNibbleOverNine) {
        val += 0x60;
      }
    }

    flag.setHalfCarry(false);
    if (val > 0xff) {
      flag.setCarry(true);
    }

    val &= 0xff;
    flag.setZero(val === 0);
    map.f(flag.flag);
    map.a(val);
    return createOpTime(1, 4);
  },

  cpl: ({ map }) => {
    let val = map.a();
    val ^= 0xFF;
    map.a(val);
    const flag = new CheckFlagFor(map.f()).setHalfCarry(true).subtraction().get();
    map.f(flag);

    return createOpTime(1, 4);
  },

  ccf: ({ map }) => {
    const flagChecker = new CheckFlagFor(map.f());
    const isCarry = flagChecker.isCarry();
    const flag = flagChecker.setHalfCarry(false).notSubtraction().setC(!isCarry).get();
    map.f(flag);
    return createOpTime(1, 4);
  },

  scf: ({ map }) => {
    const flagChecker = new CheckFlagFor(map.f());
    const flag = flagChecker.setHalfCarry(false).notSubtraction().setC(true).get();
    map.f(flag);
    return createOpTime(1, 4);
  },

  // TODO: stop and halt
  stop: ({ actions }) => {
    actions.stop = true;
    return createOpTime(1, 4);
  },

  di: ({ interrupt }) => {
    interrupt.enabled = false;
    return createOpTime(1, 4);
  },

  ei: ({ interrupt }) => {
    interrupt.enabled = true;
    return createOpTime(1, 4);
  },
};
