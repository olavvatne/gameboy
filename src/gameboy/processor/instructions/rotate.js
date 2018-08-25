import { CheckFlagFor, RegMap } from '../';

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */
/* eslint no-param-reassign: 0 */

const createOpTime = (m, t) => ({ m, t });

const rotateLeftWithMsbAround = (val, reg) => {
  const msb = (val & 0b10000000) === 0b10000000;
  const newVal = (val << 1) + msb;
  const newFlag = new CheckFlagFor().zero(newVal).setCarry(msb).get();
  reg.reg(RegMap.f, newFlag);
  return newVal;
};

const rotateLeftWithCarryAround = (val, reg) => {
  const isCarry = new CheckFlagFor(reg.flags()).isCarry();
  const msb = (val & 0b10000000) === 0b10000000;
  const newVal = (val << 1) + isCarry;
  const newFlag = new CheckFlagFor().zero(newVal).setCarry(msb).get();
  reg.reg(RegMap.f, newFlag);
  return newVal;
};

const rotateRightWithLsbAround = (val, reg) => {
  const lsb = val & 0b00000001;
  const isLsb = lsb === 0b00000001;
  const newVal = (val >>> 1) + (lsb << 7);
  const newFlag = new CheckFlagFor().zero(newVal).setCarry(isLsb).get();
  reg.reg(RegMap.f, newFlag);
  return newVal;
};

const rotateRightWithCarryAround = (val, reg) => {
  const isCarry = new CheckFlagFor(reg.flags()).isCarry();
  const lsb = val & 0b00000001;
  const isLsb = lsb === 0b00000001;
  const newVal = (val >>> 1) + (isCarry << 7);
  const newFlag = new CheckFlagFor().zero(newVal).setCarry(isLsb).get();
  reg.reg(RegMap.f, newFlag);
  return newVal;
};

export default {
  rcla: ({ reg }) => {
    const val = reg.reg(RegMap.a);
    const newVal = rotateLeftWithMsbAround(val, reg);
    reg.reg(RegMap.a, newVal);
    return createOpTime(1, 4);
  },

  rla: ({ reg }) => {
    const val = reg.reg(RegMap.a);
    const newVal = rotateLeftWithCarryAround(val, reg);
    reg.reg(RegMap.a, newVal);

    return createOpTime(1, 4);
  },

  rrca: ({ reg }) => {
    const val = reg.reg(RegMap.a);
    const newVal = rotateRightWithLsbAround(val, reg);
    reg.reg(RegMap.a, newVal);

    return createOpTime(1, 4);
  },

  rra: ({ reg }) => {
    const val = reg.reg(RegMap.a);
    const newVal = rotateRightWithCarryAround(val, reg);
    reg.reg(RegMap.a, newVal);

    return createOpTime(1, 4);
  },

  rlc: ({ reg }, regAddr) => {
    const val = reg.reg(regAddr);
    const newVal = rotateLeftWithMsbAround(val, reg);
    reg.reg(regAddr, newVal);
    return createOpTime(2, 8);
  },

  rlcMemHL: ({ reg, mmu }) => {
    const addr = reg.reg(RegMap.hl);
    const val = mmu.readByte(addr);
    const newVal = rotateLeftWithMsbAround(val, reg);
    mmu.writeByte(addr, newVal);
    return createOpTime(4, 16);
  },

  rl: ({ reg }, regAddr) => {
    const val = reg.reg(regAddr);
    const newVal = rotateLeftWithCarryAround(val, reg);
    reg.reg(regAddr, newVal);
    return createOpTime(2, 8);
  },

  rlMemHL: ({ reg, mmu }) => {
    const addr = reg.reg(RegMap.hl);
    const val = mmu.readByte(addr);
    const newVal = rotateLeftWithCarryAround(val, reg);
    mmu.writeByte(addr, newVal);
    return createOpTime(4, 16);
  },

  rrc: ({ reg }, regAddr) => {
    const val = reg.reg(regAddr);
    const newVal = rotateRightWithLsbAround(val, reg);
    reg.reg(regAddr, newVal);
    return createOpTime(2, 8);
  },

  rrcMemHL: ({ reg, mmu }) => {
    const addr = reg.reg(RegMap.hl);
    const val = mmu.readByte(addr);
    const newVal = rotateRightWithLsbAround(val, reg);
    mmu.writeByte(addr, newVal);
    return createOpTime(4, 16);
  },

  rr: ({ reg }, regAddr) => {
    const val = reg.reg(regAddr);
    const newVal = rotateRightWithCarryAround(val, reg);
    reg.reg(regAddr, newVal);
    return createOpTime(2, 8);
  },

  rrMemHL: ({ reg, mmu }) => {
    const addr = reg.reg(RegMap.hl);
    const val = mmu.readByte(addr);
    const newVal = rotateRightWithCarryAround(val, reg);
    mmu.writeByte(addr, newVal);
    return createOpTime(4, 16);
  },
};
