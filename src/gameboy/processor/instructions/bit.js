import { CheckFlagFor, NameMap } from '../';
import { createOpTime } from '../clock-util';
/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */
/* eslint no-param-reassign: 0 */

const getValFromRegOrMem = (map, mmu, regAddr) => {
  if (regAddr === NameMap.hl) {
    return mmu.readByte(map.hl());
  }
  return map[regAddr]();
};

const setValInRegOrMem = (map, mmu, regAddr, val) => {
  if (regAddr === NameMap.hl) {
    mmu.writeByte(map.hl(), val);
  } else {
    map[regAddr](val);
  }
};

const getTimeExpenditure = (regAddr) => {
  if (regAddr === NameMap.hl) {
    return 16;
  }
  return 8;
};

export default {
  bit: ({ mmu, map }, regAddr, bitNr) => {
    const val = getValFromRegOrMem(map, mmu, regAddr);
    const mask = 1 << bitNr;
    const flag = new CheckFlagFor(map.f()).notSubtraction()
      .setHalfCarry(true).zero(val & mask).get();
    map.f(flag);

    if (regAddr === NameMap.hl) {
      return 12;
    }
    return 8;
  },

  set: ({ mmu, map }, regAddr, bitNr) => {
    let val = getValFromRegOrMem(map, mmu, regAddr);
    const mask = 1 << bitNr;
    val |= mask;
    setValInRegOrMem(map, mmu, regAddr, val);
    return getTimeExpenditure(regAddr);
  },

  res: ({ mmu, map }, regAddr, bitNr) => {
    let val = getValFromRegOrMem(map, mmu, regAddr);
    const mask = 1 << bitNr;
    val &= ~mask;
    setValInRegOrMem(map, mmu, regAddr, val);
    return getTimeExpenditure(regAddr);
  },
};
