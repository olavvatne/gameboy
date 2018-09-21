import { CheckFlagFor, RegMap } from '../';
import { createOpTime } from '../clock-util';
/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */
/* eslint no-param-reassign: 0 */

const rotateLeftWithMsbAround = (val, reg, checkZero) => {
  const msb = (val & 0b10000000) === 0b10000000;
  const newVal = ((val << 1) + msb) & 0xFF;
  const newFlag = new CheckFlagFor().setZero(newVal === 0 && checkZero).setCarry(msb).get();
  reg.reg(RegMap.f, newFlag);
  return newVal;
};

const rotateLeftWithCarryAround = (val, reg, checkZero) => {
  const isCarry = new CheckFlagFor(reg.flags()).isCarry();
  const msb = (val & 0b10000000) === 0b10000000;
  const newVal = ((val << 1) + isCarry) & 0xFF;
  const newFlag = new CheckFlagFor().setZero(newVal === 0 && checkZero).setCarry(msb).get();
  reg.reg(RegMap.f, newFlag);
  return newVal;
};

const rotateRightWithLsbAround = (val, reg, checkZero) => {
  const lsb = val & 0b00000001;
  const isLsb = lsb === 0b00000001;
  const newVal = ((val >>> 1) + (lsb << 7)) & 0xFF;
  const newFlag = new CheckFlagFor().setZero(newVal === 0 && checkZero).setCarry(isLsb).get();
  reg.reg(RegMap.f, newFlag);
  return newVal;
};

const rotateRightWithCarryAround = (val, reg, checkZero) => {
  const isCarry = new CheckFlagFor(reg.flags()).isCarry();
  const lsb = val & 0b00000001;
  const isLsb = lsb === 0b00000001;
  const newVal = ((val >>> 1) + (isCarry << 7)) & 0xFF;
  const newFlag = new CheckFlagFor().setZero(newVal === 0 && checkZero).setCarry(isLsb).get();
  reg.reg(RegMap.f, newFlag);
  return newVal;
};

export default {
  rcla: ({ reg, map }) => {
    const val = map.a();
    const newVal = rotateLeftWithMsbAround(val, reg, false);
    map.a(newVal);
    return createOpTime(1, 4);
  },

  rla: ({ reg, map }) => {
    const val = map.a();
    const newVal = rotateLeftWithCarryAround(val, reg, false);
    map.a(newVal);

    return createOpTime(1, 4);
  },

  rrca: ({ reg, map }) => {
    const val = map.a();
    const newVal = rotateRightWithLsbAround(val, reg, false);
    map.a(newVal);

    return createOpTime(1, 4);
  },

  rra: ({ reg, map }) => {
    const val = map.a();
    const newVal = rotateRightWithCarryAround(val, reg, false);
    map.a(newVal);

    return createOpTime(1, 4);
  },

  rlc: ({ reg }, regAddr) => {
    const val = reg.reg(regAddr);
    const newVal = rotateLeftWithMsbAround(val, reg, true);
    reg.reg(regAddr, newVal);
    return createOpTime(2, 8);
  },

  rlcMemHL: ({ reg, mmu, map }) => {
    const addr = map.hl();
    const val = mmu.readByte(addr);
    const newVal = rotateLeftWithMsbAround(val, reg, true);
    mmu.writeByte(addr, newVal);
    return createOpTime(4, 16);
  },

  rl: ({ reg }, regAddr) => {
    const val = reg.reg(regAddr);
    const newVal = rotateLeftWithCarryAround(val, reg, true);
    reg.reg(regAddr, newVal);
    return createOpTime(2, 8);
  },

  rlMemHL: ({ reg, mmu, map }) => {
    const addr = map.hl();
    const val = mmu.readByte(addr);
    const newVal = rotateLeftWithCarryAround(val, reg, true);
    mmu.writeByte(addr, newVal);
    return createOpTime(4, 16);
  },

  rrc: ({ reg }, regAddr) => {
    const val = reg.reg(regAddr);
    const newVal = rotateRightWithLsbAround(val, reg, true);
    reg.reg(regAddr, newVal);
    return createOpTime(2, 8);
  },

  rrcMemHL: ({ reg, mmu, map }) => {
    const addr = map.hl();
    const val = mmu.readByte(addr);
    const newVal = rotateRightWithLsbAround(val, reg, true);
    mmu.writeByte(addr, newVal);
    return createOpTime(4, 16);
  },

  rr: ({ reg }, regAddr) => {
    const val = reg.reg(regAddr);
    const newVal = rotateRightWithCarryAround(val, reg, true);
    reg.reg(regAddr, newVal);
    return createOpTime(2, 8);
  },

  rrMemHL: ({ reg, mmu, map }) => {
    const addr = map.hl();
    const val = mmu.readByte(addr);
    const newVal = rotateRightWithCarryAround(val, reg, true);
    mmu.writeByte(addr, newVal);
    return createOpTime(4, 16);
  },
};
