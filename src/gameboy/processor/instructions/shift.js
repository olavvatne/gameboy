import { CheckFlagFor, RegMap } from '../';

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */
/* eslint no-param-reassign: 0 */

const createOpTime = (m, t) => ({ m, t });

const shiftLeft = (val, reg) => {
  const msb = (val & 0b10000000) === 0b10000000;
  const newVal = val << 1;
  const newFlag = new CheckFlagFor().zero(newVal).setCarry(msb).get();
  reg.reg(RegMap.f, newFlag);
  return newVal;
};

const shiftRight = (val, reg, keepMsb) => {
  const lsb = val & 0b00000001;
  const isLsb = lsb === 0b00000001;
  let newVal = val >>> 1;
  if (keepMsb) {
    const msbMask = val & 0b10000000;
    newVal |= msbMask;
  }

  const newFlag = new CheckFlagFor().zero(newVal).setCarry(isLsb).get();
  reg.reg(RegMap.f, newFlag);
  return newVal;
};

export default {
  sla: ({ reg }, regAddr) => {
    const val = reg.reg(regAddr);
    const newVal = shiftLeft(val, reg);
    reg.reg(regAddr, newVal);
    return createOpTime(2, 8);
  },

  slaMemHL: ({ reg, mmu }) => {
    const addr = reg.reg(RegMap.hl);
    const val = mmu.readByte(addr);
    const newVal = shiftLeft(val, reg);
    mmu.writeByte(addr, newVal);
    return createOpTime(4, 16);
  },

  sra: ({ reg }, regAddr) => {
    const val = reg.reg(regAddr);
    const newVal = shiftRight(val, reg, true);
    reg.reg(regAddr, newVal);
    return createOpTime(2, 8);
  },

  sraMemHL: ({ reg, mmu }) => {
    const addr = reg.reg(RegMap.hl);
    const val = mmu.readByte(addr);
    const newVal = shiftRight(val, reg, true);
    mmu.writeByte(addr, newVal);
    return createOpTime(4, 16);
  },

  srl: ({ reg }, regAddr) => {
    const val = reg.reg(regAddr);
    const newVal = shiftRight(val, reg);
    reg.reg(regAddr, newVal);
    return createOpTime(2, 8);
  },

  srlMemHL: ({ reg, mmu }) => {
    const addr = reg.reg(RegMap.hl);
    const val = mmu.readByte(addr);
    const newVal = shiftRight(val, reg);
    mmu.writeByte(addr, newVal);
    return createOpTime(4, 16);
  },
};
