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

    if (!flag.isSubtraction()) {
      const isLowerNibbleOverNine = (val & 0x0F) > 9;
      if (flag.isHalfCarry() || isLowerNibbleOverNine) {
        val += 6;
      }

      const isUpperNibbleOverNine = val > 0x9F;
      if (flag.isCarry() || isUpperNibbleOverNine) {
        val += 0x60;
      }
    } else {
      if (flag.isHalfCarry()) {
        val -= 6;
        if (!flag.isCarry()) {
          val &= 0xFF;
        }
      }

      if (flag.isCarry()) {
        val -= 0x60;
      }
    }
    const a = val & 0xFF;
    map.a(a);

    const newFlag = new CheckFlagFor(map.f()).setC(val & 0x100)
      .zero(a).setHalfCarry(false).get();
    map.f(newFlag);
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
