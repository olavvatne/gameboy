import { CheckFlagFor, RegMap } from '../';
import { createOpTime } from '../clock-util';
/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */
/* eslint no-param-reassign: 0 */

const getValFromRegOrMem = (reg, mmu, regAddr) => {
  if (regAddr === RegMap.hl) {
    return mmu.readByte(reg.reg(RegMap.hl));
  }
  return reg.reg(regAddr);
};

const setValInRegOrMem = (reg, mmu, regAddr, val) => {
  if (regAddr === RegMap.hl) {
    mmu.writeByte(reg.reg(RegMap.hl), val);
  } else {
    reg.reg(regAddr, val);
  }
};

const getTimeExpenditure = (regAddr) => {
  if (regAddr === RegMap.hl) {
    return createOpTime(4, 16);
  }
  return createOpTime(2, 8);
};

export default {
  bit: ({ reg, mmu }, regAddr, bitNr) => {
    const val = getValFromRegOrMem(reg, mmu, regAddr);
    const mask = 1 << bitNr;
    const flag = new CheckFlagFor(reg.flags()).notSubtraction()
      .setHalfCarry(true).zero(val & mask).get();
    reg.reg(RegMap.f, flag);
    return getTimeExpenditure(regAddr);
  },

  set: ({ reg, mmu }, regAddr, bitNr) => {
    let val = getValFromRegOrMem(reg, mmu, regAddr);
    const mask = 1 << bitNr;
    val |= mask;
    setValInRegOrMem(reg, mmu, regAddr, val);
    return getTimeExpenditure(regAddr);
  },

  res: ({ reg, mmu }, regAddr, bitNr) => {
    let val = getValFromRegOrMem(reg, mmu, regAddr);
    const mask = 1 << bitNr;
    val &= ~mask;
    setValInRegOrMem(reg, mmu, regAddr, val);
    return getTimeExpenditure(regAddr);
  },
};
